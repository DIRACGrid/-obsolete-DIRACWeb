var gBroker = new Object(); // Used to tight components on this page
var cache = new Object(); // Used to store cached data
function init( initSelection ){
  Ext.onReady( function(){
    Ext.override ( Ext.PagingToolbar , {
      onRender : Ext.PagingToolbar.prototype.onRender.createSequence(
        function( ct , position ){
          this.loading.removeClass('x-btn-icon');
          this.loading.setText('Refresh');
          this.loading.addClass('x-btn-text-icon');
        }
      )
    });
    updateCache();
    var files = initFilesPanel();
    var query = initValuePanel( initSelection );
    var panel = new Ext.Panel({
      border      : false
      ,split      : true
      ,layout     : 'border'
      ,region     : 'center'
      ,cmargins   : '2 2 2 2'
      ,items      : [ query , files ]
    });
    var navigation = sideBar();
    var metaPanel = initMetaPanel();
    navigation.insert( 0 , metaPanel );
    navigation.setTitle( 'MetadataCatalog' );
    renderInMainViewport([ navigation, panel ]);
  });
}
function updateCache( value ){
  if( ! value ){
    value = '';
  }
  var params = { getCache : value };
  Ext.Ajax.request({
    method        : 'POST'
    ,params       : params
    ,success      : function( response  ){
      response.responseText ? response = response.responseText : '';
      var data = Ext.util.JSON.decode(  response  );
    }
    ,timeout      : 10000
    ,url          : 'action'
  });
}
function guerySubmit(){
  if( ! gBroker.queryPanel || ! gBroker.queryPanel.layout ){
    return false;
  }
  if(  ! gBroker.valuesStore  ){
    return false;
  }
  var store = gBroker.valuesStore;
  var checked = new Array();
  for ( var i = 0;  i < store.getCount(); i++ ){
    if( store.getAt( i ).data.Chk ){
      checked.push( store.getAt( i ).data.Name  );
    }
  }
  gBroker.queryPanel.setTitle( 'Metadata Query' );
  gBroker.queryPanel.layout.setActiveItem( 0 );
}
function metaLogic(){
  if( ! gBroker.metaPanel || ! gBroker.valuesStore || ! gBroker.valuesGrid ){
    return false;
  }
  var grid = gBroker.metaPanel;
  var store = gBroker.valuesStore;
  var panel = gBroker.valuesGrid;
  if( ! gBroker.queryPanel ){
    return false;
  }
  grid.addListener( 'rowclick' , function( grid , rowIndex ){
    try{
      var record = grid.getStore().getAt( rowIndex );
      if(record.data.Name){
        var meta = record.data.Name;
        if( meta ){
          gBroker.valuesGrid.setTitle( meta );
          if( cache[meta] ){
            store.loadData( cache.meta );
          }
          gBroker.queryPanel.layout.setActiveItem( 1 );
        }
      }else{
        showError( 'record.data.Name is absent' );
      }
    }catch(e){
      showError( e.message );
    }
  });
  return true;
}
function valuesLogic(){
  if( ! gBroker.valuesStore || ! gBroker.valuesGrid ){
    return false;
  }
  var store = gBroker.valuesStore;
  var grid = gBroker.valuesGrid;
  grid.addListener( 'rowclick' , function( grid , rowIndex ){
    try{
      var record = store.getAt( rowIndex );
      if( record.get( 'Chk' ) ){
        record.set( 'Chk' , false );
      }else{
        record.set( 'Chk' , true );
      }
      record.commit();
    }catch(e){
      showError( e.message );
    }
  });
  return true
}
function checkd(check){
  if(check){
    return '<img src="'+gURLRoot+'/images/iface/checked.gif">';
  }else{
    return '<img src="'+gURLRoot+'/images/iface/unchecked.gif">';
  }
}
function initValuePanel(){
  var form = selectPanelReloaded( gBroker.filesPanel );
  if( ! form  ){
    return false;
  }
  var button = new Ext.Button({
    cls           : 'x-btn-text-icon'
    ,handler      : guerySubmit
    ,icon         : gURLRoot + '/images/iface/submit.gif'
    ,text         : 'Select'
    ,tooltip      : 'Confirm selected values and switch to query panel'
  });
  var store = new Ext.data.JsonStore({
    fields        : [ 'Name' , 'Chk' ],
    root          : 'result',
  });
  gBroker.valuesStore = store;
  var columns = [{
    dataIndex     : 'Chk',
    id            : 'sl1',
    renderer      : checkd,
    width         : 26,
    fixed         : true,
    align         : 'left',
    menuDisabled  : true,
    sortable      : false,
    css           : 'cursor:pointer;cursor:hand;'
  },{
    dataIndex     : 'Name',
    id            : 'sl2',
    align         : 'left',
    editable      : false,
    sortable      : false,
    css           : 'cursor:pointer;cursor:hand;'
  }];
  var tbar = new Ext.Toolbar({
    items         : [
                  {   text   :  '>' }
                  ,{  text   :  '<'  }
    ]
  });
  var bbar = new Ext.Toolbar({  items : [ button ]  });
  var grid = gridContainer({
    bbar          : bbar
    ,columns      : columns
    ,store        : store
    ,title        : 'Form a query'
    ,tbar         : tbar
  });
  gBroker.valuesGrid = grid;
  var logic = valuesLogic()
  if( ! logic  ){
    return false;
  }
  form.add( grid );
  form.region = 'west';
  form.buttons[ 2 ].hide();
  return form
}
function initMetaPanel( ){
  var button = new Ext.Button({
    cls           : 'x-btn-text-icon',
    handler       : function(){ store.reload() },
    icon          : gURLRoot + '/images/iface/refresh.gif',
    text          : 'Refresh',
    tooltip       : 'Updates the list of selectors',
  });
  var store = new Ext.data.JsonStore({
    autoLoad      : true,
    baseParams    : { 'getSelectorGrid' : true },
    fields        : [ 'Name' , 'Type' ],
    idProperty    : 'Name',
    root          : 'result',
    url           : 'action'
  });
  var columns = [{
    dataIndex     : 'Type',
    id            : 'sl1',
    renderer      : status,
    width         : 26,
    fixed         : true,
    align         : 'left',
    menuDisabled  : true,
    sortable      : false,
    css           : 'cursor:pointer;cursor:hand;'
  },{
    dataIndex     : 'Name',
    id            : 'sl2',
    align         : 'left',
    editable      : false,
    sortable      : false,
    css           : 'cursor:pointer;cursor:hand;'
  }];
  var bbar = new Ext.Toolbar({  items : [ button ]  });
  var grid = gridContainer({
    bbar          : bbar 
    ,columns      : columns
    ,region       : 'west'
    ,store        : store
  });
  gBroker.metaPanel = grid;
  var logic = metaLogic()
//  if( ! logic  ){
//    return false;
//  }
  return grid
}
function gridContainer(  config  ){
  if ( ! config || ! config.columns || ! config.store ){
    return false
  }
  var grid = new Ext.grid.GridPanel({
    anchor        : '-15'
    ,autoScroll   : true
    ,bbar         : config.bbar ? config.bbar : ''
    ,border       : false
    ,columns      : config.columns
    ,enableHdMenu : false
    ,hideHeaders  : true
    ,loadMask     : true
    ,split        : true    
    ,store        : config.store
    ,stripeRows   : true
    ,title        : config.title ? config.title : 'Default'
    ,tbar         : config.tbar ? config.tbar : ''
    ,width        : 200
    ,viewConfig   : { forceFit  : true , scrollOffset : 1 }
  });
  if( config.region ){
    grid.region = config.region;
  }
  grid.addListener( 'resize' , function(){
    var bar = new Object();
    bar.top = this.getTopToolbar();
    bar.bottom = this.getBottomToolbar();
    var width = this.getInnerWidth();
    for( var i in bar){
      if( bar[i] ){
        var tmpBar = bar[i];
        var items = tmpBar.items.getCount();
        if( ! items > 0 ){
          continue
        }
        var tmpWidth = width / items ;
        tmpWidth = tmpWidth - 4;
        for( var i = 0; i < items; i++ ){
          var oldButton = tmpBar.items.items[ i ];
          var newButton = oldButton.cloneConfig({ minWidth  : tmpWidth });
          Ext.fly( tmpBar.items.get( i ).getEl() ).remove();
          tmpBar.items.removeAt( i );
          tmpBar.insertButton( i , newButton );          
        }
      }
    }
    this.doLayout();
  });
  return grid
}
function addSelector( meta , form ){
  if( ! form ){
    return
  }
  var store = form.getStore();
  if ( ! store ){
    return
  }
  store.loadData({"result":[{"Type": "varchar(128)", "Name": "EvtType"}, {"Type": "int", "Name": "NumberOfEvents"}, {"Type": "int", "Name": "BXoverlayed"}, {"Type": "datetime", "Name": "StartDate"}]});
  form.doLayout();
}
function initFilesPanel(){
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
  gBroker.filesPanel = dataTable;
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
