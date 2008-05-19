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
  if(response){
    var jsonData = Ext.util.JSON.decode(response.responseText);
  }else{
    alert('Error: Server response have wrong data structure');
    return 
  }
  if(jsonData){
    if(jsonData['success'] == 'false'){
      alert('Error: ' + jsonData['error']);
      return
    }else{
      alert('Error: Server response have wrong data structure');
      return
    }
  }else{
    alert('Error: Server response have wrong data structure');
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
function displayWin(panel,title){
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
    autoScroll:true,
    width:600,
    height:350,
    border:true,
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    maximizable:true,
    layout:'fit',
    plain:true,
    shim:false,
    title:title,
    items:[panel]
  })
  window.show()
}
function initStore(record){
  var reader = new Ext.data.JsonReader({
    root:'result',
    totalProperty:'total'
  },record);
  var store = new Ext.data.Store({
    autoLoad:{params:{start:0,limit:25}},
    proxy: new Ext.data.HttpProxy({
      url:'submit',
      method:'POST'
    }),
    reader:reader
  });
  store.on('beforeload',function(){
    if(dataMngr.form){
      if(dataSelect.productionID){
        for(i = 0; i < dataMngr.form.items.length; i++){
          if(dataMngr.form.items.items[i].name == 'prod'){
            dataMngr.form.items.items[i].setValue(dataSelect.productionID); 
         }
        }
        delete dataSelect.productionID;
      }
      store.baseParams = dataMngr.form.getForm().getValues();
    }
  });
  store.on('load',function(){
    if(store.reader){
      if(store.reader.jsonData){
        if(store.reader.jsonData.success == 'false'){
          alert(store.reader.jsonData.error);
          return
        }
      }
    }
    afterDataLoad(store);
  });
  return store
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
function itemsNumber(){
  var store = new Ext.data.SimpleStore({
    fields:['number'],
    data:[[25],[50],[100],[150]]
  });
  var combo = new Ext.form.ComboBox({
    allowBlank:false,
    displayField:'number',
    editable:false,
    maxLength:3,
    maxLengthText:'The maximum value for this field is 999',
    minLength:1,
    minLengthText:'The minimum value for this field is 1',
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
      if(dataMngr.store){
        if(dirac.bbar.pageSize != combo.value){
          dirac.bbar.pageSize = combo.value;
          dataMngr.store.load({params:{start:0,limit:dirac.bbar.pageSize}});
        }
      }
    }
/*
,
    'blur':function(){
        var currentValue = combo.getRawValue();
        if(currentValue > 999){
//          var l = store.totalLength - 1;
//          var x = store.getRange();
          combo.setRawValue(150);
          combo.setValue =  150;
        }else{
          if(currentValue < 1){
            combo.setRawValue = 25
            combo.setValue = 25
          }
        }
    },
//    'keyup':function(){
//      hideControls(number);
//    }
*/
  });
  return combo
}
function selectPanel(){
  var panel = new Ext.FormPanel({
    autoScroll:true,
    id:'selectPanel',
    labelAlign:'top',
    split:true,
    region:'west',
    collapsible:true,
    width: 200,
    minWidth: 200,
    margins:'2 0 2 2',
    cmargins:'2 2 2 2',
    layoutConfig: {
      border:true,
      animate:true
    },
    bodyStyle:'padding: 5px',
    title:'Selections:',
    buttonAlign:'left',
    waitMsgTarget:true,
    url:'submit',
    method:'POST',
    items:[{
      layout: 'form',
      border: false,
      name:'buttons',
      buttons:[{
        text: 'Submit',
        handler:function(){
          var selections = {};
          if(dirac.bbar){
            selections.limit = dirac.bbar.pageSize;
            selections.start = 0;
          }
          panel.form.submit({
            params:selections,
            waitTitle:'Connecting',
            waitMsg:'Sending data...',
            success:function(form,action){
              if(action.result.success == 'false'){
                alert('Error: ' + action.result.error);
                return
              }else{
                if(dataMngr.store){
                  store = dataMngr.store;
                  store.loadData(action.result);
                }else{
                  alert('Error: Unable to load data to the table');
                }
              }
            },
            failure:function(form,action){
              alert('Error: ' + action.response.statusText);
            }
          });
        }
      },{
        text:'Reset',
        handler:function(){panel.form.reset()}
      }]
    }]
  })
  return panel
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

function selectAppMenu(){
  if(dataSelect.app){
    var data = dataSelect.app;
  }else{
    var data = [['']];
  }
  for (var i = 0; i < data.length; i++) {
    data[i] = [i ,data[i][0]];
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'app'],
    data:data
  });

  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
//    allowBlank:true,
    displayField:'app',
    emptyText:data[0][1],
    fieldLabel:'Application status',
//    forceSelection:true,
    hiddenName:'app',
    hideOnSelect:false,
    id:'appMenu',
    mode:'local',
    resizable:true,
