function chkBox(id){
 return '<input id="' + id + '" class="yui-dt-checkbox" type="checkbox"/>'
}
function dateSelectMenu(){
  var date = new Ext.form.DateField({
    anchor:'100%',
    allowBlank:true,
    emptyText:'YYYY-mm-dd',
    fieldLabel:'Date',
    format:'Y-m-d',
    hiddenName:'date',
    name:'date',
    selectOnFocus:true,
    startDay:1,
    value:''
  })
  return date
}
function initStore(record){
  var reader = new Ext.data.JsonReader({
    root:'result',
    totalProperty:'total'
  },record)
  var store = new Ext.data.Store({
    proxy: new Ext.data.HttpProxy({
      url:'submit',
      method:'POST'
    }),
    reader:reader
  })
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
  })
  return combo
}
function selectPanel(){
  var panel = new Ext.FormPanel({
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
    buttonAlign:'center',
    waitMsgTarget:true,
    url:'submit',
    method:'POST',
    items:[{
      layout: 'form',
      border: false,
      buttons:[{
        text: 'Submit',
        handler:function(){
          panel.form.submit({
            waitTitle:'Connecting',
            waitMsg:'Sending data...',
            success:function(form,action){
              if(dataMngr.store){
 //               store = dataMngr.store; 
 //               store.loadData(action.result);
              }else{
                alert('Error: ' + action.response.responseText);
              }
            },
            failure:function(form,action){
              alert('Error: ' + action.response.statusText);
            }
          })
        }
      },{
        text: 'Reset',
        handler:function(){panel.form.reset()}
      }]
    }]
  })
  return panel
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
    anchor:'100%',
    allowBlank:true,
    displayField:'app',
    emptyText:'Select application status...',
    fieldLabel:'Application status',
    hiddenName:'app',
    mode:'local',
    name:'app',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:''
  })
  return combo
}
function selectID(){
  var number = new Ext.form.NumberField({
    anchor:'100%',
    allowBlank:true,
    allowDecimals:false,
    allowNegative:false,
    emptyText:'Type JobID...',
    fieldLabel:'JobID',
//    hiddenName:'id',
    mode:'local',
    name:'id',
    selectOnFocus:true,
//    triggerAction:'all',
//    typeAhead:true,
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
    anchor:'100%',
    allowBlank:true,
    displayField:'owner',
    emptyText:'Select owner...',
    fieldLabel:'Owner',
    hiddenName:'owner',
    mode:'local',
    name:'owner',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:''
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
    anchor:'100%',
    allowBlank:true,
    displayField:'prod',
    emptyText:'Select JobGroup...',
    fieldLabel:'JobGroup',
    hiddenName:'prod',
    mode:'local',
    name:'prod',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:''
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
    anchor:'100%',
    allowBlank:true,
    displayField:'site',
    emptyText:'Select a site...',
    fieldLabel:'DIRAC Site',
    hiddenName:'site',
    mode:'local',
    name:'site',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:''
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
    anchor:'100%',
    allowBlank:true,
    displayField:'stat',
    emptyText:'Select job status...',
    fieldLabel:'Job status',
    hiddenName:'stat',
    mode:'local',
    name:'jobstat',
    selectOnFocus:true,
    store:store,
    triggerAction:'all',
    typeAhead:true,
    value:''
  })
  return combo
}
function status(value){
  if(value == 'Done'){
    return '<img src="'+gURLRoot+'/monitoring/done.gif">';
  }else if(value == 'Failed'){
    return '<img src="'+gURLRoot+'/monitoring/failed.gif">';
  }else if(value == 'Waiting'){
    return '<img src="'+gURLRoot+'/monitoring/waiting.gif">';
  }else if(value == 'Deleted'){
    return '<img src="'+gURLRoot+'/monitoring/deleted.gif">';
  }else if(value == 'Matched'){
    return '<img src="'+gURLRoot+'/monitoring/matched.gif">';
  }else if(value == 'Running'){
    return '<img src="'+gURLRoot+'/monitoring/running.gif">';
  }else{
    return '<img src="'+gURLRoot+'/monitoring/unknown.gif">';
  }
}
function statusBar(){

}
function table(store,columns){
  var iNumber = itemsNumber();
  var botBar = new Ext.PagingToolbar({
    displayInfo:true,
    items:['-','Items displaying per page: ',iNumber],
    pageSize:25,
    store:store
  })
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
    bbar:botBar,
    collapsible:true,
    columns:columns,
    labelAlign:'left',
    margins:'2 2 2 0',
    region:'center',
    split:true,
    store:store,
    stripeRows:true,
//    title:title,
//    tbar:topBar,
    viewConfig:{forceFit:true}
  });
  return dataTable
}


// Experemental::::::::
function initTop(){
  var job = new Ext.Toolbar.Button({
    text:'Jobs',
    menu:[
      {text:'Monitor',handler:mainClick},
      {text:'Production monitor',handler:mainClick},
      {text:'Site summary',handler:mainClick}
    ]
  })
  var bar = new Ext.Toolbar({
    region:'north',
    items:[job,'-','Shortcut:','->','Selected Setup: ']
  })
  return bar
}
function mainClick(item){
  var m = item;
  location.pathname = item.text;
  location.reload();
}
