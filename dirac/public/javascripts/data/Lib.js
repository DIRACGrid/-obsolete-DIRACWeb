//Ext.Ajax.on('beforerequest',this.showSpinner,this);
function action(type,mode,id){
  if((type == null) || (type == '')){
    alert('Item type is not defined');
    return
  }
  if((mode == null) || (mode == '')){
    alert('Action is not defined');
    return
  }
  var items = new Array();
  if((id == null) || (id == '')){
    var inputs = document.getElementsByTagName('input');
    var j = 0;
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].checked == true){
        items[j] = inputs[i].id;
        j = j + 1;
      }
    }
    if (items.length < 1){
      alert('No jobs were selected');
      return
    }
  }else{
    items[0] = id;
  }
  if (items.length == 1){
    var c = confirm ('Are you sure you want to ' + mode + ' ' + type + ' ' + items[0] + '?');
  }else{
    var c = confirm ('Are you sure you want to ' + mode + ' these ' + type + 's?');
  }
  if (c == false){
    return
  }
  var params = mode + '=' + items;
  Ext.Ajax.request({
    failure:function(response){
      AJAXerror(response.responseText);
    },
    method:'POST',
    params:params,
    success:function(response){
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        alert('Error: ' + jsonData['error']);
        return
      }else{
        if(dataMngr.store){
          dataMngr.store.load();
        }
      }
    },
    url:'action'
  })
}
function AJAXerror(response){
  var jsonData = Ext.util.JSON.decode(response.responseText);
  if(jsonData['success'] == 'false'){
    alert('Error: ' + jsonData['error']);
    return
  }else{
    alert('Error: Data structure is corrupted');
    return
  }
}
function AJAXrequest(value,id){
  var params = value + '=' + id;
  Ext.Ajax.request({
    failure:function(response){
      AJAXerror(response.responseText)
    },
    method:'POST',
    params:params,
    success:function(response){
      AJAXsuccess(value,id,response.responseText)
    },
    url:'action'
  })
}
function chkBox(id){
  return '<input id="' + id + '" type="checkbox"/>'
}
function dateSelectMenu(){
  var date = new Ext.form.DateField({
    anchor:'90%',
    allowBlank:true,
    emptyText:'YYYY-mm-dd',
    fieldLabel:'Date',
    format:'Y-m-d',
    name:'date',
    selectOnFocus:true,
    startDay:1,
    value:''
  });
  return date
}
function displayWin(panel,title,modal,closeOnly){
  var modal = true;
  if((modal == null) || (modal == '')){
    modal = false;
  }
  var maximizable = true;
  var collapsible = true;
  if(closeOnly == true){
    maximizable = false;
    collapsible = false;
  }
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
    width:600,
    height:350,
    border:true,
    collapsible:collapsible,
    constrain:true,
    constrainHeader:true,
    maximizable:maximizable,
    modal:modal,
    layout:'fit',
    plain:true,
    shim:false,
    title:title,
    items:[panel]
  });
  window.show();
  return window;
}
function initFileLookup(){
  function submitForm(){
    var sideBar = Ext.getCmp('sideBar');
    sideBar.body.mask('Sending data...');
    panel.form.submit({
      params:{byFile:'true'},
      success:function(form,action){
        sideBar.body.unmask();
        if(action.result.success == 'false'){
          alert('Error: ' + action.result.error);
        }else{
          var table = Ext.getCmp('DataMonitoringTable');
          if(table){
            try{
              table.store.loadData(action.result);
            }catch(e){
              alert('Error: ' + e.name + ': ' + e.message);
              return
             }
          }else{
            alert('Error: Unable to load data to the table dataMngr.store is absent');
          }
        }
      },
      failure:function(form,action){
        sideBar.body.unmask();
        alert('Error: ' + action.response.statusText);
      },
      url:'action'
    });
  }
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.reset();
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'70',
    tooltip:'Reset values in the form',
    text:'Reset'
  });
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      submitForm();
    },
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
    tooltip:'Send request to the server',
    text:'Submit'
  });
  var panel = new Ext.FormPanel({
    autoScroll:true,
    bodyStyle:'padding: 5px',
    border:false,
    buttonAlign:'center',
    buttons:[submit,reset],
    collapsible:true,
    id:'initFileLookup',
    items:[{
      anchor:'90%',
      allowBlank:false,
      allowDecimals:false,
      allowNegative:false,
      fieldLabel:'LFN',
      mode:'local',
      name:'lfn',
      selectOnFocus:true,
      value:'',
      xtype:'field'
    }],
    labelAlign:'top',
    method:'POST',
    minWidth:'200',
    title:'File Lookup',
    url:'submit',
    waitMsgTarget:true
  });
  return panel
}
function initProductionLookup(){
  function submitForm(){
    var table = Ext.getCmp('DataMonitoringTable');
    if(table){
      try{
        table.store.proxy.conn.url = 'action';
        var formValues = panel.form.getValues();
        table.store.baseParams = formValues;
        table.store.baseParams.byProd = 'true';
        table.store.load();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
    }
  }
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.reset();
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'70',
    tooltip:'Reset values in the form',
    text:'Reset'
  });
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      submitForm();
    },
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
    tooltip:'Send request to the server',
    text:'Submit'
  });
  var prod = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:false,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'Production ID',
    mode:'local',
    name:'prodID',
    selectOnFocus:true,
    value:0
  });
  var store = new Ext.data.JsonStore({
    autoLoad:true,
    baseParams:{fileTypes:'true'},
    fields:['type'],
    method:'POST',
    root:'result',
    url:'action'
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:false,
    displayField:'type',
    fieldLabel:'Restrict to Files',
    forceSelection:true,
    hiddenName:'restrictFiles',
    mode:'local',
    name:'restFiles',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:'ALL'
  });
  var panel = new Ext.FormPanel({
    autoScroll:true,
    bodyStyle:'padding: 5px',
    border:false,
    buttonAlign:'center',
    buttons:[submit,reset],
    collapsible:true,
    id:'initProductionLookup',
    items:[prod,combo],
    labelAlign:'top',
    method:'POST',
    minWidth:'200',
    title:'Production Lookup',
    url:'submit',
    waitMsgTarget:true
  });
  return panel
}
function initStore(record){
  var reader = new Ext.data.JsonReader({
    root:'result',
    totalProperty:'total'
  },record);
  var limit = 25;
  try{
    limit = dataSelect.extra.limit/1;
  }catch(e){}
  var start = 0;
  try{
    start = dataSelect.extra.start/1;
    delete dataSelect.extra.start;
  }catch(e){}
  var store = new Ext.data.Store({
    proxy: new Ext.data.HttpProxy({
      callback:function(options,success,response){
        var test = 0;
      },
      method:'POST',
      timeout:610000,
      url:'submit'
    }),
    reader:reader
  });
  store.on('loadexception',function(){
    if(store.reader){
      if(store.reader.jsonData){
        if(store.reader.jsonData.success == 'false'){
          alert(store.reader.jsonData.error);
        }
      }
    }
  });
  store.on('beforeload',function(){
    try{
      for(i = 0; i < dataMngr.form.items.length; i++){
        if(dataMngr.form.items.items[i].name == 'prod'){
          dataMngr.form.items.items[i].setValue(dataSelect.productionID);
        }
      }
      delete dataSelect.productionID;
      store.baseParams = dataMngr.form.getForm().getValues();
    }catch(e){}
  });
  store.on('load',function(){
    try{
      if(store.reader.jsonData.success == 'false'){
        alert(store.reader.jsonData.error);
      }
      if(store.reader.jsonData.extra){
        store.extra_msg = store.reader.jsonData.extra;
      }
      var value = store.baseParams.sort;
      if(value){
        var sort = value.split(' ');
        if(sort.length == 2){
          store.sort(sort[0],sort[1]);
        }
      }
    }catch(e){}
    afterDataLoad();
  });
  return store;
}
/*
function itemsNumber(){
  var store = new Ext.data.SimpleStore({
    fields:['number'],
    data:[[25],[50],[100],[200],[500],[1000]]
  });
  var combo = new Ext.form.ComboBox({
    displayField:'number',
    mode:'local',
    name:'number',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:25,
    width:50
  });
  combo.on({
    'collapse':function(){
      try{
        var table = Ext.getCmp('DataMonitoringTable');
        if(table){
          if(table.bbar.pageSize != combo.value){
            table.bbar.pageSize = combo.value;
            table.store.load({params:{start:0,limit:table.bbar.pageSize}});
          }
        }
      }catch(e){}
    }
  });
  return combo
}
*/
function itemsNumber(){
  var store = new Ext.data.SimpleStore({
    fields:['number'],
    data:[[25],[50],[100],[200],[500],[1000]]
  });
  var value = 25;
  try{
    if(dataSelect.extra.limit){ // Will be deleted in table function
      value = dataSelect.extra.limit/1;
    }
  }catch(e){}
  var combo = new Ext.form.ComboBox({
    allowBlank:false,
    displayField:'number',
    editable:false,
    maxLength:4,
    maxLengthText:'The maximum value for this field is 1000',
    minLength:1,
    minLengthText:'The minimum value for this field is 1',
    mode:'local',
    name:'number',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:value,
    width:50
  });
  combo.on({
    'collapse':function(){
      try{
        var table = Ext.getCmp('DataMonitoringTable');
        if(table){
          if(table.bbar.pageSize != combo.value){
            table.bbar.pageSize = combo.value;
            table.store.load({params:{start:0,limit:table.bbar.pageSize}});
          }
        }
      }catch(e){}
    }
  });
  return combo;
}

