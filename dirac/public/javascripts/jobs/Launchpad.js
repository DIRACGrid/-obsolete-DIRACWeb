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
      'fileselected':function(fb,name){
        var panel = Ext.getCmp('sandboxStore'); 
        if(!panel){
          alert('Error: can not get component by id sandboxStore');
          return
        }
        var recordConstructor = Ext.data.Record.create([
          {name:'icon'},
          {name:'fileName'},
          {name:'bytesTotal'}
        ]);
        record = new recordConstructor({icon:'file',fileName:name,bytesTotal:'1Gb'});
        panel.store.add(record);
        panel.store.commitChanges();
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
    function deleteBox(flag){
      var img = '<img src="'+gURLRoot+'/images/iface/close.gif">';
      return img
    }
    function whichIcon(mode){
      if(mode == 'file'){
        return '<img src="'+gURLRoot+'/images/iface/addfile.gif">'
      }else if(mode == 'lfn'){
        return '<img src="'+gURLRoot+'/images/iface/lfn.gif">'
      }else{
        return '<img src="'+gURLRoot+'/images/iface/unknown.gif">'
      }
    }
    var data = [['file','TestName.txt','1GB']];
    var store = new Ext.data.SimpleStore({
      fields:['icon','fileName','bytesTotal'],
      data:data,
    });
    var panel = new Ext.grid.GridPanel({
      anchor:'-15',
      autoScroll:true,
      border:false,
      columns:[
        {dataIndex:'icon',width:26,renderer:whichIcon,sortable:false,fixed:true},
        {dataIndex:'fileName',sortable:true,align:'left'},
        {dataIndex:'bytesTotal',width:100,sortable:true,align:'left',fixed:true},
        {dataIndex:'fileName',width:26,renderer:deleteBox,sortable:false,fixed:true,css:'cursor:pointer;cursor:hand;'}
      ],
      enableHdMenu:false,
      hideHeaders:true,
      header:false,
//      html:'<center><br><b>Sandbox is empty</b></center>',
      id:'sandboxStore',
      layout:'fit',
      loadMask:true,
      store:store,
      stripeRows:true,
      viewConfig:{forceFit:true,scrollOffset:1}
    });
    panel.addListener('cellclick',function(table,rowIndex,columnIndex){
      var record = table.getStore().getAt(rowIndex); // Get the Record for the row
      if(columnIndex == 3){
        store.remove(record);
      }
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
