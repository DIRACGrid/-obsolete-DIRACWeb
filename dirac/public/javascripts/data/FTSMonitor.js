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
    {name:'FTSReqID'},
    {name:'Status'},
    {name:'SourceSite'},
    {name:'DestinationSite'},
    {name:'PercentageComplete'},
    {name:'NumberOfFiles'},
    {name:'TotalSize'},
    {name:'SubmitTime'},
    {name:'LastMonitor'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var source = selectSourceSite();
  var destination = selectDestSite();
  var id = selectFTSID();
  var dt = dateTimeWidget();
  var select = selectPanel(); // Initializing container for selection objects
  select.buttons[2].hide(); // Remove refresh button
  // Insert object to container BEFORE buttons:
  select.insert(0,source);
  select.insert(1,destination);
  select.insert(2,id);
  select.insert(3,dt);
//  var sortGlobal = sortGlobalPanel(); // Initializing the global sort panel
  var bar = sideBar();
  bar.insert(0,select);
//  bar.insert(1,sortGlobal);
  bar.setTitle('FTS Monitor');
  return bar
}
function initData(store){
  var columns = [
    {header:'',name:'checkBox',id:'checkBox',width:26,sortable:false,dataIndex:'JobIDcheckBox',renderer:chkBox,hideable:false,fixed:true,menuDisabled:true},
    {header:'FTSReqID',sortable:true,dataIndex:'FTSReqID',align:'left'},
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
    {header:'SourceSite',sortable:true,dataIndex:'SourceSite',align:'left'},
    {header:'DestinationSite',sortable:true,dataIndex:'DestinationSite',align:'left'},
    {header:'PercentageComplete',sortable:true,dataIndex:'PercentageComplete',align:'left'},
    {header:'NumberOfFiles',sortable:true,dataIndex:'NumberOfFiles',align:'left'},
    {header:'TotalSize',sortable:true,dataIndex:'TotalSize',align:'left'},
    {header:'SubmitTime [UTC]',sortable: true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'SubmitTime'},
    {header:'LastMonitor [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'LastMonitor'}
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
}
