var gBroker = new Object() ; // Used to tight components on this page
var cache = new Object() ; // Used to store cached data
function init( initSelection ){
  Ext.onReady( function(){
    Ext.override ( Ext.PagingToolbar , {
      onRender : Ext.PagingToolbar.prototype.onRender.createSequence(
        function( ct , position ){
          this.first.hide();
          for( var i = 9 ; i > 0 ; i-- ){
            if( Ext.isEmpty( this.items.get( i ) ) ){
              continue;
            }
            Ext.fly( this.items.get( i ).getEl() ).remove() ;
            this.items.removeAt( i ) ;
          }
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
    text              : metaname + ': ' 
  }) ; 
  // TODO: check the length of the text in the label and decrease it if needed
  var menu = new Ext.menu.Menu({
    items             : [{
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
  }) ;
  var button = new Ext.Button({
    cls               : 'x-btn-icon'
    ,ctCls            : 'paddingButton'
    ,icon             : gURLRoot + '/images/iface/equal.gif'
    ,minWidth         : '25'
    ,menu             : menu
    ,value            : '='
  }) ;
  var selector = createRemoteMenu({
    baseParams        : { 'getMeta' : metaname }
    ,name             : metaname
  });
  selector.forceSelection = false;
  if( type == 'datetime' ){
    selector = new Ext.form.DateField({
      emptyText       : 'YYYY-mm-dd'
      ,format         : 'Y-m-d'
      ,name           : metaname
      ,selectOnFocus  : true
      ,startDay       : 1
      ,value          : ''
    });
  }
  selector.setWidth( 100 ) ;
  if( type.indexOf( 'char' ) > 0 ){
    selector.setWidth( 140 ) ;
    button = '';
  }
  selector.ctCls = 'paddingButton' ;
  var reset = new Ext.Button({
    cls               : 'x-btn-icon'
    ,ctCls            : 'paddingButton'
    ,handler          : function(){ selector.reset() }
    ,icon             : gURLRoot + '/images/iface/resetButton.gif'
    ,minWidth         : '25'
  }) ; 
  var kill = new Ext.Button({
    cls               : 'x-btn-icon'
    ,ctCls            : 'paddingButton'
    ,handler          : function(){ rmQuerySelector( bar ) }
    ,icon             : gURLRoot + '/images/iface/close.gif'
    ,minWidth         : '25'
    ,style            : 'margin: 5px !important;'
  }) ;
  var bar = new Ext.Toolbar({
    cls               : 'metaselect'
    ,items            : [
                          label
                          , '->'
                          , button
                          , selector
                          , reset
                          , kill
                        ]
    ,width            : 300
  });
  bar.on( 'render' , function( el , position ){
    el.removeClass( 'x-toolbar' );
  })
  return bar
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
  var submit = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ submitMetaQuery( panel ) }
    ,icon             : gURLRoot + '/images/iface/submit.gif'
    ,text             : 'Submit'
  }) ;
  var reset = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ removePanelItems( panel ) }
    ,icon             : gURLRoot + '/images/iface/reset.gif'
    ,text             : 'Reset'
    ,width            : 100
  }) ;
  var label = new Ext.Toolbar.TextItem({
    text              : 'Path to start from: ' 
  }) ;
  var reg = new RegExp( /^[a-zA-Z0-9\"\'\|\{\}\.\/;\\\[\]\-=+_,`()%\^\$#!@~&*:<>\? ]+$/ ) ;
  var altText = 'Valid characters are corresponds to IBM PC keyboard layout' ;
  var path = genericID( 'dfc_path' , '' , reg , altText ) ;
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
  }) ;
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
    ,url              : 'action'
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
    {name:'filename'}
  ]);
  var columns = [
    {header:'',name:'checkBox',id:'checkBox',width:26,sortable:false,dataIndex:'filename',renderer:chkBox,hideable:false,fixed:true,menuDisabled:true},
    {header:'File Name',sortable:true,dataIndex:'filename',align:'left',width:'90%'}
  ];
  var store = new Ext.data.Store({
    reader            : new Ext.data.JsonReader({
                          root              : 'result'
                          ,totalProperty    : 'total'
                        },record)
    ,url              : 'submit'
  });
  store.on( 'beforeload' , function(){
    try{
      gMainLayout.container.mask('Loading...');
    }catch(e){}
  }) ;
  store.on( 'loadexception' , function(){
    try{
      gMainLayout.container.unmask();
    }catch(e){}
  }) ;
  store.on( 'load' , function(records){
    try{
      gMainLayout.container.unmask();
    }catch(e){}
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
  var tbar = [{
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ selectAll( 'all' ) }
    ,disabled         : true
    ,icon             : gURLRoot + '/images/iface/checked.gif'
    ,text             : 'Select All'
    ,tooltip          : 'Click to select all rows'
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
  }];
  var bbar = [ '->' , {
    text: 'Displaying 0 items'
  }];
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
