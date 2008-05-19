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
'SystemPriority', 'ApplicationNumStatus', 'JobID', 'LastSignOfLife', 'VerifiedFlag', 'RetrievedFlag', 'Status', 'StartExecTime', 'RescheduleCounter', 'JobSplitType', 'MinorStatus', 'ApplicationStatus', 'SubmissionTime', 'JobType', 'MasterJobID', 'KilledFlag', 'RescheduleTime', 'DIRACSetup', 'FailedFlag', 'CPUTime', 'OwnerDN', 'JobGroup', 'JobName', 'AccountedFlag', 'OSandboxReadyFlag', 'LastUpdateTime', 'Site', 'HeartBeatTime', 'OwnerGroup', 'ISandboxReadyFlag', 'UserPriority', 'Owner', 'DeletedFlag'

// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'SystemPriority', type: 'float'},
    {name:'ApplicationNumStatus'},
    {name:'JobID', type: 'float'},
    {name:'LastSignOfLife',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'VerifiedFlag'},
    {name:'RetrievedFlag'},
    {name:'Status'},
    {name:'StartExecTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'RescheduleCounter'},
    {name:'JobSplitType'},
    {name:'MinorStatus'},
    {name:'ApplicationStatus'},
    {name:'SubmissionTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'JobType'},
    {name:'MasterJobID'},
    {name:'KilledFlag'},
    {name:'RescheduleTime'},
    {name:'DIRACSetup'},
    {name:'FailedFlag'},
    {name:'CPUTime'},
    {name:'OwnerDN'},
    {name:'JobGroup'},
    {name:'JobName'},
    {name:'AccountedFlag'},
    {name:'OSandboxReadyFlag'},
    {name:'LastUpdateTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'Site'},
    {name:'HeartBeatTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'OwnerGroup'},
    {name:'ISandboxReadyFlag'},
    {name:'UserPriority'},
    {name:'Owner'},
    {name:'DeletedFlag'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var siteSelect = selectSiteMenu(); // Initializing Site Menu
  var ownerSelect = selectOwnerMenu(); // Initializing Owner Menu
  var appSelect = selectAppMenu(); // Initializing Application status Menu
  var statSelect = selectStatusMenu(); // Initializing JobStatus Menu
  var minSelect = selectMinorStatus(); // Initializing Minor Status Menu
  var prodSelect = selectProdMenu(); // Initializing JobGroup Menu
  var dateSelect = dateSelectMenu(); // Initializing date dialog
  var id = selectID(); // Initialize field for JobIDs
  var select = selectPanel(); // Initializing container for selection objects
  // Insert object to container BEFORE buttons:
  select.insert(0,siteSelect);
  select.insert(1,statSelect);
  select.insert(2,minSelect);
  select.insert(3,appSelect);
  select.insert(4,ownerSelect);
  select.insert(5,prodSelect);
  select.insert(6,dateSelect);
  select.insert(7,id);
  return select
}
function initData(store){
  var columns = [
    {header:'',name:'checkBox',id:'checkBox',width:10,sortable:false,dataIndex:'JobID',renderer:chkBox,hideable:false},
    {header:'JobId',sortable:true,dataIndex:'JobID',align:'left'},
    {header:'',width:10,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
    {header:'MinorStatus',sortable:true,dataIndex:'MinorStatus',align:'left'},
    {header:'ApplicationStatus',sortable:true,dataIndex:'ApplicationStatus',align:'left'},
    {header:'Site',sortable:true,dataIndex:'Site',align:'left'},
    {header:'JobName',sortable:true,dataIndex:'JobName',align:'left'},
    {header:'LastUpdate [UTC]',sortable: true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'LastUpdateTime'},
    {header:'LastSignOfLife [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'LastSignOfLife'},
    {header:'SubmissionTime [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'SubmissionTime'},
    {header:'DIRACSetup',sortable:true,dataIndex:'DIRACSetup',align:'left',hidden:true},
    {header:'FailedFlag',sortable:true,dataIndex:'FailedFlag',align:'left',hidden:true},
    {header:'CPUTime',sortable:true,dataIndex:'CPUTime',align:'left,hidden:true'},
    {header:'OwnerDN',sortable:true,dataIndex:'OwnerDN',align:'left',hidden:true},
    {header:'JobGroup',sortable:true,dataIndex:'JobGroup',align:'left',hidden:true},
    {header:'JobName',sortable:true,dataIndex:'JobName',align:'left',hidden:true},
    {header:'AccountedFlag',sortable:true,dataIndex:'AccountedFlag',align:'left',hidden:true},
    {header:'OSandboxReadyFlag',sortable:true,dataIndex:'OSandboxReadyFlag',align:'left',hidden:true},
    {header:'Owner',sortable:true,dataIndex:'Owner',align:'left'}
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
  store.setDefaultSort('JobID','DESC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'title':title,'tbar':tbar};
  var t = table(tableMngr);
  t.addListener('cellclick',showMenu);
  return t
}
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar,'store':store}
}

function setMenuItems(selections){
  if(selections){
    var id = selections.JobID;
    var status = selections.Status;
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
  var panel = {};
  if((value == 'getJDL')||(value == 'getStandardOutput')||(value == 'pilotStdOut')||(value == 'pilotStdErr')||(value == 'getStagerReport')){
    var html = '<pre>' + result + '</pre>';
    panel = new Ext.Panel({border:0,autoScroll:true,html:html,layout:'fit'})
  }else if(value == 'LogURL'){
    result = result.replace(/"/g,"");
    result = result.replace(/\\/g,"");
    var html = '<iframe id="www_frame" src =' + result + '></iframe>';
    panel = new Ext.Panel({border:0,autoScroll:true,html:html,layout:'fit'})
    panel.on('resize',function(){
      var wwwFrame = document.getElementById('www_frame');
      wwwFrame.height = panel.getInnerHeight();
      wwwFrame.width = panel.getInnerWidth();
    })
  }else{
    var reader = {};
    var columns = [];
    if((value == 'getBasicInfo')||(value == 'getParams')){
      reader = new Ext.data.ArrayReader({},[
        {name:'name'},
        {name:'value'}
      ]);
      columns = [
        {header:'Name',sortable:true,dataIndex:'name',align:'left'},
        {header:'Value',sortable:true,dataIndex:'value',align:'left'}
      ];
    }else if(value == 'LoggingInfo'){
     reader = new Ext.data.ArrayReader({},[
        {name:'status'},
        {name:'minorstatus'},
        {name:'applicationstatus'},
        {name:'datetime',type:'date',dateFormat:'Y-n-j h:i:s'},
        {name:'source'}
      ]);
      columns = [
        {header:'Source',sortable:true,dataIndex:'source',align:'left'},
        {header:'Status',sortable:true,dataIndex:'status',align:'left'},
        {header:'MinorStatus',sortable:true,dataIndex:'minorstatus',align:'left'},
        {header:'ApplicationStatus',sortable:true,dataIndex:'applicationstatus',align:'left'},
        {header:'DateTime',sortable:true,dataIndex:'datetime',align:'left'}
      ];
    }
    var store = new Ext.data.Store({
      data:result,
      reader:reader
    }),
    panel = new Ext.grid.GridPanel({
      columns:columns,
      store:store,
      stripeRows:true,
      viewConfig:{forceFit:true}
    });
  }
  id = setTitle(value,id);
  displayWin(panel,id)
}
function afterDataLoad(){
}
