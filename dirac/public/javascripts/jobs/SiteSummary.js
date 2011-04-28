var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
var refreshRate = 0; // autorefresh is off
var refeshID = 0;
// Main routine
function initSiteSummary(reponseSelect){
  dataSelect = reponseSelect;
  Ext.onReady(function(){
    var record = initRecord();
    var store = initStore(record,{'groupBy':'FullCountry'});
    renderData(store);
  });
}
// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'GridType'},
    {name:'Site'},
    {name:'Country'},
    {name:'MaskStatus'},
    {name:'Received',type:'int'},
    {name:'Checking',type:'int'},
    {name:'Staging',type:'int'},
    {name:'Waiting',type:'int'},
    {name:'Matched',type:'int'},
    {name:'Running',type:'int'},
    {name:'Stalled',type:'int'},
    {name:'Done',type:'int'},
    {name:'Completed',type:'int'},
    {name:'Failed',type:'int'},
    {name:'Efficiency'},
    {name:'Status'},
    {name:'Tier'},
    {name:'FullCountry'},
    {name:'MaskStatusIcon',mapping:'MaskStatus'},
    {name:'StatusIcon',mapping:'Status'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var selectStatusSiteSummary = createMenu('status','Status'); // Initializing Owner Menu
  var selectGridType = createMenu('gridtype','GridType'); // Initializing Application status Menu
  var selectMaskStatus = createMenu('maskstatus','MaskStatus'); // Initializing JobStatus Menu
  var selectCountry = createMenu('country','Country',true); // Initializing JobGroup Menu
  var dateSelect = dateSelectMenu(); // Initializing date dialog
  var id = genericID('id','JobID'); // Initialize field for JobIDs
  var select = selectPanel(); // Initializing container for selection objects
//  select.buttons[2].hide(); // Remove refresh button
  // Insert object to container BEFORE buttons:
  select.insert(0,selectStatusSiteSummary);
  select.insert(1,selectGridType);
  select.insert(2,selectMaskStatus);
  select.insert(3,selectCountry);
  var bar = sideBar();
  bar.insert(0,select);
  bar.setTitle('SiteSummary');
  return bar
}
function initData(store){
  var columns = [
    {header:'Name',sortable:true,dataIndex:'Site',align:'left',hideable:false},
    {header:'Tier',sortable:true,dataIndex:'Tier',align:'left'},
    {header:'GridType',sortable:true,dataIndex:'GridType',align:'left'},
    {header:'',width:26,sortable:false,dataIndex:'Country',renderer:flag,hideable:false,fixed:true,menuDisabled:true},
    {header:'Country',sortable:true,dataIndex:'FullCountry',align:'left'},
    {header:'',width:26,sortable:false,dataIndex:'MaskStatusIcon',renderer:status,hideable:false,fixed:true,menuDisabled:true},
    {header:'MaskStatus',sortable:true,dataIndex:'MaskStatus',align:'left'},
    {header:'Efficiency (%)',sortable:true,dataIndex:'Efficiency',align:'left'},
    {header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:status,hideable:false,fixed:true,menuDisabled:true},
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
    {header:'Received',sortable:true,dataIndex:'Received',align:'left',hidden:true},
    {header:'Checking',sortable:true,dataIndex:'Checking',align:'left',hidden:true},
    {header:'Staging',sortable:true,dataIndex:'Staging',align:'left'},
    {header:'Waiting',sortable:true,dataIndex:'Waiting',align:'left',hidden:true},
    {header:'Matched',sortable:true,dataIndex:'Matched',align:'left',hidden:true},
    {header:'Running',sortable:true,dataIndex:'Running',align:'left'},
    {header:'Completed',sortable:true,dataIndex:'Completed',align:'left'},
    {header:'Done',sortable:true,dataIndex:'Done',align:'left'},
    {header:'Stalled',sortable:true,dataIndex:'Stalled',align:'left'},
    {header:'Failed',sortable:true,dataIndex:'Failed',align:'left'}
  ];
  var refresh = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      refreshCycle();
    },
    iconCls:'Refresh',
    text:'Refresh',
    tooltip:'Click the button for manual refresh.'
  });
  var timeStamp = {
    disabled:true,
    disabledClass:'my-disabled',
    hidden:true,
    id:'timeStamp',
    text:'Updated: '
  };
  var auto = new Ext.Toolbar.Button({
    cls:"x-btn-text",
    id:'autoButton',
    menu:new Ext.menu.Menu({items:[
      {checked:setChk(0),checkHandler:function(){refreshYO(0,true);},group:'refresh',text:'Disabled'},
      {checked:setChk(900000),checkHandler:function(){refreshYO(900000,true,'Each 15m');},group:'refresh',text:'15 Minutes'},
      {checked:setChk(3600000),checkHandler:function(){refreshYO(3600000,true,'Each Hour');},group:'refresh',text:'One Hour'},
      {checked:setChk(86400000),checkHandler:function(){refreshYO(86400000,true,'Each Day');},group:'refresh',text:'One Day'},
    ]}),
    text:'Disabled',
    tooltip:'Click to set the time for autorefresh'
  });
  auto.on('menuhide',function(button,menu){
    var length = menu.items.getCount();
    for(var i = 0; i < length; i++){
      if(menu.items.items[i].checked){
        button.setText(menu.items.items[i].text);
      }
    }
  });
  dirac.tbar = ['->',refresh,'-','Auto:',auto,timeStamp];
  var view = new Ext.grid.GroupingView({
    groupTextTpl: '<tpl if="dataMngr.store.groupField==\'FullCountry\'">{group}:</tpl><tpl if="dataMngr.store.groupField!=\'FullCountry\'">{text},</tpl> {[values.rs.length]} {[values.rs.length > 1 ? "Sites" : "Site"]}',
  })
  store.setDefaultSort('FullCountry','ASC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'tbar':dirac.tbar,'view':view};
  var t = table(tableMngr);
  t.addListener('cellclick',function(table,rowIndex,columnIndex){
    showMenu('main',table,rowIndex,columnIndex);
  });
  var bar = t.getBottomToolbar();
  bar.hide();
  t.footer = false;
  return t
}
function setChk(value){
  if(value == refreshRate){
    return true
  }else{
    return false
  }
}
function refreshYO(delay,start,text){
  var select = Ext.getCmp('selectPanel');
  if(select && select.form){
    select.form.submit();
  }
  if(refeshID != 0){
    clearTimeout(refeshID);
  }
  if(delay == 0){
    clearTimeout(refeshID);
  }else{
    if(!start){
      var select = Ext.getCmp('selectPanel');
      if(select && select.form){
        select.form.submit();
      }
    }
    start = false;
    refeshID = setTimeout('refreshYO(' + delay + ',false)',delay);
  }
}
function setMenuItems(selections){
  if(selections){
    var id = selections.Site;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){jump('site',id)},text:'Show Job(s)'}
    );
  }
}
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar,'store':store};
}
function afterDataLoad(store){
  var stamp = Ext.getCmp('timeStamp');
  if(stamp){
    var d = new Date();
    var hh = d.getHours();
    if(hh < 10){
      hh = '0' + hh;
    }
    var mm = d.getMinutes()
    if(mm < 10){
      mm = '0' + mm;
    }
    stamp.setText('Updated: ' + hh + ":" + mm);
    stamp.show();
  }
}
function jump(type,id){
  var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/' + gPageDescription.selectedSetup
  url = url + '/' + gPageDescription.userData.group + '/jobs/JobMonitor/display';
  var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
  post_req = post_req + '<input type="hidden" name="' + type + '" value="' + id + '">';
  post_req = post_req + '</form>';
  document.body.innerHTML = document.body.innerHTML + post_req;
  var form = document.getElementById('redirform');
  form.submit();
}
function AJAXsuccess(value,id,response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
}
