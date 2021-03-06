var gBroker = new Object() ; // Used to tight components on this page
var cache = new Object() ; // Used to store cached data
function init( initSelection ){
  Ext.onReady( function(){
    Ext.override ( Ext.PagingToolbar , {
      onRender : Ext.PagingToolbar.prototype.onRender.createSequence(
        function( ct , position ){
          this.loading.removeClass('x-btn-icon') ;
          this.loading.setText('Refresh') ;
          this.loading.addClass('x-btn-text-icon') ;
        }
      )
    }) ;
    updateCache() ;
    var files = initFilesPanel() ;
    var query = initQueryPanel( initSelection ) ;
    var panel = new Ext.Panel({
      border          : false
      ,split          : true
      ,layout         : 'border'
      ,region         : 'center'
      ,cmargins       : '2 2 2 2'
      ,items          : [ query , files ]
    }) ;
    var navigation = sideBar() ;
    var metaPanel = initMetaPanel() ;
    navigation.insert( 0 , metaPanel ) ;
    navigation.setTitle( 'MetadataCatalog' ) ;
    renderInMainViewport([ navigation, panel ]) ;
//    addMenu(); todo: remove entry and function if splitbutton is enough
  }) ;
}
function updateCache( value ){
  if( ! value ){
    value = '' ;
  }
  var params = { getCache : value };
  Ext.Ajax.request({
    method            : 'POST'
    ,params           : params
    ,success          : function( response  ){
                          response.responseText ? response = response.responseText : '';
                          var data = Ext.util.JSON.decode( response );
                          if( data && data.result ){
                            cache = data.result;
                          }
                        }
    ,timeout          : 10000
    ,url              : 'action'
  });
}
function rmQuerySelector( item ){
  if( ! gBroker.queryPanel || ! gBroker.queryPanel.isXType( 'panel' , true ) ){
    return showError( 'queryPanel is absent or unaccessible' ) ;
  }
  if( ! item.isXType( 'toolbar' , true ) ){
    return showError( 'rmQuerySelector function expect toolbar as argument' ) ;
  }
  gBroker.queryPanel.remove( item ) ;
}
function querySelector( metaname , type ){
  var label = new Ext.Toolbar.TextItem({
    text: metaname + ': ' 
  }) ; 
  // TODO: check the length of the text in the label and decrease it if needed
  var menu = new Ext.menu.Menu({
    items: [{
                          handler : function(){
                                      button.value = '=' ;
                                      button.setIconClass( 'Equal' ) ;
                                    }
                          ,iconCls: 'Equal'
                          ,text   : 'Equal to'
                        },{
                          handler : function(){
                                      button.value = '!=' ;
                                      button.setIconClass( 'NotEqual' ) ;
                                    }
                          ,iconCls: 'NotEqual'
                          ,text   : 'Not equal to'
                        },{
                          handler : function(){
                                      button.value = '>' ;
                                      button.setIconClass( 'Greater' ) ;
                                    }
                          ,iconCls: 'Greater'
                          ,text   : 'Greater then'
                        },{
                          handler : function(){
                                      button.value = '<' ;
                                      button.setIconClass( 'Less' ) ;
                                    }
                          ,iconCls: 'Less'
                          ,text   : 'Less then'
                        },{
                          handler : function(){
                                      button.value = '>=' ;
                                      button.setIconClass( 'GreaterEqual' ) ;
                                    }
                          ,iconCls: 'GreaterEqual'
                          ,text   : 'Greater then or equal to'
                        },{
                          handler : function(){ 
                                      button.value = '<=' ;
                                      button.setIconClass( 'LessEqual' ) ;
                                    }
                          ,iconCls: 'LessEqual'
                          ,text   : 'Less then or equal to'
                        }]
  });
  var button = new Ext.Button({
    cls: 'x-btn-icon'
    ,ctCls: 'paddingButton'
    ,icon: gURLRoot + '/images/iface/equal.gif'
    ,minWidth: '25'
    ,menu: menu
    ,value: '='
  });
  var selector = new Ext.form.ComboBox({
    anchor: '-15',
    displayField: 'name',
    emptyText: 'Select item from the menu',
    fieldLabel: metaname,
    forceSelection: true,
    name: metaname,
    loadingText: 'Loading...',
    mode: 'remote',
    selectOnFocus: true,
    store: new Ext.data.JsonStore({
      baseParams: { getValue: metaname },
      fields: [ 'name' ],
      root: 'result',
      url: 'getMetadata'
    }),
    typeAhead:true
  });
  selector.forceSelection = false;
  if( type == 'datetime' ){
    selector = new Ext.form.DateField({
      emptyText: 'YYYY-mm-dd'
      ,format: 'Y-m-d'
      ,name: metaname
      ,selectOnFocus: true
      ,startDay: 1
      ,value: ''
    });
  }
  selector.setWidth( 100 ) ;
  if( type.indexOf( 'char' ) > 0 ){
    selector.setWidth( 140 );
    button = '';
  }
  selector.ctCls = 'paddingButton';
  selector.on( 'collapse' , function( me ){
    getCompatible( metaname , me.getRawValue() );
  });
  selector.on( 'beforequery' , function( q ){
    selector.store.reload({
      params: getMetadata( selector )
    });
    q.cancel = true;
    return q;
  });
  var reset = new Ext.Button({
    cls: 'x-btn-icon'
    ,ctCls: 'paddingButton'
    ,handler: function(){ selector.reset() }
    ,icon: gURLRoot + '/images/iface/resetButton.gif'
    ,minWidth: '25'
  });
  reset.on( 'click' , function(){
    var store = gBroker.metaPanel.getStore()
    store.clearFilter();
    if( store.myFilter ){
      delete store.myFilter;
    }
    getCompatible( metaname , '' );
  });
  var kill = new Ext.Button({
    cls: 'x-btn-icon'
    ,ctCls: 'paddingButton'
    ,handler: function(){ rmQuerySelector( bar ) }
    ,icon: gURLRoot + '/images/iface/close.gif'
    ,minWidth: '25'
    ,style: 'margin: 5px !important;'
  });
  var bar = new Ext.Toolbar({
    cls: 'metaselect'
    ,items: [
      label
      , '->'
      , button
      , selector
      , reset
      , kill
    ]
    ,width: 300
  });
  bar.on( 'render' , function( el , position ){
    el.removeClass( 'x-toolbar' );
  });
  bar.on( 'disable' , function(){
    selector.disable();
  });
  bar.on( 'enable' , function(){
    selector.enable();
  });
  return bar
}
function getMetadata( selector ){
  var params = new Object();
  var path = "/"
  try{
    var store = gBroker.filesPanel.getStore();
    path = store.path;
  }catch( error ){
    showError( 'Failed to get directory path. Starting from root' );
  }
  params.path = path;
  var query = gBroker.queryPanel.items;
  if( query.getCount() < 1 ){
    return params
  }
  for( var i = 0 ; i < query.getCount() ; i++ ){
    var item = query.itemAt( i );
    var selector = item.initialConfig.items[ 3 ] ;
    if( Ext.isEmpty( selector ) ){
      continue;
    }
    var value = selector.getRawValue();
    if( ! Ext.isEmpty( value ) ){
      params[ '_compatible_' + selector.name ] = value;
    }
  }
  return params
}
function getCompatible( meta , value ){
  var path = "/"
  try{
    var store = gBroker.filesPanel.getStore();
    path = store.path;
  }catch( error ){
    showError( 'Failed to get directory path. Starting from root' );
  }
  Ext.Ajax.request({
    method: 'POST'
    ,params: { meta : meta , value : value , path: path }
    ,success: function( response  ){
      response.responseText ? response = response.responseText : '';
      var data = Ext.util.JSON.decode( response );
      if( Ext.isEmpty( data.result ) ){
        return
      }
      data.result[ meta ] = true;

      for( var i = 0 ; i < gBroker.queryPanel.items.getCount() ; i++ ){
        var item = gBroker.queryPanel.items.itemAt( i ) ;
        var selector = item.initialConfig.items[ 3 ] ;
        if( Ext.isEmpty( selector ) ){
          continue;
        }
        if( data.result[ selector.name ] ){
          item.enable();
        }else{
          item.disable();
        }
      }

      var store = gBroker.metaPanel.getStore();
      var reg = new Array( meta );
      for( var i in data.result ){
        reg.push( i );
      }
      store.myFilter = new RegExp( reg.join( '|' ) );
      store.filter( 'Name' , store.myFilter );
    }
    ,timeout: 10000
    ,url: 'getCompatible'
  });
}
function metaLogic(){
  if( ! gBroker.metaPanel || ! gBroker.queryPanel ){
    return false ;
  }
  var grid = gBroker.metaPanel ;
  var query = gBroker.queryPanel ;
  grid.addListener( 'rowclick' , function( grid , rowIndex ){
    try{
      var record = grid.getStore().getAt( rowIndex ) ;
      if( ! record.data.Name){
        return showError( 'metaLogic: record.data.Name is absent' ) ;
      }
      if( ! record.data.Type){
        return showError( 'metaLogic: record.data.Type is absent' ) ;
      }
      var meta = record.data.Name ;
      var type = record.data.Type
      var newSelector = querySelector( meta , type ) ;
      query.add(newSelector) ;
      query.doLayout() ;
    }catch(e){
      showError( e.message ) ;
    }
  });
  return true ;
}
function submitMetaQuery( panel ){
  if( ! panel || ! panel.isXType( 'panel' , true ) ){
    return showError( 'submitMetaQuery: expect ExtJS panel as first argument' ) ;
  }
  if( ! gBroker.filesPanel || ! gBroker.filesPanel.isXType( 'grid' , true )){
    var msg = 'submitMetaQuery: expect ExtJS grid at gBroker.filesPanel' ;
    return showError( msg ) ;
  }
  var grid = gBroker.filesPanel ;
  var store = grid.getStore() ;
  if( ! store ){
    var msg = 'submitMetaQuery: GridStore for gBroker.filesPanel is undefined' ;
    return showError( msg ) ;
  }
  var params = new Object() ;
  var len = panel.items.getCount() ;
  for( var i = 0 ; i < len ; i++ ){
    var item = panel.items.itemAt( i ) ;
    var selector = item.initialConfig.items[ 3 ] ;
    if( ! selector ){
      continue ;
    }
    var name = selector.getName() ;
    if( ! name ){
      continue ;
    }
    var value = selector.getValue() ;
    if( ! value ){
      continue
    }
    if( selector.isXType( 'datefield' , true ) ){
      var year = value.getUTCFullYear() ;
      var month = value.getUTCMonth() ;
      if( month < 10 ){
        month = '0' + month ;
      }
      var day = value.getUTCDate() ;
      if( day < 10 ){
        day = '0' + day ;
      }
      value = year + '-' + month + '-' + day ;
    }
    var logic = item.items.items[ 2 ].value ;
    if( ! logic ){
      logic = '=' ;
    }
    var id = Ext.id() ;
    params[ id + '.' + logic + '.' + name ] = value ;
  }
  if( ! store.path ){
    store.path = '/' ;
  }
  params['path'] = store.path ;
  store.baseParams = params ;
  store.load() ;
}
function initQueryPanel( selection ){
  function resetFilter(){
    var store = gBroker.metaPanel.getStore();
    store.clearFilter();
    if( store.myFilter ){
      delete store.myFilter;
    }
  }
  var submit = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ submitMetaQuery( panel ) }
    ,icon             : gURLRoot + '/images/iface/submit.gif'
    ,text             : 'Submit'
  }) ;
  var reset = new Ext.Button({
    cls: 'x-btn-text-icon'
    ,handler: function(){
      removePanelItems( panel );
      resetFilter();
    }
    ,icon: gURLRoot + '/images/iface/reset.gif'
    ,text: 'Reset'
    ,width: 100
  }) ;
  var label = new Ext.Toolbar.TextItem({
    text              : 'Path to start from: ' 
  }) ;
  var reg = new RegExp( /^[a-zA-Z0-9\"\'\|\{\}\.\/;\\\[\]\-=+_,`()%\^\$#!@~&*:<>\? ]+$/ ) ;
  var altText = 'Valid characters are corresponds to IBM PC keyboard layout' ;
  var value = '';
  try{
    value = dataSelect.extra.name;
    delete dataSelect.extra.name;
  }catch(e){}
  var path =  new Ext.form.TextField({
    anchor:'-15',
    allowBlank:true,
    enableKeyEvents:true,
    fieldLabel:'',
    mode:'local',
    name:'dfc_path',
    regex:reg,
    regexText:altText,
    selectOnFocus:true,
    value:value
  })
  path.on( 'valid' , addPath2Store ) ;
  path.setValue( '/' ) ;
  var pathReset = new Ext.Button({
    cls               : 'x-btn-icon'
    ,handler          : function(){ path.reset() }
    ,icon             : gURLRoot + '/images/iface/reset.gif'
    ,minWidth         : '25'
  }) ;
  var tbar = new Ext.Toolbar({ items : [ label , path , pathReset ] }) ;
  var bbar = new Ext.Toolbar({ items : [ submit , reset ] }) ;
  var panel = new Ext.Panel({
    autoScroll        : true
    ,bbar             : bbar
    ,border           : true
    ,cmargins         : '2 2 2 2'
    ,layout           : 'column'
    ,margins          : '2 0 2 0'
    ,minWidth         : 315
    ,region           : 'west'
    ,split            : true
    ,tbar             : tbar
    ,title            : 'Metadata Query'
    ,width            : 315
    ,viewConfig       : { forceFit  : true , scrollOffset : 1 }
  });
  panel.addListener( 'remove' , function(){
    if( panel.items.getCount < 1 ){
      resetFilter();
    }
  });
  panel.addListener( 'resize' , function(){
    var width = this.getInnerWidth();
    var newSubmit = submit.cloneConfig({ minWidth  : ( ( 2 * width ) / 3 ) - 4 }) ;
    var newReset = reset.cloneConfig({ minWidth  : ( ( width ) / 3 ) - 4 }) ;
    for( var i = 1 ; i > -1 ; i-- ){
      Ext.fly( bbar.items.get( i ).getEl() ).remove() ;
      bbar.items.removeAt( i ) ;
    }
    bbar.insertButton( 0 , newSubmit ) ;
    bbar.insertButton( 1 , newReset ) ;
    var button = tbar.items.items[2] ;
    var bWidth = button.getEl().getWidth() ;
    var nWidth = width - bWidth - 98 ;
    path.setWidth( nWidth ) ;
    if( ! panel.items ){
      return
    }
    if( panel.items.getCount() < 1 ){
      return
    }
    for( i = 0 ; i < panel.items.getCount() ; i++ ){
      var tmpItem = panel.getComponent( i );
      tmpItem.setWidth( width - 15 );
    }
  });
  gBroker.queryPanel = panel ;
  return panel
}
function initMetaPanel( ){
  var button = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ store.reload() }
    ,icon             : gURLRoot + '/images/iface/refresh.gif'
    ,text             : 'Refresh'
    ,tooltip          : 'Updates the list of selectors'
  });
  var store = new Ext.data.JsonStore({
    autoLoad          : true
    ,baseParams       : { 'getSelectorGrid' : true }
    ,fields           : [ 'Name' , 'Type' ]
    ,idProperty       : 'Name'
    ,root             : 'result'
    ,sortInfo         : { field: 'Name' , direction: 'ASC' }
    ,url              : 'action'
  });
  store.on( 'load' , function(){
    if( store.myFilter ){
      store.filter( 'Name' , store.myFilter );
    }
  });
  var columns = [{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'Type'
    ,fixed            : true
    ,id               : 'sl1'
    ,renderer         : metastatus
    ,menuDisabled     : true
    ,sortable         : false
    ,width            : 26
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'Name'
    ,editable         : false
    ,id               : 'sl2'
    ,sortable         : false
  }];
  var bbar = new Ext.Toolbar({ items : [ button ] });
  var grid = gridContainer({
    bbar              : bbar 
    ,columns          : columns
    ,region           : 'west'
    ,store            : store
    ,title            : 'Metadata tags'
  });
  gBroker.metaPanel = grid;
  var logic = metaLogic()
  if( ! logic  ){
    return false;
  }
  return grid
}
function gridContainer(  config  ){
  if ( ! config || ! config.columns || ! config.store ){
    return false
  }
  var grid = new Ext.grid.GridPanel({
    anchor            : '-15'
    ,autoScroll       : true
    ,bbar             : config.bbar ? config.bbar : ''
    ,border           : false
    ,columns          : config.columns
    ,enableHdMenu     : false
    ,hideHeaders      : true
    ,loadMask         : true
    ,split            : true    
    ,store            : config.store
    ,stripeRows       : true
    ,title            : config.title ? config.title : 'Default'
    ,tbar             : config.tbar ? config.tbar : ''
    ,width            : 200
    ,viewConfig       : { forceFit : true , scrollOffset : 1 }
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
function initFilesPanel(){
  var record = new Ext.data.Record.create([
    { name: 'filename' }
    ,{ name: 'size' }
    ,{ dateFormat:'Y-n-j h:i:s' , name: 'date' , type: 'date' }
    ,{ name: 'metadata' }
  ]);
  var sm = new Ext.grid.CheckboxSelectionModel({
    header: ''
  }) ;
  var columns = [
    sm
  ,{
    align:'left'
    ,dataIndex: 'filename'
    ,header: 'File Name'
    ,sortable: true
  },{
    align:'left'
    ,dataIndex: 'size'
    ,header: 'Size'
    ,sortable: true
    ,width: 120
  },{
    align:'left'
    ,dataIndex: 'date'
    ,header: 'Date'
    ,renderer: Ext.util.Format.dateRenderer( 'Y-m-d H:i' )
    ,sortable: true
    ,width: 120
  },{
    align:'left'
    ,dataIndex: 'metadata'
    ,header: 'Metadata'
    ,sortable: true
  }];
  var store = new Ext.data.Store({
    reader: new Ext.data.JsonReader({
      root: 'result'
      ,totalProperty: 'total'
    } , record )
    ,view: new Ext.grid.GridView({ autoFill: true , forceFit: true })
    ,url: 'submit'
  });
  store.on('loadexception',function(){
    // If the returned JSON data is not correct
    try{
      if( store.reader.jsonData.success == 'false' ){
        if( ! Ext.isEmpty(store.reader.jsonData.error )){
          alert( store.reader.jsonData.error );
        }else{
          alert( "Undefined error. Maybe trying again will solve the problem. Otherwise, see with the experts.")
        }
      }
    }catch(e){
      alert("There is an exception while loading data. Please, refresh table");
    }
    dataTable.getStore().removeAll();
  });

  store.on( 'load' , function(records){
    var disable = true;
    if(records && records.totalLength && records.totalLength > 0){
      disable = false;
    }
    var toolbar = dataTable.getTopToolbar();
    if(!toolbar){
      return errorReport('Unable to get toolbar of dataTable component');
    }
    for( var i=0 ; i < toolbar.items.getCount() ; i++ ){
      try{
        toolbar.items.itemAt(i).setDisabled( disable );
      }catch(e){}
    }
  });
  var tbar = [ new Ext.Toolbar.SplitButton({
    cls:"x-btn-text-icon",
    handler:function(){
      showFiles( dataTable , ', ');
    },
    disabled:true,
    icon:gURLRoot+'/images/iface/jdl.gif',
    menu: new Ext.menu.Menu({
		  items: [
        {handler: function(){ showFiles( dataTable , ' ') } , text : 'Space separated' },
        {handler: function(){ showFiles( dataTable , ', ') } , text : 'Comma separated' },
        {handler: function(){ showFiles( dataTable , '; ') } , text: 'Semicolon separated' },
		  ]
		}),
    text:'Export',
    tooltip:'Click to display selected filenames as text'

  }),{
    cls:"x-btn-text-icon",
    handler:function(){
      save(this, dataTable);
    },
    disabled:true,
    icon:gURLRoot+'/images/iface/save.gif',
    text:'Save',
    tooltip:'Click to save selected data'
  }];
  /*
  var dataTable = new Ext.grid.GridPanel({
    autoHeight:false,
    bbar: new Ext.PagingToolbar({
      displayInfo: true
      ,pageSize: store.getTotalCount()
      ,refreshText:'Click to refresh current page'
      ,store: store
    }),
    columns:columns,
    labelAlign:'left',
    margins:'2 0 2 0',
    id:'FilePanel',
    region:'center',
    split:true,
    store:store,
    stripeRows:true,
    tbar:tbar
    ,view: new Ext.grid.GridView({ autoFill: true , forceFit: true })
  });
  */
  var dataTable = new getDatagrid({
    autorefresh: true
    ,columns: columns
    ,region: 'center'
    ,menu: undefined
    ,sm: sm
    ,split: true
    ,store: store
    ,tbar: tbar
    ,view: new Ext.grid.GridView({ autoFill: true , forceFit: true })
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
function displayWin(panel,title){
	  var window = new Ext.Window({
	    iconCls:'icon-grid',
	    closable:true,
	    autoScroll:true,
//	    autoHeight:true,
	    width:600,
	    height:350,
	    border:true,
	    collapsible:true,
	    constrain:true,
	    constrainHeader:true,
	    maximizable:true,
	    layout:'fit',
	    plain:true,
	    shim:false,
	    title:"ID: " + title,
	    items:[panel]
	  })
	  window.show()
	}
function showFiles( grid , separator ){
  var record = grid.getSelectionModel().getSelections();
  var items = [];
  for( var k = 0 ; k < record.length ; k++ ){
    items.push( record[ k ].get( 'filename' ) );
  }
  if( items.length < 1 ){
    return showError( 'No files were selected' );
  }
  if( items.length < 25 ){
    return Ext.Msg.alert( 'Files' , items.join( separator ) );
  }
  panel = new Ext.Panel({
    autoScroll: true
    ,border: 0
    ,html: items.join( separator )
    ,layout: 'fit'
  });
  return displayWin( panel , 'Files' );
}
function errorReport( strobj ){
	  var prefix = 'Error: ' ;
	  var postfix = '' ;
	  var error = 'Action has finished with error' ;
	  if( ! strobj ){
	    return alert( prefix + error + postfix ) ;
	  }
	  if( strobj.substring ){
	      error = strobj ;
	  }else{
	    try{
	      if( strobj.failureType == 'connect' ){
	        error = 'Can not recieve service response' ;
	      }
	    }catch(e){}
	    try{
	      error = error + '\nService Response: ' + strobj.statusText ;
	    }catch(e){}
	  }
	  return alert( prefix + error + postfix ) ;
	}
function save(button, table){
  button.setIconClass('Loading');
  var record = table.getSelectionModel().getSelections();
  var items = [];
  var files = ''
  for( var k = 0 ; k < record.length ; k++ ){
    files = files + record[ k ].get( 'filename' ) + ',';
  }
  files = files.replace(/,$/,'');
  if( files =='' ){
	  return errorReport("No files selected")
  }
  Ext.Ajax.request({
    failure:function(response){
      button.setIconClass('Save');
      var message = (response.responseText) ? response.responseText : 'Connection error';
      return errorReport(message);
    },
    method:'POST',
    params:{getFile:files},
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
function removePanelItems( panel ){
  if( ! panel || ! panel.isXType( 'panel' , true ) ){
    return showError( 'removePanelItems expect panel as first argument' ) ;
  }
  var len = panel.items.getCount() ;
  if( len < 0 ){
    return false ;
  }
  for( var i = len ; i > -1 ; i-- ){
    var item = panel.items.itemAt( i ) ;
    panel.remove( item ) ;
  }
}
function addPath2Store( path ){
  var path = path.getValue() ;
  if( ! gBroker.filesPanel || ! gBroker.filesPanel.isXType( 'grid' , true )){
    var msg = 'addPath2Store: expect ExtJS grid at gBroker.filesPanel' ;
    return showError( msg ) ;
  }
  var grid = gBroker.filesPanel ;
  var store = grid.getStore() ;
  if( ! store ){
    var msg = 'addPath2Store: GridStore for gBroker.filesPanel is undefined' ;
    return showError( msg ) ;
  }
  store.path = path ;
}
function metastatus( value ){
  if( value == 'varchar(128)' ){
    return '<img src="' + gURLRoot + '/images/iface/str.gif">' ;
  }else if( value == 'int' ){
    return '<img src="' + gURLRoot + '/images/iface/int.gif">' ;
  }else if( value == 'datetime' ){
    return '<img src="' + gURLRoot + '/images/iface/date.gif">' ;
  }else{
    return '<img src="' + gURLRoot + '/images/monitoring/unknown.gif">' ;
  }
}
function afterDataLoad(){}
