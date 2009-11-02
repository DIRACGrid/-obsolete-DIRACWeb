function addLFN(id){

//      jdlPanel.insert(index,createText(record.data.Option,record.data.Value));
//      record.commit(); // Renders changes
//      jdlPanel.doLayout();

  var panel = Ext.getCmp(id).items.items[0].items.items[1].items.items[0];
/*
  var rec = [{
    id:'inp',
    fileName:'fileName',
    filePath:'filePath',
    shortName:'shortName',
    fileCls:'this.getFileCls(fileName)',
    bytesTotal:'bytesTotal',
  }];
  panel.store.insert(0,rec[0]);
  rec.commit();
*/
  panel.doLayout();
  alert(id);
}
function submitJobNew(){
  function showJob(id){
    var textField = Ext.getCmp('id');
    textField.setValue(id);
    hideControls(textField);
    var button = Ext.getCmp('submitFormButton');
    button.handler.call(button.scope, button, Ext.EventObject)
  }
  function submitForm(panelid){
    gMainLayout.container.mask('Please wait');
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
        try{
          alert('Error: ' + action.response.statusText);
        }catch(e){
          alert('Error: Unknow error during sending request to service. panel.form.submit');
        }
      },
      url:'jobSubmit'
    });
  }
var fbutton = {
            buttonCfg: {
                hideLabel: true
                ,iconCls:'sandbox'
            }
            ,buttonText:'Add file...'
            ,buttonOnly: true //no textfield
            ,listeners: { 
                fileselected: {fn:this.onAddFile, scope:this}
            }
            ,style: { display: 'none' } //IE hack - can't use visibility b/c IE buffers the space
            ,xtype:'fileuploadfield'
	};
