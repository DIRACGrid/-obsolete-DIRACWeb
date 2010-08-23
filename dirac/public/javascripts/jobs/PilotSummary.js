var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initPilotSummary(reponseSelect){
  dataSelect = reponseSelect;
  dataSelect.globalSort = "Site ASC";
  var record = initRecord();
  var store = initStore(record);
  Ext.onReady(function(){
    renderData(store);
  });
}
// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'Scheduled'},
    {name:'Status'},
    {name:'Aborted_Hour'},
    {name:'PilotsPerJob',type:'float'},
    {name:'Site'},
    {name:'Submitted'},
    {name:'Done_Empty'},
    {name:'Waiting'},
    {name:'PilotJobEff',type:'float'},
    {name:'Done'},
    {name:'CE'},
    {name:'Aborted'},
    {name:'Ready'},
    {name:'Total'},
    {name:'Running'},
    {name:'StatusIcon',mapping:'Status'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var siteSelect = selectSiteMenu(); // Initializing Site Menu
//  var statSelect = selectPilotStatusMenu(); // Initializing Owner Menu
  var select = selectPanel(); // Initializing container for selection objects
  select.buttons[2].hide(); // Remove refresh button
  // Insert object to container BEFORE buttons:
  select.insert(0,siteSelect);
//  select.insert(1,statSelect);
  var stat = statPanel('Statistics','current','statGrid');
  var bar = sideBar();
  bar.insert(0,select);
  bar.insert(1,stat);
  bar.setTitle('PilotSummary');
  return bar
}
var expSites = new Array();
function expSite(value,xxx,obj){
  if(value == 'Multiple'){
    var site = 'Empty value'
    try{
      var site = obj.data.Site;
      var recIndex = obj.id;
      expSites[expSites.length] = [site,recIndex];
    }catch(e){}
    var html = '<img id="img.' + site + '" style="cursor: pointer; cursor: hand;" src="'+gURLRoot+'/images/iface/plus.gif"';
    html = html + ' onclick="addEntries(\'' + site + '\',' + recIndex + ')" />';
    return html
  }
}
function initData(store){
  var columns = [
    {header:'',name:'expand',id:'expand',width:26,sortable:false,dataIndex:'CE',renderer:expSite,hideable:false,hideable:false,fixed:true,menuDisabled:true},
    {header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:status,hideable:false,hideable:false,fixed:true,menuDisabled:true},
    {header:'Site',sortable:false,dataIndex:'Site',align:'left',hideable:false,fixed:true},
    {header:'CE',sortable:false,dataIndex:'CE',align:'left',hideable:false,fixed:true},
    {header:'Status',width:60,sortable:false,dataIndex:'Status',align:'left'},
    {header:'PilotJobEff (%)',sortable:false,dataIndex:'PilotJobEff',align:'left'},
    {header:'PilotsPerJob',sortable:false,dataIndex:'PilotsPerJob',align:'left'},
    {header:'Submitted',sortable:false,dataIndex:'Submitted',align:'left',hidden:true},
    {header:'Ready',sortable:false,dataIndex:'Ready',align:'left',hidden:true},
    {header:'Waiting',sortable:false,dataIndex:'Waiting',align:'left'},
    {header:'Scheduled',sortable:false,dataIndex:'Scheduled',align:'left'},
    {header:'Running',sortable:false,dataIndex:'Running',align:'left'},
    {header:'Done',sortable:false,dataIndex:'Done',align:'left'},
    {header:'Aborted',sortable:false,dataIndex:'Aborted',align:'left'},
    {header:'Aborted_Hour',sortable:false,dataIndex:'Aborted_Hour',align:'left'},
    {header:'Done_Empty',sortable:false,dataIndex:'Done_Empty',align:'left',hidden:true},
    {header:'Total',sortable:false,dataIndex:'Total',align:'left',hidden:true}
  ];
  store.setDefaultSort('Site','ASC'); // Default sorting
/*
  var tbar = [
    {
      cls:"x-btn-text-icon",
      handler:function(){expandAll()},
      icon:gURLRoot+'/images/iface/plus.gif',
      text:'Expand All',
      tooltip:'Click to expand all collapsed sites'
    },{
      cls:"x-btn-text-icon",
      handler:function(){collapseAll()},
      icon:gURLRoot+'/images/iface/minus.gif',
      text:'Collapse All',
      tooltip:'Click to collapse CEs to single site'
    },'->'
  ];
*/
  var tbar = '';
  tableMngr = {'store':store,'columns':columns,'tbar':tbar};
  var t = table(tableMngr);
  t.addListener('cellclick',function(table,rowIndex,columnIndex){
    showMenu('main',table,rowIndex,columnIndex);
  });
  t.store.addListener('beforeload',function(){
    expSites.length = 0;
  });
  var bar = t.getBottomToolbar();
  bar.hide();
  return t
}
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar.items.items[0],'store':store}
  addMenu();
}
function AJAXsuccess(value,id,response){
}
/*
function addMenu(){
  var topBar = Ext.getCmp('diracTopBar');
  if(topBar){
    var button = new Ext.Toolbar.Button({
      text:'Tools',
      menu:[
        {handler:function(){showURL()},text:'Full URL'},
        {menu:{items:[
          {handler:function(){showJobID(', ')},text:'Comma separated'},
          {handler:function(){showJobID('; ')},text:'Semicolon separated'}
        ]},text:'Show selected JobIDs'}
      ]
    });
    topBar.insertButton(5,button);
  }
}
*/
function setMenuItems(selections){
  if(selections){
    var id = selections.JobID;
    var status = selections.Status;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){jump('pilots',selections)},text:'Show Pilots'}
    )
  }
};
function afterDataLoad(){
  var msg = [];
  if(dataMngr){
    if(dataMngr.store){
      if(dataMngr.store.extra_msg){
         msg = dataMngr.store.extra_msg;
      }
    }
  }
  var statPanel = Ext.getCmp('statGrid');
  if((statPanel)&&(msg)){
    var data = [];
    var j = 0;
    for( var i in msg ){
      if(i == 'SubmissionEff'){
        data[j] = ['SubmissionEff (%)',msg[i]];
      }else if(i == 'PilotJobEff'){
        data[j] = ['PilotJobEff (%)',msg[i]];
      }else{
        data[j] = [i,msg[i]];
      }
      j = j + 1;
    }
    statPanel.store.loadData(data);
  }
}
function addEntries(site,id){
  var img = document.getElementById('img.' + site);
  img.src = gURLRoot+'/images/iface/loading.gif';
  img.onclick = '';
  Ext.Ajax.request({
    failure:function(response){
      AJAXerror(response.responseText);
      img.onclick = function(){addEntries(site,id)};
      img.src = gURLRoot+'/images/iface/plus.gif';
    },
    method:'POST',
    params:{'expand':site},
    success:function(response){
      var table = Ext.getCmp('JobMonitoringTable');
      table.getView().getRowClass = function(){return 'new-row'};
      var record = table.store.indexOfId(id);
      var view = table.getView();
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(dataMngr){
        if(dataMngr.store){
          var rec = initRecord();
          var newRecord = '';
          var len = jsonData.result.length;
          var newID = new Array();
          newID[0] = id;
          for(var i = 0; i < len; i++){
            record = record + 1;
            newRecord = new rec(jsonData.result[i]);
            newID[i+1] = newRecord.id;
            dataMngr.store.insert(record,newRecord);
          }
        }
      }
      img.onclick = function(){killEntries(site,newID)};
      img.src = gURLRoot+'/images/iface/minus.gif';
      table.getView().getRowClass = function(){return ''};
    },
    url:'submit'
  }); 
}
function killEntries(site,id){
  var img = document.getElementById('img.' + site);
  try{
    var store = dataMngr.store
  }catch(e){
    alert('Error: Data store is not defined');
    return;
  }
  var len = id.length;
  if(len > 0){
    for(var i = 1; i < len; i++){
      var rec = store.getById(id[i])
      store.remove(rec);
    }
  }
  img.onclick = function(){addEntries(site,id[0])};
  img.src = gURLRoot+'/images/iface/plus.gif';
}
function expandAll(){
  var len = 0;
  try{
    len = expSites.length;
  }catch(e){}
  if(len > 0){
    for(var i = 0; i < len; i++){
      addEntries(expSites[i][0],expSites[i][1]);
    }
  }
}
function jump(type,selections){
  var request = ''
  try{
    if(selections.CE == 'Multiple'){
      request = 'name="site" value=' + selections.Site;
    }else{
      request = 'name="ce" value=' + selections.CE;
    }
    var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/' + gPageDescription.selectedSetup;
    url = url + '/' + gPageDescription.userData.group + '/jobs/PilotMonitor/display';
    var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
    post_req = post_req + '<input type="hidden" ' + request + '">';
    post_req = post_req + '</form>';
    document.body.innerHTML = document.body.innerHTML + post_req;
    var form = document.getElementById('redirform');
    form.submit();
  }catch(e){}
}
