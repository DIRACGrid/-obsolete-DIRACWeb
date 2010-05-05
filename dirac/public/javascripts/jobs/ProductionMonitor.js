var dataSelect = ''; // Required to store the data for filters fields. Object.
var dataMngr = ''; // Required to connect form and table. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.
var testObject = {}; // Used to store values between refresh action
// Main routine
function initProductionMonitor(reponseSelect){
  dataSelect = reponseSelect;
  dataSelect.globalSort = '';
  var record = initRecord();
  var store = initStore(record);
  store.addListener('beforeload',function(store){
    if(store.totalLength){
      testObject = {}
      for(var i = 0; i < store.totalLength; i++){
        var record = store.getAt(i);
        try{
          testObject[record.data.TransformationID] = {};
          testObject[record.data.TransformationID]['Jobs_Created'] = record.data['Jobs_Created'];
          testObject[record.data.TransformationID]['Jobs_Done'] = record.data['Jobs_Done'];
          testObject[record.data.TransformationID]['Jobs_Failed'] = record.data['Jobs_Failed'];
          testObject[record.data.TransformationID]['Jobs_Running'] = record.data['Jobs_Running'];
          testObject[record.data.TransformationID]['Jobs_Stalled'] = record.data['Jobs_Stalled'];
          testObject[record.data.TransformationID]['Jobs_Submitted'] = record.data['Jobs_Submitted'];
          testObject[record.data.TransformationID]['Jobs_Waiting'] = record.data['Jobs_Waiting'];
          testObject[record.data.TransformationID]['Files_PercentProcessed'] = record.data['Files_PercentProcessed'];
          testObject[record.data.TransformationID]['Files_Total'] = record.data['Files_Total'];
          testObject[record.data.TransformationID]['Files_Unused'] = record.data['Files_Unused'];
          testObject[record.data.TransformationID]['Files_Assigned'] = record.data['Files_Assigned'];
          testObject[record.data.TransformationID]['Files_Processed'] = record.data['Files_Processed'];
          testObject[record.data.TransformationID]['Files_Problematic'] = record.data['Files_Problematic'];
        }catch(e){}
      }
    }
  });
  Ext.onReady(function(){
    Ext.override(Ext.PagingToolbar, {
      onRender :  Ext.PagingToolbar.prototype.onRender.createSequence(function(ct, position){
        this.loading.removeClass("x-btn-icon")
        this.loading.setText('Refresh');
        this.loading.addClass("x-btn-text-icon");
      })
    });
    renderData(store);
  });
}
function diffValues(value,metaData,record,rowIndex,colIndex,store){
  var id = record.data.TransformationID;
  if(id && testObject[id]){
    var name = this.name;
    try{
      var diff = value - testObject[id][name];
      var test = diff + '';
      if(test.indexOf(".") > 0){
        diff = diff.toFixed(2);
      }
      if(diff > 0){
        return value + ' <font color="#00CC00">(+' + diff + ')</font>';
      }else if(diff < 0){
        return value + ' <font color="#FF3300">(' + diff + ')</font>';
      }else{
        return value;
      }
    }catch(e){
      return value;
    }
  }else{
    return value;
  }
}
// function describing data structure, should be individual per page 
function initRecord(){
  var record = new Ext.data.Record.create([
    {name:'TransformationIDcheckBox',mapping:'TransformationID'},
    {name:'TransformationID'},
    {name:'StatusIcon',mapping:'Status'},
    {name:'Status'},
    {name:'TransformationName'},
    {name:'TransformationGroup'},
    {name:'GroupSize'},
    {name:'InheritedFrom'},
    {name:'MaxNumberOfJobs'},
    {name:'EventsPerJob'},
    {name:'AuthorDN'},
    {name:'AuthorGroup'},
    {name:'Type'},
    {name:'Plugin'},
    {name:'AgentType'},
    {name:'FileMask'},
    {name:'Description'},
    {name:'LongDescription'},
    {name:'CreationDate',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'LastUpdate',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'Files_Total'},
    {name:'Files_PercentProcessed'},
    {name:'Files_Unused'},
    {name:'Files_Assigned'},
    {name:'Files_Processed'},
    {name:'Files_Problematic'},
    {name:'Jobs_Created'},
    {name:'Jobs_Submitted'},
    {name:'Jobs_Waiting'},
    {name:'Jobs_Running'},
    {name:'Jobs_Done'},
    {name:'Jobs_Failed'},
    {name:'Jobs_Stalled'}
//    {name:'Bk_ConfigName'},
//    {name:'Bk_Events'},
//    {name:'Bk_ConfigVersion'},
//    {name:'Bk_Steps'},
//    {name:'BkQueryID'},
//    {name:'Bk_Files'},
//    {name:'Bk_EventType'},
//    {name:'Bk_Jobs'},
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
  var stat = statPanel('Current Statistics','current','statGrid');
  var glStat = statPanel('Global Statistics','global','glStatGrid');
  var bar = sideBar();
  bar.insert(0,select);
  bar.insert(1,stat);
  bar.insert(2,glStat);
  bar.setTitle('ProductionMonitor');
  return bar
}
function initData(store){
  var columns = [
    {header:'',id:'checkBox',width:26,sortable:false,dataIndex:'TransformationIDcheckBox',renderer:chkBox,hideable:false,fixed:true,menuDisabled:true},
    {header:'ID',width:60,sortable:true,dataIndex:'TransformationID',align:'left',hideable:false},
    {header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:status,hideable:false,fixed:true,menuDisabled:true},
    {header:'Status',width:60,sortable:true,dataIndex:'Status',align:'left'},
    {header:'AgentType',width:60,sortable:true,dataIndex:'AgentType',align:'left'},
    {header:'Type',sortable:true,dataIndex:'Type',align:'left'},//,hidden:true},
    {header:'Group',sortable:true,dataIndex:'TransformationGroup',align:'left',hidden:true},
    {header:'Name',sortable:true,dataIndex:'TransformationName',align:'left'},
    {header:'Files',sortable:true,dataIndex:'Files_Total',align:'left',renderer:diffValues},
    {header:'Processed (%)',sortable:true,dataIndex:'Files_PercentProcessed',align:'left',renderer:diffValues},
    {header:'Files Processed',sortable:true,dataIndex:'Files_Processed',align:'left',hidden:true,renderer:diffValues},
    {header:'Files Assigned',sortable:true,dataIndex:'Files_Assigned',align:'left',hidden:true,renderer:diffValues},
    {header:'Files Problematic',sortable:true,dataIndex:'Files_Problematic',align:'left',hidden:true,renderer:diffValues},
    {header:'Files Unused',sortable:true,dataIndex:'Files_Unused',align:'left',hidden:true,renderer:diffValues},
    {header:'Created',sortable:true,dataIndex:'Jobs_Created',align:'left',renderer:diffValues},
    {header:'Submitted',sortable:true,dataIndex:'Jobs_Submitted',align:'left',renderer:diffValues},
    {header:'Waiting',sortable:true,dataIndex:'Jobs_Waiting',align:'left',renderer:diffValues},
    {header:'Running',sortable:true,dataIndex:'Jobs_Running',align:'left',renderer:diffValues},
    {header:'Done',sortable:true,dataIndex:'Jobs_Done',align:'left',renderer:diffValues},
    {header:'Failed',sortable:true,dataIndex:'Jobs_Failed',align:'left',renderer:diffValues},
    {header:'Stalled',sortable:true,dataIndex:'Jobs_Stalled',align:'left',renderer:diffValues},
    {header:'InheritedFrom',sortable:true,dataIndex:'InheritedFrom',align:'left',hidden:true},
    {header:'GroupSize',sortable:true,dataIndex:'GroupSize',align:'left',hidden:true},
    {header:'FileMask',sortable:true,dataIndex:'FileMask',align:'left',hidden:true},
    {header:'Plugin',sortable:true,dataIndex:'Plugin',align:'left',hidden:true},
    {header:'EventsPerJob',sortable:true,dataIndex:'EventsPerJob',align:'left',hidden:true},
    {header:'MaxNumberOfJobs',sortable:true,dataIndex:'MaxNumberOfJobs',align:'left',hidden:true},
    {header:'AuthorDN',sortable:true,dataIndex:'AuthorDN',align:'left',hidden:true},
    {header:'AuthorGroup',sortable:true,dataIndex:'AuthorGroup',align:'left',hidden:true},
    {header:'Description',sortable:true,dataIndex:'Description',align:'left',hidden:true},
    {header:'LongDescription',sortable:true,dataIndex:'LongDescription',align:'left',hidden:true},
    {header:'CreationDate [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-n-j h:i'),dataIndex:'CreationDate'},
    {header:'LastUpdate [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-n-j h:i'),dataIndex:'LastUpdate'}

//    {header:'Bk_ConfigName',sortable:true,dataIndex:'Bk_ConfigName',align:'left',hidden:true},
//    {header:'Bk_Events',sortable:true,dataIndex:'Bk_Events',align:'left'},
//    {header:'Bk_ConfigVersion',sortable:true,dataIndex:'Bk_ConfigVersion',align:'left',hidden:true},
//    {header:'Bk_Steps',sortable:true,dataIndex:'Bk_Steps',align:'left',hidden:true},
//    {header:'BkQueryID',sortable:true,dataIndex:'BkQueryID',align:'left',hidden:true},
//    {header:'Bk_Files',sortable:true,dataIndex:'Bk_Files',align:'left',hidden:true},
//    {header:'Bk_EventType',sortable:true,dataIndex:'Bk_EventType',align:'left',hidden:true},
//    {header:'Bk_Jobs',sortable:true,dataIndex:'Bk_Jobs',align:'left',hidden:true}
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
    {handler:function(){action('production','flush')},text:'Flush',tooltip:'Click to flush selected production(s)'},
    {handler:function(){action('production','clean')},text:'Clean',tooltip:'Click to clean selected production(s)'}
  ];
  store.setDefaultSort('TransformationID','DESC'); // Default sorting
  tableMngr = {'store':store,'columns':columns,'tbar':tbar};
  var t = table(tableMngr);
  t.addListener('cellclick',function(table,rowIndex,columnIndex){
      showMenu('main',table,rowIndex,columnIndex);
  });
//  var bbar = t.;
  return t
}
function renderData(store){
  var leftBar = initSidebar();
  var mainContent = initData(store);
  renderInMainViewport([ leftBar, mainContent ]);
  dataMngr = {'form':leftBar.items.items[0],'store':store}
}

