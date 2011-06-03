function initUserProfile(){
  var menu = [{
    id:'layoutUPTopbarMenu',
	  menu:{items:[
	    {text:'Load',icon:gURLRoot + '/images/iface/reschedule.gif'},
	    {text:'Save',icon:gURLRoot + '/images/iface/save.gif'},
	    {handler:function(){importUPD()},text:'Import',icon:gURLRoot + '/images/iface/import.gif'},
      {handler:function(){changeUPD()},text:'Edit',icon:gURLRoot + '/images/iface/gear.gif'},
  	  '-',
	    {handler:function(){testMenuHandler('delete')},icon:gURLRoot + '/images/iface/close.gif',text:'Delete'},
	    {handler:function(){testMenuHandler('deleteAll')},icon:gURLRoot + '/images/iface/delete.gif',text:'Delete All'}
	  ]},
	  text:'Layout'
  }];
  return menu
}

function addProfileMenuItems(){
  var menu = false;
  try{
    menu = Ext.getCmp('layoutUPTopbarMenu').menu;
  }catch(e){}
  if(!menu){
  	return
  }
  var resultL = new Ext.menu.Menu();
  var resultS = new Ext.menu.Menu();
  resultS.add({handler:function(){testMenuHandler('saveNew')},text:'Save as new',icon:gURLRoot + '/images/iface/save.gif'});
  var params = {'page':pageDescription['pageName'],'user':gPageDescription.userData.username};
  var setup = gPageDescription.selectedSetup;
  var group = gPageDescription.userData.group;
  var url = location.protocol + '//' + location.host + '/' + setup + '/' + group + '/jobs/Common/getLayoutList';
  Ext.Ajax.request({
  	failure:function(response){
  	  var jsonData = Ext.util.JSON.decode(response.responseText);
  	  if(jsonData){
  	    alert('Error: ' + jsonData['error']);
  	  }else{
    		alert('Recived data: ' + jsonData.toSource() + '\nError: Service response has wrong data structure');
  	  }
  	  return
  	},
  	method:'POST',
  	params:params,
  	success:function(response){
  	  var jsonData = Ext.util.JSON.decode(response.responseText);
  	  if(jsonData['success'] == 'false'){
  	    alert('Error: ' + jsonData['error']);
  	    return
  	  }else{
    		var items = jsonData['result'];
        if(items){
          for(var i = 0; i < items.length; i++){
          	var j = items[i];
          	resultL.add({text:j,handler:function(){testMenuHandler('load',j)}});
          	resultS.add({text:j,handler:function(){testMenuHandler('save',j)}});
          }
        }
        var lll = resultL.items.getCount();
        if(resultL.items.getCount() > 0){
          menu.items.items[0].menu = resultL;
        }else{
          menu.items.items[0].disable();
        }  		
	    	menu.items.items[1].menu = resultS;
	    }
  	},
	  url:url
  });
}
function importUPD(){
  var formID = Ext.id(); // from panel
  var winID = Ext.id();
  var pageID = Ext.id();
  var layout = '';
  var user = '';
  var totalItems = 50;
  function userSel(width,userStore,store){
    var user = new Ext.form.ComboBox({
      anchor:'100%',
      store:userStore,
      displayField:'name',
      typeAhead:true,
      minWidth:width,
      fieldLabel:'Owner',
      forceSelection:true,
      triggerAction:'all',
      emptyText:'Select Owner',
      selectOnFocus:true,
      width:width
    });
    userStore.on('beforeload',function(){
      try{
        user.disable();
      }catch(e){}
    });
    userStore.on('load',function(){
      try{
        user.enable();
      }catch(e){}
    });
    user.on('collapse',function(){
      var value = this.getRawValue();
      if(value != ''){
        store.baseParams['user'] = value;
        store.load();
      }
    });
    return user
  }
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    disabled:true,
    handler:function(){
      try{
        UP.variable = layout;
        loadProfile(layout,user);
      }catch(e){
        alert('Action is not supported on this page');
      }
    },
    icon:gURLRoot+'/images/iface/submit.gif',
    id:'layoutLoadButton',
    minWidth:'150',
    tooltip:'Overrides current layout, all unsaved changes will be lost',
    text:'Import Data'
  });
  var refresh = new Ext.Button({
    cls:"x-btn-icon",
    handler:function(){
      storeUser.load();
    },
    icon:gURLRoot+'/images/iface/refresh.gif',
    minWidth:'20',
    tooltip:'Refresh data in the selection boxes',
    width:'100%'
  });
  var close = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      var win = Ext.getCmp(winID);
      try{
        win.close();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
      }
	  },
    icon:gURLRoot+'/images/iface/close.gif',
    minWidth:'70',
    tooltip:'Alternatively, you can close the dialogue by pressing the [X] button on the top of the window',
    text:'Close'
  });
  var setup = gPageDescription.selectedSetup;
  var group = gPageDescription.userData.group;
  var url = location.protocol + '//' + location.host + '/' + setup + '/' + group + '/jobs/Common/';
  var storeUser = new Ext.data.JsonStore({
    baseParams:{'profile':'Summary'},
    fields:['name'],
    root:'result',
    url:url+'getLayoutUserList'
  });
  var store = new Ext.data.JsonStore({
    baseParams:{'user':'All','profile':'Summary'},
    fields:['name','description','owner'],
    root:'result',
    url:url+'getLayoutAndOwner'
  });
  store.load();
  var user = userSel(200,storeUser,store);
  var table = new Ext.grid.GridPanel({
    anchor:'100%',
    autoHeight:false,
    autoScroll:true,
    bbar:new Ext.PagingToolbar({
      displayInfo:true,
      id:pageID,
      pageSize:totalItems,
      prependButtons:true,
      store:store
    }),
    border:false,
    columns:[
      {header:'Name',dataIndex:'name',align:'left',menuDisabled:true,sortable:false,css:'cursor:pointer;cursor:hand;'},
      {header:'Owner',dataIndex:'owner',align:'left',editable:false,sortable:false,css:'cursor:pointer;cursor:hand;'}
    ],
    enableHdMenu:false,
    layout:'fit',
    loadMask:true,
    store:store,
    stripeRows:true,
    tbar:[refresh,user],
    viewConfig:{forceFit:true,scrollOffset:1}
  });
  table.addListener('rowclick',function(tab,rowIndex){
    var record = tab.getStore().getAt(rowIndex);
    try{
      var data = record.data;
      var button = Ext.getCmp('layoutLoadButton');
      button.enable();
      layout = data['name'];
      user = data['owner'];
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message);
      return
    }
  });
  table.addListener('rowdblclick',function(tab,rowIndex){
    var record = tab.getStore().getAt(rowIndex);
    try{
      var data = record.data;
      var button = Ext.getCmp('layoutLoadButton');
      button.enable();
      layout = data['name'];
      user = data['owner'];
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message);
      return
    }
    try{
      UP.variable = layout;
      loadProfile(layout,user);
    }catch(e){
      alert('Action is not supported on this page');
    }
  });
  table.addListener('resize',function(){
	  var tmpWidth = table.getInnerWidth() - 26;
	  var list = userSel(tmpWidth,storeUser,store);
	  var bar = table.getTopToolbar();
	  Ext.fly(bar.items.get(1).getEl()).remove();
	  bar.items.removeAt(1);
  	bar.add(list);
	  table.doLayout();
  });
  var window = displayWin(table,{'title':'Import Data','modal':true,'buttons':[submit,close],'collapsible':false,'id':winID});
  window.center();
}
function changeUPD(){
  var formID = Ext.id(); // from panel
  var winID = Ext.id();
  var pageID = Ext.id();
  var layout = UP('edit');
  if(!layout){
	  alert('Can not get the definition of layout');
	  return
  }
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    disabled:true,
    handler:function(){
	    testMenuHandler('save',layout);
    },
    icon:gURLRoot+'/images/iface/submit.gif',
    id:'layoutEditButton',
    minWidth:'150',
    tooltip:'Edit and save your layout',
    text:'Save changes'
  });
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      storeUser.load();
    },
    icon:gURLRoot+'/images/iface/refresh.gif',
    minWidth:'70',
    tooltip:'Reset all the changes using previously downloaded data',
    text:'Reset'
  });
  var close = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      var win = Ext.getCmp(winID);
      try{
        win.close();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
      }
	  },
    icon:gURLRoot+'/images/iface/close.gif',
    minWidth:'70',
    tooltip:'Alternatively, you can close the dialogue by pressing the [X] button on the top of the window',
    text:'Close'
  });
  var setup = gPageDescription.selectedSetup;
  var group = gPageDescription.userData.group;
  var url = location.protocol + '//' + location.host + '/' + setup + '/' + group + '/jobs/Common/';
  var store = new Ext.data.JsonStore({
    baseParams:{'user':'All','profile':'Summary'},
    fields:['name','description','owner'],
    root:'result',
    url:url+'layoutAvailable'
  });
  store.load();
  var checkBox = new Ext.form.Checkbox({
    boxLabel:'Read available for everyone',
    name:'readEverybody',
  });
  checkBox.addListener('change',function(){
  	try{
	    Ext.getCmp('layoutEditButton').enable();
	  }catch(e){} 
  });
  var table = new Ext.grid.GridPanel({
    anchor:'100%',
    autoHeight:false,
    autoScroll:true,
    bbar:[checkBox],
    border:false,
    columns:[
      {header:'Key',dataIndex:'name',align:'left',menuDisabled:true,sortable:false,css:'cursor:pointer;cursor:hand;'},
      {header:'Value',dataIndex:'owner',align:'left',editable:false,sortable:false,css:'cursor:pointer;cursor:hand;'}
    ],
    enableHdMenu:false,
    layout:'fit',
    loadMask:true,
    store:store,
    stripeRows:true,
    viewConfig:{forceFit:true,scrollOffset:1}
  });
  table.addListener('rowclick',function(tab,rowIndex){
    var record = tab.getStore().getAt(rowIndex);
    try{
      var data = record.data;
      var button = Ext.getCmp('layoutLoadButton');
      button.enable();
      layout = data['name'];
      user = data['owner'];
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message);
      return
    }
  });
  var window = displayWin(table,{'title':'Edit Layout Data','modal':true,'buttons':[submit,reset,close],'collapsible':false,'id':winID});
  window.center();  
}
function displayWin(item,config){
  var title = 'Default Title';
  if(config.title){
    title = config.title;
  }
  var closable = true;
  if(config.closable){
    closable = config.closable;
  }
  var collapsible = true;
  if(config.collapsible){
    closable = config.collapsible;
  }
  var maximizable = true;
  if(config.maximizable){
    maximizable = config.maximizable;
  }
  var modal = false;
  if(config.modal){
    modal = config.modal;
  }
  var buttons = false;
  if(config.buttons){
    buttons = config.buttons;
  }
  var id = Ext.id();
  if(config.id){
    id = config.id;
  }
  var window = new Ext.Window({
    border:true,
    buttonAlign:'center',
    buttons:buttons,
    closable:closable,
    collapsible:collapsible,
    constrain:true,
    constrainHeader:true,
    height:400,
    id:id,
    iconCls:'icon-grid',
    items:[item],
    layout:'fit',
    maximizable:maximizable,
    modal:modal,
    minHeight:300,
    minWidth:400,
    plain:true,
    shim:false,
    title:title,
    width:600
  });
  window.show();
  return window;
}
