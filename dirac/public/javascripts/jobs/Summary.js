var columnWidth = '.33'; // 3 Columns per page
var refreshRate = 0; // autorefresh is off
var layout = 'default';
var heartbeat = '';
var contextMenu = '';
function initLoop(initValues){
  Ext.onReady(function(){
    var mainContent = mainPanel(initValues);
    renderInMainViewport([ mainContent ]);
  });
}
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
  var current = {
    disabled:true,
    disabledClass:'my-disabled',
    id:'currentID',
    text:'Current Layout: <b>' + layout + '</b>'
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
      saveLayout(layout);
    },
    iconCls:'Save',
    id:'setLayoutButton',
    menu:createMenu('set',initValues),
    tooltip:'Read your current layout and save it on the server',
    text:'Save'
  });
  var get = new Ext.SplitButton({
    cls:"x-btn-text-icon",
    handler:function(){
      loadLayout(layout);
      var mainPanel = Ext.getCmp('mainConteiner');
      if(mainPanel){
        mainPanel.doLayout();
      }
    },
    iconCls:'Restore',
    id:'getLayoutButton',
    menu:createMenu('get',initValues),
    tooltip:'Download your saved layout and apply it',
    text:'Load'
  });
  var del = new Ext.SplitButton({
    cls:"x-btn-text-icon",
    handler:function(){
      deleteLayout(layout);
    },
    iconCls:'Delete',
    id:'delLayoutButton',
    menu:createMenu('del',initValues),
    tooltip:'',
    text:'Delete'
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
    text:'Refresh',
    tooltip:'Click the button for manual refresh. Set autorefresh rate in the button menu',
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
    tbar:[current,'->',add,'-',get,set,del,'-',refresh,column]
  });
  panel.on('render',function(){
    if(initValues){
      redoLayout(initValues,'load');
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
  }else{
    return false
  }
}
function menuItem(value,group){
  var item = new Ext.menu.Item({
    handler:function(item){
      if(group == 'get'){
        loadLayout(value);
      }else if(group == 'set'){
        saveLayout(value);
      }else if(group == 'del'){
        deleteLayout(value);
      }
    },
    text:value
  });
  return item
}
function createMenu(mode,init){
  var menu = new Ext.menu.Menu();
  if(init){
    if(init.layoutNames){
      var layouts = init.layoutNames;
      if(layouts.length > 0){
        layouts = layouts.split(';');
      }
    }
  }
  if(mode == 'set'){
    menu.addItem(new Ext.menu.Item({handler:function(){saveAs()},icon:gURLRoot + '/images/iface/save.gif',text:'Save as new'}));
    if(layouts){
      menu.addItem(new Ext.menu.Separator());
    }
  }
  if(mode == 'get'){
    menu.addItem(new Ext.menu.Item({handler:function(){syncLayout()},icon:gURLRoot + '/images/iface/reschedule.gif',text:'Synchronize Menues'}));
    if(layouts){
      menu.addItem(new Ext.menu.Separator());
    }
  }
  if(layouts){
    var length = layouts.length;
    for(var i=0; i<length; i++){
      if(layouts[i].length > 0){
        tmp = menuItem(layouts[i],mode);
        menu.addItem(tmp);
      }
    }
  }
  if(mode == 'del'){
    if(layouts){
      menu.addItem(new Ext.menu.Separator());
    }
    menu.addItem(new Ext.menu.Item({handler:function(){deleteAll()},icon:gURLRoot + '/images/iface/close.gif',text:'Delete All'}));
  }
  return menu
}
function resetMenu(value){
  var id = ['getLayoutButton','setLayoutButton','delLayoutButton'];
  for(var i=0; i<id.length; i++ ){
    try{
      var button = Ext.getCmp(id[i]);
      if(button){
        var menu = createMenu(id[i].slice(0,3),value);
      }
      if(button && menu){
        button.menu = menu;
      }
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message);
      return
    }
  }
}
function refreshCycle(){
  try{
    var mainPanel = Ext.getCmp('mainConteiner');
    var length = mainPanel.items.getCount();
    for(var i=0; i<length; i++){
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
  var mainPanel = Ext.getCmp('mainConteiner');
  try{
    columnWidth = width;
    var length = mainPanel.items.getCount();
    for(var i=0; i<length; i++){
      var tmp = mainPanel.getComponent(i);
      tmp.columnWidth = width;
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  try{
    mainPanel.doLayout();
  }catch(e){}
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
}
function changeIcon(id,state){
  var button = Ext.getCmp(id);
  var class = '';
  if(id == 'getLayoutButton' && state == 'load'){
    class = 'Loading';
  }else if(id == 'getLayoutButton' && state == 'normal'){
    class = 'Restore';
  }else if(id == 'setLayoutButton' && state == 'load'){
    class = 'Loading';
  }else if(id == 'setLayoutButton' && state == 'normal'){
    class = 'Save';
  }else if(id == 'delLayoutButton' && state == 'load'){
    class = 'Loading';
  }else if(id == 'delLayoutButton' && state == 'normal'){
    class = 'Delete';
  }
  try{
    if(state == 'load'){
      button.disable();
    }else{
      button.enable();
    }
    button.setIconClass(class);
  }catch(e){}
}
function gatherInfo(){
  var url = '';
  try{
    var mainPanel = Ext.getCmp('mainConteiner');
    var length = mainPanel.items.getCount();
    for(var i=0; i<length; i++){
      if(mainPanel.getComponent(i).id != 'welcomeMessage'){
        url = url + mainPanel.getComponent(i).autoEl.src + ';';
      }
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  var params = {'columns':columnWidth,'refresh':refreshRate,'plots':url};  
  return params
}
function syncLayout(){
  changeIcon('getLayoutButton','load');
  Ext.Ajax.request({
    failure:function(response){
      changeIcon('getLayoutButton','normal');
      AJAXerror(response.responseText);
      return false
    },
    method:'POST',
    params:{'getBookmarks':''},
    success:function(response){
      changeIcon('getLayoutButton','normal');
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        AJAXerror(response.responseText);
        return false
      }else{
        redoLayout(jsonData['result'],'sync');
      }
    },
    url:'action'
  });
}
function saveAs(){
  var params = gatherInfo();
  var title = 'Save Layout';
  var welcome = Ext.getCmp('welcomeMessage');
  if(welcome){
    Ext.Msg.alert(title,'This is the default layout and can not be saved')
  }else{
    var msg = 'Enter the name of the new layout: ';
    Ext.Msg.prompt(title,msg,function(btn,text){
      if(btn == 'ok'){
        if(text){
          params['setBookmarks'] = text;
          changeIcon('setLayoutButton','load');
          Ext.Ajax.request({
            failure:function(response){
              changeIcon('setLayoutButton','normal');
              AJAXerror(response.responseText);
              return false
            },
            method:'POST',
            params:params,
            success:function(response){
              changeIcon('setLayoutButton','normal');
              var jsonData = Ext.util.JSON.decode(response.responseText);
              if(jsonData['success'] == 'false'){
                AJAXerror(response.responseText);
                return false
              }else{
                redoLayout(jsonData['result'],'save');
                var mainPanel = Ext.getCmp('mainConteiner');
                if(mainPanel){
                  mainPanel.doLayout();
                }
              }
            },
            url:'action'
          });
        }
      }
    });
  }
}
function saveLayout(name){
  var params = gatherInfo();
  params['setBookmarks'] = name;
  var title = 'Save Layout';
  var welcome = Ext.getCmp('welcomeMessage');
  if(welcome){
    Ext.Msg.alert(title,'This is the default layout and can not be saved')
  }else{
    var msg = 'Save current layout to: ' + name + ' ?';
    Ext.Msg.confirm(title,msg,function(btn){
      if(btn == 'yes'){
        changeIcon('setLayoutButton','load');
        Ext.Ajax.request({
          failure:function(response){
            changeIcon('setLayoutButton','normal');
            AJAXerror(response.responseText);
            return false
          },
          method:'POST',
          params:params,
          success:function(response){
            changeIcon('setLayoutButton','normal');
            var jsonData = Ext.util.JSON.decode(response.responseText);
            if(jsonData['success'] == 'false'){
              AJAXerror(response.responseText);
              return false
            }else{
              redoLayout(jsonData['result'],'save');
              var mainPanel = Ext.getCmp('mainConteiner');
              if(mainPanel){
                mainPanel.doLayout();
              }
            }
          },
          url:'action'
        });
      }
    });
  }
}
function loadLayout(name){
  var title = 'Load Layout';
  try{
    var button = Ext.getCmp('getLayoutButton');
    var length = button.menu.items.getCount();
    if(length <= 0){
      Ext.Msg.alert(title,'Seems you do not have any layout to load');
      return;
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  var msg = 'Load the layout: ' + name + ' ?';
  Ext.Msg.confirm(title,msg,function(btn){
    if(btn == 'yes'){
      changeIcon('getLayoutButton','load');
      Ext.Ajax.request({
        failure:function(response){
          changeIcon('getLayoutButton','normal');
          AJAXerror(response.responseText);
          return false
        },
        method:'POST',
        params:{'getBookmarks':name},
        success:function(response){
          changeIcon('getLayoutButton','normal');
         var jsonData = Ext.util.JSON.decode(response.responseText);
          if(jsonData['success'] == 'false'){
            AJAXerror(response.responseText);
            return false
          }else{
            redoLayout(jsonData['result'],'load');
            var mainPanel = Ext.getCmp('mainConteiner');
            if(mainPanel){
              mainPanel.doLayout();
            }
          }
        },
        url:'action'
      });
    }
  });
}
function deleteAll(){
  var title = 'Delete Layout';
  var msg = 'Do you really want to delete all layouts stored at remote service?';
  Ext.Msg.confirm(title,msg,function(btn){
    if(btn == 'yes'){
      msg = 'Are you sure?'
      Ext.Msg.confirm(title,msg,function(btn){
        if(btn == 'yes'){
          changeIcon('delLayoutButton','load');
          Ext.Ajax.request({
            failure:function(response){
              changeIcon('delLayoutButton','normal');
              AJAXerror(response.responseText);
              return false
            },
            method:'POST',
            params:{'delAllBookmarks':true},
            success:function(response){
              changeIcon('delLayoutButton','normal');
              var jsonData = Ext.util.JSON.decode(response.responseText);
              if(jsonData['success'] == 'false'){
                AJAXerror(response.responseText);
                return false
              }else{
                redoLayout(jsonData['result'],'del');
                var mainPanel = Ext.getCmp('mainConteiner');
                if(mainPanel){
                  mainPanel.doLayout();
                }
              }
            },
            url:'action'
          });
        }
      });
    }
  });
}
function deleteLayout(name){
  var title = 'Delete Layout';
  if(name == layout){
    try{
      var button = Ext.getCmp('delLayoutButton');
      var length = button.menu.items.getCount();
      if(length > 1){
        layout = button.menu.items.items[0].text;
      }else{
        layout = '';
      }
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message);
      return
    }
  }
  var msg = 'Do you really want to delete layout: ' + name + ' ?';
  Ext.Msg.confirm(title,msg,function(btn){
    if(btn == 'yes'){
      changeIcon('delLayoutButton','load');
      Ext.Ajax.request({
        failure:function(response){
          changeIcon('delLayoutButton','normal');
          AJAXerror(response.responseText);
          return false
        },
        method:'POST',
        params:{'delBookmarks':name,'defaultLayout':layout},
        success:function(response){
          changeIcon('delLayoutButton','normal');
          var jsonData = Ext.util.JSON.decode(response.responseText);
          if(jsonData['success'] == 'false'){
            AJAXerror(response.responseText);
            return false
          }else{
            redoLayout(jsonData['result'],'del');
            var mainPanel = Ext.getCmp('mainConteiner');
            if(mainPanel){
              mainPanel.doLayout();
            }
          }
        },
        url:'action'
      });
    }
  });
}
function redoLayout(result,mode){
// ToDo set some kind of check here
  if(!result){
    return
  }
  resetMenu(result);
  if(mode == 'sync'){
    return // just to update the menues
  }
  if(result.defaultLayout){
    layout = result.defaultLayout;
  }else{
    layout = 'default';
  }
  var mainPanel = Ext.getCmp('mainConteiner');
  var current = Ext.getCmp('currentID');
  if(current){
    current.setText('Current Layout: <b>' + layout + '</b>');
  }
  if(result.layouts){
    for(var i in result.layouts){
      if(i == layout){
        var plots = result.layouts[i]['url'].split(';');
        columnWidth = result.layouts[i]['columns'];
        refreshRate = result.layouts[i]['refresh'];
      }
    }
    if(plots && mainPanel){
      try{
        var length = mainPanel.items.getCount() - 1;
        for(i=length; i>=0; i--){
          var tmp = mainPanel.getComponent(i);
          mainPanel.remove(tmp,true);
        }
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
      if(plots.length > 0){
        for(i=0; i<plots.length; i++){
          if(plots[i].length > 0){
            mainPanel.add(createPanel(plots[i]));
          }
        }
      }
    }
  }
  var button = Ext.getCmp('refreshSplitButton');
  try{
    if(refreshRate == 0){
      button.menu.items.items[0].setChecked(true);
    }else if(refreshRate == 900000){
      button.menu.items.items[1].setChecked(true);
    }else if(refreshRate == 3600000){
      button.menu.items.items[2].setChecked(true);
    }else if(refreshRate == 86400000){
      button.menu.items.items[3].setChecked(true);
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  button = Ext.getCmp('columnSplitButton');
  try{
    if(columnWidth == '.98'){
      button.menu.items.items[0].setChecked(true);
    }else if(columnWidth == '.49'){
      button.menu.items.items[1].setChecked(true);
    }else if(columnWidth == '.24'){
      button.menu.items.items[3].setChecked(true);
    }else if(columnWidth == '.19'){
      button.menu.items.items[4].setChecked(true);
    }else if(columnWidth == '.33'){
      button.menu.items.items[2].setChecked(true);
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
}
function fullSize(link){
  var html = '<img src="' + link + '" />';
  var win = new Ext.Window({
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    html:html,
    layout:'fit',
    minHeight:200,
    minWidth:320,
    title:'Actual size'
  });
  win.show();
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
            fullSize(img);
          },
//          icon:gURLRoot + '/images/iface/close.gif',
          text:'Actual size'
        },{
          handler:function(){
            window.open(img)
          },
//          icon:gURLRoot + '/images/iface/close.gif',
          text:'Open in new window'
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
function AJAXerror(response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
  try{
    var jsonData = Ext.util.JSON.decode(response);
    if(jsonData['success'] == 'false'){
      alert('Error: ' + jsonData['error']);
      return;
    }else{
      alert('data: ' + jsonData.toSource() + '\nError: Server response has wrong data structure');
      return;
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
}
