var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initJobMonitor(reponseSelect){

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
    {name:'id', type: 'float'},
    {name:'status'},
    {name:'minorStatus'},
    {name:'applicationStatus'},
    {name:'site'},
    {name:'jobname'},
    {name:'lastUpdate',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'owner'},
    {name:'signTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'submissionTime',type:'date',dateFormat:'Y-n-j h:i:s'}
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
  return select
}
function initData(store){
  var columns = [
    {header:'',name:'checkBox',id:'checkBox',width:10,sortable:false,dataIndex:'id',renderer:chkBox},
    {header:'JobId',sortable:true,dataIndex:'id',align:'left'},
    {header:'',width:10,sortable:false,dataIndex:'status',renderer:status},
    {header:'Status',sortable:true,dataIndex:'status',align:'left'},
    {header:'MinorStatus',sortable:true,dataIndex:'minorStatus',align:'left'},
    {header:'ApplicationStatus',sortable:true,dataIndex:'applicationStatus',align:'left'},
    {header:'Site',sortable:true,dataIndex:'site',align:'left'},
    {header:'JobName',sortable:true,dataIndex:'jobname',align:'left'},
    {header:'LastUpdate [UTC]',sortable: true,renderer:Ext.util.Format.dateRenderer('Y-n-j h:i'),dataIndex:'lastUpdate'},
    {header:'LastSignOfLife [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-n-j h:i'),dataIndex:'signTime'},
    {header:'SubmissionTime [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-n-j h:i'),dataIndex:'submissionTime'},
    {header:'Owner',sortable:true,dataIndex:'owner',align:'left'}
  ];
  var title = 'Job Monitoring';
  var tbar = [
    {handler:function(){selectAll('all')},text:'Select All',width:150,tooltip:'Click to select all rows'},
    {handler:function(){selectAll('none')},text:'Select None',width:150,tooltip:'Click to uncheck selected row(s)'},
    '->',
    {handler:function(){action('job','reset')},text:'Reset',tooltip:'Click to reset selected job(s)'},
    {handler:function(){action('job','kill')},text:'Kill',tooltip:'Click to kill selected job(s)'},
    {handler:function(){action('job','delete')},text:'Delete',tooltip:'Click to delete selected job(s)'}
  ];
 tableMngr = {'store':store,'columns':columns,'title':title,'tbar':tbar};
  var t = table(tableMngr);
  t.addListener('cellclick',showMenu);
  return t
}
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
/*  var overallLayout = new Ext.Viewport({
    layout:'border',
    plain:true,
    items:[topBar,leftBar,mainContent,bottomBar]
  })
*/
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar,'store':store}
}

function setMenuItems(selections){
  if(selections){
    var id = selections.id;
    var status = selections.status;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){AJAXrequest('getJDL',id)},text:'JDL'},
      '-',
      {handler:function(){AJAXrequest('getBasicInfo',id)},text:'Attributes'},
      {handler:function(){AJAXrequest('getParams',id)},text:'Parameters'},
      {handler:function(){AJAXrequest('LoggingInfo',id)},text:'Logging info'},
      '-',
      {handler:function(){AJAXrequest('getStandardOutput',id)},text:'StandardOutput'},
      {handler:function(){AJAXrequest('LogURL',id)},text:'Get LogFile'},
      {handler:function(){AJAXrequest('getStagerReport',id)},text:'Get StagerReport'},
      '-',
      {text:'Actions',menu:({items:[
        {handler:function(){action('job','reset',id)},text:'Reset'},
        {handler:function(){action('job','kill',id)},text:'Kill'},
        {handler:function(){action('job','delete',id)},text:'Delete'}
      ]})},
      {text:'Pilot', menu:({items:[
        {handler:function(){AJAXrequest('pilotStdOut',id)},text:'Get StdOut'},
        {handler:function(){AJAXrequest('pilotStdErr',id)},text:'Get StdErr'}
      ]})}
    );
    if((status == 'Done')||(status == 'Failed')){
      dirac.menu.items.items[8].enable();
    }else{
      dirac.menu.items.items[8].disable();
    }
  }
};
function AJAXsuccess(value,id,response){
  var jsonData = Ext.util.JSON.decode(response);
  if(jsonData['success'] == 'false'){
    alert('Error: ' + jsonData['error']);
    return
  }
  var result = jsonData.result;
  if((value == 'getJDL')||(value == 'getStandardOutput')||(value == 'pilotStdOut')||(value == 'pilotStdErr')||(value == 'getStagerReport')){
    var html = '<pre>' + result + '</pre>';
    var panel = new Ext.Panel({border:0,autoHeight:true,html:html,layout:'fit'})
  }else if(value == 'LogURL'){
    result = result.replace(/"/g,"");
    result = result.replace(/\\/g,"");
    var html = '<iframe id="www_frame" src =' + result + '></iframe>';
    var panel = new Ext.Panel({border:0,autoWidth:true,autoHeight:true,html:html,layout:'fit'})
  }else{
    if((value == 'getBasicInfo')||(value == 'getParams')){
      var reader = new Ext.data.ArrayReader({}, [
        {name:'name'},
        {name:'value'}
      ]);
      var panel = new Ext.grid.GridPanel({
        store:new Ext.data.Store({
          data:result,
          reader:reader
        }),
        columns:[
          {header:'Name',sortable:true,dataIndex:'name',align:'left'},
          {header:'Value',sortable:true,dataIndex:'value',align:'left'}
        ],
        autoHeight: true,
        viewConfig: {forceFit: true},
        stripeRows: true
      });
    }else if(value == 'LoggingInfo'){
      var reader = new Ext.data.ArrayReader({}, [
        {name:'status'},
        {name:'minorstatus'},
        {name:'applicationstatus'},
        {name:'datetime',type:'date',dateFormat:'Y-n-j h:i:s'},
        {name:'source'}
      ]);
      var panel = new Ext.grid.GridPanel({
        store:new Ext.data.Store({
          data:result,
          reader:reader
        }),
        columns:[
          {header:'Source',sortable:true,dataIndex:'source',align:'left'},
          {header:'Status',sortable:true,dataIndex:'status',align:'left'},
          {header:'MinorStatus',sortable:true,dataIndex:'minorstatus',align:'left'},
          {header:'ApplicationStatus',sortable:true,dataIndex:'applicationstatus',align:'left'},
          {header:'DateTime',sortable:true,dataIndex:'datetime',align:'left'}
        ],
        autoHeight: true,
        viewConfig: {forceFit: true},
        stripeRows: true
      });
    }
  }
  displayWin(panel,id)
}
function afterDataLoad(){
}
