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
/*
    var panel = leftBar.items.itemAt(0);
    panel.on('actioncomplete',function(form,action){
      try{
        gMainLayout.container.unmask();
      }catch(e){}
      try{
        if(action.result.success == 'false'){
          errorReport(action.result.error);
        }else{
          mainContent.store.loadData(action.result;nel()
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
*/
    var mainContent = center();
    renderInMainViewport([ leftBar, mainContent ]);
  });
}
function left(reponseSelect){
  var store = new Ext.data.JsonStore({
    autoLoad:true,
    baseParams:{'getSelectorGrid':true},
    fields:['Name','Type'],
    idProperty:'Name',
    root:'result',
    url:'action'
  });
/*
  store.on('load',function(){
    if(siteName != ''){
      var result = store.find('site',siteName);
      if(result >= 0){
        var selectionMod = table.getSelectionModel();
        selectionMod.selectRow(result);
        simultaneousLoad(siteName);
      }else{
        alert('Error: Can not find the site named: ' + siteName);
        return
      }
    }
  });
*/
  function syncButton(minWidth){
    if(!minWidth){
      minWidth = '';
    }
    var button = new Ext.Button({
      cls:"x-btn-text-icon",
      handler:function(){
        store.reload();
      },
      icon:gURLRoot+'/images/iface/refresh.gif',
      minWidth:minWidth,
      text:'Refresh',
      tooltip:'Updates the list of sites',
    });
    return button
  }
  var table = new Ext.grid.GridPanel({
    anchor:'-15',
    autoScroll:true,
    bbar:new Ext.Toolbar({
      items:[syncButton()]
    }),
    columns:[
      {dataIndex:'Type',id:'sl1',renderer:status,width:26,fixed:true,align:'left',menuDisabled:true,sortable:false,css:'cursor:pointer;cursor:hand;'},
//      {dataIndex:'Name',id:'sl2',renderer:flag,width:26,fixed:true,align:'left',menuDisabled:true,sortable:false,css:'cursor:pointer;cursor:hand;'},
      {dataIndex:'Name',id:'sl3',align:'left',editable:false,sortable:false,css:'cursor:pointer;cursor:hand;'}
    ],
    collapsible:true,
    cmargins:'2 2 2 2',
    enableHdMenu:false,
    hideHeaders:true,
//    id:'sidebarSiteSelectors',
    loadMask:true,
    margins:'2 0 2 0',
    minWidth: 200,
//    name:'sidebarSiteSelectors',
    region:'west',
    split:true,
    store:store,
    stripeRows:true,
    title:'MetadataCatalog',
    width: 200,
    viewConfig:{forceFit:true,scrollOffset:1}
  });
  table.addListener('rowclick',function(tab,rowIndex){
    var record = tab.getStore().getAt(rowIndex); // Get the Record for the row
    try{
      if(record.data.Name){
        addSelector(record.data.Name);
        table.doLayout();
//        window.location.hash = 'site=' + record.data.Name;
      }else{
        alert('Error: record.data.site is absent');
      }
    }catch(e){
      alert('Error: Unable to get the name of a site');
    }
  });
  table.addListener('resize',function(){
    var tmpWidth = table.getInnerWidth() - 6;
    var button = syncButton(tmpWidth);
    var bar = table.getBottomToolbar();
    Ext.fly(bar.items.get(0).getEl()).remove();
    bar.items.removeAt(0);
    bar.insertButton(0,button);
    table.doLayout();
  });
  return table
}
function addSelector(name){
  var table = false;
  table = Ext.getCmp('FilePanel');
  if(!table){
    return
  }
  var tbar = false;
  tbar = table.getTopToolbar();
  if(!tbar){
    return
  }
  var item = createRemoteMenu({
    baseParams:{getMeta:name},
    name:name
  });
  var tbar = Ext.getCmp('tdt');
  tbar.add(item);
//  table.add(new Ext.Toolbar({items:item}) )
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
    id:'FilePanel',
    region:'center',
    split:true,
    store:store,
    stripeRows:true,
    tbar:tbar
  });
  return dataTable
}
function keepButtonSize(panel,button){
  var tmpWidth = panel.getInnerWidth() - 15;
  var tmpButton = button.cloneConfig({minWidth:tmpWidth});
  var last = panel.items.getCount() - 1;
  var lastCmp = panel.getComponent(panel.items.items[last].id);
  panel.remove(lastCmp);
  panel.add(tmpButton);
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
//        label = 'string';
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
function returnBtnLogic(){
  var button = new Ext.Button({
    cls:"x-btn-icon",
    icon:gURLRoot+'/images/iface/advanced.gif',
    minWidth:'25',
    menu:new Ext.menu.Menu({
      items:[
        {text:'=='},
        {text:'!='},
        {text:'>'},
        {text:'<'},
        {text:'=>'},
        {text:'<='},
        {text:'[]'},
        {text:']['},
        {text:']]'},
        {text:'[['},
      ]
    }),
    tooltip:'Logical operations supported',
    columnWidth:'35'
  });
  return button
}
function checkConditions(form){
  var len = form.items.getCount();
  if(len < 1){
    return false
  }
  var checked = new Array();
  for(var i=0; i<len; i++){
    if(form.items.items[i].checked){
      checked.push(form.items.items[i]);
    }
  }
  var len = checked.length;
  if(len < 1){
    return false
  }
  return checked
}
function resetButton(tmpWidth, panel){
  var button = {
    cls:"x-btn-text-icon",
    handler:function(){
      timeSpan.reset();
      startDate.reset();
      startTime.reset();
      endDate.reset();
      endTime.reset();
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:tmpWidth,
    text:'Reset Values',
    tooltip:'Click to reset values of date and time in this widget'
  }
  return button
}
function selectWidget(title){
  var button = false;
  button = returnBtnLogic();
  if(!button){
    return false
  }
  button.style = 'padding:10px;';
//  title = 
  var deleteButton = {
    cls:"x-btn-text-icon",
    handler:function(){
      panel.destroy();
    },
    icon:gURLRoot+'/images/iface/close.gif',
    text:'Delete selector',
    tooltip:'Click to '
  }
  var panel = new Ext.Panel({
    autoHeight:true,
    bbar:[resetButton()],
//    border:false,
//    defaults: {
//      style:'padding:5px;',
//    },
    items:[button],
    layoutConfig: {
      columns: 3
    },
    layout:'table',
    monitorResize:true,
    style:'padding-bottom:4px;',
    tbar:[title, '->', deleteButton]
//    title:title ? title : 'Undefined'
  });
  panel.on('resize',function(){
    var tmpWidth = panel.getInnerWidth() - 6;
    var bar = panel.getBottomToolbar();
    Ext.fly(bar.items.get(0).getEl()).remove();
    bar.items.removeAt(0);
    bar.insertButton(0,resetButton(tmpWidth, panel));
  });
  return panel
}
function addItems2Panel(panel,form){
  var check = false;
  check = checkConditions(form);
  if(!check){
    return
  }
  for(var i=0; i < check.length; i++){
    if(!check[i].dataLabel || !check[i].dataType){
      continue
    }
    var name = check[i].dataLabel;
    var type = check[i].dataType;
    var select = false;
    select = selectWidget(name);
    if(!select){
      continue
    }
    for ( i in { 'start' : '' , 'end' : '' } ) {
      var tmp = name +  '_' + i;
      if(type == 'date'){
        var item = new Ext.form.DateField({
          allowBlank:true,
          emptyText:'YYYY-mm-dd',
          format:'Y-m-d',
          name:tmp,
          selectOnFocus:true,
          startDay:1,
          value:'',
        }); 
      }else{
        var item = createRemoteMenu({
          baseParams:{getMeta:name},
          name:tmp
        });
      }
      if(item){
        select.add(item);
        panel.form.add(item);
        select.doLayout();
      }
      panel.insert(0,select);
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
