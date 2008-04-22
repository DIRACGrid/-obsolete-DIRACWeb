var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initSiteSummary(reponseSelect){
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
    {name:'name'},
    {name:'waiting',type:'int'},
    {name:'running',type:'int'},
    {name:'done',type:'int'},
    {name:'failed',type:'int'},
    {name:'stalled',type:'int'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var siteSelect = selectSiteMenu(); // Initializing Site Menu
  var ownerSelect = selectOwnerMenu(); // Initializing Owner Menu
  var appSelect = selectAppMenu(); // Initializing Application status Menu
  var statSelect = selectStatusMenu(); // Initializing JobStatus Menu
  var prodSelect = selectProdMenu(); // Initializing JobGroup Menu
  var dateSelect = dateSelectMenu(); // Initializing date dialog
  var id = selectID(); // Initialize field for JobIDs
  var select = selectPanel(); // Initializing container for selection objects
  // Insert object to container BEFORE buttons:
  select.insert(0,siteSelect);
  select.insert(1,statSelect);
  select.insert(2,appSelect);
  select.insert(3,ownerSelect);
  select.insert(4,prodSelect);
  select.insert(5,dateSelect);
  select.insert(6,id);
//  select.collapsed = true;
  select.hide();
  return select
}
function initData(store){
  var columns = [
    {header:'Name',sortable:true,dataIndex:'name',align:'left'},
    {header:'Waiting',sortable:true,dataIndex:'waiting',align:'left'},
    {header:'Running',sortable:true,dataIndex:'running',align:'left'},
    {header:'Done',sortable:true,dataIndex:'done',align:'left'},
    {header:'Failed',sortable:true,dataIndex:'failed',align:'left'},
    {header:'Stalled',sortable:true,dataIndex:'stalled',align:'left'}
  ];
  var title = 'Site Summary';
  dirac.tbar = ['->',
    {handler:function(){store.load()},text:'Refresh it',tooltip:'Click to refresh the data'}
  ];
  tableMngr = {'store':store,'columns':columns,'title':title,'tbar':dirac.tbar};
  var t = table(tableMngr);
//  t.footer = true;
  return t
}
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar,'store':store}
}
function afterDataLoad(store){
  var last = 'Refresh it';
  if(store.reader.jsonData){
    last = dataMngr.store.reader.jsonData.time;
  }
  last = 'Last update: ' + last
  if(dirac.tbar.items.items[1]){
    dirac.tbar.items.items[1].setText(last);
  }
}