function hideControls(caller){
  if(caller){
    var value = caller.getRawValue();
    var sPanel = Ext.getCmp('selectPanel');
    if(sPanel){
      var items = sPanel.items;
      if(items){
        if(value == ''){
          for(var i = 0; i < items.length; i++){
            items.items[i].enable();
          }
        }else{
          for(var i = 0; i < items.length; i++){
            var j = items.items[i];
            if((j.name == caller.name)||(j.name == 'buttons')){
              j.enable();
            }else{
              j.disable();
            }
          }
        }
      }
    }
  }
}
function pageRowNumber(ds,rowIndex){
  var i = 0;
  try{
    i = ds.lastOptions.params.start;
  }catch(e){}
  if(isNaN(i)){
    i = 0;
  }
  return rowIndex+i+1
}
function sideBar(){
  var panel = new Ext.Panel({
    autoScroll:true,
    id:'sideBar',
    split:true,
    region:'west',
    collapsible:true,
    width: 200,
    minWidth: 200,
    margins:'2 0 2 0',
    cmargins:'2 2 2 2',
    buttonAlign:'left',
    title:'DIRAC SideBar',
    layout:'accordion',
    layoutConfig:{
      titleCollapse:true,
      activeOnTop:false,
      border:false
    }
  });
  return panel;
}
function sideTree(loader,title,root){
//  var tree = new Ext.tree.TreePanel({
  var tree = new Ext.tree.ColumnTree({
    border:false,
    collapsible:true,
    columns:[{
      header:'Tree',
      width:300,
      dataIndex:'text'
    },{
      header:'Description',
      width:90,
      dataIndex:'qtip'
    }],
    id:'selectPanel',
    labelAlign:'top',
    minWidth:'200',
    autoScroll:true,
    animate:true,
    lines:true,
    containerScroll:true,
    loader:loader,
    title:title,
    root:root
  });
  return tree
}
function selectAll(selection){
  var inputs = document.getElementsByTagName('input');
  if(selection == 'all'){
    var ch = 0;
  }else if(selection == 'none'){
    var ch = 1;
  }else{
    var ch = 0;
  }
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].type && inputs[i].type == 'checkbox'){
      if (ch == 0){
        inputs[i].checked = true;
      }else{
        inputs[i].checked = false;
      }
    }
  }
}
// Input fields
function selectFileID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'File ID',
    enableKeyEvents:true,
    mode:'local',
    name:'fileID',
    selectOnFocus:true,
    value:''
  })
  number.on({
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number
}
function selectJobID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'Job ID',
    enableKeyEvents:true,
    mode:'local',
    name:'jobID',
    selectOnFocus:true,
    value:''
  })
  number.on({
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number
}
function selectRequestID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'Request ID',
    enableKeyEvents:true,
    mode:'local',
    name:'requestID',
    selectOnFocus:true,
    value:''
  })
  number.on({
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number
}
function selectSubRequestID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'SubRequest ID',
    enableKeyEvents:true,
    mode:'local',
    name:'subRequestID',
    selectOnFocus:true,
    value:''
  })
  number.on({
    'blur':function(){
      hideControls(number);
    },
    'keyup':function(){
      hideControls(number);
    }
  });
  return number
}
// Lists:
function selectOperation(){
  if(dataSelect.operation){
    var data = dataSelect.operation;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['operation'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'operation',
    emptyText:data[0],
    fieldLabel:'Operation',
    forceSelection:true,
    hiddenName:'operation',
    mode:'local',
    name:'operation',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectRequestType(){
  if(dataSelect.type){
    var data = dataSelect.type;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['requestType'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'requestType',
    emptyText:data[0],
    fieldLabel:'RequestType',
    forceSelection:true,
    hiddenName:'requestType',
    mode:'local',
    name:'requestType',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectSourceSE(){
  if(dataSelect.source){
    data = dataSelect.source;
  }else{
    data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['sourceSE'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'sourceSE',
    emptyText:data[0],
    fieldLabel:'Source SE',
    forceSelection:true,
    hiddenName:'sourceSE',
    mode:'local',
    name:'sourceSE',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectStatusMenu(){
  if(dataSelect.stat){
    data = dataSelect.stat;
  }else{
    data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['stat'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'stat',
    emptyText:data[0],
    fieldLabel:'Status',
    forceSelection:true,
    hiddenName:'stat',
    mode:'local',
    name:'jobstat',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectTargetSE(){
  if(dataSelect.target){
    var data = dataSelect.target;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['targetSE'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'targetSE',
    emptyText:data[0],
    fieldLabel:'Target SE',
    forceSelection:true,
    hiddenName:'targetSE',
    mode:'local',
    name:'targetSE',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function showMenu(mode,table,rowIndex,columnIndex){
  var record = table.getStore().getAt(rowIndex); // Get the Record for the row
  var columnName = table.getColumnModel().getColumnId(columnIndex); // Get the name for the column
  var fieldName = table.getColumnModel().getDataIndex(columnIndex); // Get field name for the column
  dirac.menu = new Ext.menu.Menu(); // Nado li?
  var coords = Ext.EventObject.xy;
  if(record.data){
    selections = record.data;
    value = record.get(fieldName);
  }
  if(columnName != 'checkBox'){ // column with checkboxes
    dirac.menu.removeAll();
    if(mode == 'main'){
      setMenuItems(selections);
      dirac.menu.add('-',{handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
    }else{
      dirac.menu.add({handler:function(){Ext.Msg.minWidth = 360;Ext.Msg.alert('Cell value is:',value);},text:'Show value'});
    }
    dirac.menu.showAt(coords);
  }
}
function status(value){
  if(value == 'Done'){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if(value == 'Failed'){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else if((value == 'Waiting')||(value == 'Stopped')){
    return '<img src="'+gURLRoot+'/images/monitoring/waiting.gif">';
  }else if(value == 'Deleted'){
    return '<img src="'+gURLRoot+'/images/monitoring/deleted.gif">';
  }else if(value == 'Matched'){
    return '<img src="'+gURLRoot+'/images/monitoring/matched.gif">';
  }else if((value == 'Running')||(value == 'Active')){
    return '<img src="'+gURLRoot+'/images/monitoring/running.gif">';
  }else{
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }
}
function table(tableMngr){
  if(tableMngr.store){
    var store = tableMngr.store;
  }else{
    alert('Unable to display data. Data store is not defined');
    return;
  }
  if(tableMngr.columns){
    var columns = tableMngr.columns;
  }else{
    alert('Unable to display data. Data defenition is not defined');
    return;
  }
  if(tableMngr.title){
    var title = tableMngr.title;
  }else{
    title = '';
  }
  var iNumber = itemsNumber();
  var pageSize = 25;
  try{
    pageSize = dataSelect.extra.limit/1; // Will be deleted in table function
  }catch(e){}
  tableMngr.bbar = new Ext.PagingToolbar({
    displayInfo:true,
    items:['-','Items displaying per page: ',iNumber,],
    pageSize:pageSize,
    refreshText:'Click to refresh current page',
    store:store
  });
  var tbar = new Ext.Toolbar({items:[]});
  if(tableMngr.tbar){
    tbar = new Ext.Toolbar({items:tableMngr.tbar});
  }
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
//    autoWidth:true,
    bbar:tableMngr.bbar,
    columns:columns,
    id:'DataMonitoringTable',
    labelAlign:'left',
    loadMask:true,
    margins:'2 0 2 0',
    region:'center',
    split:true,
    store:store,
    stripeRows:true,
    tbar:tbar,
    title:title,
//    viewConfig:{forceFit:true}
  });
  if(tableMngr.tbar == ''){
    var bar = dataTable.getTopToolbar();
    bar.hide();
  }
  dataTable.on({
    'render':function(){
      try{
        delete dataSelect.extra.limit;
      }catch(e){}
    }
  });
  return dataTable;
}
function columnTreeee(){
  var tree = new Ext.tree.ColumnTree({
//    width: 550,
//    height: 300,
    rootVisible:false,
    autoScroll:true,
    margins:'2 0 2 0',
    region:'center',
//    title: 'ColumnTree Test',
    columns:[{
      header:'Site, CE',
      width:330,
      dataIndex:'PilotJobEff'
    },{
      header:'SubmissionEff',
      width:200,
      dataIndex:'SubmissionEff'
    },{
      header:'Aborted_Hour',
      width:200,
      dataIndex:'Aborted_Hour'
    }],
    loader: new Ext.tree.TreeLoader({
      baseAttrs:{},
      baseParams:{level:'/',node:'BKSource',root:'/'},
      dataUrl:'https://lhcbtest.pic.es/DIRAC/LHCb-Development/lhcb/data/BK/submit',
      uiProviders:{
        'col': Ext.tree.ColumnNodeUI
      }
    }),
    root: new Ext.tree.AsyncTreeNode({
      draggable:false,
      expanded:true,
      extra:'/',
      id:'BKSource',
      text: '/'
    })
  });
  return tree
}