function extendTransformation(id){
  Ext.Msg.prompt('Extend transformation','Please enter the number of tasks',function(btn,tasks){
    if( btn == 'ok'){
      if (tasks){
        Ext.Ajax.request({
          success:function(response){
            var jsonData = Ext.util.JSON.decode(response.responseText);
            if(jsonData['success'] == 'false'){
              alert('Error: ' + jsonData['error']);
              return;
            }else{
              if(jsonData.showResult){
                var html = '';
                for(var i = 0; i < jsonData.showResult.length; i++){
                  html = html + jsonData.showResult[i] + '<br>';
                }
                Ext.Msg.alert('Result:',html);
              }
              if(dataMngr){
                if(dataMngr.store){
                  if(dataMngr.store.autoLoad){
                    if(dataMngr.store.autoLoad.params){
                      if(dataMngr.store.autoLoad.params.limit){
                        dataMngr.store.load({params:{start:0,limit:dataMngr.store.autoLoad.params.limit}});
                      }
                    }
                  }
                }
              }
            }
          },
          failure:function(response){
            AJAXerror(response.responseText)
          },
          method:'POST',
          params:{'extend':id,'tasks':tasks},
          url:'action'
        })
      }else{
        this.hide();
      }
    }else{
      this.hide();
    }
  });   
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
    {handler:function(){extendTransformation(id)},text:'Extend'},
    {handler:function(){action('production','flush',id)},text:'Flush'},
    {handler:function(){action('production','clean',id)},text:'Clean'},
    '-'
  ];
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){jump('job',id,submited)},text:'Show Jobs'},
      {handler:function(){AJAXrequest('log',id)},text:'Logging Info'},
      {handler:function(){AJAXrequest('fileStat',id)},text:'File Status'},
      {handler:function(){AJAXrequest('elog',id)},text:'Show Details'},
      '-',
      {text:'Actions',menu:({items:subMenu})}
    );
  }
  if(status == 'Active'){
    dirac.menu.items.items[5].menu.items.items[1].enable();
    dirac.menu.items.items[5].menu.items.items[0].disable();
  }else if(status == 'New'){
    dirac.menu.items.items[5].menu.items.items[1].disable();
    dirac.menu.items.items[5].menu.items.items[0].enable();
  }else{
    dirac.menu.items.items[5].menu.items.items[1].disable();
    dirac.menu.items.items[5].menu.items.items[0].enable();
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
  }else if(value == 'fileStat'){
    var reader = {};
    var columns = [];
    reader = new Ext.data.ArrayReader({},[
      {name:'status'},
      {name:'count'},
      {name:'percent'}
    ]);
    columns = [
        {header:'Status',sortable:true,dataIndex:'status',align:'left'},
        {header:'Count',sortable:true,dataIndex:'count',align:'left'},
        {header:'Percentage',sortable:true,dataIndex:'percent',align:'left'}
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
  }else if(value == 'elog'){
    var html = '<pre>' + result + '</pre>';
    panel = new Ext.Panel({border:0,autoScroll:true,html:html,layout:'fit'})
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
