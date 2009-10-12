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
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var lfn = selectLFN()
  var statusSelect = selectRAWStatusMenu();
  var storageSelect = selectStorageElementMenu()
  var dt = dateTimeWidget();
  var select = selectPanel(); // Initializing container for selection objects
  select.buttons[2].hide(); // Remove refresh button
  // Insert object to container BEFORE buttons:
  select.insert(0,statusSelect);
  select.insert(1,storageSelect);
  select.insert(2,dt);
  select.insert(3,lfn);
  var bar = sideBar();
  bar.insert(0,select);
  var buttons = [
      ['Submit Time Ascending','SubmitTime ASC'],
      ['Submit Time Descending','SubmitTime DESC'],
      ['Status Ascending','Status ASC'],
      ['Status Descending','Status DESC'],
      ['StorageElement Ascending','StorageElement ASC'],
      ['StorageElement Descending','StorageElement DESC'],
      ['LFN Ascending','LFN ASC'],
      ['LFN Descending','LFN DESC']
    ];
  var sortGlobal = sortGlobalPanel(buttons,'SubmitTime DESC');
  bar.insert(1,sortGlobal);
  var stat = statPanel('Current Statistics','fileStatus','statGrid');
  bar.insert(2,stat);
  var glStat = statPanel('Global Statistics','globalFile','glStatGrid');
  bar.insert(3,glStat);
  bar.setTitle('RAW Integrity DB Monitor');
  return bar
}
// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'lfn'},
    {name:'pfn'},
    {name:'size'},
    {name:'storageelement'},
    {name:'guid'},
    {name:'checksum'},
    {name:'status'},
    {name:'startTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'endTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'StatusIcon',mapping:'status'}
  ]);
  return record
}
function initData(store){
  var columns = [
    {header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:fileStatus,hideable:false,fixed:true,menuDisabled:true},
    {header:'LFN',sortable:true,dataIndex:'lfn',align:'left',hideable:false},
    {header:'Status',width:60,sortable:true,dataIndex:'status',align:'left'},
    {header:'PFN',sortable:true,dataIndex:'pfn',align:'left',hidden:true},
    {header:'Size',sortable:true,dataIndex:'size',align:'right'},
    {header:'StorageElement',sortable:true,dataIndex:'storageelement',align:'left'},
    {header:'GUID',sortable:true,dataIndex:'guid',align:'left',hidden:true},
    {header:'Checksum',sortable:true,dataIndex:'checksum',align:'left'},
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
    var id = selections.lfn;
    var status = selections.state;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){AJAXrequest('getLoggingInfo',id)},text:'Logging Info'}
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
    if((value == 'getLoggingInfo')||(value == 'void')){
      //var reader = new Ext.data.ArrayReader({},[
      var record = new Ext.data.Record.create([
        {name:'Status'},
        {name:'MinorStatus'},
        {name:'StatusTime'},
        {name:'Source'}
      ]);
      var reader = new Ext.data.JsonReader({
        root:'result',
        totalProperty:'total'
      },record);
      var columns = [
        {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
        {header:'Minor Status',sortable:true,dataIndex:'MinorStatus',align:'left'},
        {header:'StatusTime [UTC]',sortable:true,dataIndex:'StatusTime',align:'left'},
        {header:'Source',sortable:true,dataIndex:'Source',align:'left'}
      ];
      var store = new Ext.data.Store({
        baseParams:{'getLoggingInfo':id},
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
  if(value == 'getLoggingInfo'){
    tmpWin.setWidth(800);
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
