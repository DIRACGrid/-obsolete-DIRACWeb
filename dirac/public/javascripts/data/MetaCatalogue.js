var tableMngr = new Object();
function init(reponseSelect){
  Ext.onReady(function(){
    Ext.override(Ext.PagingToolbar,{
      onRender :  Ext.PagingToolbar.prototype.onRender.createSequence(function(ct, position){
        this.loading.removeClass('x-btn-icon');
        this.loading.setText('Refresh');
        this.loading.addClass('x-btn-text-icon');
      })
    });
    var leftBar = left(reponseSelect);
    var panel = leftBar.items.itemAt(0);
    panel.on('actioncomplete',function(form,action){
      try{
        gMainLayout.container.unmask();
      }catch(e){}
      try{
        if(action.result.success == 'false'){
          errorReport(action.result.error);
        }else{
          mainContent.store.loadData(action.result);
        }
      }catch(e){
        alert('');
      }
    });
    panel.on('actionfailed',function(form,action){
      try{
        gMainLayout.container.unmask();
      }catch(e){}
      errorReport(action);
    });
    var rightBar = right();
    var mainContent = center();
    renderInMainViewport([ leftBar, mainContent ]);
  });
}
function left(reponseSelect){
  var addButton = new Ext.Toolbar.Button({
    cls:"x-btn-text-icon",
    icon:gURLRoot+'/images/iface/advanced.gif',
    handler:function(){
      addMenu(panel);
    },
    text:'Add Metadata selector(s)',
    tooltip:'Click to add more metadata selectors'
  });
  var refresh = new Ext.Button({
    cls:"x-btn-icon",
    handler:function(){
      refreshSelect(panel);
    },
    icon:gURLRoot+'/images/iface/refresh.gif',
    minWidth:'20',
    tooltip:'Refresh data in the selection boxes',
    width:'100%'
  });
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.reset();
      var number = Ext.getCmp('id');
      hideControls(number);
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'70',
    tooltip:'Reset values in the form',
    text:'Reset'
  });
  var submit = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.submit();
    },
    id:'submitFormButton',
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
    name:'submitFormButton',
    tooltip:'Send request to the server',
    text:'Submit'
  });
  var initPanel = new Ext.form.Hidden({name:'init',value:''});
  var panel = new Ext.FormPanel({
    autoScroll:true,
    border:false,
    buttonAlign:'center',
    buttons:[submit,reset],
    bodyStyle:'padding: 5px',
    items:[initPanel],
    labelAlign:'top',
    tbar:new Ext.Toolbar({
      items:[addButton]
    }),
    url:'submit'
  });
  panel.on('resize',function(){
    keepButtonSize(panel,addButton);
  });
  var sidebar = new Ext.Panel({
    collapsible:true,
    cmargins:'2 2 2 2',
    items:[panel],
    layout:'fit',
    minWidth: 200,
    margins:'2 0 2 0',
    region:'west',
    split:true,
    title:'MetadataCatalogue',
    width: 200,
  });
  return sidebar
}
function right(){
  var save = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      Ext.emptyFn();
    },
    icon:gURLRoot+'/images/iface/save.gif',
    tooltip:'Click the button if you want to save records to a file',
    text:'Save dialog'
  });
  function createField(label){
    var txtField = new Ext.form.TextField({
      anchor:'90%',
      fieldLabel:label,
      readOnly:true
    });
    return txtField;
  }
  var fSet1 = {
    autoHeight:true,
    defaultType:'textfield',
    items:[
      createField('Configuration Name'),
      createField('Configuration Version'),
      createField('Simulation/DataTaking Conditions'),
      createField('Processing pass'),
      createField('Event Type'),
      createField('File Type'),
    ],
    labelAlign:'top',
    xtype:'fieldset'
  }
  var fSet2 = {
    autoHeight:true,
    defaultType:'textfield',
    items:[
      createField('Number Of Files'),
      createField('Number Of Events'),
      createField('File(s) Size')
    ],
    labelAlign:'top',
    title:'Statistics',
    xtype:'fieldset'
  }
  var panel = new Ext.Panel({
    autoScroll:true,
    bbar:new Ext.Toolbar({
      items:[save]
    }),
    collapsible:false,
    split:true,
    region:'east',
    margins:'2 0 2 0',
    cmargins:'2 2 2 2',
    bodyStyle:'padding: 5px',
    width: 200,
    labelAlign:'top',
    minWidth: 200,
    items:[fSet1,fSet2],
    title:'Stat info',
  });
  panel.on('resize',function(){
    keepButtonSize(panel,save);
  });
  /*
  panel.addListener('resize',function(){
    var tmpWidth = panel.getInnerWidth() - 4;
    var button = saveButton(tmpWidth);
    var bar = panel.getBottomToolbar();
    Ext.fly(bar.items.get(0).getEl()).remove();
    bar.items.removeAt(0);
    bar.insertButton(0,button);
    panel.doLayout();
  });
  */
  return panel
}
function center(){
  var record = new Ext.data.Record.create([
    {name:'filename'}
  ]);
  var columns = [
    {header:'',name:'checkBox',id:'checkBox',width:26,sortable:false,dataIndex:'filename',renderer:chkBox,hideable:false,fixed:true,menuDisabled:true},
    {header:'File Name',sortable:true,dataIndex:'filename',align:'left',width:'90%'}
  ];
  var store = new Ext.data.Store({
    reader:new Ext.data.JsonReader({
      root:'result',
      totalProperty:'total'
    },record)
  });
  store.on('load',function(records){
    var show = false;
    if(records && records.totalLength){
      if(records.totalLength > 0){
        show = true;
      }
    }
    var toolbar = dataTable.getTopToolbar();
    if(!toolbar){
      return errorReport('Unable to get toolbar of dataTable component');
    }
    var length = toolbar.items.getCount();
    for(var i=0; i < length; i++){
      if(show){
        toolbar.items.itemAt(i).enable();
      }else{
        toolbar.items.itemAt(i).disable();
      }
    }
  });
  var tbar = [
    {
      cls:"x-btn-text-icon",
      handler:function(){selectAll('all')},
      disabled:true,
      icon:gURLRoot+'/images/iface/checked.gif',
      text:'Select All',
      tooltip:'Click to select all rows'
    },{
      cls:"x-btn-text-icon",
      handler:function(){selectAll('none')},
      disabled:true,
      icon:gURLRoot+'/images/iface/unchecked.gif',
      text:'Select None',
      tooltip:'Click to uncheck selected row(s)'
    },'->',{
      cls:"x-btn-text-icon",
      handler:function(){
        save(this);
      },
      disabled:true,
      icon:gURLRoot+'/images/iface/save.gif',
      text:'Save',
      tooltip:'Click to save selected data'
    }
  ];
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
    columns:columns,
    labelAlign:'left',
    loadMask:true,
    margins:'2 0 2 0',
    region:'center',
    split:true,
    store:store,
    stripeRows:true,
    tbar:tbar
  });
  return dataTable
}
function keepButtonSize(panel,button){
/*
TODO: 
1) Make the new button's width dependent from number of buttons
i.e. single button has a width of 100% percents, two buttons
should have 50% width each
2) Take a button position on the toolbar and insert the new one
exactly to the same place
*/
  var tmpWidth = panel.getInnerWidth() - 5;
  var tmpButton = button.cloneConfig({minWidth:tmpWidth});
  var bar = new Array();
  var bbar = panel.getBottomToolbar();
  var tbar = panel.getTopToolbar();
  try{
    tbar.items.get(button.id) ? bar.push(tbar) : '';
  }catch(e){}
  try{
    bbar.items.get(button.id) ? bar.push(bbar) : '';
  }catch(e){}
  for(var i = 0; i < bar.length; i++){
    var j = bar[i];
    Ext.fly(j.items.get(button.id).getEl()).remove();
    j.items.removeAt(button.id);
    j.insertButton(0,tmpButton);
  }
}
function addMenu(panel){
  var initPanel = new Ext.form.Hidden({name:'init',value:''});
  var reset = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      panel.form.reset();
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'70',
    tooltip:'Reset values in the form',
    text:'Reset'
  });
  var ok = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      addItems2Panel(panel,form);
      win.close();
    },
    icon:gURLRoot+'/images/iface/submit.gif',
    minWidth:'70',
    tooltip:'Send request to the server',
    text:'Accept'
  });
  var close = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      win.close();
    },
    icon:gURLRoot+'/images/iface/close.gif',
    minWidth:'70',
    tooltip:'Alternatively, you can close the dialogue by pressing the [X] button on the top of the window',
    text:'Close'
  });
  var form = new Ext.Panel({
    bodyStyle:'padding: 10px',
    border:false,
    buttonAlign:'center',
    buttons:[ok,reset,close],
    items:[initPanel],
    labelWidth:0,
  });
  form.on('render',function(){
    form.container.mask('Please wait');
    Ext.Ajax.request({
      failure:function(response){
        form.container.unmask();
        response.responseText ? response = response.responseText : '';
        errorReport(response);
      },
      method:'POST',
      params:{'getSelector':'All'},
      success:function(response){
        form.container.unmask();
        response.responseText ? response = response.responseText : '';
        addItems(response,form);
      },
      timeout:60000, // 1min
      url:'action'
    });
  });
  var win = displayWin(form,'Add Metadata selector(s)',true)
}
function checkedMenu(text,isList){
  var item = new Ext.form.Checkbox({
    checkHandler:Ext.emptyFn(),
    hideOnClick:false,
    fieldLabel:text
  });
  return item
}
function addItems(response,panel){
  var data = Ext.util.JSON.decode(response);
  if(data && data.error){
    errorReport(data.error);
    return
  }
  var result = new Array();
// TODO: Check against already selected boxes
  if(data && data.result){
    for(var i in data.result){
      var label = 'unknown';
      if(data.result[i] == 'int'){
        label = 'integer';
      }else if(data.result[i] == 'datetime'){
        label = 'date';
      }else if(data.result[i] == 'varchar(32)'){
        label = 'string';
      }else if(data.result[i] == 'varchar(128)'){
        label = 'string';
      }
      var item = new Ext.form.Checkbox({
        boxLabel:i + ' (' + label + ')',
        dataLabel:i,
        dataType:label
      });
      result.push(item);
    }
  }
  for(var i = 0; i < result.length; i++){
    panel.add(result[i]);
  }
  panel.doLayout();
}
function addItems2Panel(panel,form){
  var len = form.items.getCount();
  if(len < 1){
    return
  }
  var checked = new Array();
  for(var i=0; i<len; i++){
    if(form.items.items[i].checked){
      checked.push(form.items.items[i]);
    }
  }
  var len = checked.length;
  if(len < 1){
    return
  }
  for(var i=0; i<len; i++){
    var item = false;
    if(checked[i].dataType == 'integer'){
      var name = label = checked[i].dataLabel;
      item = genericID(name,label);
    }else if(checked[i].dataType == 'date'){
      var name = label = checked[i].dataLabel;
      item = new Ext.form.DateField({
        anchor:'-15',
        allowBlank:true,
        emptyText:'YYYY-mm-dd',
        fieldLabel:label,
        format:'Y-m-d',
        name:name,
        selectOnFocus:true,
        startDay:1,
        value:'',
        width:98
      });      
    }else if(checked[i].dataType == 'string'){
      var name = label = checked[i].dataLabel;
      item = createRemoteMenu({
        baseParams:{getMeta:name},
        fieldLabel:name,
        name:name
      });
    }
    if(item){
      panel.form.add(item);
      panel.add(item);
    }
  }
  panel.doLayout();
}
function save(button){
  button.setIconClass('Loading');
  var files = '';
  var inputs = document.getElementsByTagName('input');
  for (var i = 0; i < inputs.length; i++){
    if (inputs[i].checked === true){
      files = files + inputs[i].id + ',';
    }
  }
  files = files.replace(/,$/,'');
  Ext.Ajax.request({
    failure:function(response){
      button.setIconClass('Save');
      var message = (response.responseText) ? response.responseText : 'Connection error';
      return errorReport(message);
    },
    method:'POST',
    params:{'getFile':files},
    success:function(response){
      button.setIconClass('Save');
      try{
        var data = (response.responseText) ? Ext.util.JSON.decode(response.responseText) : false;
      }catch(e){
        return errorReport('Unable to decode data from server response');
      }
      if(data && data.error){
          return errorReport(data.error);
      }
      try{
        window.open(data.result.url);
      }catch(e){
        return errorReport('Unable to decode data from server response');
      }
    },
    timeout:60000, // 1min
    url:'action'
  });
}
