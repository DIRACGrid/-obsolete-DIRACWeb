var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
// Main routine
function initJobMonitor(reponseSelect){
  dataSelect = reponseSelect;
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
    {name:'RequestID', type: 'float'},
    {name:'RequestName'},
    {name:'JobID'},
    {name:'RequestType'},
    {name:'Status'},
    {name:'OwnerDN'},
    {name:'OwnerGroup'},
    {name:'Error'},
    {name:'CreationTime',type:'date',dateFormat:'Y-n-j H:i:s'},
    {name:'LastUpdateTime',type:'date',dateFormat:'Y-n-j H:i:s'},
    {name:'Operation'}
  ]);
  return record
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var requestType = createMenu('requestType','RequestType');
  var status = createMenu('status','Status');
  var operation = createMenu('operation','Operation');
  var owner = createMenu('owner','Owner');
  var ownerGroup = createMenu('ownerGroup','OwnerGroup');
  var id = genericID('id','JobID'); // Initialize field for JobIDs
  var reqId = genericID('reqId','RequestID');
  var dateSelect = dateTimeWidget();
  var select = selectPanel(); // Initializing container for selection objects
//  select.buttons[2].hide(); // Remove refresh button
  select.insert(0,requestType);
  select.insert(1,status);
  select.insert(2,operation);
  select.insert(3,owner);
  select.insert(4,ownerGroup);
  select.insert(5,id);
  select.insert(6,reqId);
  select.insert(7,dateSelect);
  var bar = sideBar();
  bar.insert(0,select);
  bar.setTitle('RequestMonitor');
  return bar
}
function initData(store){
  var columns = [
    {header:'RequestId',sortable:true,dataIndex:'RequestID',align:'left'},
    {header:'JobID',sortable:true,dataIndex:'JobID',align:'left'},
    {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
    {header:'RequestType',sortable:true,dataIndex:'RequestType',align:'left'},
    {header:'Operation',sortable:true,dataIndex:'Operation',align:'left'},
    {header:'OwnerDN',sortable:true,dataIndex:'OwnerDN',align:'left'},
    {header:'OwnerGroup',sortable:true,dataIndex:'OwnerGroup',align:'left'},
    {header:'RequestName',sortable:true,dataIndex:'RequestName',align:'left',hidden:true},
    {header:'Error',sortable:true,dataIndex:'Error',align:'left'},
    {header:'CreationTime [UTC]',sortable:true,dataIndex:'CreationTime',align:'left',hidden:true,renderer:Ext.util.Format.dateRenderer('Y-m-j H:i')},
    {header:'LastUpdateTime [UTC]',sortable:true,dataIndex:'LastUpdateTime',align:'left',hidden:true,renderer:Ext.util.Format.dateRenderer('Y-m-j H:i')}
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
    },'->',{
      handler:function(){action('job','reset')},
      text:'Reset',
      tooltip:'Click to reset selected job(s)'
    },{
      handler:function(){action('job','kill')},
      text:'Kill',
      tooltip:'Click to kill selected job(s)'
    },{
      handler:function(){action('job','delete')},
      text:'Delete',
      tooltip:'Click to delete selected job(s)'
    }
  ];
  store.setDefaultSort('RequestID','DESC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'tbar':''};
  var t = table(tableMngr);
  t.addListener('cellclick',function(table,rowIndex,columnIndex){
      showMenu('main',table,rowIndex,columnIndex);
  });
//  var tabPanel = new Ext.TabPanel({
//    activeTab:0,
//    enableTabScroll:true,
//    id:'tabPanel',
//    items:[t],
//    margins:'2 0 2 0',
//    region:'center'
//  });
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
    var jobID = selections.JobID;
    var status = selections.Status;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){jump('id',jobID)},text:'Show Job'}
    );
  }
  if(jobID == '-'){
    dirac.menu.items.items[0].disable();
  }
};
function AJAXsuccess(value,id,response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
}
function jump(type,id){
  var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/' + gPageDescription.selectedSetup;
  url = url + '/' + gPageDescription.userData.group + '/jobs/JobMonitor/display';
  var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
  post_req = post_req + '<input type="hidden" name="' + type + '" value="' + id + '">';
  post_req = post_req + '</form>';
  document.body.innerHTML = document.body.innerHTML + post_req;
  var form = document.getElementById('redirform');
  form.submit();
}
function afterDataLoad(){
}
