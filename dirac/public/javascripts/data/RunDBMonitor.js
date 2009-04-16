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
    {name:'partitionID'},
    {name:'endLumi',type:'float'},
    {name:'startLumi',type:'float'},
    {name:'fillID'},
    {name:'destination'},
    {name:'state'},
    {name:'beamEnergy',type:'float'},
    {name:'runID'},
    {name:'startTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'runType'},
    {name:'partitionName'},
    {name:'endTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'StatusIcon',mapping:'state'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var destSelect = selectDestinationsMenu(); // Initializing Site Menu
  var partSelect = selectPartitionNamesMenu();
  var stateSelect = selectStatesMenu();
  var fillSelect = selectFillIDMenu();
  var runtypeSelect = selectRunTypesMenu();
  var dateStartSelect = dateStartSelectMenu(); // Initializing date dialog
  var dateEndSelect = dateEndSelectMenu();
  var id = selectID(); // Initialize field for JobIDs
  var select = selectPanel(); // Initializing container for selection objects
  var endLSelect = selectEndLumiMenu();
  var startLSelect = selectStartLumiMenu();
  var beamSelect = selectBeamEnergyMenu();
  // Insert object to container BEFORE buttons:
  select.insert(0,id);
  select.insert(1,stateSelect);
  select.insert(2,destSelect);
  select.insert(3,runtypeSelect);
  select.insert(4,partSelect);
  select.insert(5,fillSelect);
  select.insert(6,startLSelect);
  select.insert(7,endLSelect);
  select.insert(8,beamSelect);
  select.insert(9,dateStartSelect);
  select.insert(10,dateEndSelect);
//  var sortGlobal = sortGlobalPanel(); // Initializing the global sort panel
  var stat = statPanel('Current Statistics','current','statGrid');
//  var glStat = statPanel('Global Statistics','global','glStatGrid');
  var bar = sideBar();
  bar.insert(0,select);
//  bar.insert(1,sortGlobal);
  bar.insert(2,stat);
//  bar.insert(3,glStat);
  bar.setTitle('RunDB Monitor');
  return bar
}
function initData(store){
  var columns = [
    {header:'RunID',sortable:true,dataIndex:'runID',align:'left',hideable:false},
    {header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:status,hideable:false,fixed:true,menuDisabled:true},
    {header:'State',sortable:true,dataIndex:'state',align:'left'},
    {header:'Destination',sortable:true,dataIndex:'destination',align:'left'},
    {header:'RunType',sortable:true,dataIndex:'RunType',align:'left'},
    {header:'PartitionName',sortable:true,dataIndex:'partitionName',align:'left'},
    {header:'FillID',sortable:true,dataIndex:'fillID',align:'left'},
    {header:'StartLumi',width:60,sortable:true,dataIndex:'startLumi',align:'left'},
    {header:'EndLumi',sortable:true,dataIndex:'endLumi',align:'left'},
    {header:'BeamEnergy',sortable:true,dataIndex:'beamEnergy',align:'left'},
    {header:'StartTime [UTC]',sortable: true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'startTime'},
    {header:'EndTime [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'endTime'}
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
      {handler:function(){AJAXrequest('showRunFiles',id)},text:'Show Files'},
      {handler:function(){AJAXrequest('getRunParams',id)},text:'Run Parameters'}
    )
  }
};
function AJAXsuccess(value,id,response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
  var jsonData = Ext.util.JSON.decode(response);
  if(jsonData['success'] == 'false'){
    alert('Error: ' + jsonData['error']);
    return
  }
  var result = jsonData.result;
  var panel = {};
  if((value == 'ForPlainText')||(value == 'plainText')){
    var html = '<pre>' + result + '</pre>';
    panel = new Ext.Panel({border:0,autoScroll:true,html:html,layout:'fit'})
  }else{
    if((value == 'getRunParams')||(value == 'void')){
      var reader = new Ext.data.ArrayReader({},[
        {name:'name'},
        {name:'value'}
      ]);
      var columns = [
        {header:'Name',sortable:true,dataIndex:'name',align:'left'},
        {header:'Value',sortable:true,dataIndex:'value',align:'left'}
      ];
      var store = new Ext.data.Store({
        data:result,
        reader:reader
      });
    }else if(value == 'showRunFiles'){
      var record = new Ext.data.Record.create([
        {name:'fileID'},
        {name:'runID'},
        {name:'name'},
        {name:'state'},
        {name:'bytes'},
        {name:'events'},
        {name:'stream'},
        {name:'creationTime',type:'date',dateFormat:'Y-n-j h:i:s'},
        {name:'timeStamp',type:'date',dateFormat:'Y-n-j h:i:s'},
        {name:'refCount'},
        {name:'StatusIcon',mapping:'state'}
      ]);
      var reader = new Ext.data.JsonReader({
        root:'result',
        totalProperty:'total'
      },record);
      var columns = [
        {header:'FileID',width:40,sortable:true,dataIndex:'fileID',align:'left',hideable:false},
        {header:'RunID',width:40,sortable:true,dataIndex:'runID',align:'left',hideable:false},
        {header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:status,hideable:false,fixed:true,menuDisabled:true},
        {header:'State',sortable:true,dataIndex:'state',align:'left',hideable:false},
        {header:'Name',sortable:true,dataIndex:'name',align:'left'},
        {header:'Bytes',sortable:true,dataIndex:'bytes',align:'left'},
        {header:'Events',sortable:true,dataIndex:'events',align:'left'},
        {header:'Stream',sortable:true,dataIndex:'stream',align:'left'},
        {header:'RefCount',sortable:true,dataIndex:'refCount',align:'left'},
        {header:'CreationTime [UTC]',sortable: true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'creationTime'},
        {header:'TimeStamp [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'timeStamp'}
      ];
      var store = new Ext.data.Store({
        baseParams:{'showRunFiles':id},
        proxy: new Ext.data.HttpProxy({
          url:'action',
          method:'POST',
        }),
        reader:reader
      });
      var bbar = new Ext.PagingToolbar({
        displayInfo:true,
        items:['-','Maximum items per page: 100'],
        pageSize:100,
        refreshText:'Click to refresh current page',
        store:store
      });
      store.loadData(jsonData);
    }
    panel = new Ext.grid.GridPanel({
      anchor:'100%',
      bbar:bbar,
      columns:columns,
      store:store,
      stripeRows:true,
      viewConfig:{forceFit:true}
    });
    panel.addListener('cellclick',function(table,rowIndex,columnIndex){
      showMenu('nonMain',table,rowIndex,columnIndex);
    });
  }
  id = setTitle(value,id);
  var tmpWin = displayWin(panel,id);
  if(value == 'showRunFiles'){
    tmpWin.setWidth(1000);
  }
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
    msg = createStateMatrix(msg);
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
