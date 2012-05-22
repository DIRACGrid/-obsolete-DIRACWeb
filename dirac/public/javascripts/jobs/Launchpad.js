/**
* Convert number of bytes into human readable format
*
* @param integer bytes     Number of bytes to convert
* @param integer precision Number of digits after the decimal separator
* @return string
*/
function bytesToSize(bytes, precision){  
  var kilobyte = 1024;
  var megabyte = kilobyte * 1024;
  var gigabyte = megabyte * 1024;
  var terabyte = gigabyte * 1024;
  if ((bytes >= 0) && (bytes < kilobyte)) {
    return bytes + ' B';
  } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
    return (bytes / kilobyte).toFixed(precision) + ' KB';
  } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
    return (bytes / megabyte).toFixed(precision) + ' MB';
  } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
    return (bytes / gigabyte).toFixed(precision) + ' GB';
  } else if (bytes >= terabyte) {
    return (bytes / terabyte).toFixed(precision) + ' TB';
  } else {
    return bytes + ' B';
  }
}
function loadLaunchpadOpts(options){
  for(var i in options){
    var ss = options[i];
    var tt = 0;
  }
}
function submitJobNew(){
  var formID = Ext.id(); // from panel
  var innID =  Ext.id(); // For JDL and Sandboxescontainer
  var jdlID = Ext.id();
  var fileID = Ext.id();
  var lfnID = Ext.id();
  var winID = Ext.id();
  var addID = Ext.id();
  var fileAnchor = 45;
  var fieldAnchor = '-5';
  var data = [ // Array of default key\value pairs
    ['InputData',''],
    ['OutputData',''],
    ['OutputSE','DIRAC-USER'],
    ['OutputPath',''],
    ['CPUTime','86400'],
    ['Site',''],
    ['BannedSite',''],
    ['SystemConfig','slc4_ia32_gcc34'],
    ['Priority','5'],
    ['StdError','std.err'],
    ['StdOutput','std.out'],
    ['Parameters','0'],
    ['ParameterStart','0'],
    ['ParameterStep','1']
  ];
// check for proxy
  var proxyCheckerFunction = function(){
    showProxyStat('check');
    Ext.Ajax.request({
      failure:function(response){
        AJAXerror(response.responseText);
        showProxyStat('neutral');
        return false
      },
      method:'POST',
      params:{'getProxyStatus':true},
      success:function(response){
        var jsonData = Ext.util.JSON.decode(response.responseText);
        if(jsonData['success'] == 'false'){
          showProxyStat('false');
          return false
        }else{
          if(jsonData['result'] == 'false'){
            showProxyStat('false');
            return false
          }else{
            showProxyStat('true');
            return true
          }
        }
      },
      url:'action'
    });
  };
// Periodic check for a user proxy
  var heartbeat = {
    run:proxyCheckerFunction,
    interval:3600*1000 // 1 hour
  };
  Ext.TaskMgr.start(heartbeat);
// Returns proxy button
  function proxyButton(mode){
    var msg = 'Proxy Status: ';
    if(mode == 'true'){
      msg = msg + '<span style="color:#009900; font-weight:bold">Valid</span>';
    }else if(mode == 'false'){
      msg = msg + '<span style="color:#FF0000; font-weight:bold">Not Valid</span>';
    }else if(mode == 'check'){
      msg = msg + '<span style="color:#FF9900; font-weight:bold">Checking</span>';
    }else{
      msg = msg + '<span style="font-weight:bold">Unknown</span>';
    }
    var button = {
      cls:'x-btn-text',
      handler:proxyCheckerFunction,
      tooltip:'Proxy status updates automatically once per day',
      text:msg
    };
    return button
  }
// Update proxy status in the panel topbar
  function showProxyStat(mode){
    var button = proxyButton(mode);
    var form = Ext.getCmp(formID);
    if(!form){
      return false
    }
    var bar = form.getTopToolbar();
    if(!bar){
      return false
    }
    Ext.fly(bar.items.get(0).getEl()).remove();
    bar.items.removeAt(0);
    bar.insertButton(0,button);
    var bButton = form.buttons[0];
    if(mode != 'true'){
      bButton.disable();
    }else{
      bButton.enable();
    }
  }
// This function is a bit of puzzle
  function showJob(id){
    var textField = Ext.getCmp('id');
    textField.setValue(id);
    hideControls(textField);
    var button = Ext.getCmp('submitFormButton');
    button.handler.call(button.scope, button, Ext.EventObject)
  }
// Form submition function
  function submitForm(id){
    gMainLayout.container.mask('Please wait');
    var panel = Ext.getCmp(id);
    try{
      panel.form.submit({
        success:function(form,action){
          gMainLayout.container.unmask();
          if(action.result.success == 'false'){
             alert('Error: ' + action.result.error);
          }else{
            var warn = Ext.Msg.show({
              animEl: 'elId',
              buttons:{ok:'Ok',cancel:'Show Job'},
              icon: Ext.MessageBox.INFO,
              fn:function(btn){
                warn.hide();
                if(btn == 'cancel'){
                  showJob(action.result.result);
                }
              },
              minWidth:300,
              msg:'Your Job ID is ' + action.result.result,
              title:'Success '
            });
          }
        },
        failure:function(form,action){
          gMainLayout.container.unmask();
          alert('Error: ' + action.response.statusText);
        },
        url:'jobSubmit'
      });
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message);
    }
  }