//    name:'app',
//    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    enableKeyEvents:true,
    fieldLabel:'ID',
    mode:'local',
    name:'id',
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
function selectRequest(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'RequestID',
    mode:'local',
    name:'RequestID',
    selectOnFocus:true,
    value:''
  })
  return number
}
function selectMinorStatus(){
  if(dataSelect.minorstat){
    var data = dataSelect.minorstat;
  }else{
    var data = [['']];
  }
  for (var i = 0; i < data.length; i++) {
    data[i] = [i ,data[i][0]];
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'minorstat'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    displayField:'minorstat',
    emptyText:data[0][1],
    fieldLabel:'Minor status',
    hiddenName:'minorstat',
    hideOnSelect:false,
    id:'minorstatMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectOwnerMenu(){
  if(dataSelect.owner){
    var data = dataSelect.owner;
  }else{
    var data = [['']];
  }
  for (var i = 0; i < data.length; i++) {
    data[i] = [i ,data[i][0]];
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'owner'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    displayField:'owner',
    emptyText:data[0][1],
    fieldLabel:'Owner',
    hiddenName:'owner',
    hideOnSelect:false,
    id:'ownerMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectProdMenu(){
  if(dataSelect.prod){
    var data = dataSelect.prod;
  }else{
    var data = [['']];
  }
  for (var i = 0; i < data.length; i++) {
    data[i] = [i ,data[i][0]];
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'prod'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    displayField:'prod',
    emptyText:data[0][1],
    fieldLabel:'JobGroup',
    hiddenName:'prod',
    hideOnSelect:false,
    id:'prodMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectSiteMenu(){
  if(dataSelect.site){
    var data = dataSelect.site;
  }else{
    var data = [['']];
  }
  for (var i = 0; i < data.length; i++) {
    data[i] = [i ,data[i][0]];
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'site'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    displayField:'site',
    emptyText:data[0][1],
    fieldLabel:'DIRAC Site',
    hiddenName:'site',
    hideOnSelect:false,
    id:'siteMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function selectStatusMenu(){
  if(dataSelect.stat){
    var data = dataSelect.stat;
  }else{
    var data = [['']];
  }
  for (var i = 0; i < data.length; i++) {
    data[i] = [i ,data[i][0]];
  }
  var store = new Ext.data.SimpleStore({
    id:0,
    fields:[{name:'id',type:'int'},'stat'],
    data:data
  });
  var combo = new Ext.ux.form.LovCombo({
    anchor:'90%',
    displayField:'stat',
    emptyText:data[0][1],
    fieldLabel:'Status',
    hiddenName:'stat',
    hideOnSelect:false,
    id:'statMenu',
    mode:'local',
    resizable:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    valueField:'id'
  })
  return combo
}
function showMenu(table,rowIndex,columnIndex){
  var record = table.getStore().getAt(rowIndex); // Get the Record for the row
  var columnName = table.getColumnModel().getColumnId(columnIndex); // Get field name for the column
  dirac.menu = new Ext.menu.Menu(); // Nado li?
  var coords = Ext.EventObject.xy;
  if(record.data){
    selections = record.data;
  }
  if(columnName != 'checkBox'){ // column with checkboxes
    dirac.menu.removeAll();
    setMenuItems(selections);
    dirac.menu.showAt(coords);
  }
}
function setTitle(value,id){
  var titleID = '';
  var titleValue = '';
  if((id == null) || (id == '')){
    titleID = 'Unknown';
  }else{
    titleID = id;
  }
  if((value == null) || (value == '')){
    titleValue = 'Unknown window for item with ID: ';
  }else{
    if(value == 'getJDL'){
      titleValue = 'JDL for JobID: ';
    }else if(value == 'getBasicInfo'){
      titleValue = 'Attributes for JobID: ';
    }else if(value == 'getParams'){
      titleValue = 'Parameters for JobID: ';
    }else if(value == 'LoggingInfo'){
      titleValue = 'Logging info for JobID: ';
    }else if(value == 'getStandardOutput'){
      titleValue = 'Standard output for JobID: ';
    }else if(value == 'LogURL'){
      titleValue = 'Log file(s) for JobID: ';
    }else if(value == 'getStagerReport'){
      titleValue = 'Stager report for JobID: ';
    }else if(value == 'pilotStdOut'){
      titleValue = 'Pilot StdOut for JobID: ';
    }else if(value == 'pilotStdErr'){
      titleValue = 'Pilot StdErr for JobID: ';
    }else if(value == 'log'){
      titleValue = 'Logs for JobGroup ID: ';
    }else{
      titleValue = 'Item ID: ';
    }
  }
  title = titleValue + titleID;
  return title
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
    return
  }
  if(tableMngr.columns){
    var columns = tableMngr.columns;
  }else{
    alert('Unable to display data. Data defenition is not defined');
    return
  }
  if(tableMngr.title){
    var title = tableMngr.title;
  }else{
    title = 'Unknown';
  }
  if(tableMngr.tbar){
    dirac.tbar = new Ext.Toolbar({
//    var tbar = new Ext.Toolbar({
      items:tableMngr.tbar
    })
  }else{
    dirac.tbar = new Ext.Toolbar({
//    var tbar = new Ext.Toolbar({
      items:[]
    })
  }
  var iNumber = itemsNumber();
  dirac.bbar = new Ext.PagingToolbar({
    displayInfo:true,
    items:['-','Items displaying per page: ',iNumber],
    pageSize:25,
    store:store
  })
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
    bbar:dirac.bbar,
    collapsible:true,
    columns:columns,
    labelAlign:'left',
    margins:'2 2 2 2',
    region:'center',
    split:true,
    store:store,
    stripeRows:true,
    title:title,
//    tbar:tbar,
    tbar:dirac.tbar,
    viewConfig:{forceFit:true}
  });
  return dataTable
}

function mainClick(item){
  var m = item;
  location.pathname = item.text;
  location.reload();
}
