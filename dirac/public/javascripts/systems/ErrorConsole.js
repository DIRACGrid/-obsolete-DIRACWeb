var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initErrorConsole(reponseSelect){
  dataSelect = reponseSelect;
  var record = initRecord();
  var store = initStore(record);
  Ext.onReady(function(){
    renderData(store);
  });
}
// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'SystemName'},
    {name:'SubSystemName'},
    {name:'FixedTextString'},
    {name:'MessageTime'},
    {name:'LogLevel'},
    {name:'VariableText'},
    {name:'OwnerDN'},
    {name:'OwnerGroup'},
    {name:'ClientIPNumberString'},
    {name:'SiteName'},
    {name:'Number of Errors'}
  ]);
  return record
}
function initSidebar(){
  var startDate = selectStartDate(); // Initializing date dialog
  var finalDate = selectFinalDate(); // Initializing date dialog
  var select = selectPanel(); // Initializing container for selection objects
  select.insert(0,startDate);
  select.insert(1,finalDate);
  select.buttons[2].hide(); // Remove refresh button
  var bar = sideBar();
  bar.insert(0,select);
  return bar
}
function initData(store){
  var columns = [
    {header:'Component',sortable:true,dataIndex:'SystemName',align:'left'},
    {header:'SubSystem',sortable:true,dataIndex:'SubSystemName',align:'left',hidden:true},
    {header:'Error',sortable:true,dataIndex:'FixedTextString',align:'left'},
    {header:'LogLevel',sortable:true,dataIndex:'LogLevel',align:'left',hidden:true},
    {header:'SiteName',sortable:true,dataIndex:'SiteName',align:'left',hidden:true},
    {header:'Example',sortable:true,dataIndex:'VariableText',align:'left',hidden:true},
    {header:'OwnerDN',sortable:true,dataIndex:'OwnerDN',align:'left',hidden:true},
    {header:'OwnerGroup',sortable:true,dataIndex:'OwnerGroup',align:'left',hidden:true},
    {header:'IP',sortable:true,dataIndex:'ClientIPNumberString',align:'left',hidden:true},
    {header:'Message Time',sortable:true,dataIndex:'MessageTime',align:'left',hidden:true},
    {header:'Number of error(s)',sortable:true,dataIndex:'Number of Errors',align:'left'}
  ];
  var title = 'Error Console';
  store.setDefaultSort('Number of Errors','DESC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'title':title,'tbar':''};
  var t = table(tableMngr);
  t.addListener('cellclick',showMenu);
  var tabPanel = new Ext.TabPanel({
    activeTab:0,
    enableTabScroll:true,
    id:'tabPanel',
    items:[t],
    margins:'2 0 2 0',
    region:'center'
  });
  return tabPanel
}
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
 dataMngr = {'form':leftBar,'store':store}
}
/*
// function describing data structure, should be individual per page
function initData(){
  var h1 = '<div id="error" style="height:100%">Errors per hour</div>';
  var h2 = '<div id="error" style="height:100%">Errors per day</div>';
  var h3 = '<div id="error" style="height:100%">per week</div>';
  var h4 = '<div id="error" style="height:100%">overall errors</div>';
  var p1 = new Ext.Panel({border:0,autoScroll:false,html:h1,title:'One hour period',height:'100%',width:'25%'});
  var p2 = new Ext.Panel({border:0,autoScroll:false,html:h2,title:'One day period',width:'25%'});
  var p3 = new Ext.Panel({border:0,autoScroll:false,html:h3,title:'One week period',width:'25%'});
  var p4 = new Ext.Panel({border:0,autoScroll:false,html:h4,title:'Whole period',width:'25%'});
  var panel = new Ext.Panel({border:0,autoScroll:false,collapsible:true,items:[p1,p2,p3,p4],layout:'column',cmargins:'2 2 2 2',margins:'2 2 2 2',region:'center',title:'Error console'});
  return panel
}
*/
function afterDataLoad(){
}