// fileField return the file input field and updates the bottom toolbar element of panel
  function fileField(){
    var field = new Ext.ux.form.FileUploadField({
      buttonOffset:2,
      cls:"x-btn-text-icon",
      hideLabel:true,
      icon:gURLRoot+'/images/iface/addfile.gif',
      listeners:{
        'fileselected':function(fb,name){
          var panel = Ext.getCmp(fileID);
          if(!panel){
            alert('Error: Can not get component by fileID');
            return
          }
          var inn = Ext.getCmp(innID);
          if(!inn){
            alert('Error: Can not get component by innID');
            return
          }
          var width = inn.getInnerWidth() - fileAnchor;
          var length = panel.items.getCount();
          var addFile = true;
          for(i=0; i<length; i++){
            var tmpItem = panel.getComponent(i);
            if(!tmpItem.value){
              var addFile = false;
            }
          }
          if(addFile){
            var tmp = fileField();
            tmp.setWidth(width);
            panel.add(tmp);
          }
          length = panel.items.getCount();
          var size = 0;
          for(i=0; i<length; i++){
            var tmpItem = panel.getComponent(i);
            var fileSize = tmpItem.getFileSize();
            if(fileSize){
              size = size + fileSize;
            }
          }
          var msg = 'Input Sandbox';
          if(size > 0){
            var msg = 'Input Sandbox (Total Size: ' + bytesToSize(size, 1) + ')';
          }
          var form = Ext.getCmp(formID);
          if(!form){
            return false
          }
          var bar = form.getTopToolbar();
          if(!bar){
            return false
          }
          try{
            if(bar.items.items[3].disabled){ // Last button in the top toolbar
              bar.items.items[3].enable();
            }
          }catch(e){}
          panel.setTitle(msg);
          panel.doLayout();
        }
      },
      width:300
    });
    return field
  }
// Create a text entrie for JDL panel
  function createText(name,value){
    var text = new Ext.form.TextField({
      anchor:fieldAnchor,
      fieldLabel:name,
      name:name,
      value:value
    });
    return text
  }
// Create a combobox entrie for JDL panel
  function createList(name,items){
    for(var i in items){
      items[i] = [items[i]];
    }
    var combo = createMenu(false,name,items);
    combo.separator = launchpadOptsSeparator;
    combo.anchor = fieldAnchor;
    combo.id = Ext.id();
    return combo;  
  }
// Add or remove entries from the JDL panel
  function entryMagic(item,state){
    var panel = Ext.getCmp(jdlID);
    if(!panel){
      alert('Error: Can not get component by jdlID');
      return
    }
    var form = Ext.getCmp(formID);
    if(!form){
      alert('Error: Can not get component by formID');
      return
    }
    var text = item.text;
    var findJDL = panel.find('fieldLabel',text);
    var isJDL = false;
    if(findJDL.length > 0){
      isJDL = true;
    }
    if(state){
      for(var i=0; i<data.length; i++){
        if(data[i][0] == text && !isJDL){
          if(typeof(data[i][1]) == 'object'){
            var field = createList(data[i][0],data[i][1]);
          }else{
            var field = createText(data[i][0],data[i][1]);
          }
          form.form.add(field);
          panel.add(field);
        }
      }
    }else{
      if(isJDL){
        for(var i=0; i<findJDL.length; i++){
          if(findJDL[i].fieldLabel && findJDL[i].fieldLabel == text){
            var tmpJDL = panel.getComponent(findJDL[i].id);
            if(!tmpJDL){
              return
            }
            var itemParentNode = tmpJDL.el.up('div.x-form-item');
            panel.remove(tmpJDL);
            if(itemParentNode){
              Ext.fly(itemParentNode).remove();
            }
            form.form.remove(tmpJDL);
          }
        }
      }
    }
    panel.doLayout();
  }
