var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initPilotMonitor(reponseSelect){
  dataSelect = reponseSelect;
  dataSelect.globalSort = "SubmissionTime DESC";
  var record = initRecord();
  var store = initStore(record);
  Ext.onReady(function(){
    Ext.override(Ext.PagingToolbar, {
      onRender :  Ext.PagingToolbar.prototype.onRender.createSequence(function(ct, position){
        this.loading.removeClass('x-btn-icon');
        this.loading.setText('Refresh');
        this.loading.addClass('x-btn-text-icon');
      })
    });
    renderData(store);
  });
}
// function describing data structure, should be individual per page
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'Status'},
    {name:'OwnerGroup'},
    {name:'LastUpdateTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'DestinationSite'},
    {name:'GridType'},
    {name:'TaskQueueID'},
    {name:'CurrentJobID'},
    {name:'BenchMark',type:'float'},
    {name:'Broker'},
    {name:'OwnerDN'},
    {name:'GridSite'},
    {name:'PilotID'},
    {name:'ParentID'},
    {name:'SubmissionTime',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'PilotJobReference'},
    {name:'Owner'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var siteSelect = selectGridSiteMenu(); // Initializing Site Menu
  var owner = selectOwnerMenu();
  var ownerGrp = selectOwnerGroupMenu();
  var ce = selectCEMenu();
  var pilotStatus = selectStatusMenu();
  var broker = selectBrokerMenu();
  var taskQueue = selectTaskQueueID();
  var id = selectPilotID(); // Initialize field for JobIDs
  var dateSelect = dateTimeWidget();
  var select = selectPanel(); // Initializing container for selection objects
  select.buttons[2].hide(); // Remove refresh button
//  var gridType = selectGridTypeMenu(); Commentted for later usage
  // Insert object to container BEFORE buttons:
  select.insert(0,siteSelect);
  select.insert(1,pilotStatus);
  select.insert(2,ce);
  select.insert(3,owner);
  select.insert(4,ownerGrp);
  select.insert(5,broker);
  select.insert(6,taskQueue);
  select.insert(7,id);
  select.insert(8,dateSelect);
//  select.insert(6,gridType); Commentted for later usage
//  select.insert(1,statSelect);
//  var stat = statPanel('Statistics','current','statGrid');
  var bar = sideBar();
  bar.insert(0,select);
//  bar.insert(1,stat);
  bar.setTitle('PilotMonitor');
  return bar
}
function initData(store){
  var columns = [
    {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
    {header:'PilotJobReference',sortable:true,dataIndex:'PilotJobReference',align:'left'},
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
    {header:'Site',sortable:true,dataIndex:'GridSite',align:'left'},
    {header:'ComputingElement',sortable:true,dataIndex:'DestinationSite',align:'left'},
    {header:'Broker',sortable:true,dataIndex:'Broker',align:'left'},
    {header:'CurrentJobID',sortable:true,dataIndex:'CurrentJobID',align:'left'},
    {header:'GridType',sortable:true,dataIndex:'GridType',align:'left',hidden:true},
    {header:'TaskQueueID',sortable:true,dataIndex:'TaskQueueID',align:'left',hidden:true},
    {header:'BenchMark',sortable:true,dataIndex:'BenchMark',align:'left',hidden:true},
    {header:'Owner',sortable:true,dataIndex:'Owner',align:'left',hidden:true},
    {header:'OwnerDN',sortable:true,dataIndex:'OwnerDN',align:'left',hidden:true},
    {header:'OwnerGroup',sortable:true,dataIndex:'OwnerGroup',align:'left'},
    {header:'PilotID',sortable:true,dataIndex:'PilotID',align:'left',hidden:true},
    {header:'ParentID',sortable:true,dataIndex:'ParentID',align:'left',hidden:true},
    {header:'LastUpdateTime [UTC]',sortable:true,dataIndex:'LastUpdateTime',align:'left',renderer:Ext.util.Format.dateRenderer('Y-m-j H:i')},
    {header:'SubmissionTime [UTC]',sortable:true,dataIndex:'SubmissionTime',align:'left',renderer:Ext.util.Format.dateRenderer('Y-m-j H:i')},
  ];
  store.setDefaultSort('SubmissionTime','DESC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'tbar':''};
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
//  addMenu();
}
function setMenuItems(selections){
  if(selections){
    var id = selections.PilotJobReference;
    var jobID = selections.CurrentJobID;
    var status = selections.Status;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){jump(jobID)},text:'Show Job'},
      {handler:function(){AJAXrequest('getPilotOutput',id)},text:'PilotOutput'},
      {handler:function(){AJAXrequest('getPilotError',id)},text:'PilotError'},
      {handler:function(){AJAXrequest('getPilotLoggingInfo',id)},text:'LoggingInfo'}
    );
  }
  if(jobID == '-'){
    dirac.menu.items.items[0].disable();
  }
  if(status != 'Done'){
    dirac.menu.items.items[1].disable();
    dirac.menu.items.items[2].disable();
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
  if(value == 'getPilotOutput'){
    var html = '<pre>' + result + '</pre>';
    panel = new Ext.Panel({border:0,autoScroll:true,html:html,layout:'fit'})
  }else if(value == 'getPilotError'){
    var html = '<pre>' + result + '</pre>';
    panel = new Ext.Panel({border:0,autoScroll:true,html:html,layout:'fit'})
  }else if(value == 'getPilotLoggingInfo'){
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
function jump(id){
  var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/' + gPageDescription.selectedSetup;
  url = url + '/' + gPageDescription.userData.group + '/jobs/JobMonitor/display';
  var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
  post_req = post_req + '<input type="hidden" name="id" value="' + id + '">';
  post_req = post_req + '</form>';
  document.body.innerHTML = document.body.innerHTML + post_req;
  var form = document.getElementById('redirform');
  form.submit();
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
      if(i == 'SubmissionEff'){
        data[j] = ['SubmissionEff (%)',msg[i]];
      }else if(i == 'PilotJobEff'){
        data[j] = ['PilotJobEff (%)',msg[i]];
      }else{
        data[j] = [i,msg[i]];
      }
      j = j + 1;
    }
    statPanel.store.loadData(data);
  }
}
