var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initLoop(){
  var record = initRecord();
  var store = initStore(record);
  Ext.onReady(function(){
    renderData(store);
  });
}
// function describing data structure, should be individual per page
function initRecord(){
//'transfer': {'Assigned': 0, 'ToDo': 59}, 'diset': {'Assigned': 0, 'ToDo': 105}, 'register': {'Assigned': 0, 'ToDo': 63}, 'removal': {'Assigned': 0, 'ToDo': 59}
  var record = new Ext.data.Record.create([
    {name:'disetTo'},
    {name:'disetAss'},
    {name:'transferTo'},
    {name:'transferAss'},
    {name:'registerTo'},
    {name:'registerAss'},
    {name:'removalTo'},
    {name:'removalAss'},
    {name:'loguploadTo'},
    {name:'loguploadAss'}
  ]);
  return record
}
//"diset:40", "transfer:68", "register:68", "removal:68", "logupload:0", "accounting:0"
function initData(store){
  var columns = [
    {header:'DISET<br>ToDo',sortable:true,dataIndex:'disetTo',align:'center'},
    {header:'DISET<br>Assigned',sortable:true,dataIndex:'disetAss',align:'center'},
    {header:'Transfer<br>ToDo',sortable:true,dataIndex:'transferTo',align:'center'},
    {header:'Transfer<br>Assigned',sortable:true,dataIndex:'transferAss',align:'center'},
    {header:'Register<br>ToDo',sortable:true,dataIndex:'registerTo',align:'center'},
    {header:'Register<br>Assigned',sortable:true,dataIndex:'registerAss',align:'center'},
    {header:'Removal<br>ToDo',sortable:true,dataIndex:'removalTo',align:'center'},
    {header:'Removal<br>Assigned',sortable:true,dataIndex:'removalAss',align:'center'},
    {header:'Logupload<br>ToDo',sortable:true,dataIndex:'loguploadTo',align:'center'},
    {header:'Logupload<br>Assigned',sortable:true,dataIndex:'loguploadAss',align:'center'},
    {header:'Accounting<br>ToDo',sortable:true,dataIndex:'accountingTo',align:'center'},
    {header:'Accounting<br>Assigned',sortable:true,dataIndex:'accountingAss',align:'center'}
  ];
  try{
    if(gPageDescription.userData.group == 'diracAdmin'){
      var resetButton = {
        handler:function(){action('job','reset')},
        text:'Reset',
        tooltip:'Click to reset selected job(s)'
      }
      var a = tbar.slice(), b = a.splice( 3 );
      a[3] = resetButton;
      tbar = a.concat( b );
    }
  }catch(e){}
//  store.setDefaultSort('Column','DESC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'tbar':'','title':'RequestDB Summary'};
  var t = table(tableMngr);
  t.addListener('cellclick',function(table,rowIndex,columnIndex){
      showMenu('main',table,rowIndex,columnIndex);
  })
  return t
}
function renderData(store){
//  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ mainContent ]);
  dataMngr = {'store':store}
  addMenu();
}
function addMenu(){
  var topBar = Ext.getCmp('diracTopBar');
  if(topBar){
    var button = new Ext.Toolbar.Button({
      text:'Tools',
      menu:[
        {handler:function(){showURL()},text:'Full URL'},
        {menu:{items:[
          {handler:function(){showJobID(', ')},text:'Comma separated'},
          {handler:function(){showJobID('; ')},text:'Semicolon separated'}
        ]},text:'Show selected JobIDs'}
      ]
    });
    topBar.insertButton(5,button);
  }
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
      {handler:function(){AJAXrequest('getStandardOutput',id)},text:'Peek StandardOutput'},
      {handler:function(){AJAXrequest('LogURL',id)},text:'Get LogFile'},
      {handler:function(){AJAXrequest('getPending',id)},text:'Get PendingRequest'},
      {handler:function(){AJAXrequest('getStagerReport',id)},text:'Get StagerReport'},
      {handler:function(){AJAXrequest('getSandBox',id)},text:'Get SandBox file'},
      '-',
      {text:'Actions',icon:gURLRoot + '/images/iface/action.gif',menu:({items:[
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
      dirac.menu.items.items[9].enable();
    }else{
      dirac.menu.items.items[9].disable();
    }
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
  if((value == 'getJDL')||(value == 'getStandardOutput')||(value == 'pilotStdOut')||(value == 'pilotStdErr')||(value == 'getStagerReport')){
    var html = '<pre>' + result + '</pre>';
    panel = new Ext.Panel({border:0,autoScroll:true,html:html,layout:'fit'})
  }else if(value == 'LogURL'){
    result = result.replace(/"/g,"");
    result = result.replace(/\\/g,"");
    var html = '<iframe id="www_frame" src =' + result + '></iframe>';
    panel = new Ext.Panel({border:0,autoScroll:false,html:html})
    panel.on('resize',function(){
      var wwwFrame = document.getElementById('www_frame');
      wwwFrame.height = panel.getInnerHeight() - 4;
      wwwFrame.width = panel.getInnerWidth() - 4;
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
    }else if(value == 'getPending'){
      reader = new Ext.data.ArrayReader({},[
        {name:'type'},
        {name:'operation'},
        {name:'status'},
        {name:'order'},
        {name:'targetSE'},
        {name:'file'}
      ]);
      columns = [
        {header:'Type',sortable:true,dataIndex:'type',align:'left'},
        {header:'Operation',sortable:true,dataIndex:'operation',align:'left'},
        {header:'Status',sortable:true,dataIndex:'status',align:'left'},
        {header:'Order',sortable:true,dataIndex:'order',align:'left'},
        {header:'Targert SE',sortable:true,dataIndex:'targetSE',align:'left'},
        {header:'File',sortable:true,dataIndex:'file',align:'left'}
      ];
      var mark = 0;
      for(var i = 0; i < result.length; i++){
        if(result[i][0] == 'PendingRequest'){
          var intermed = result[i][1].split('\n');
          mark = 1;
        }
      }
      if(mark == 0){
        alert('Error: No pending request(s) found');
        return
      }else{
        for(var j = 0; j < intermed.length; j++){
          intermed[j] = intermed[j].split(':');
        }
        result = intermed;
      }
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
    });
    panel = new Ext.grid.GridPanel({
      anchor:'100%',
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
  displayWin(panel,id)
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