// Create the specific entries for the Add Elements menu
  function checkedMenu(text,isList){
    var item = new Ext.menu.CheckItem({
      checkHandler:entryMagic,
      hideOnClick:false,
      text:text
    });
    return item
  }
// Recursively check if element is already exists in menu
  function menuAdd(menu,items){
    var extmenu = []
    try{    
      var length = menu.items.getCount();
      for(var j = 0; j < length; j++){
        if(menu.items.items[j].text){
          extmenu.push(menu.items.items[j].text);
        }
      }  
    }catch(e){
      alert('Error: ' + e.name + ': ' + e.message)
      return
    }
    for(var i in items){
      if(extmenu.indexOf(i) != -1){
        if(typeof(items[i]) == 'object'){
          var length = menu.items.getCount();
          for(var j = 0; j < length; j++){
            if(menu.items.items[j].text == i){
              if(menu.items.items[j].menu){
                menuAdd(menu.items.items[j].menu,items[i]);
              }else{
                var sub = new Ext.menu.Menu();
                menuAdd(sub,items[i]);              
              }
            }
          }
        }
      }else{
        if(i == '-'){
          menu.add('-');
        }else if(typeof(items[i]) == 'object'){
          var sub = new Ext.menu.Menu();
          menu.add({text:i,menu:sub});
          menuAdd(sub,items[i]);
        }else{
          if(launchpadOptsSeparator){
            var list = items[i].split(launchpadOptsSeparator);
            if(list.length > 1){
              menu.add(checkedMenu(i,list));
            }else{
              menu.add(checkedMenu(i));
            }
          }else{
            menu.add(checkedMenu(i));
          }
        }
      }
    }
  }
// Adds new elements to data key/value massive
  function dataAdd(items){
    for(var i in items){
      if(typeof(items[i]) == 'object'){
        dataAdd(items[i]);
      }else{
        var list = items[i].split(launchpadOptsSeparator);
        if(list.length > 1){
          for(var j = 0; j < list.length; j++){
            list[j] = list[j].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
          }
        }
        var add = true;
        for(var j in data){
          if(i == data[j][0]){
            if(list.length > 1){
              data[j][1] = list;
            }else{
              data[j][1] = list[0];
            }
            add = false;
          }
        }
        if(add){
          if(list.length > 1){
            data.push([i, list]);
          }else{
            data.push([i, items[i]]);
          }
        }
      }
    }
  }
// Create/change menu entries in 'Add Parameters' menu
  function menuShuffle(menu){
    dataAdd(menu);
    var add = Ext.getCmp(addID);
    if(!launchpadOptsOverride && add.menu){
      menuAdd(add.menu,menu);
    }else{
      var sub = new Ext.menu.Menu();
      add.menu = sub;
      menuAdd(sub,menu);
    }
  }
// End of function declaration
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      submitForm(formID);
    },
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
    tooltip:'Send a request to the server',
    text:'Submit'
  });
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      var panel = Ext.getCmp(formID);
      try{
        panel.form.reset();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
      }
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'70',
    tooltip:'Reset values in the form',
    text:'Reset'
  });
  var close = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      var win = Ext.getCmp(winID);
      try{
        win.close();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message)
      }
    },
    icon:gURLRoot+'/images/iface/close.gif',
    minWidth:'70',
    tooltip:'Alternatively, you can close the dialogue by pressing the [X] button on the top of the window',
    text:'Close'
  });
  var jdl = new Ext.form.FieldSet({
    autoHeight:true,
    bodyStyle:'padding: 5px',
    collapsible: true,
    defaultType:'textfield',
    id:jdlID,
    items:[{
      anchor:fieldAnchor,
      fieldLabel:'JobName',
      name:'JobName',
      allowBlank:true,
      value:'DIRAC_' + gPageDescription.userData.username + '_' + Math.floor(Math.random()*1000001)
    },{
      allowBlank:false,
      anchor:fieldAnchor,
      fieldLabel:'Executable',
      name:'Executable',
      value:'/bin/ls'
    },{
      anchor:fieldAnchor,
      fieldLabel:'Arguments',
      name:'Arguments',
      value:'-ltrA'
    },{
      anchor:fieldAnchor,
      fieldLabel:'OutputSandbox',
      name:'OutputSandbox',
      value:'std.out, std.err'
    }],
    monitorResize:true,
    title:'JDL',
  });
  var sandbox = new Ext.form.FieldSet({
    autoHeight:true,
    collapsible: true,
    id:fileID,
    items:[fileField()],
    monitorResize:true,
    title:'Input Sandbox',
  });
