var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initProductionMonitor(reponseSelect){
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
    {name:'id'},
    {name:'name'},
    {name:'status'},
    {name:'created'},
    {name:'submited'},
    {name:'wait'},
    {name:'running'},
    {name:'done'},
    {name:'failed'},
    {name:'agenttype'},
    {name:'description'},
    {name:'creationdate',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'stalled'}
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
    {header:'',id:'checkBox',width:10,sortable:false,dataIndex:'id',renderer:chkBox},
    {header:'ID',sortable:true,dataIndex:'id',align:'left'},
    {header:'',width:10,sortable:false,dataIndex:'status',renderer:status},
    {header:'Status',sortable:true,dataIndex:'status',align:'left'},
    {header:'Name',sortable:true,dataIndex:'name',align:'left'},
    {header:'Created',sortable:true,dataIndex:'created',align:'left'},
    {header:'Submited',sortable:true,dataIndex:'submited',align:'left'},
    {header:'Waiting',sortable:true,dataIndex:'wait',align:'left'},
    {header:'Running',sortable:true,dataIndex:'running',align:'left'},
    {header:'Done',sortable:true,dataIndex:'done',align:'left'},
    {header:'Failed',sortable:true,dataIndex:'failed',align:'left'},
    {header:'Description',sortable:true,dataIndex:'description',align:'left'},
    {header:'AgentType',sortable:true,dataIndex:'agenttype',align:'left'},
    {header:'CreationDate [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-n-j h:i'),dataIndex:'creationdate'},
    {header:'Owner',sortable:true,dataIndex:'owner',align:'left'}
  ];
  var title = 'Production Monitoring';
  var tbar = [
    {handler:function(){selectAll('all')},text:'Select All',width:150,tooltip:'Click to select all rows'},
    {handler:function(){selectAll('none')},text:'Select None',width:150,tooltip:'Click to uncheck selected row(s)'},
    '->',
    {handler:function(){action('production','start')},text:'Start',tooltip:'Click to start selected production(s)'},
    {handler:function(){action('production','stop')},text:'Stop',tooltip:'Click to kill selected production(s)'},
    {handler:function(){action('production','delete')},text:'Delete',tooltip:'Click to delete selected production(s)'}
  ];
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
    var id = selections.id;
    var status = selections.status;
    var submited = selections.submited;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){jump('job',id,submited)},text:'Show Jobs'},
      {handler:function(){AJAXrequest('log',id)},text:'Show Logs'},
      '-',
      {text:'Actions',menu:({items:[
        {handler:function(){action('production','start',id)},text:'Start'},
        {handler:function(){action('production','stop',id)},text:'Stop'},
        {handler:function(){action('production','delete',id)},text:'Delete'}
      ]})}
    );
  }
  if((status == 'Active')||(status == 'New')){
      dirac.menu.items.items[3].menu.items.items[1].enable();
      dirac.menu.items.items[3].menu.items.items[0].disable();
  }else{
      dirac.menu.items.items[3].menu.items.items[1].disable();
      dirac.menu.items.items[3].menu.items.items[0].enable();
  }
  x = 0;
};
function AJAXsuccess(value,id,response){
  var jsonData = Ext.util.JSON.decode(response);
  if(jsonData['success'] == 'false'){
    alert('Error: ' + jsonData['error']);
    return
  }
  var result = jsonData.result;
  if(value == 'log'){


    var reader = {};
    var columns = [];
    reader = new Ext.data.ArrayReader({},[
      {name:'message'},
      {name:'author'},
      {name:'date'}
    ]);
    columns = [
        {header:'Message',sortable:true,dataIndex:'message',align:'left'},
        {header:'Date [UTC]',sortable:true,dataIndex:'date',align:'left'},
//        {header:'Date [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-n-j h:i'),dataIndex:'date'},
        {header:'Author',sortable:true,dataIndex:'author',align:'left'}
    ];
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
  displayWin(panel,id)
}
function jump(type,id,submited){
  if(submited==0){
    alert('Nothing to display');
    return
  }else{
    var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/jobs/JobMonitor/display';
    var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
    post_req = post_req + '<input type="hidden" name="productionID" value="' + id + '">';
    post_req = post_req + '</form>';
    document.body.innerHTML = document.body.innerHTML + post_req;
    var form = document.getElementById('redirform');
    form.submit();
  }
}
function afterDataLoad(){
}
