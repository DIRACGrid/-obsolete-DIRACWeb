var columnWidth = '.33'; // 3 Columns per page
var refreshRate = 0; // autorefresh is off
var refeshID = 0;
var layout = 'default';
var heartbeat = '';
var contextMenu = '';
function initLoop(initValues){
  Ext.onReady(function(){
    if(window.location.hash){
      var test = window.location.hash.split('#layout=');
      if(test.length == 2 && initValues){
        initValues.defaultLayout = test[1];
      }
    }
    var mainContent = mainPanel(initValues);
    renderInMainViewport([ mainContent ]);
  });
}
function mainPanel(initValues){
  heartbeat = new Ext.util.TaskRunner();
  contextMenu = new Ext.menu.Menu();
  var current = {
    disabled:true,
    disabledClass:'my-disabled',
    id:'currentID',
    text:'Current Layout: <b>' + layout + '</b>'
  };
  var timeStamp = {
    disabled:true,
    disabledClass:'my-disabled',
    hidden:true,
    id:'timeStamp',
    text:'Updated: '
  }; 
  var add = {
    cls:"x-btn-text-icon",
    handler:function(){
      addPanel();
    },
    iconCls:'Add',
    tooltip:'Some wise tooltip here',
    text:'Add'
  };
  var set = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'Save',
    id:'setLayoutButton',
    menu:createMenu('set',initValues),
    tooltip:'Read your current layout and save it on the server',
    text:'Save'
  });
  var get = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'Restore',
    id:'getLayoutButton',
    menu:createMenu('get',initValues),
    tooltip:'Download your saved layout and apply it',
    text:'Load'
  });
  var act = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'Act',
    id:'actLayoutButton',
    menu:[
      {handler:function(){exportLayout();},icon:gURLRoot + '/images/iface/export.gif',text:'Export'},
      {handler:function(){importLayout()},icon:gURLRoot + '/images/iface/import.gif',text:'Import'},
      {handler:function(){deleteLayout()},icon:gURLRoot + '/images/iface/close.gif',text:'Delete'},
      {handler:function(){deleteLayout('All')},icon:gURLRoot + '/images/iface/delete.gif',text:'Delete All'}
    ],
    tooltip:'',
    text:'Actions'
  });
  var column = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    iconCls:'columnSplitButton',
    id:'columnSplitButton',
    menu:[
      {checked:setChk('.98'),checkHandler:function(){setColumn('.98');},group:'column',text:'1 Column'},
      {checked:setChk('.49'),checkHandler:function(){setColumn('.49');},group:'column',text:'2 Columns'},
      {checked:setChk('.33'),checkHandler:function(){setColumn('.33');},group:'column',text:'3 Columns'},
      {checked:setChk('.24'),checkHandler:function(){setColumn('.24');},group:'column',text:'4 Columns'},
      {checked:setChk('.19'),checkHandler:function(){setColumn('.19');},group:'column',text:'5 Columns'}
    ],
    text:'Columns',
    tooltip:'Click to change number of columns'
  });