/*
  var lfnbox = new Ext.form.FieldSet({
    autoHeight:true,
    collapsible: true,
    items:[],
    title:'Input Sandbox LFN',
  });
//*/
  var addButton = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    id:addID,
    icon:gURLRoot+'/images/iface/advanced.gif',
    menu:[
      checkedMenu('InputData'),
      checkedMenu('OutputData'),
      checkedMenu('OutputSE'),
      checkedMenu('OutputPath'),
      '-',
      checkedMenu('CPUTime'),
      checkedMenu('Site'),
      checkedMenu('BannedSite'),
      checkedMenu('SystemConfig'),
      '-',
      checkedMenu('Priority'),
      '-',
      checkedMenu('StdError'),
      checkedMenu('StdOutput'),
      '-',
      checkedMenu('Parameters'),
      checkedMenu('ParameterStart'),
      checkedMenu('ParameterStep')
    ],
//    menu:menu,    
    text:'Add Parameters',
    tooltip:'Click to add more parameters to the JDL'
  });
  var cancelButton = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    disabled:true,
    handler:function(button){
      var sandbox = Ext.getCmp(fileID);
      if(sandbox){
        var length = sandbox.items.getCount() - 1;
        for(i=length; i>=0; i--){
          var tmp = sandbox.getComponent(i);
          sandbox.remove(tmp,true);
        }
        var width = sandbox.getInnerWidth() - fileAnchor;
        var tmp = fileField();
        tmp.setWidth(width);
        sandbox.add(tmp);
        sandbox.setTitle('Input Sandbox');
        sandbox.doLayout();
      }
      button.disable();
    },
    icon:gURLRoot+'/images/iface/close.gif',
    scope:this,
    tooltip:'Remove all files and LFNs from the sandbox',
    text:'Clear Sandbox'
  });
  var inn = new Ext.Panel({
    autoScroll:true,
    bodyStyle:'padding: 5px',
    border:false,
    id:innID,
    items:[jdl,sandbox],
    layout:'fit',
    monitorResize:true
  });
  inn.on({
    'resize':function(){
      var sandbox = Ext.getCmp(fileID);
      if(!sandbox){
        return
      }
      var width = inn.getInnerWidth() - fileAnchor;
      var length = sandbox.items.getCount();
      for(i=0; i<length; i++){
        var tmp = sandbox.getComponent(i);
        tmp.setWidth(width);
      }
    }
  });
  var panel = new Ext.FormPanel({
    border:false,
    buttons:[submit,reset,close],
    fileUpload: true,
    id:formID,
    items:[inn],
    labelWidth:100,
    monitorResize:true,
    tbar:[proxyButton('init'),'->',addButton,cancelButton],
    url:''
  });
  var win = new Ext.Window({
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    id:winID,
    items:[panel],
    layout:'fit',
    maximizable:true,
    minHeight:240,
    minWidth:320,
    title:'Launchpad',
  });
  win.show();
  Ext.Ajax.request({
    method:'POST',
    params:{'getLaunchpadOpts':true},
    success:function(response){
      var response = Ext.util.JSON.decode(response.responseText);
      if(response.override && response.override == 'true'){
        launchpadOptsOverride = true;
      }else{
        launchpadOptsOverride = false;
      }
      if(response.separator && response.separator != 'false'){
        launchpadOptsSeparator = response.separator;
      }
      addButton.enable();
      if(response.result){
        menuShuffle(response.result);
      }
    },
    failure:function(response){
      addButton.enable();
      alert('Error: Failed to load additional options from Configuration Service. Default options will be used');
    },
    timeout:60000, // 1min
    url:'action'
  });  
  win.on({
    'resize':function(){
      var panel = Ext.getCmp(innID);
      var form = Ext.getCmp(formID);
      var wHeight = form.getInnerHeight();
      var wWidth = win.getInnerWidth();
      panel.setHeight(wHeight);
      panel.setWidth(wWidth);
    }
  });
  win.setSize(500,500);
}
