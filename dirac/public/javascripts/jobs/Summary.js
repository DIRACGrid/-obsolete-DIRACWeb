var columnWidth = '.33'; // 3 Columns per page
var refreshRate = 0; // autorefresh is off
var layout = 'default';
function initLoop(initValues){
  if(initValues){
    if(initValues.columns){
      columnWidth = initValues.columns;
    }
    if(initValues.refresh){
      refreshRate = initValues.refresh;
    }
    if(initValues.defaultLayout){
      layout = initValues.defaultLayout;
    }
  }
  Ext.onReady(function(){
    var mainContent = mainPanel(initValues);
    renderInMainViewport([ mainContent ]);
  });
}
// Declaration
var heartbeat = '';
var contextMenu = '';
function mainPanel(initValues){
  heartbeat = new Ext.util.TaskRunner();
  contextMenu = new Ext.menu.Menu();
  var message = {
    anchor:'100%',
    fieldLabel:'Tip',
    columnWidth:.99,
    html:'Welcome to the Summary page. With this page you can build your own monitoring environment. To start with, press \'Add\' button and enter an image URL in the \'Path\' field. You can enter any URL of a plot not only for the DIRAC accounting plots. To remove an image do mouse right click on it and in the menu select \'Remove\'. Unfortunately you can not reshuffle items yet, so to remove and to add the items is the only way to reshuffle it so far. You can always save the current layout on the server side by clicking \'Save Layout\' button, so you\'ll have the same environment at any browser at any time. If you want to discard the changes, just click the \'Restore Layout\' button',
    id:'welcomeMessage',
    xtype:'label'
  };
  var add = {
    cls:"x-btn-text-icon",
    handler:function(){
      addPanel();
    },
    iconCls:'Add',
    tooltip:'Some wise tooltip here',
    text:'Add',
  };
  var set = new Ext.SplitButton({
    cls:"x-btn-text-icon",
    handler:function(){
      var welcome = Ext.getCmp('welcomeMessage');
      if(welcome){
        Ext.Msg.alert('Warning','Can not save the default layout')
      }else{
        saveState();
      }
    },
    iconCls:'Save',
    id:'saveLayoutButton',
    menu:getMenu(initValues),
    tooltip:'Read your current layout and save it on the server',
    text:''
  });
  var get = new Ext.SplitButton({
    cls:"x-btn-text-icon",
    handler:function(){
      restoreState(layout);
      var mainPanel = Ext.getCmp('mainConteiner');
      if(mainPanel){
        mainPanel.doLayout();
      }
    },
    iconCls:'Restore',
    id:'loadLayoutButton',
    menu:getMenu(initValues),
    tooltip:'Download your saved layout and apply it',
    text:''
  });
  get.on('render',function(){
    returnText('loadLayoutButton',layout);
  });
  var column = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'columnSplitButton',
    id:'columnSplitButton',
    menu:[
      {checked:setChk('.98'),checkHandler:function(){setColumn('.98')},group:'column',text:'1 Column'},
      {checked:setChk('.49'),checkHandler:function(){setColumn('.49')},group:'column',text:'2 Columns'},
      {checked:setChk('.33'),checkHandler:function(){setColumn('.33')},group:'column',text:'3 Columns'},
      {checked:setChk('.24'),checkHandler:function(){setColumn('.24')},group:'column',text:'4 Columns'},
      {checked:setChk('.19'),checkHandler:function(){setColumn('.19')},group:'column',text:'5 Columns'}
    ],
    text:'Columns',
    tooltip:'Click to change number of columns'
  });
  var refresh = new Ext.SplitButton({
    cls:"x-btn-text-icon",
    handler:function(){
      refreshCycle();
    },
    iconCls:'refreshSplitButton',
    id:'refreshSplitButton',
    menu:new Ext.menu.Menu({items:[
      {checked:setChk(0),checkHandler:function(){setRefresh(0);},group:'refresh',text:'Disabled'},
      {checked:setChk(900000),checkHandler:function(){setRefresh(900000);},group:'refresh',text:'Each 15m'},
      {checked:setChk(3600000),checkHandler:function(){setRefresh(3600000);},group:'refresh',text:'Each Hour'},
      {checked:setChk(86400000),checkHandler:function(){setRefresh(86400000);},group:'refresh',text:'Each Day'}
    ]}),
    text:'',
    tooltip:'Click the button for manual refresh. Set autorefresh rate in the button menu',
  });
  refresh.on('render',function(){
    returnText('refreshSplitButton',refreshRate);
  });
  var panel = new Ext.Panel({
    autoScroll:true,
    bodyStyle:'padding:5px;',
    defaults: {
      bodyStyle:'padding:5px'
    },
    id:'mainConteiner',
    items:[message],
    layout:'column',
    margins:'2 0 2 0',
    monitorResize:true,
    region:'center',
    tbar:[add,'Save As:',set,'Load Layout:',get,'->','Auto Refresh:',refresh,column]
  });
  panel.on('render',function(){
    if(initValues){
//      restoreState(initValues);
    }
  });
  return panel
}
///////////////////////////////////////////////////////
function setChk(value){
  if(value == columnWidth){
    return true
  }else if(value == refreshRate){
    return true
  }else if(value == layout){
    return true
  }else{
    return false
  }
}
function returnText(id,value){
  var button = Ext.getCmp(id);
  if(button){
    try{
      if(id == 'refreshSplitButton'){
        if(value == 900000){
          button.setText('Each 15m');
        }else if(value == 3600000){
          button.setText('Each Hour');
        }else if(value == 86400000){
          button.setText('Each Day');
        }else{
          button.setText('Disabled');
        }
      }else if(id == 'loadLayoutButton'){
        button.setText(value);
      }
    }catch(e){}
  }
}
function chkMenuItem(value,group){
  var item = new Ext.menu.CheckItem({
    checked:setChk(value),
    checkHandler:function(item,status){
      if(group == 'get' && status){
        restoreState(value);
      }
    },
    group:group,
    text:value
  });
  return item
}
function getMenu(init){
  var menu = new Ext.menu.Menu();
  var tmp = chkMenuItem(layout,'get');
  menu.addItem(tmp);
  if(init){
    if(init.layouts){
      var layouts = init.layouts.split(';');
      if(layouts.indexOf(layout)>=0){
        layouts.splice(layouts.indexOf(layout),1);
      }
    }
  }
  if(layouts){
    var length = layouts.length;
    for(i=0; i<length; i++){
      if(layouts[i].length > 0){
        tmp = chkMenuItem(layouts[i],'get');
        menu.addItem(tmp);
      }
    }
  }
  return menu
}
function refreshCycle(){
  try{
    var mainPanel = Ext.getCmp('mainConteiner');
    var length = mainPanel.items.getCount();
    for(i=0; i<length; i++){
      var j = mainPanel.getComponent(i);
      if(j.id != 'welcomeMessage'){
        var tmp = createPanel(j.autoEl.src);
        mainPanel.remove(i);
        mainPanel.insert(i,tmp);
      }
    }
    mainPanel.doLayout();
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
}
function setColumn(width){
  var button = Ext.getCmp('columnSplitButton');
  try{
    var mainPanel = Ext.getCmp('mainConteiner');
    columnWidth = width;
    var length = mainPanel.items.getCount();
    for(i=0; i<length; i++){
      var tmp = mainPanel.getComponent(i);
      tmp.columnWidth = width;
    }
    mainPanel.doLayout();
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
}
function setRefresh(time){
  if(time == 900000 || time == 3600000 || time == 86400000){
    refreshRate = time;
    heartbeat.start({
      run:refreshCycle,
      interval:time
    });
  }else{
    refreshRate = 0;
    heartbeat.stopAll();
  }
  returnText('refreshSplitButton',time);
}
function changeIcon(id,state){
  var button = Ext.getCmp(id);
  var class = '';
  if(id == 'loadLayoutButton' && state == 'load'){
    class = 'Loading';
  }else if(id == 'loadLayoutButton' && state == 'normal'){
    class = 'Restore';
  }else if(id == 'saveLayoutButton' && state == 'load'){
    class = 'Loading';
  }else if(id == 'saveLayoutButton' && state == 'normal'){
    class = 'Save';
  }
  try{
    button.setIconClass(class);
  }catch(e){}
}
function saveState(){
}
function restoreState(name){
  changeIcon('loadLayoutButton','load');
  returnText('loadLayoutButton',name);
  layout = name;
  Ext.Ajax.request({
    failure:function(response){
      changeIcon('loadLayoutButton','normal');
      AJAXerror(response.responseText);
      return false
    },
    method:'POST',
    params:{'getBookmarks':true,'layouName':name},
    success:function(response){
      changeIcon('loadLayoutButton','normal');
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        AJAXerror(response.responseText);
        return false
      }else{
        var mainPanel = Ext.getCmp('mainConteiner');
        mainPanel.doLayout();
      }
    },
    url:'action'
  });
}
function createPanel(img){
  var welcome = Ext.getCmp('welcomeMessage');
  if(welcome){
    var mainPanel = Ext.getCmp('mainConteiner');
    mainPanel.remove(welcome);
  }
  var boxID = Ext.id();
  var box = new Ext.BoxComponent({
    autoEl:{
      tag:'img',
      src:img
    },
    columnWidth:columnWidth,
    id:boxID
  });
  box.on('render',function(){
    box.el.on('contextmenu', function(evt,div,x,y,z) {
      evt.stopEvent();
      contextMenu.removeAll();
      contextMenu.add({
          handler:function(){
            var mainPanel = Ext.getCmp('mainConteiner');
            mainPanel.remove(box);
          },
          icon:gURLRoot + '/images/iface/close.gif',
          text:'Remove'
        },{
          handler:function(){
            Ext.Msg.alert('Show URL',img);
          },
          icon:gURLRoot + '/images/iface/showPath.gif',
          text:'Show URL'
        });
      contextMenu.showAt(evt.xy);
    });
  });
  return box
}
function addPanel(){
  var winID = Ext.id();
  var panelID = Ext.id();
  var titleID = Ext.id();
  var pathID = Ext.id();
  var panel = new Ext.FormPanel({
    bodyStyle:'padding: 5px',
    buttonAlign:'center',
    buttons:[{
      cls:"x-btn-text-icon",
      handler:function(){
        try{
          var pathField = Ext.getCmp(pathID);
          var path = pathField.getValue();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message);
          return
        }
        if((path == null) || (path == '')){
          alert('Path is empty, please input image url')
          return
        }
        try{
          var tmpPanel = createPanel(path);
          var mainPanel = Ext.getCmp('mainConteiner');
          var newWidth = Math.round((mainPanel.getInnerWidth() - 30)/3);
          tmpPanel.setWidth(newWidth);
          mainPanel.add(tmpPanel);
          mainPanel.doLayout();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message);
          return
        }
        var win = Ext.getCmp(winID);
        try{
          win.close();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message)
        }
      },
      icon:gURLRoot+'/images/iface/advanced.gif',
      minWidth:'150',
      tooltip:'Add the link in the input field to the bookmark panel',
      text:'Add Panel'
    },{
      cls:"x-btn-text-icon",
      handler:function(){
        var win = Ext.getCmp(winID);
        try{
          win.close();
        }catch(e){
          alert('Error: ' + e.name + ': ' + e.message)
        }
      },
      icon:gURLRoot+'/images/iface/reset.gif',
      minWidth:'100',
      tooltip:'Click here to discard changes and close the window',
      text:'Cancel'
    }],
    id:panelID,
    items:[{
      allowBlank:false,
      anchor:'100%',
      allowBlank:true,
      id:pathID,
      enableKeyEvents:true,
      fieldLabel:'Path',
      selectOnFocus:true,
      xtype:'textfield'
    },{
      anchor:'100%',
      fieldLabel:'Tip',
      html:'In the Path text field you can put any URL of an image.',
      xtype:'label'
    },{
      anchor:'100%',
      fieldLabel:'Tip',
      html:'To delete the image simple do right mouse click over it and choose \'remove\' action',
      xtype:'label'
    }],
    labelAlign:'top'
  });
  var win = new Ext.Window({
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    height:200,
    id:winID,
    items:[panel],
    layout:'fit',
    maximizable:false,
    minHeight:200,
    minWidth:320,
    title:'Create panel',
    width:320
  });
  win.show();
}