/*
  var refresh = new Ext.SplitButton({
    cls:"x-btn-text-icon",
    handler:function(){
      refreshCycle();
    },
    iconCls:'refreshSplitButton',
    id:'refreshSplitButton',
    menu:new Ext.menu.Menu({items:[
      {checked:setChk(0),checkHandler:function(){refreshYO(0,true);},group:'refresh',text:'Disabled'},
      {checked:setChk(900000),checkHandler:function(){refreshYO(900000,true,'Each 15m');},group:'refresh',text:'Each 15m'},
      {checked:setChk(3600000),checkHandler:function(){refreshYO(3600000,true,'Each Hour');},group:'refresh',text:'Each Hour'},
      {checked:setChk(86400000),checkHandler:function(){refreshYO(86400000,true,'Each Day');},group:'refresh',text:'Each Day'}
    ]}),
    text:'Refresh',
    tooltip:'Click the button for manual refresh. Set autorefresh rate in the button menu',
  }); 
*/
  var refresh = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      refreshCycle();
    },
    iconCls:'Refresh',
    text:'Refresh',
    tooltip:'Click the button for manual refresh.'
  });
  var auto = new Ext.Toolbar.Button({
    cls:"x-btn-text",
    id:'autoButton',
    menu:new Ext.menu.Menu({items:[
      {checked:setChk(0),checkHandler:function(){refreshYO(0,true);},group:'refresh',text:'Disabled'},
      {checked:setChk(900000),checkHandler:function(){refreshYO(900000,true,'Each 15m');},group:'refresh',text:'15 Minutes'},
      {checked:setChk(3600000),checkHandler:function(){refreshYO(3600000,true,'Each Hour');},group:'refresh',text:'One Hour'},
      {checked:setChk(86400000),checkHandler:function(){refreshYO(86400000,true,'Each Day');},group:'refresh',text:'One Day'},
    ]}),
    text:'Disabled',
    tooltip:'Click to set the time for autorefresh'
  });
  auto.on('menuhide',function(button,menu){
    var length = menu.items.getCount();
    for(var i = 0; i < length; i++){
      if(menu.items.items[i].checked){
        button.setText(menu.items.items[i].text);
      }
    }
  });
  var panel = new Ext.Panel({
    autoScroll:true,
    bodyStyle:'padding:5px;',
    defaults: {
      bodyStyle:'padding:5px'
    },
    id:'mainConteiner',
    items:[newLayout()],
    layout:'column',
    margins:'2 0 2 0',
    monitorResize:true,
    region:'center',
    tbar:[current,'->',refresh,'-','Auto:',auto,timeStamp]
//    tbar:[current,'->',add,'-',get,set,act,'-',refresh,'-','Auto:',auto,timeStamp,'-',column]
  });
  panel.on('render',function(){
    addMenu();
    if(initValues){
      redoLayout(initValues,'load');
    }
  });
  return panel
}
///////////////////////////////////////////////////////
function refreshYO(delay,start,text){
  if(refeshID != 0){
    clearTimeout(refeshID);
  }
  if(delay == 0){
    clearTimeout(refeshID);
  }else{
    if(!start){
      refreshCycle();
    }
    start = false;
    refeshID = setTimeout('refreshYO(' + delay + ',false)',delay);
  }
}
function changedFlag(){
  var current = Ext.getCmp('currentID');
  if(current){
    current.setText('Current Layout: <b>' + layout + '*</b>');
  }
  document.title = layout + '*';
}
function newLayout(){
  var html = '<br><center><h1>Information Presenter</h1></center><br><p>With this page you can build your own collection of monitoring tools.';
  html = html + 'Currently only plots can be presented in a grid like layout. The layouts can be saved in the User Profile and recalled back.';
  html = html + ' You can define as many layouts as you need.</p><br>';
  html = html + '<h1>Managing layouts</h1><br><h3>Adding image</h3><p>To start with, press <b>Add</b> button and enter an image URL in the <i>Path</i> field.';
  html = html + 'You can enter any URL of a plot not only the DIRAC accounting plots. The image will be added to the layout.';
  html = html + ' The number of columns of the layout grid can be chosen with the <b>Columns</b> selector.</p>';
  html = html + '<br><h3>Removing image</h3><p>To remove an image do mouse right click on it and select <i>Remove</i> in the drop-down menu.</p>';
  html = html + '<br><h3>Saving layout</h3><p>You can always save the current layout on the server side by clicking ';
  html = html + '<b>Save</b> -&gt; <b>Save as new</b> button.</p><br><h3>Loading layout</h3>';
  html = html + '<p>If you want to load layout or to discard the changes, just click the <b>Load</b> button and select layout to restore</p>';
  html = html + '<br><h3>Exporting and importing layouts</h3><p>If you want to share your layout with others, you can choose ';
  html = html + '<b>Actions</b> -&gt; <b>Export</b> menu item and copy the layout description from a pop-up panel as a long string.';
  html = html + ' This string can now be sent to other users. To use it, choose <b>Actions</b> -&gt; <b>Import</b>';
  html = html + ' and paste the layout description.</p><center>';

  html = html + '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/TSY4y-Qr_LM&hl=en&fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/TSY4y-Qr_LM&hl=en&fs=1"type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="425" height="344"></embed></object>';
  html = html + '</center>';
  var message = {
    anchor:'100%',
    fieldLabel:'Tip',
    columnWidth:.99,
    html:html,
    id:'welcomeMessage',
    xtype:'label'
  };
  return message
}
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
  return menu
}
function resetMenu(value){
  var id = ['getLayoutButton','setLayoutButton'];
  for(var i=0; i<id.length; i++ ){
    try{
      var button = Ext.getCmp(id[i]);
      if(button){
        var tmpMenu = createMenu(id[i].slice(0,3),value);
      }
      if(button && tmpMenu){
        button.menu.removeAll();
        var length = tmpMenu.items.getCount();
        for(var j=0; j<length; j++){
          button.menu.add(tmpMenu.items.items[j]);
        }
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
        var tmpSrc = j.autoEl.src;
        if(tmpSrc.search(/&dummythingforrefresh/i) > 0){
          tmpSrc = tmpSrc.split('&dummythingforrefresh')[0];
          tmpSrc = tmpSrc + '&dummythingforrefresh=' + Ext.id() + '_' + Math.floor(Math.random()*101);
        }else{
          tmpSrc = tmpSrc + '&dummythingforrefresh=' + Ext.id() + '_' + Math.floor(Math.random()*101);
        }
        var tmp = createPanel(tmpSrc);
        mainPanel.remove(i);
        mainPanel.insert(i,tmp);
        mainPanel.doLayout();
        updateTimestamp();
      }
    }
//    mainPanel.doLayout();
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
function changeIcon(id,state){
  if(id == 'del'){
    id = 'actLayoutButton';
  }
  var button = Ext.getCmp(id);
  var btnClass = 0;
  if(id == 'getLayoutButton' && state == 'load'){
    btnClass = 'Loading';
  }else if(id == 'getLayoutButton' && state == 'normal'){
    btnClass = 'Restore';
  }else if(id == 'setLayoutButton' && state == 'load'){
    btnClass = 'Loading';
  }else if(id == 'setLayoutButton' && state == 'normal'){
    btnClass = 'Save';
  }else if(id == 'actLayoutButton' && state == 'load'){
    btnClass = 'Loading';
  }else if(id == 'actLayoutButton' && state == 'normal'){
    btnClass = 'Act';
  }
  try{
    if(state == 'load'){
      button.disable();
    }else{
      button.enable();
    }
    button.setIconClass(btnClass);
  }catch(e){}
}
function gatherInfo(){
  var url = '';
  try{
    var mainPanel = Ext.getCmp('mainConteiner');
    var length = mainPanel.items.getCount();
    for(var i=0; i<length; i++){
      if(mainPanel.getComponent(i).id != 'welcomeMessage'){
        var tmpSrc = mainPanel.getComponent(i).autoEl.src;
        if(tmpSrc.search(/&dummythingforrefresh/i) > 0){
          tmpSrc = tmpSrc.split('&dummythingforrefresh')[0];
        }
        url = url + tmpSrc + ';';
      }
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
  if(url){
    url = url.replace(/&/g,'[ampersand]');
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
function loadProfile(name,user){
  var title = 'Load Data';
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
  var msg = 'Are you sure that you want to load \'' + layout + '\' data?';
  msg = msg + '<br>' + 'Caution. All unsaved data will be lost';
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
// change icon 'delLayoutButton'
function deleteLayout(mode){
  var title = 'Delete Layout';
  if(mode == 'All'){
    var msg = 'Do you really want to delete all layouts stored at remote service?';
    var params = {'delAllBookmarks':true};
  }else{
    var msg = 'Do you really want to delete layout: ' + layout + ' ?';
    var params = {'delBookmarks':layout};
  }
  Ext.Msg.confirm(title,msg,function(btn){
    if(btn == 'yes'){
      if(mode == 'All'){
        Ext.Msg.confirm(title,'Are you sure?',function(btn){
          if(btn == 'yes'){
            changeIcon('del','load');
            action(params,'del');
          }
        });
      }else{
        changeIcon('del','load');
        action(params,'del');
      }
    }
  });
}
function action(params,mode){
  Ext.Ajax.request({
    failure:function(response){
      changeIcon(mode,'normal');
      AJAXerror(response.responseText);
      return false
    },
    method:'POST',
    params:params,
    success:function(response){
      changeIcon(mode,'normal');
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        AJAXerror(response.responseText);
        return false
      }else{
        redoLayout(jsonData['result'],mode);
        var mainPanel = Ext.getCmp('mainConteiner');
        if(mainPanel){
          mainPanel.doLayout();
        }
      }
    },
    url:'action'
  });
}
function exportLayout(){
  var finalStr = '';
  var layoutObj = {};
  layoutObj = gatherInfo();
  for(var i in layoutObj){
    finalStr = finalStr + i + ' is equal ' + layoutObj[i] + '&';
  }
  finalStr = finalStr.replace(/;$/,"");
  Ext.Msg.alert('Export',finalStr);
}
function importLayout(){
  Ext.Msg.prompt('Import', 'Please enter the layout definition:',function(btn,text){
    if(btn == 'ok'){
      if(text){
        var finalObj = new Object;
        text = text.replace(/\n/g,'');
        var layoutObj = text.split('&');
        for(var i=0; i<layoutObj.length; i++){
          layoutObj[i] = layoutObj[i].replace(/\[ampersand\]/g,'&');
          var tmp = layoutObj[i].split(' is equal ');
          if(tmp.length == 2){
            finalObj[tmp[0]] = tmp[1];
          }
        }
        if(!finalObj.plots || !finalObj.columns || !finalObj.refresh){
          alert('Error: The format of imported data is not valid');
          return
        }else{
          redoLayout(finalObj,'import');
          var mainPanel = Ext.getCmp('mainConteiner');
          if(mainPanel){
            mainPanel.doLayout();
          }
        }
      }  
    }
  },this,true);
}
function updateTimestamp(){
  var stamp = Ext.getCmp('timeStamp');
  if(stamp){
    var d = new Date();
    var hh = d.getHours();
    if(hh < 10){
      hh = '0' + hh;
    }
    var mm = d.getMinutes()
    if(mm < 10){
      mm = '0' + mm;
    }
    stamp.setText('Updated: ' + hh + ":" + mm);
    stamp.show();
  }
}
function redoLayout(result,mode){
// ToDo set some kind of check here
  if(!result){
    return
  }
  if(mode != 'import'){
    resetMenu(result);
  }
  if(mode == 'sync'){
    return // just to update the menues
  }
  if(result.defaultLayout){
    if(result.defaultLayout == ''){
      layout = 'default';
    }else{
      layout = result.defaultLayout;
    }
  }else if(mode == 'import'){
    layout = layout + '*';
  }else{
    layout = 'default';
  }
  window.location.hash = 'layout=' + layout;
  var current = Ext.getCmp('currentID');
  if(current){
    current.setText('Current Layout: <b>' + layout + '</b>');
    document.title = layout;
  }
  updateTimestamp();
  if(result.layouts){
    for(var i in result.layouts){
      if(i == layout){
        var plotSrc = result.layouts[i]['url'];
        plotSrc = plotSrc.replace(/\[ampersand\]/g,'&');
        var plots = plotSrc.split(';');
        for(var j = 0; j < plots.length; j++){
          if(plots[j].search(/&dummythingforrefresh/i) > 0){
            plots[j] = plots[j].split('&dummythingforrefresh')[0];
          }
        }
        columnWidth = result.layouts[i]['columns'];
        refreshRate = result.layouts[i]['refresh'];
      }
    }
  }else if(mode == 'import'){
    if(result.plots){
      var plots = result.plots.split(';');
    }
  }
  var mainPanel = Ext.getCmp('mainConteiner');
  if(mainPanel){
      try{
        if(plots){
          var length = mainPanel.items.getCount() - 1;
          for(i=length; i>=0; i--){
            var tmp = mainPanel.getComponent(i);
            mainPanel.remove(tmp,true);
          }
          if(plots.length > 0){
            for(i=0; i<plots.length; i++){
              if(plots[i].length > 0){
                mainPanel.add(createPanel(plots[i]));
              }
            }
          }
        }else{
          var length = mainPanel.items.getCount() - 1;
          for(i=length; i>=0; i--){
            var tmp = mainPanel.getComponent(i);
            mainPanel.remove(tmp,true);
          }
          mainPanel.add(newLayout());
        }
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
  }
  var button = Ext.getCmp('autoButton');
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
      style:'cursor:pointer;cursor:hand;',
      src:img
    },
    columnWidth:columnWidth,
    cls:'pointer',
    id:boxID
  });
  box.on('render',function(){
    box.el.on('click', function(evt,div,x,y,z) {
      fullSize(img);
    });
    box.el.on('contextmenu', function(evt,div,x,y,z) {
      evt.stopEvent();
      contextMenu.removeAll();
      contextMenu.add({
          disabled:true,
          handler:function(){
            return
          },
          icon:gURLRoot + '/images/iface/edit.gif',
          text:'Edit'
        },{
          handler:function(){
            var mainPanel = Ext.getCmp('mainConteiner');
            mainPanel.remove(box);
            var current = Ext.getCmp('currentID');
            if(current){
              current.setText('Current Layout: <b>' + layout + '*</b>');
            }
          },
          icon:gURLRoot + '/images/iface/close.gif',
          text:'Remove'
        },{
          handler:function(){
            window.open(img)
          },
          icon:gURLRoot + '/images/iface/new-window.gif',
          text:'Open in new window'
        },{
          handler:function(){
            changeURL(boxID,img);
          },
          icon:gURLRoot + '/images/iface/edit.gif',
          text:'Change URL'
        },{
          handler:function(){
            if(img.search(/&dummythingforrefresh/i) > 0){
              img = img.split('&dummythingforrefresh')[0];
            }
            Ext.Msg.alert('Show URL',img);
          },
          icon:gURLRoot + '/images/iface/url.gif',
          text:'Show URL'
        });
      contextMenu.showAt(evt.xy);
    });
  });
  return box
}
function createTable(){
  function status(value){
  if((value == 'Done')||(value == 'Completed')||(value == 'Good')||(value == 'Active')||(value == 'Cleared')){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if((value == 'Failed')||(value == 'Bad')||(value == 'Banned')||(value == 'Aborted')){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else if((value == 'Waiting')||(value == 'Stopped')||(value == 'Poor')||(value == 'Probing')){
    return '<img src="'+gURLRoot+'/images/monitoring/waiting.gif">';
  }else if(value == 'Deleted'){
    return '<img src="'+gURLRoot+'/images/monitoring/deleted.gif">';
  }else if(value == 'Matched'){
    return '<img src="'+gURLRoot+'/images/monitoring/matched.gif">';
  }else if((value == 'Running')||(value == 'Active')||(value == 'Fair')){
    return '<img src="'+gURLRoot+'/images/monitoring/running.gif">';
  }else if(value == 'NoMask'){
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }else{
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }
  }
  var reader = new Ext.data.ArrayReader({},[
    {name:'Status'},
    {name:'Number'}
  ]);
  var columns = [
    {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
    {header:'Status',width:60,sortable:true,dataIndex:'Status',align:'left'},
    {header:'Numbers',sortable:true,dataIndex:'Number',align:'left'}
  ];
  var store = new Ext.data.Store({
    autoLoad:{params:{globalStat:'true'}},
    proxy: new Ext.data.HttpProxy({
      url:'https://lhcbtest.pic.es/DIRAC/LHCb-Production/diracAdmin/jobs/JobMonitor/action',
      method:'POST',
    }),
    reader:reader
  });
  var grid = new Ext.grid.GridPanel({
    columns:columns,
    header:false,
    loadMask:true,
    store:store,
    stripeRows:true,
    viewConfig:{forceFit:true}
  });
  return grid
}
function changeURL(id,url){
  var winID = Ext.id();
  var pathID = Ext.id();
  var changeValue = ''
  if((url)||(url != null)||(url != '')){
    changeValue = url;
  }
  var change = new Ext.Button({
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
        alert('Textarea is empty, please input url ther')
        return
      }
      try{
        var box = Ext.getCmp(id);
        var mainPanel = Ext.getCmp('mainConteiner');
        var index = mainPanel.items.indexOf(box);
        var newPanel = createPanel(path);
        mainPanel.remove(box);
        mainPanel.insert(index,newPanel);
        mainPanel.doLayout();
        var current = Ext.getCmp('currentID');
        if(current){
          current.setText('Current Layout: <b>' + layout + '*</b>');
        }
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
    icon:gURLRoot+'/images/iface/edit.gif',
    minWidth:'150',
    tooltip:'',
    text:'Change URL'
  });
  var cancel = new Ext.Button({
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
  });
  var textarea = new Ext.form.TextArea({
    allowBlank:false,
    anchor:'100%',
    allowBlank:true,
    id:pathID,
    enableKeyEvents:true,
    fieldLabel:'Path',
    selectOnFocus:true,
    value:changeValue
  });
  var win = new Ext.Window({
    buttonAlign:'center',
    buttons:[change,cancel],
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    height:200,
    id:winID,
    items:textarea,
    layout:'fit',
    maximizable:false,
    minHeight:200,
    minWidth:320,
    title:'Create panel',
    width:320
  });
  win.on('resize',function(panel){
    newHeight = panel.getInnerHeight() - 10;
    var path = Ext.getCmp(pathID);
    path.setHeight(newHeight);
  })

  win.show();
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
          var current = Ext.getCmp('currentID');
          if(current){
            current.setText('Current Layout: <b>' + layout + '*</b>');
          }
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
/*
    },{
      cls:"x-btn-text-icon",
      handler:function(){
        try{
          var tmpPanel = createTable();
          var mainPanel = Ext.getCmp('mainConteiner');
          var newWidth = Math.round((mainPanel.getInnerWidth() - 30)/3);
          mainPanel.add(tmpPanel);
          mainPanel.doLayout();
          tmpPanel.setWidth(newWidth);
          tmpPanel.setHeight(newWidth);
          var current = Ext.getCmp('currentID');
          if(current){
            current.setText('Current Layout: <b>' + layout + '*</b>');
          }
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
      minWidth:'50',
      tooltip:' ',
      text:'Add Table'
*/
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
      html:'In the Path text field you can put any URL of an image. ',
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
function addMenu(){
  var menu = new Ext.menu.Menu({
    items:[
      {handler:function(){addPanel()},icon:gURLRoot + '/images/iface/advanced.gif',text:'Add'},
      {menu:{items:[
        {checked:setChk('.98'),checkHandler:function(){setColumn('.98');},group:'column',text:'1 Column'},
        {checked:setChk('.49'),checkHandler:function(){setColumn('.49');},group:'column',text:'2 Columns'},
        {checked:setChk('.33'),checkHandler:function(){setColumn('.33');},group:'column',text:'3 Columns'},
        {checked:setChk('.24'),checkHandler:function(){setColumn('.24');},group:'column',text:'4 Columns'},
        {checked:setChk('.19'),checkHandler:function(){setColumn('.19');},group:'column',text:'5 Columns'}
      ]},text:'Columns',icon:gURLRoot + '/images/iface/columns.gif'}
      ,'-'
    ]
  });
  var button = Ext.getCmp('mainTopbarToolsButton');
  if(button){
    var originalMenu = button.menu;
    var length = menu.items.items.length;
    for(i=0; i<length; i++){
      originalMenu.insert(i,menu.items.items[i]);
    }
    var originalMenu = button.menu;
    originalMenu.add(menu);
    button.menu = originalMenu;
  }
}
function UP(mode,name){
  if(mode == 'saveNew'){
    saveAs();
  }else if(mode == 'save'){
	if(name){
	  saveLayout(name);
	}else{
	  alert('Error: name is absent');
	  return
	}
  }else if(mode == 'import'){
	  
  }else if(mode == 'edit'){
    return layout
  }else if(mode == 'delete'){
	  
  }else if(mode == 'deleteAll'){
	  
  }else if(mode == 'load'){
	  
  }else{
	alert('Error: Available');  
  }
}