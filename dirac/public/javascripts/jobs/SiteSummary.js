var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initSiteSummary(reponseSelect){
  dataSelect = reponseSelect;
  var record = initRecord();
  var store = initStore(record,'FullCountry');
  Ext.onReady(function(){
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
//  var siteSelect = selectSiteSummaryMenu(); // Initializing Site Menu
  var selectStatusSiteSummary = selectStatusSiteSummaryMenu(); // Initializing Owner Menu
  var selectGridType = selectGridTypeMenu(); // Initializing Application status Menu
  var selectMaskStatus = selectMaskStatusMenu(); // Initializing JobStatus Menu
  var selectCountry = selectCountryMenu(); // Initializing JobGroup Menu
  var dateSelect = dateSelectMenu(); // Initializing date dialog
  var id = selectID(); // Initialize field for JobIDs
  var select = selectPanel(); // Initializing container for selection objects
  select.buttons[2].hide(); // Remove refresh button
  // Insert object to container BEFORE buttons:
//  select.insert(0,siteSelect);
  select.insert(1,selectStatusSiteSummary);
  select.insert(2,selectGridType);
  select.insert(3,selectMaskStatus);
  select.insert(4,selectCountry);
//  select.insert(5,id);
//  var sortGlobal = sortGlobalPanel(); // Initializing the global sort panel
//  var stat = statPanel('Current Statistics','current','statGrid');
//  var glStat = statPanel('Global Statistics','global','glStatGrid');
  var bar = sideBar();
  bar.insert(0,select);
//  bar.insert(1,sortGlobal);
//  bar.insert(2,stat);
//  bar.insert(3,glStat);
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
  dirac.tbar = ['->',{
    cls:"x-btn-text-icon",
    handler:function(){store.load()},
    icon:gURLRoot+'/images/iface/refresh.gif',
    text:'Refresh',
    tooltip:'Click to refresh the data in the table'
  }];
  dirac.tbar = '';
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
};
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar,'store':store}
}
function afterDataLoad(store){
  try{
    var img = '<img src="getImg?name="'+store.reader.jsonData.plots+'>';
  }catch(e){}
  var last = 'Refresh it';
  if(store){
    if(store.reader){
      if(store.reader.jsonData){
        last = dataMngr.store.reader.jsonData.time;
      }
    }
  }
  last = 'Last update: ' + last
  if(dirac){
    if(dirac.tbar){
      if(dirac.tbar.items){
        if(dirac.tbar.items.items[1]){
          dirac.tbar.items.items[1].setText(last);
        }
      }
    }
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
