var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initLoop(reponseSelect){
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
    {name:'Directory Path'},
    {name:'Files'},
    {name:'Size'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var prod = selectProduction(); // Initialize field for JobIDs
  var type = selectFileType();
  var se = selectSEs();
  var dir = selectDirectory();
  var select = selectPanel(); // Initializing container for selection objects
  select.buttons[2].hide(); // Remove refresh button
  // Insert object to container BEFORE buttons:
  select.insert(0,prod);
  select.insert(1,type);
  select.insert(2,dir);
  select.insert(3,se);
//  var sortGlobal = sortGlobalPanel(); // Initializing the global sort panel
  var stat = statPanel('SE Usage','storage','statGrid');
//  var glStat = statPanel('Global Statistics','global','glStatGrid');
  var bar = sideBar();
  bar.insert(0,select);
//  bar.insert(1,sortGlobal);
  bar.insert(2,stat);
//  bar.insert(3,glStat);
  bar.setTitle('Storage Directory Summary');
  return bar
}
function initData(store){
  var columns = [
    {header:'Directory Path',sortable:true,dataIndex:'Directory Path',align:'left',hideable:false},
    {header:'Replicas',sortable:true,dataIndex:'Files',align:'right'},
    {header:'Size',sortable:true,dataIndex:'Size',align:'left'},
  ];
  var tbar = '';
  tableMngr = {'store':store,'columns':columns,'tbar':tbar};
  var t = table(tableMngr);
  t.addListener('cellclick',function(table,rowIndex,columnIndex){
    showMenu('main',table,rowIndex,columnIndex);
  })
  return t
}
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar.items.items[0],'store':store}
}
function setMenuItems(selections){
  if(selections){
    var id = selections.runID;
    var status = selections.state;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
//      {handler:function(){AJAXrequest('showRunFiles',id)},text:'Show Files'},
//      {handler:function(){AJAXrequest('getRunParams',id)},text:'Run Parameters'}
    )
  }
};
function AJAXsuccess(value,id,response){
}
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
    statPanel.store.loadData(msg);
  }
/*
  try{
    delete dataSelect.extra.limit;
  }catch(e){}
  try{
    delete dataSelect.extra.start;
  }catch(e){}
*/
}
