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
function displayWin(panel,title){
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
    autoScroll:true,
//    autoHeight:true,
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
    title:"ID: " + title,
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
function itemsNumber(){
  var store = new Ext.data.SimpleStore({
    fields:['number'],
    data:[[25],[50],[100],[150]]
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
      if(dataMngr.store){
        if(dirac.bbar.pageSize != combo.value){
          dirac.bbar.pageSize = combo.value;
          dataMngr.store.load({params:{start:0,limit:dirac.bbar.pageSize}});
        }
      }
    }
  });
/*
  combo.on({
    'blur':function(){
      if(dataMngr.store){
        if(dirac.bbar.pageSize != combo.value){
          dirac.bbar.pageSize = combo.value;
          dataMngr.store.load({params:{start:0,limit:dirac.bbar.pageSize}});
        }
      }
    }
  });
*/
  return combo
}
function selectPanel(){
  var panel = new Ext.FormPanel({
    autoScroll:true,
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
        text: 'Reset',
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
  var store = new Ext.data.SimpleStore({
    fields:['app'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'app',
    emptyText:data[0],
    fieldLabel:'Application status',
    forceSelection:true,
    hiddenName:'app',
    mode:'local',
    name:'app',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectID(){
  var number = new Ext.form.NumberField({
    anchor:'90%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    fieldLabel:'ID',
    mode:'local',
    name:'id',
    selectOnFocus:true,
    value:''
  })
  return number
}
function selectOwnerMenu(){
  if(dataSelect.owner){
    var data = dataSelect.owner;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['owner'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'owner',
    emptyText:data[0],
    fieldLabel:'Owner',
    forceSelection:true,
    hiddenName:'owner',
    mode:'local',
    name:'owner',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectProdMenu(){
  if(dataSelect.prod){
    var data = dataSelect.prod;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['prod'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'prod',
    emptyText:data[0],
    fieldLabel:'JobGroup',
    forceSelection:true,
    hiddenName:'prod',
    mode:'local',
    name:'prod',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true
  })
  return combo
}
function selectSiteMenu(){
  if(dataSelect.site){
    var data = dataSelect.site;
  }else{
    var data = [['']];
  }
  var store = new Ext.data.SimpleStore({
    fields:['site'],
    data:data
  });
  var combo = new Ext.form.ComboBox({
    anchor:'90%',
    allowBlank:true,
    displayField:'site',
    emptyText:data[0],
    fieldLabel:'DIRAC Site',
    forceSelection:true,
    hiddenName:'site',
    mode:'local',
    name:'site',
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
    fieldLabel:'Job status',
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
function showMenu(table,rowIndex,columnIndex){
//  if(dirac.menu){
//    dirac.menu.destroy();
//    delete dirac.menu;
//    return
//  }
  var record = table.getStore().getAt(rowIndex); // Get the Record for the row
  var columnName = table.getColumnModel().getColumnId(columnIndex); // Get field name for the column
//  var data = record.get(fieldName); data in the particular cell
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
