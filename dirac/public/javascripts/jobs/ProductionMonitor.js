var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initProductionMonitor(reponseSelect){
  dataSelect = reponseSelect;
  dataSelect.globalSort = '';
  var record = initRecord();
  var store = initStore(record);
  Ext.onReady(function(){
    renderData(store);
  });
}
// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'Jobs_Running'},
    {name:'Files_Problematic'},
    {name:'Files_Total'},
    {name:'Files_Unused'},
    {name:'AuthorDN'},
    {name:'TransformationName'},
    {name:'Type'},
    {name:'Jobs_Failed'},
    {name:'Status'},
    {name:'Description'},
    {name:'AgentType'},
    {name:'TransformationID'},
    {name:'FileMask'},
    {name:'Plugin'},
    {name:'Jobs_Done'},
    {name:'AuthorGroup'},
    {name:'Files_Assigned'},
    {name:'LongDescription'},
    {name:'Jobs_Submitted'},
    {name:'Jobs_Stalled'},
    {name:'CreationDate',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'Jobs_Waiting'},
    {name:'Jobs_Created'},
    {name:'Bk_ConfigName'},
    {name:'Bk_Events'},
    {name:'Bk_ConfigVersion'},
    {name:'Bk_Steps'},
    {name:'BkQueryID'},
    {name:'Bk_Files'},
    {name:'Bk_EventType'},
    {name:'Bk_Jobs'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var prodSelect = selectProdStatusMenu(); // Initializing Production Status Menu
  var agentSelect = selectProdAgentMenu(); // Initializing Agent Type Menu
  var prodType = selectProdTypeMenu();
  var transGroup = selectTransGroupMenu();
  var plugin = selectPluginMenu();
  var dateSelect = dateSelectMenu(); // Initializing date dialog
  var id = selectProductionID(); // Initialize field for JobIDs
  var select = selectPanel(); // Initializing container for selection objects
  select.buttons[2].hide(); // Remove refresh button
  // Insert object to container BEFORE buttons:
  select.insert(0,prodSelect);
  select.insert(1,agentSelect);
  select.insert(2,prodType);
  select.insert(3,transGroup);
  select.insert(4,plugin);
  select.insert(5,dateSelect);
  select.insert(6,id);
  var stat = statPanel('Statistics','current','statGrid');
  var bar = sideBar();
  bar.insert(0,select);
  bar.insert(1,stat);
  bar.setTitle('ProductionMonitor');
  return bar
}
function initData(store){
  var columns = [
    {header:'',id:'checkBox',width:26,sortable:false,dataIndex:'TransformationID',renderer:chkBox,hideable:false},
    {header:'ID',width:60,sortable:true,dataIndex:'TransformationID',align:'left'},
    {header:'Type',sortable:true,dataIndex:'Type',align:'left',hidden:true},
    {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
    {header:'Status',width:60,sortable:true,dataIndex:'Status',align:'left'},
    {header:'Name',sortable:true,dataIndex:'TransformationName',align:'left'},
    {header:'Files',sortable:true,dataIndex:'Files_Total',align:'left'},
    {header:'Files Assigned',sortable:true,dataIndex:'Files_Assigned',align:'left',hidden:true},
    {header:'Files Problematic',sortable:true,dataIndex:'Files_Problematic',align:'left',hidden:true},
    {header:'Files Unused',sortable:true,dataIndex:'Files_Unused',align:'left',hidden:true},
    {header:'FileMask',sortable:true,dataIndex:'FileMask',align:'left',hidden:true},
    {header:'Plugin',sortable:true,dataIndex:'Plugin',align:'left',hidden:true},
    {header:'Created',sortable:true,dataIndex:'Jobs_Created',align:'left'},
    {header:'Submited',sortable:true,dataIndex:'Jobs_Submitted',align:'left'},
    {header:'Waiting',sortable:true,dataIndex:'Jobs_Waiting',align:'left'},
    {header:'Running',sortable:true,dataIndex:'Jobs_Running',align:'left'},
    {header:'Stalled',sortable:true,dataIndex:'Jobs_Stalled',align:'left'},
    {header:'Done',sortable:true,dataIndex:'Jobs_Done',align:'left'},
    {header:'Failed',sortable:true,dataIndex:'Jobs_Failed',align:'left'},
    {header:'Bk_ConfigName',sortable:true,dataIndex:'Bk_ConfigName',align:'left',hidden:true},
//    {header:'Bk_Events',sortable:true,dataIndex:'Bk_Events',align:'left'},
    {header:'Bk_ConfigVersion',sortable:true,dataIndex:'Bk_ConfigVersion',align:'left',hidden:true},
    {header:'Bk_Steps',sortable:true,dataIndex:'Bk_Steps',align:'left',hidden:true},
    {header:'BkQueryID',sortable:true,dataIndex:'BkQueryID',align:'left',hidden:true},
    {header:'Bk_Files',sortable:true,dataIndex:'Bk_Files',align:'left',hidden:true},
    {header:'Bk_EventType',sortable:true,dataIndex:'Bk_EventType',align:'left',hidden:true},
    {header:'Bk_Jobs',sortable:true,dataIndex:'Bk_Jobs',align:'left',hidden:true},
    {header:'Description',sortable:true,dataIndex:'Description',align:'left',hidden:true},
    {header:'LongDescription',sortable:true,dataIndex:'LongDescription',align:'left',hidden:true},
    {header:'AgentType',width:60,sortable:true,dataIndex:'AgentType',align:'left'},
    {header:'AuthorDN',sortable:true,dataIndex:'AuthorDN',align:'left',hidden:true},
    {header:'AuthorGroup',sortable:true,dataIndex:'AuthorGroup',align:'left',hidden:true},
    {header:'CreationDate [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-n-j h:i'),dataIndex:'CreationDate'}
  ];
  var tbar = [
    {
      cls:"x-btn-text-icon",
      handler:function(){selectAll('all')},
      icon:gURLRoot+'/images/iface/checked.gif',
      text:'Select All',
      tooltip:'Click to select all rows'
    },{
      cls:"x-btn-text-icon",
      handler:function(){selectAll('none')},
      icon:gURLRoot+'/images/iface/unchecked.gif',
      text:'Select None',
      tooltip:'Click to uncheck selected row(s)'
    },
    '->',
    {handler:function(){action('production','start')},text:'Start',tooltip:'Click to start selected production(s)'},
    {handler:function(){action('production','stop')},text:'Stop',tooltip:'Click to kill selected production(s)'},
    {handler:function(){action('production','delete')},text:'Delete',tooltip:'Click to delete selected production(s)'}
  ];
  store.setDefaultSort('TransformationID','DESC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'tbar':tbar};
  var t = table(tableMngr);
  t.addListener('cellclick',function(table,rowIndex,columnIndex){
      showMenu('main',table,rowIndex,columnIndex);
  });
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
    var id = selections.TransformationID;
    var status = selections.Status;
    var submited = selections.Jobs_Submitted;
  }else{
    return
  }
  var subMenu = [
    {handler:function(){action('production','start',id)},text:'Start'},
    {handler:function(){action('production','stop',id)},text:'Stop'},
    {handler:function(){action('production','delete',id)},text:'Delete'},
    '-'
  ];
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){jump('job',id,submited)},text:'Show Jobs'},
      {handler:function(){AJAXrequest('log',id)},text:'Show Logs'},
      '-',
      {text:'Actions',menu:({items:subMenu})}
    );
  }
  if(status == 'Active'){
    dirac.menu.items.items[3].menu.items.items[1].enable();
    dirac.menu.items.items[3].menu.items.items[0].disable();
  }else if(status == 'New'){
    dirac.menu.items.items[3].menu.items.items[1].disable();
    dirac.menu.items.items[3].menu.items.items[0].enable();
  }else{
    dirac.menu.items.items[3].menu.items.items[1].disable();
    dirac.menu.items.items[3].menu.items.items[0].enable();
  }
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
    panel.addListener('cellclick',function(table,rowIndex,columnIndex){
      showMenu('nonMain',table,rowIndex,columnIndex);
    });
  }
  displayWin(panel,id)
}
function jump(type,id,submited){
  if(submited == 0){
    alert('Nothing to display');
    return
  }else{
    var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/' + gPageDescription.selectedSetup;
    url = url + '/' + gPageDescription.userData.group + '/jobs/JobMonitor/display';
    var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
    post_req = post_req + '<input type="hidden" name="prod" value="' + id + '">';
    post_req = post_req + '</form>';
    document.body.innerHTML = document.body.innerHTML + post_req;
    var form = document.getElementById('redirform');
    form.submit();
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
    var data = [];
    var j = 0;
    for( var i in msg ){
      data[j] = [i,msg[i]];
      j = j + 1;
    }
    statPanel.store.loadData(data);
  }
}
