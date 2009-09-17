var dataMngr = [];
var tableMngr = [];
// Main routine
function initBK(){
  Ext.onReady(function(){
    renderData();
  });
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initTree(){
  var root = new Ext.tree.AsyncTreeNode({
     draggable:false,
     expanded:true,
     extra:'/',
     id:'BKSource',
     text: '/'
  });
  var loader = new Ext.tree.TreeLoader({
    dataUrl:'submit',
    requestMethod:'POST'
  });
  loader.on("beforeload", function(treeLoader, node){
    try{
      this.baseParams.root = node.attributes.extra;
      this.baseParams.level = node.attributes.qtip;
    }catch(e){}
  });
  loader.on("load",function(tree,node,response){
    try{
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        alert('Error: ' + jsonData['error']);
        return
      }
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message);
      return
    }
  });
  var tree = sideTree(loader,'BK browser',root);
  tree.addListener('click',function(node){
    if(node.leaf){
      node.ui.removeClass("x-tree-node-leaf");
      node.ui.removeClass("x-tree-node-collapsed");
      node.ui.addClass("x-tree-node-expanded");
      var table = Ext.getCmp('DataMonitoringTable');
      if(table){
        try{
          delete table.store.baseParams;
          table.store.baseParams = new Object();
          table.store.baseParams.root = node.attributes.extra;
          table.store.baseParams.level = node.attributes.qtip;
          table.store.baseParams.limit = table.bottomToolbar.pageSize;
          table.store.load();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message);
          return
        }
      }else{
        alert('Can not find the "DataMonitoringTable" table');
        return
      }
    }
  });
  return tree
}
function initSidebar(){
  var tree = initTree();
  var fileLook = initFileLookup();
  var prodLook = initProductionLookup();
  var bar = sideBar();
  bar.setWidth(400);
  bar.insert(0,tree);
  bar.insert(1,fileLook);
  bar.insert(2,prodLook);
  return bar
}
function bkTable(){
  var record = new Ext.data.Record.create([
    {name:'Name'},
    {name:'EventStat'},
    {name:'FileSize'},
    {name:'CreationDate',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'Generator'},
    {name:'GeometryVersion'},
    {name:'JobStart',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'JobEnd',type:'date',dateFormat:'Y-n-j h:i:s'},
    {name:'WorkerNode'},
    {name:'FileType'},
    {name:'EvtTypeId'}
  ]);
  var columns = [
    {header:'#',width:50,sortable:false,locked:true,renderer:function(a,b,c,rowIndex,d,ds){return pageRowNumber(ds,rowIndex)}},
    {header:'File Name',sortable:true,dataIndex:'Name',align:'left'},
    {header:'Event Stat',sortable:true,dataIndex:'EventStat',align:'left'},
    {header:'File Size',sortable:true,dataIndex:'FileSize',align:'left'},
    {header:'Creation Date',sortable:true,dataIndex:'CreationDate',align:'left',hidden:true},
    {header:'Generator',sortable:true,dataIndex:'Generator',align:'left',hidden:true},
    {header:'Geometry Version',sortable:true,dataIndex:'GeometryVersion',align:'left',hidden:true},
    {header:'Job Start',sortable:true,dataIndex:'JobStart',align:'left'},
    {header:'Job End',sortable:true,dataIndex:'JobEnd',align:'left'},
    {header:'Worker Node',sortable:true,dataIndex:'WorkerNode',align:'left',hidden:true},
    {header:'File Type',sortable:true,dataIndex:'FileType',align:'left',hidden:true},
    {header:'Event Type Id',sortable:true,dataIndex:'EvtTypeId',align:'left',hidden:true}
  ];
  var store = initStore(record);
  dataMngr['store'] = store;
  var title = '';
  tableMngr = {'store':store,'columns':columns,'title':title,'tbar':'','bk':true};
  var dataTable = table(tableMngr);
  dataTable.addListener('cellclick',function(table,rowIndex,columnIndex){
    showMenu('main',table,rowIndex,columnIndex);
  });
  return dataTable
}
function setMenuItems(selections){
  if(selections){
    var lfn = selections.Name;
  }else{
    return
  }
  if(dirac.menu){
    dirac.menu.add(
      {handler:function(){AJAXrequest('getLogInfoLFN',lfn)},text:'Logging Information'}
    );
  }
};
function renderData(){
  var leftBar = initSidebar();
  var rightBar = bkRight();
  var mainContent = bkTable();
  renderInMainViewport([ leftBar, mainContent, rightBar ]);
  dataMngr['form'] = leftBar.items;
}
function afterDataLoad(){
  var table = Ext.getCmp('DataMonitoringTable');
  if(table){
    try{
      var nof = Ext.getCmp('nof');
      nof.setRawValue('');
      if(table.store.totalLength){
        nof.setRawValue(table.store.totalLength);
//        delete table.store.totalLength; 
      }
    }catch(e){}
    try{
      var noe = Ext.getCmp('noe');
      noe.setRawValue('');
      if(table.store.extra_msg.GlobalStatistics.NumberofEvents){
        noe.setRawValue(table.store.extra_msg.GlobalStatistics.NumberofEvents);
        delete table.store.extra_msg.GlobalStatistics.NumberofEvents;
      }
    }catch(e){}
    try{
      var fSize = Ext.getCmp('fSize');
      fSize.setRawValue('');
      if(table.store.extra_msg.GlobalStatistics.FilesSize){
        fSize.setRawValue(table.store.extra_msg.GlobalStatistics.FilesSize);
        delete table.store.extra_msg.GlobalStatistics.FilesSize;
      }
    }catch(e){}
    try{
      var pass = Ext.getCmp('procPass');
      pass.setRawValue('');
      if(table.store.extra_msg.Selection.ProcessingPass){
        pass.setRawValue(table.store.extra_msg.Selection.ProcessingPass);
        delete table.store.extra_msg.Selection.ProcessingPass;
      }
    }catch(e){}
    try{
      var eType = Ext.getCmp('eType');
      eType.setRawValue('');
      if(table.store.extra_msg.Selection.Eventtype){
        eType.setRawValue(table.store.extra_msg.Selection.Eventtype);
        delete table.store.extra_msg.Selection.Eventtype;
      }
    }catch(e){}
    try{
      var cName = Ext.getCmp('cName');
      cName.setRawValue('');
      if(table.store.extra_msg.Selection.ConfigurationName){
        cName.setRawValue(table.store.extra_msg.Selection.ConfigurationName);
        delete table.store.extra_msg.Selection.ConfigurationName;
      }
    }catch(e){}
    try{
      var cVersion = Ext.getCmp('cVersion');
      cVersion.setRawValue('');
      if(table.store.extra_msg.Selection.ConfigurationVersion){
        cVersion.setRawValue(table.store.extra_msg.Selection.ConfigurationVersion);
        delete table.store.extra_msg.Selection.ConfigurationVersion;
      }
    }catch(e){}
    try{
      var production = Ext.getCmp('production');
      production.setRawValue('');
      if(table.store.extra_msg.Selection.Production){
        production.setRawValue(table.store.extra_msg.Selection.Production);
        delete table.store.extra_msg.Selection.Production;
      }
    }catch(e){}
    try{
      var simCond = Ext.getCmp('simCond');
      simCond.setRawValue('');
      if(table.store.extra_msg.Selection.SimulationCondition){
        simCond.setRawValue(table.store.extra_msg.Selection.SimulationCondition);
        delete table.store.extra_msg.Selection.SimulationCondition;
      }
    }catch(e){}
    try{
      var fType = Ext.getCmp('fType');
      fType.setRawValue('');
      if(table.store.extra_msg.Selection.FileType){
        fType.setRawValue(table.store.extra_msg.Selection.FileType);
        delete table.store.extra_msg.Selection.FileType;
      }
    }catch(e){}
    try{
      var nameVersion = Ext.getCmp('nameVersion');
      nameVersion.setRawValue('');
      var ver = '';
      var name = '';
      if(table.store.extra_msg.Selection.Programname){
        name = table.store.extra_msg.Selection.Programname;
        delete table.store.extra_msg.Selection.Programname;
      }
      if(table.store.extra_msg.Selection.Programversion){
        ver = table.store.extra_msg.Selection.Programversion;
        delete table.store.extra_msg.Selection.Programversion;
      }
      nameVersion.setRawValue(name + ' ' + ver);
    }catch(e){}
  }
  var rBar = Ext.getCmp('bkRight');
  try{
    if(rBar){
      rBar.enable();
    }
  }catch(e){}
}
function AJAXsuccess(value,id,response){
  gMainLayout.container.unmask();
  var jsonData = Ext.util.JSON.decode(response);
  if(jsonData['success'] == 'false'){
    alert('Error: ' + jsonData['error']);
    return
  }
  var result = jsonData['result'];
  var panel = {};
  if(value == 'getLogInfoLFN'){
    var reader = {};
    var columns = [];
    reader = new Ext.data.ArrayReader({},[
      {name:'Status'},
      {name:'MinorStatus'},
      {name:'StatusTime'},
      {name:'Source'}
    ]);
    columns = [
      {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
      {header:'MinorStatus',sortable:true,dataIndex:'MinorStatus',align:'left'},
      {header:'StatusTime [UTC]',sortable:true,dataIndex:'StatusTime',align:'left'},
      {header:'Source',sortable:true,dataIndex:'Source',align:'left'}
    ];
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
  displayWin(panel,id);
}
