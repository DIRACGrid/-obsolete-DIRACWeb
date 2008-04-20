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
  return '<input id="' + id + '" class="yui-dt-checkbox" type="checkbox"/>'
}
function dateSelectMenu(){
  var date = new Ext.form.DateField({
    anchor:'100%',
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
function displayWin(panel){
  var window = new Ext.Window({
    closable:true,
    defaults:{autoScroll:true},
    autoHeight:true,
    width:600,
    height:350,
    border:true,
    collapsible:true,
    constrain:true,
    maximizable:true,
    plain:true,
    title:"Job ID: " + id,
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
//      store.baseParams = dataMngr.form.getForm().getValues();
    }
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
    'change':function(){
      var x = this.prototype;
      if(dataMngr.store){
        this.pageSize = combo.value;
        dataMngr.store.load()
      }
    }
  });
  return combo
}
function selectPanel(){
  var panel = new Ext.FormPanel({
    labelAlign:'top',
    split:true,
    region:'west',
//    footer:['Sort by:',' '],
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
          if(dataMngr.form){
            var tmp = panel.form.getValues();
            var item = panel.form.items.items;
            if(tmp.date){
              for(i=0;i<panel.form.items.length;i++){
                if(tmp.date == item[i].emptyText){
                  tmp.date = '';
                }
              }
            }
            if(tmp.id){
              for(i=0;i<panel.form.items.length;i++){
                if(tmp.id == item[i].emptyText){
                  tmp.id = '';
                }
              }
            }
          }
          panel.form.submit({
            params:tmp,
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
function showMenu(){
  var menu = new Ext.menu.Menu({
    allowOtherMenus:true
  });
  var coords = Ext.EventObject.xy;
  var id = this.getSelections()[0].data.id;
  var status = this.getSelections()[0].data.status;
  var cellName = Ext.EventObject.target;
  var cellName = this.getColumnModel();
  if(cellName == ""){
    var cellName = this.getColumnModel().getDataIndex(0);
  }else{
    menu.removeAll();
    setMenuItems(menu,id);
    menu.showAt(coords);
  }
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
function table(tableMngr){
  if(tableMngr.store){
    store = tableMngr.store;
  }else{
    alert('Unable to display data. Data store is not defined');
    return
  }
  if(tableMngr.columns){
    columns = tableMngr.columns;
  }else{
    alert('Unable to display data. Data defenition is not defined');
    return
  }
  if(tableMngr.title){
    title = tableMngr.title;
  }else{
    title = '';
  }
  if(tableMngr.tbar){
    topBar = tableMngr.tbar;
  }else{
    topBar = [{}];
  }
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
    title:title,
    tbar:topBar,
    viewConfig:{forceFit:true}
  });
  return dataTable
}


// Experemental::::::::
function initTop(){
  var html = '<table class="header"><tr><td><img alt="DIRAC" src="'+gURLRoot+'/logos/DIRAC-logo-transp.png" height="48px" /></td><td class="headerSpacer"></td><td><img alt="LHCb" src="'+gURLRoot+'/LHCbLogo.png" height="48px" /></td></tr></table>'
  var job = new Ext.Toolbar.Button({
    text:'Jobs',
    menu:[
      {text:'Monitor',handler:mainClick},
      {text:'Production monitor',handler:mainClick},
      {text:'Site summary',handler:mainClick}
    ]
  })
  var shortcut = new Ext.Toolbar.Button({text:'Job Monitoring'})
  var setup = new Ext.Toolbar.Button({
    text:'LHCb-Development'
  })
  var bbb = new Ext.Panel({
    html:html,
    region:'north',
    margins: '0 0 0 0'
  })
  var bar = new Ext.Toolbar({
    region:'north',
    items:[job,'->','Selected Setup:',' ',setup],
    margins: '0 0 0 0'
  })
  var c = new Ext.Panel({
//    layout:'border',
//    region:'north',
    items:[bbb,bar]
  })
  return bar
}



function initBottom(){
  var user = new Ext.Toolbar.Button({
    text:'lhcb',
    menu:[
      {text:'lhcb_admin',handler:mainClick},
      {text:'lhcb_prod',handler:mainClick},
      {text:'lhcb_user',handler:mainClick},
      {text:'lhcb',handler:mainClick},
      {text:'diracAdmin',handler:mainClick}
    ]
  })
  var bar = new Ext.Toolbar({
    region:'south',
    items:['jobs > Monitor','->','msapunov@',user,' ','/O=GRID-FR/C=FR/O=CNRS/OU=CPPM/CN=Matvey Sapunov']
  })
  return bar
}





function mainClick(item){
  var m = item;
  location.pathname = item.text;
  location.reload();
}