/*
  var fbutton = new Ext.ux.form.FileUploadField({
    buttonText:'Add File',
    buttonOnly:true,
    buttonOffset:0,
    cls:"x-btn-text-icon",
    icon:gURLRoot+'/images/iface/addfile.gif',
    listeners:{
      'fileselected': function(fb, v){
        var el = Ext.fly('fi-button-msg');
        var value = document.getElementById('fi-button-msg').innerHTML;
        if(value == 'InputSandbox is empty'){
          el.update('<b>Selected:</b> '+v);
        }else{
          el.update(value + '<br><b>Selected:</b> '+v);
        }
        if(!el.isVisible()){
          el.slideIn('t', {
            duration: .2,
            easing: 'easeIn',
            callback: function(){
              el.highlight();
            }
          });
        }else{
          el.highlight();
        }
      }
    }
  });
*/
  function showTable(id){
    function createText(name,value){
      var text = new Ext.form.TextField({
        anchor:'-15',
        fieldLabel:name,
        name:name,
        value:value
      });
      return text
    }
    function chkBoxJDL(flag){
      if(flag == 1){
        var img = '<img src="'+gURLRoot+'/images/iface/checked.gif">';
      }else{
        var img = '<img src="'+gURLRoot+'/images/iface/unchecked.gif">';
      }
      return img
    }
    var data = [
      [0,'CPUTime','86400'],
      [0,'StdError','testJob.err'],
      [0,'JobType','MPI'],
      [0,'CPUNumber','2'],
      [0,'InputDataType',''],
      [0,'SystemConfig','slc4_ia32_gcc34'],
      [0,'Site',''],
      [0,'BannedSite','']
    ];
    var store = new Ext.data.SimpleStore({
      fields:['Flag','Option','Value'],
      data:data
    });
    var table = new Ext.grid.GridPanel({
      anchor:'-15',
      autoScroll:true,
      border:false,
      columns:[
        {header:'',width:26,sortable:false,dataIndex:'Flag',renderer:chkBoxJDL,hideable:false,fixed:true,menuDisabled:true},
        {header:'JDL Parameter',sortable:true,dataIndex:'Option',align:'left',hideable:false},
        {header:'Default Value',sortable:true,dataIndex:'Value',align:'left',hideable:false}
      ],
      header:false,
      layout:'fit',
      loadMask:true,
      store:store,
      stripeRows:true,
      viewConfig:{forceFit:true,scrollOffset:1}
    });
    table.addListener('rowclick',function(tab,rowIndex){
      var record = tab.getStore().getAt(rowIndex); // Get the Record for the row
      var panel = Ext.getCmp(id);
      var jdl = panel.items.items[0].items.items[0].items;
      var jdlPanel = panel.items.items[0].items.items[0];
      var currentJDL = []
      for(var i = 0; i < jdl.length; i++){
        currentJDL[i] = jdl.items[i].name;
      }
      var isCurrentJDL = currentJDL.indexOf(record.data.Option); // Is an option already in the JDL
      var msg = '';
      if(isCurrentJDL == -1){ // Option is not in JDL
        var index = panel.items.items[0].items.items[0].items.length;
        jdlPanel.insert(index,createText(record.data.Option,record.data.Value));
        record.data['Flag'] = 1;
        msg = record.data.Option + ' has been add to JDL';
      }else if(isCurrentJDL >= 0){ //Option is already in JDL
        var item = jdlPanel.getComponent(isCurrentJDL);
        var itemParentNode = item.el.dom.parentNode.parentNode;
        jdlPanel.remove(isCurrentJDL);
        Ext.fly(itemParentNode).remove();
        record.data['Flag'] = 0;
        msg = record.data.Option + ' has been deleted from JDL';
      }else{ // Fallback
        record.data['Flag'] = 0;
        msg = record.data.Option + ' has been reset';
      }
      var bar = panel.items.items[0].items.items[2].getBottomToolbar();
      Ext.fly(bar.items.get(1).getEl().parentNode).remove(); // Secret hack for remove an element from toolbar
      bar.items.removeAt(1);
      bar.add({xtype:'label',text:msg});
      record.commit(); // Renders changes
      jdlPanel.doLayout();
    });
    return table
  }
  var panel = new Ext.FormPanel({
    fileUpload: true,
    labelWidth:100,
    monitorResize:true,
    border:false,
    items:[{
      xtype:'tabpanel',
      activeTab:0,
      monitorResize:true,
      items:[{
        bodyStyle:'padding: 5px',
        defaultType:'textfield',
        iconCls:'jdl',
        monitorResize:true,
        autoScroll:true,
        items:[{
          anchor:'-15',
          fieldLabel:'JobName',
          name:'jobname',
          allowBlank:true,
          value:'DIRAC_' + gPageDescription.userData.username + '_' + Math.floor(Math.random()*1000001)
        },{
          allowBlank:false,
          anchor:'-15',
          fieldLabel:'Executable',
          name:'exec',
          value:'/bin/ls'
        },{
          anchor:'-15',
          fieldLabel:'Arguments',
          name:'params',
          value:'-ltrA'
        },{
          anchor:'-15',
          fieldLabel:'OutputSandbox',
          name:'outputSandbox',
          value:'std.out, std.err'
        }],
        layout:'form',
        title:'JDL'
      },{
        bodyStyle:'padding: 5px',
        defaultType:'fileuploadfield',
        iconCls:'sandbox',
        monitorResize:true,
        autoScroll:true,
        items:[{
          anchor:'-15',
          fieldLabel:'Add file'
        },{
          anchor:'-15',
          fieldLabel:'Add file'
        },{
          anchor:'-15',
          fieldLabel:'Add file'
        }],
        layout:'form',
        title:'Sandbox'
/*
        bodyStyle:'padding: 0px !important',
        defaultType:'label',
        iconCls:'sandbox',
        items:[{
          text:'InputSandbox is empty',
        }],
        layout:'form',
        tbar:[fbutton,{
          cls:"x-btn-text-icon",
          handler:function(){
            addLFN(panel.id);
          },
          icon:gURLRoot+'/images/iface/lfn.gif',
          tooltip:'Input Logical File Name of your data sample',
          text:'Add LFN'
        },'->',{
          cls:"x-btn-text-icon",
          disabled:true,
          handler:function(){
            addLFN(panel.id);
          },
          icon:gURLRoot+'/images/iface/close.gif',
          scope:this,
          tooltip:'Remove all items from the sandbox',
          text:'Clear All'
        }],
        title:'Sandbox'
*/
      },{
        autoScroll:true,
        defaultType:'grid',
        iconCls:'advanced',
        layout:'form',
        monitorResize:true,
        tabTip:'Here you can include or exclude any of the JDL parameters',
        bbar:['->','Click on a row to start working'],
        title:'Advanced'
      }]
    }],
    buttons:[{
      cls:"x-btn-text-icon",
      handler:function(){
        submitForm(panel.id);
      },
      icon:gURLRoot+'/images/iface/submit.gif',
      minWidth:'70',
      tooltip:'Send a request to the server',
      text:'Submit'
    },{
      cls:"x-btn-text-icon",
      handler:function(){
        panel.form.reset();
      },
      icon:gURLRoot+'/images/iface/reset.gif',
      minWidth:'70',
      tooltip:'Reset values in the form',
      text:'Reset'
    },{
      cls:"x-btn-text-icon",
      handler:function(){
        win.close();
      },
      icon:gURLRoot+'/images/iface/close.gif',
      minWidth:'70',
      tooltip:'Alternatively, you can close the dialogue by pressing the [X] button on the top of the window',
      text:'Close'
    }],
    url:'',
  });
  panel.on({
    'render':function(){
      var grid = showTable(panel.id);
      panel.items.items[0].items.items[2].insert(0,grid);
    }
  });
  var win = displayWin(panel,'Launchpad');
  win.on({
    'resize':function(){
      var wHeight = win.getInnerHeight();
      var wWidth = win.getInnerWidth();
      panel.items.items[0].setHeight(wHeight - 39);
      panel.items.items[0].setWidth(wWidth - 2);
    }
  });
  win.setSize(400,300);
}

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

