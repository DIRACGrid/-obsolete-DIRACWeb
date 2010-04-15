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
function submitJobNew(){
  var formID = Ext.id(); // from panel
  var innID =  Ext.id(); // For JDL and Sandboxescontainer
  var jdlID = Ext.id();
  var fileID = Ext.id();
  var lfnID = Ext.id();
  var winID = Ext.id();
  var fileAnchor = 45;
  var fieldAnchor = '-5';
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
      params:{'getProxyStatus':86460},
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
    interval:86400*1000 // 1 day
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
    if(mode == 'false'||mode == 'check'){
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
            alert('Error: can not get component by fileID');
            return
          }
          var inn = Ext.getCmp(innID);
          if(!inn){
            alert('Error: can not get component by innID');
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
// Create an text entrie for JDL panel
  function createText(name,value){
    var text = new Ext.form.TextField({
      anchor:fieldAnchor,
      fieldLabel:name,
      name:name,
      value:value
    });
    return text
  }
// Add or remove entries from the JDL panel
  function entryMagic(item,state){
    var data = [
      ['CPUTime','86400'],
      ['StdError','testJob.err'],
      ['JobType','MPI'],
      ['CPUNumber','2'],
      ['InputDataType',''],
      ['SystemConfig','slc4_ia32_gcc34'],
      ['Site',''],
      ['BannedSite',''],
      ['OutputSE',''],
      ['OutputData','']
    ];
    var panel = Ext.getCmp(jdlID);
    if(!panel){
      alert('Error: ');
      return
    }
    var form = Ext.getCmp(formID);
    if(!form){
      alert('Error: ');
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
          var field = createText(data[i][0],data[i][1]);
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
            var itemParentNode = tmpJDL.el.dom.parentNode.parentNode;
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
  function checkedMenu(text){
    var item = new Ext.menu.CheckItem({
      checkHandler:entryMagic,
      hideOnClick:false,
      text:text
    });
    return item
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
    icon:gURLRoot+'/images/iface/advanced.gif',
    menu:[
      checkedMenu('CPUTime'),
      checkedMenu('StdError'),
      checkedMenu('JobType'),
      checkedMenu('CPUNumber'),
      checkedMenu('InputDataType'),
      checkedMenu('SystemConfig'),
      checkedMenu('Site'),
      checkedMenu('BannedSite'),
      checkedMenu('OutputSE'),
      checkedMenu('OutputData')
    ],
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