function launchJob(){
  function showJob(id){
    var textField = Ext.getCmp('id');
    textField.setValue(id);
    hideControls(textField);
    var button = Ext.getCmp('submitFormButton');
    button.handler.call(button.scope, button, Ext.EventObject)
  }
  function submitForm(panelid){
    gMainLayout.container.mask('Please wait');
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
        try{
          alert('Error: ' + action.response.statusText);
        }catch(e){
          alert('Error: Unknow error during sending request to service. panel.form.submit');
        }
      },
      url:'jobSubmit'
    });
  }
  var fbutton = new Ext.ux.form.FileUploadField({
    buttonText:'Add File',
    buttonOnly:true,
    buttonOffset:0,
    cls:"x-btn-text-icon",
    icon:gURLRoot+'/images/iface/addfile.gif',
    listeners:{
      'fileselected': function(fb, v){
        var el = Ext.fly('fi-button-msg');
        var value = document.getElementById('fi-button-msg').innerHTML;
        if(value == 'InputSandbox is empty'){
          el.update('<b>Selected:</b> '+v);
        }else{
          el.update(value + '<br><b>Selected:</b> '+v);
        }
        if(!el.isVisible()){
          el.slideIn('t', {
            duration: .2,
            easing: 'easeIn',
            callback: function(){
              el.highlight();
            }
          });
        }else{
          el.highlight();
        }
      }
    }
  });
  function showTable(id){
    function createText(name,value){
      var text = new Ext.form.TextField({
        anchor:'-15',
        fieldLabel:name,
        name:name,
        value:value
      });
      return text
    }
    function chkBoxJDL(flag){
      if(flag == 1){
        var img = '<img src="'+gURLRoot+'/images/iface/checked.gif">';
      }else{
        var img = '<img src="'+gURLRoot+'/images/iface/unchecked.gif">';
      }
      return img
    }
    var data = [
      [0,'CPUTime','86400'],
      [0,'StdError','testJob.err'],
      [0,'JobType','MPI'],
      [0,'CPUNumber','2'],
      [0,'InputDataType',''],
      [0,'SystemConfig','slc4_ia32_gcc34'],
      [0,'Site',''],
      [0,'BannedSite','']
    ];
    var store = new Ext.data.SimpleStore({
      fields:['Flag','Option','Value'],
      data:data
    });
    var table = new Ext.grid.GridPanel({
      anchor:'-15',
      autoScroll:true,
      border:false,
      columns:[
        {header:'',width:26,sortable:false,dataIndex:'Flag',renderer:chkBoxJDL,hideable:false,fixed:true,menuDisabled:true},
        {header:'JDL Parameter',sortable:true,dataIndex:'Option',align:'left',hideable:false},
        {header:'Default Value',sortable:true,dataIndex:'Value',align:'left',hideable:false}
      ],
      header:false,
      layout:'fit',
      loadMask:true,
      store:store,
      stripeRows:true,
      viewConfig:{forceFit:true,scrollOffset:1}
    });
    table.addListener('rowclick',function(tab,rowIndex){
      var record = tab.getStore().getAt(rowIndex); // Get the Record for the row
      var panel = Ext.getCmp(id);
      var jdl = panel.items.items[0].items.items[0].items;
      var jdlPanel = panel.items.items[0].items.items[0];
      var currentJDL = []
      for(var i = 0; i < jdl.length; i++){
        currentJDL[i] = jdl.items[i].name;
      }
      var isCurrentJDL = currentJDL.indexOf(record.data.Option); // Is an option already in the JDL
      var msg = '';
      if(isCurrentJDL == -1){ // Option is not in JDL
        var field = createText(record.data.Option,record.data.Value);
        panel.form.add(field);
        var index = panel.items.items[0].items.items[0].items.length;
        jdlPanel.insert(index,field);
        record.data['Flag'] = 1;
        msg = record.data.Option + ' has been add to JDL';
      }else if(isCurrentJDL >= 0){ //Option is already in JDL
        var item = jdlPanel.getComponent(isCurrentJDL);
        var itemParentNode = item.el.dom.parentNode.parentNode;
        jdlPanel.remove(isCurrentJDL);
        Ext.fly(itemParentNode).remove();
        panel.form.remove(item);
        record.data['Flag'] = 0;
        msg = record.data.Option + ' has been deleted from JDL';
      }else{ // Fallback
        record.data['Flag'] = 0;
        msg = record.data.Option + ' has been reset';
      }
      var bar = panel.items.items[0].items.items[2].getBottomToolbar();
      Ext.fly(bar.items.get(1).getEl().parentNode).remove(); // Secret hack for remove an element from toolbar
      bar.items.removeAt(1);
      bar.add({xtype:'label',text:msg});
      record.commit(); // Renders changes
      jdlPanel.doLayout();
    });
    return table
  }
  function showSPanel(){
    var data = [
      [0,'CPUTime','86400'],
      [0,'StdError','testJob.err'],
      [0,'JobType','MPI'],
      [0,'CPUNumber','2'],
      [0,'InputDataType',''],
      [0,'SystemConfig','slc4_ia32_gcc34'],
      [0,'Site',''],
      [0,'BannedSite','']
    ];
    var store = new Ext.data.SimpleStore({
      fields:['id','fileName','bytesTotal'],
      data:data
    });
    var tempanel = new Ext.grid.GridPanel({
      anchor:'-15',
      autoScroll:true,
      border:false,
      columns:[
        {header:'',sortable:false,dataIndex:'id',hideable:false,fixed:true,menuDisabled:true},
        {header:'JDL Parameter',sortable:true,dataIndex:'fileName',align:'left',hideable:false},
        {header:'Default Value',sortable:true,dataIndex:'bytesTotal',align:'left',hideable:false}
      ],
      header:false,
      layout:'fit',
      loadMask:true,
      store:store,
      stripeRows:true,
      viewConfig:{forceFit:true,scrollOffset:1}
    });
    var panel = new Ext.Panel({
    id:'images-view',
    frame:true,
    width:535,
    height: 400,
    autoHeight:true,
    collapsible:true,
    layout:'fit',
    title:'Simple DataView',
    items: new Ext.DataView({
      itemSelector:'div.ux-up-item'
      ,store:store
      ,overClass:'x-view-over'
      ,singleSelect:true
      ,emptyText:"Sandbox is empty"
      ,tpl:new Ext.XTemplate(
  '<tpl for=".">'
 + '<div class="ux-up-item">'
 + '<div class="ux-up-icon-file {fileName}">&#160;</div>'
 + '<div class="ux-up-text x-unselectable" qtip="{fileName}">{fileName}</div>'
 + '<div id="remove-{id}" class="ux-up-icon-state ux-up-icon-{bytesTotal}"'
 + 'qtip="{[this.scope.getQtip(bytesTotal)]}">&#160;</div>'
 + '</div>'
 + '</tpl>'
/*
      '<tpl for=".">',
        '<div class="thumb-wrap" id="{id}">',
        '<div class="thumb">{fileName}</div>',
        '<span class="x-editable">{bytesTotal}</span></div>',
      '</tpl>',
      '<div class="x-clear"></div>'
*/
      )
    })
    });
    return panel
  }
  var panel = new Ext.FormPanel({
    fileUpload: true,
    labelWidth:100,
    monitorResize:true,
    border:false,
    items:[{
      xtype:'tabpanel',
      activeTab:0,
      monitorResize:true,
      items:[{
        bodyStyle:'padding: 5px',
        defaultType:'textfield',
        iconCls:'jdl',
        monitorResize:true,
        autoScroll:true,
        items:[{
          anchor:'-15',
          fieldLabel:'JobName',
          name:'jobname',
          allowBlank:true,
          value:'DIRAC_' + gPageDescription.userData.username + '_' + Math.floor(Math.random()*1000001)
        },{
          allowBlank:false,
          anchor:'-15',
          fieldLabel:'Executable',
          name:'exec',
          value:'/bin/ls'
        },{
          anchor:'-15',
          fieldLabel:'Arguments',
          name:'params',
          value:'-ltrA'
        },{
          anchor:'-15',
          fieldLabel:'OutputSandbox',
          name:'outputSandbox',
          value:'std.out, std.err'
        }],
        layout:'form',
        title:'JDL'
      },{
        bodyStyle:'padding: 0px !important',
        defaultType:'label',
        iconCls:'sandbox',
        items:showSPanel(),
//        items:[{
//          text:'InputSandbox is empty',
//        }],
        layout:'form',
        tbar:[fbutton,{
          cls:"x-btn-text-icon",
          handler:function(){
            addLFN(panel.id);
          },
          icon:gURLRoot+'/images/iface/lfn.gif',
          tooltip:'Input Logical File Name of your data sample',
          text:'Add LFN'
        },'->',{
          cls:"x-btn-text-icon",
          disabled:true,
          handler:function(){
            addLFN(panel.id);
          },
          icon:gURLRoot+'/images/iface/close.gif',
          scope:this,
          tooltip:'Remove all items from the sandbox',
          text:'Clear All'
        }],
        title:'Sandbox'
      },{
        autoScroll:true,
        defaultType:'grid',
        iconCls:'advanced',
        layout:'form',
        monitorResize:true,
        tabTip:'Here you can include or exclude any of the JDL parameters',
        bbar:['->','Click on a row to start working'],
        title:'Advanced'
      }]
    }],
    buttons:[{
      cls:"x-btn-text-icon",
      handler:function(){
        submitForm(panel.id);
      },
      icon:gURLRoot+'/images/iface/submit.gif',
      minWidth:'70',
      tooltip:'Send a request to the server',
      text:'Submit'
    },{
      cls:"x-btn-text-icon",
      handler:function(){
        panel.form.reset();
      },
      icon:gURLRoot+'/images/iface/reset.gif',
      minWidth:'70',
      tooltip:'Reset values in the form',
      text:'Reset'
    },{
      cls:"x-btn-text-icon",
      handler:function(){
        win.close();
      },
      icon:gURLRoot+'/images/iface/close.gif',
      minWidth:'70',
      tooltip:'Alternatively, you can close the dialogue by pressing the [X] button on the top of the window',
      text:'Close'
    }],
    url:'',
  });
  panel.on({
    'render':function(){
      var grid = showTable(panel.id);
      panel.items.items[0].items.items[2].insert(0,grid);
    }
  });
  var win = displayWin(panel,'Launchpad');
  win.on({
    'resize':function(){
      var wHeight = win.getInnerHeight();
      var wWidth = win.getInnerWidth();
      panel.items.items[0].setHeight(wHeight - 39);
      panel.items.items[0].setWidth(wWidth - 2);
    }
  });
  win.setSize(400,300);
}
