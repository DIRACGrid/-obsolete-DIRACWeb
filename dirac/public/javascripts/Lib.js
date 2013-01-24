function initAjax(){
  /*
  This function can be used for error catching and to add parameters before or
  after any ajax request. Right now it's used to remove mask from the body of
  the page upon the end of ajax calls. Since it's enhancing ExtJS Ajax singleton
  it should be called only once at the beggining of your JS code.
  */
  Ext.Ajax.on( 'requestcomplete' , function(){
    Ext.getBody().unmask() ;
  } , this ) ;
  Ext.Ajax.on( 'requestexception' , function( conn , response , options ){
    Ext.getBody().unmask() ;
  } , this ) ;
}
function aError( response , opt ){
  Ext.getBody().unmask();
  var error = 'Action has finished with error\n';
  if( ! Ext.isEmpty( response.failureType ) ){
    error = error + 'Type of failure: ' + response.failureType + '\n';
  }
  var service = 'Server response: ';
  if( ! Ext.isEmpty( response.status ) ){
    service = service + response.status + ' ';
  }
  if( ! Ext.isEmpty( response.statusText ) ){
    service = service + response.statusText + '\n';
  }
  if( service !== 'Server response: ' ){
    error = error + service;
  }
  return showError( error );
}
function ajax( cfg ){
  if( typeof cfg === 'undefined' ){
    return false ;
  }
  if( cfg.mask ){
    Ext.getBody().mask( cfg.msg ? cfg.msg : 'Communicating with server' ) ;
  }
  Ext.Ajax.request({
    failure: cfg.failure ? cfg.failure : aError
    ,headers: cfg.headers ? cfg.headers : undefined
    ,end: cfg.end ? cfg.end : new Ext.emptyFn
    ,method: cfg.method ? cfg.method : 'POST'
    ,params: cfg.params ? cfg.params : undefined
    ,success: cfg.success ? cfg.success : new Ext.emptyFn
    ,timeout: cfg.timeout ? cfg.timeout : 60000
    ,url: cfg.url ? cfg.url : 'action'
  });
}
function createMenu( dataName , title ){
  if( Ext.isEmpty( dataName ) ){
    return showError( 'Argument dataName is missing in createMenu call' );
  }
  if( Ext.isEmpty( title ) ){
    return showError( 'Argument title is missing in createMenu call' );
  }
  if( Ext.isEmpty( dataSelect ) ){
    return showError( 'Argument title is missing in createMenu call' );
  }
  var data = dataSelect[ dataName ];
  if(
    Ext.isEmpty( data ) || Ext.isEmpty( data[ 0 ] )
    || Ext.isEmpty( data[ 0 ][ 0 ] )
  ){
    data = [ [ 'Nothing to display' ] ];
  }
  var error = [
    'Error happened on service side'
    ,'Nothing to display'
    ,'Insufficient rights'
  ];
  var errorRegexp = new RegExp( '^(' + error.join( '|' ) + ')$' );
  var disabled = true ;
  if( ! errorRegexp.test( data[ 0 ][ 0 ] ) ){
    disabled = false ;
  }
  var store = new Ext.data.SimpleStore({
    data: data
    ,fields: [ 'value' ]
  });
  var combo = new dropdownMenu({
    combo: true
    ,disabled: disabled
    ,emptyText: data[ 0 ][ 0 ]
    ,fieldLabel: title
    ,name: dataName
    ,maxLength: 20
    ,store: store
    ,width: 80
  });
  combo.on( 'render' , function(){
    if(
      Ext.isEmpty( dataSelect ) || Ext.isEmpty( dataSelect[ 'extra' ] )
      || Ext.isEmpty( dataSelect[ 'extra' ][ dataName ] )
    ){
      return false;
    }
    var nameList = dataSelect[ 'extra' ][ dataName ].split( this.separator );
    var newValue = new Array();
    for( var j = 0 ; j < nameList.length ; j++ ){
      var re = new RegExp( nameList[ j ] , 'g' );
      if( store.find( 'value' , re ) != -1 ){
        newValue.push( nameList[ j ] );
      }
    }
    newValue = newValue.join( this.separator );
    combo.setValue( newValue );
    delete dataSelect.extra[ dataName ];
  });
  return combo;
}
function dropdownMenu( cfg ){
  if( typeof cfg === 'undefined' ){
    return false ;
  }
  if( ! cfg.store ){
    return false ;
  }
  var config = new Object({
    anchor            : cfg.anchor ? cfg.anchor : '-15'
    ,disabled         : cfg.disabled ? cfg.disabled : false
    ,displayField     : cfg.displayField ? cfg.displayField : 'value'
    ,emptyText        : cfg.emptyText ? cfg.emptyText : 'Select item from menu'
    ,fieldLabel       : cfg.fieldLabel ? cfg.fieldLabel : 'Default title'
    ,forceSelection   : cfg.forceSelection ? cfg.forceSelection : false
    ,hiddenName       : cfg.name ? cfg.name : 'set_in_cfg_' + Ext.id()
    ,hideOnSelect     : cfg.hideOnSelect ? cfg.hideOnSelect : false
    ,id               : cfg.id ? cfg.id : Ext.id()
    ,maxLength        : cfg.maxLength ? cfg.maxLength : 100
    ,mode             : cfg.mode ? cfg.mode : 'local'
    ,resizable        : cfg.resizable ? cfg.resizable : true
    ,selectOnFocus    : cfg.selectOnFocus ? cfg.selectOnFocus : true
    ,separator        : cfg.separator ? cfg.separator : ':::'
    ,store            : cfg.store
    ,triggerAction    : cfg.triggerAction ? cfg.triggerAction : 'all'
    ,typeAhead        : cfg.typeAhead ? cfg.typeAhead : true
    ,value            : cfg.value ? cfg.value : undefined
    ,valueField       : cfg.valueField ? cfg.valueField : 'value'
    ,visualseparator  : cfg.visualseparator ? cfg.visualseparator : ', '
    ,width            : cfg.width ? cfg.width : 'auto'
  })
  var combo = ( cfg.combo) ?
    new Ext.ux.form.LovCombo( config ) : new Ext.form.ComboBox( config ) ;
  combo.on( 'render' , function(){
    if( typeof dataSelect === 'undefined' || ! dataSelect.extra ){
      return
    }
    if( ! dataSelect.extra[ this.hiddenName ] ){
      return
    }
    var newValue = new Array() ;
    var selection = dataSelect.extra[ this.hiddenName ] ;
    var nameList = ( this.combo ) ?
      selection.split( this.separator ) : new Array( selection ) ;
    for( var i = 0 ; i < nameList.length ; i++ ){
      var re = new RegExp( nameList[ i ] , "g" ) ;
      if( this.store.find( 'value' , re ) != -1 ){
        newValue.push( nameList[ i ] ) ;
      }
    }
    newValue = ( this.combo ) ? 
      newValue.join( this.separator ) : newValue[ 0 ] ;
    combo.setValue( newValue ) ;
    delete dataSelect.extra[ this.hiddenName ] ;
  }) ;
  return combo;
}
function toolbarElementsAutoresize( bar , elements ){
  /*
  bar        : Object. Instance of Ext.Toolbar
  elements   : Array of objects. Items from toolbar items collection
  
  Function is checking for existance of passed elements in toolbar. Calculates
  the width without objects from elements array. Dividing the remain width by
  number of elements. New width should be more then 25 pixels. Set new width on
  per elements basis paying attention of kind of element. setWidth for form
  elements, create-delete-insertButton for toolbar buttons.

  Example:
  
    gridpanel.on( 'resize' , function(){
      toolbarElementsAutoresize( toolbar , [ button ] ) ;
    }) ;
    
  */
  if( ! bar.isXType( 'toolbar' , true ) ){
    return false ;
  }
  if( ! Ext.isArray( elements ) ){
    return false ;
  }
  var width = Ext.num( bar.getSize().width , 0 ) ;
  if( width == 0 ){
    return false ;
  }
  // initialConfig cuz bar.items contains already rendered items
  var clone = bar.initialConfig.items.slice() ;
  var index = new Object() ;
  var realItems = new Object() ;
  var realLength = 0 ;
  for( var i = 0 ; i < elements.length ; i++ ){
    var ind = clone.indexOf( elements[ i ] ) ;
    if( ind > -1 ){
      realItems[ ind ] = elements[ i ].getXType() ; // !!! TEST THIS
      index[ ind ] = elements[ i ] ;
      realLength++ ;
    }
  }
  if( ! realItems || ! realLength > 0 || ! index ){
    return false ;
  }
  width = width - 4 ;
  for( var i = 0 ; i < bar.items.getCount() ; i++ ){
    if( ! realItems[ i ] ){
      var id = bar.items.items[ i ].id ;
      var el = Ext.get( id ) ;
      var tmpW = Ext.num( el.getWidth() , 0 ) ;
      if( tmpW > 0 ){
        width = width - tmpW ;
      }
    }
  }
  if( width <= 0 ){
    return false ;
  }
  var setWidth = Math.floor( width / realLength ) ;
  if( ! setWidth > 25 ){
    return false ;
  }
  for( var i = 0 ; i < bar.items.getCount() ; i++ ){
    if( realItems[ i ] && index[ i ] ){
      if( index[ i ].setWidth ){
        index[ i ].setWidth( setWidth ) ;
        continue ;
      }
      if( realItems[ i ] == '' ){
        var tmp = clone[ i ].cloneConfig({ minWidth  : setWidth }) ;
        Ext.fly( bar.items.get( i ).getEl() ).remove() ;
        bar.items.removeAt( i ) ;
        bar.insertButton( i , tmp ) ;
      }
    }
  }
  return bar
}
function smartPositionX(){
  var minWidth = 350 ;
  var width = Ext.num( Ext.getBody().getViewSize().width , 640 ) ;
  var x = Ext.num( Ext.EventObject.xy[ 0 ] , 0 ) ;
  if( width - minWidth < x ){
    x = width - minWidth - 10 ;
  }
  x = x - 8 ;
  return x
}
function smartPositionY(){
  var minHeight = 200 ;
  var height = Ext.num( Ext.getBody().getViewSize().height , 480 ) ;
  var y = Ext.num( Ext.EventObject.xy[ 1 ] , 0 ) ;
  if( height - minHeight < y ){
    y = height - minHeight - 10 ;
  }
  y = y - 8 ;
  return y
}
function displayWindow( cfg ){
  var minWidth = 350 ;
  var minHeight = 200 ;
  if( ! cfg ){
    var cfg = new Object() ;
  }
  var submit = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : Ext.emptyFn
    ,icon             : gURLRoot + '/images/iface/advanced.gif'
    ,minWidth         : 150
    ,tooltip          : ''
    ,text             : 'Submit'
  }) ;
  var reset = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : Ext.emptyFn
    ,icon             : gURLRoot + '/images/iface/reset.gif'
    ,minWidth         : 80
    ,tooltip          : 'Click to reset values and restore defaults'
    ,text             : 'Reset'
  }) ;
  var close = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ win.close() }
    ,icon             : gURLRoot + '/images/iface/close.gif'
    ,minWidth         : 80
    ,tooltip          : 'Click to discard changes and close the window'
    ,text             : 'Close'
  }) ;
  var win = new Ext.Window({
    border            : true
    ,collapsible      : cfg.collapsible ? cfg.collapsible : false
    ,constrain        : cfg.constrain ? cfg.constrain : true
    ,constrainHeader  : cfg.constrainHeader ? cfg.constrainHeader : true
    ,closable         : cfg.closable ? cfg.closable : true
    ,buttonAlign      : 'center'
    ,buttons          : [ submit , reset , close ]
    ,height           : minHeight
    ,iconCls          : cfg.icon ? cfg.icon : 'icon-grid'
    ,layout           : 'fit'
    ,maximizable      : cfg.maximizable ? cfg.maximizable : false
    ,minHeight        : minHeight
    ,minWidth         : minWidth
    ,modal            : cfg.modal ? cfg.modal : true 
    ,plain            : false
    ,shim             : false
    ,title            : cfg.title ? cfg.title : 'Default title'
    ,width            : minWidth
    ,x                : smartPositionX
    ,y                : smartPositionY
  }) ;
  return win
}
function formWindow( cfg ){
  if( ! cfg ){
    var cfg = new Object() ;
  }
  var minWidth = 350 ;
  var width = Ext.num( Ext.getBody().getViewSize().width , 640 ) ;
  var x = Ext.num( Ext.EventObject.xy[ 0 ] , 0 ) ;
  if( width - minWidth < x ){
    x = width - minWidth - 10 ;
  }
  x = x - 8 ;
  var minHeight = 200 ;
  var height = Ext.num( Ext.getBody().getViewSize().height , 480 ) ;
  var y = Ext.num( Ext.EventObject.xy[ 1 ] , 0 ) ;
  if( height - minHeight < y ){
    y = height - minHeight - 10 ;
  }
  y = y - 8 ;
  var submit = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : Ext.emptyFn
    ,icon             : gURLRoot + '/images/iface/advanced.gif'
    ,minWidth         : 150
    ,tooltip          : ''
    ,text             : 'Submit'
  }) ;
  var reset = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : Ext.emptyFn
    ,icon             : gURLRoot + '/images/iface/reset.gif'
    ,minWidth         : 80
    ,tooltip          : 'Click to reset values and restore defaults'
    ,text             : 'Reset'
  }) ;
  var close = new Ext.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ win.close() }
    ,icon             : gURLRoot + '/images/iface/close.gif'
    ,minWidth         : 80
    ,tooltip          : 'Click to discard changes and close the window'
    ,text             : 'Close'
  }) ;
  var win = new Ext.Window({
    border            : true
    ,collapsible      : cfg.collapsible ? cfg.collapsible : false
    ,constrain        : cfg.constrain ? cfg.constrain : true
    ,constrainHeader  : cfg.constrainHeader ? cfg.constrainHeader : true
    ,closable         : cfg.closable ? cfg.closable : true
    ,buttonAlign      : 'center'
    ,buttons          : [ submit , reset , close ]
    ,height           : minHeight
    ,iconCls          : cfg.icon ? cfg.icon : 'icon-grid'
    ,layout           : 'fit'
    ,maximizable      : cfg.maximizable ? cfg.maximizable : false
    ,minHeight        : minHeight
    ,minWidth         : minWidth
    ,modal            : cfg.modal ? cfg.modal : true 
    ,plain            : false
    ,shim             : false
    ,title            : cfg.title ? cfg.title : 'Default title'
    ,width            : minWidth
    ,x                : x
    ,y                : y
  }) ;
  return win
}



function initStore(record,options,id){
  var reader = new Ext.data.JsonReader({
    root:'result',
    totalProperty:'total'
  },record);
  var limit = 25;
  var start = 0;
  try{
    if((!dataSelect)||(dataSelect == "")){
      dataSelect = {};
    }
  }catch(e){
    dataSelect = {};
  }
  try{
    if(!dataSelect.extra){
      dataSelect.extra = {};
    }
  }catch(e){
    dataSelect.extra = {};
  }
  try{
    if(!dataSelect.extra.limit){
      dataSelect.extra.limit = 25;
    }else{
      dataSelect.extra.limit = dataSelect.extra.limit/1;
    }
  }catch(e){
    dataSelect.extra.limit = 25;
  }
  try{
    if(!dataSelect.extra.start){
      dataSelect.extra.start = 0;
    }else{
      dataSelect.extra.start = dataSelect.extra.start/1;
    }
  }catch(e){
    dataSelect.extra.start = 0;
  }
  var auto = {};
  try{
    if(dataSelect.extra){
      auto = {params:dataSelect.extra};
    }else{
      auto = {params:{start:0,limit:25}};
    }
  }catch(e){
    auto = {params:{start:0,limit:25}};
  }
  var id = 'mainDataStore';
  if(options){
    if(options.auto){
      auto = false;
    }
    if(options.id){
      id = options.id;
    }
  }
  var url = 'submit';
  var groupBy = false;
  var params = [];
  if(options ){
    if(options.groupBy){
      groupBy = options.groupBy;
    }
    if(options.url){
      url = options.url;
    }
    if(options.params){
      params = options.params;
    }
  }
  if(groupBy){
    var store = new Ext.data.GroupingStore({
      autoLoad:auto,
      baseParams:params,
      groupField:groupBy,
      id:id,
      proxy: new Ext.data.HttpProxy({
        url:url,
        method:'POST',
      }),
      reader:reader
    });
  }else{
    var store = new Ext.data.Store({
      autoLoad:auto,
      baseParams:params,
      id:id,
      proxy: new Ext.data.HttpProxy({
        url:url,
        method:'POST',
        timeout:360000
      }),
      reader:reader
    });
  }
  store.on('loadexception',function(){
    try{
      if(store.reader.jsonData){
        if(store.reader.jsonData.success == 'false'){
          alert(store.reader.jsonData.error);
        }
      }else{
        alert("There is an exception while loading data. Please, refresh table");
      }
    }catch(e){
      alert("There is an exception while loading data. Please, refresh table");
    }
  });
  return store;
}
function flag(code){
  return '<img src="'+gURLRoot+'/images/flags/' + code + '.gif">';
}
function sideBar(){
  var panel = new Ext.Panel({
    autoScroll:true,
    split:true,
    region:'west',
    collapsible:true,
    width: 200,
    minWidth: 200,
    margins:'2 0 2 0',
    cmargins:'2 2 2 2',
    buttonAlign:'left',
    title:'DIRAC SideBar',
    layout:'accordion',
    layoutConfig:{
      titleCollapse:true,
      activeOnTop:false,
      border:false
    }
  });
  return panel;
}
function selectPanel( datagrid ){
  if( Ext.isEmpty( datagrid ) ){
    showError( 'selectPanel: Argument datagrid is missing' );
    return false
  }
  try{
    if( Ext.isEmpty( datagrid.getStore() ) ){
      showError( 'selectPanel: Data store is not available' );
      return false
    }
  }catch( e ){
    showError( 'selectPanel: ' + e.message );
    return false
  }
  var refresh = new Ext.Button({
    cls: 'x-btn-icon',
    handler: function(){ refreshSelect( panel ) },
    icon: gURLRoot + '/images/iface/refresh.gif',
    minWidth: '20',
    tooltip: 'Refresh data in the selection boxes',
    width: '100%'
  });
  var reset = new Ext.Button({
    cls: 'x-btn-text-icon',
    handler: function(){
      panel.form.reset();
//      var number = Ext.getCmp('id');
//      hideControls(number);
    },
    icon: gURLRoot + '/images/iface/reset.gif',
    minWidth: '70',
    tooltip: 'Reset values in the form',
    text: 'Reset'
  });
  var submit = new Ext.Button({
    cls: 'x-btn-text-icon',
    handler: function(){ panel.form.submit() },
    id: 'submitFormButton',
    icon: gURLRoot + '/images/iface/submit.gif',
    minWidth: '70',
    tooltip: 'Send request to the server',
    text: 'Submit'
  });
  var panel = new Ext.FormPanel({
    autoScroll: true,
    bodyStyle: 'padding: 5px',
    border: false,
    buttonAlign: 'center',
    buttons: [ submit , reset , refresh ],
    collapsible: true,
    keys: [{
      key: 13,
      scope: this,
      fn: function(){ panel.form.submit() }
    }],
    labelAlign: 'top',
    method: 'POST',
    minWidth: '200',
    title: 'Selections',
    url: 'submit',
    waitMsgTarget: true
  });
  panel.on( 'beforeaction' , function( panel , action ){
    var params = this.getForm().getValues();
    for( var i in params ){
      datagrid.getStore().baseParams[ i ] = params[ i ];
    }
    datagrid.getStore().load();
  });
  return panel;
}
function status( value ){
  if( ( value == 'Done' ) ||
      ( value == 'Completed' ) ||
      ( value == 'Good' ) ||
      ( value == 'Active' )||
      ( value == 'Cleared' )||
      ( value == 'Completing' )
  ){
    return '<img src="' + gURLRoot + '/images/monitoring/done.gif">' ;
  }else if( value == 'Bad' ){
    return '<img src="' + gURLRoot + '/images/monitoring/bad.gif">' ;
  }else if( ( value == 'Failed' ) ||
            ( value == 'Bad' ) ||
            ( value == 'Banned' ) ||
            ( value == 'Aborted' )
  ){
    return '<img src="' + gURLRoot + '/images/monitoring/failed.gif">' ;
  }else if( ( value == 'Waiting' ) ||
            ( value == 'Stopped' ) ||
            ( value == 'Poor') ||
            ( value == 'Probing' )
  ){
    return '<img src="' + gURLRoot + '/images/monitoring/waiting.gif">' ;
  }else if( value == 'Deleted' ){
    return '<img src="' + gURLRoot + '/images/monitoring/deleted.gif">' ;
  }else if( value == 'Matched' ){
    return '<img src="' + gURLRoot + '/images/monitoring/matched.gif">' ;
  }else if( ( value == 'Running' ) ||
            ( value == 'Active' ) ||
            ( value == 'Fair' )
  ){
    return '<img src="' + gURLRoot + '/images/monitoring/running.gif">' ;
  }else if( value == 'NoMask' ){
    return '<img src="' + gURLRoot + '/images/monitoring/unknown.gif">' ;
  }else{
    return '<img src="' + gURLRoot + '/images/monitoring/unknown.gif">' ;
  }
}
function statusColor(value){
  if( Ext.isEmpty( value ) ){
    return 'cccccc' ;
  }
  if( value == 'Done' ){
    return '00BD39' ;
  }else if( value == 'Ready' ){
    return '007B25' ;
  }else if( value == 'Completed' ){
    return '007B25' ;
  }else if( value == 'Good' ){
   return '238D43' ;
  }else if( value == 'Active' ){
   return '37DE6A' ;
  }else if( value == 'Failed' ){
   return 'FF2300' ;
  }else if( value == 'Aborted' ){
   return 'BF4330' ;
  }else if( value == 'Bad' ){
   return 'BF4330' ;
  }else if( value == 'Banned' ){
   return 'FF5A40' ;
  }else if( value == 'Scheduled' ){
   return 'FF8100' ;
  }else if( value == 'Waiting' ){
   return 'FF8100' ;
  }else if( value == 'Stopped' ){
   return 'FFA040' ;
  }else if( value == 'Poor' ){
   return 'BF7830' ;
  }else if( value == 'Deleted' ){
   return '666666' ;
  }else if( value == 'Matched' ){
   return '025167' ;
  }else if( value == 'Running' ){
   return '39AECF' ;
  }else if( value == 'Active' ){
   return '61B7CF' ;
  }else if( value == 'Fair' ){
   return '057D9F' ;
  }else if( value == 'NoMask' ){
   return '999999' ;
  }else{
   return 'cccccc' ;
  }
}
function itemsPerPage(){
  var store = new Ext.data.SimpleStore( {
    data: [ [ 25 ] , [ 50 ] , [ 100 ] , [ 200 ] , [ 500 ] , [ 1000 ] ]
    ,fields:[ 'value' ]
  } );
  var combo = new Ext.form.ComboBox({
    allowBlank:false
    ,displayField:'value'
    ,editable:false
    ,maxLength:4
    ,maxLengthText:'The maximum value for this field is 1000'
    ,minLength:1
    ,minLengthText:'The minimum value for this field is 1'
    ,mode:'local'
    ,selectOnFocus:true
    ,store:store
    ,triggerAction:'all'
    ,typeAhead:true
    ,value: 25
    ,width:50
  });
  return combo
}
function getDatagrid( cfg ){
  if( Ext.isEmpty( cfg ) ){
    return false ;
  }
  var bbaritems = [ '-' ];
  if( cfg.autorefresh ){
    var task = {
      run: function(){
        datagrid.getStore().load();
      }
      ,interval: 0
    }
    var heartbeat = new Ext.util.TaskRunner();
    var autoMenu = [{
      handler: function(){
        this.setChecked( true );
        heartbeat.start( Ext.apply( task , { interval: 900000 } ) );
      }
      ,group: 'refresh'
      ,text: '15 Minutes'
    },{
      handler: function(){
        this.setChecked( true );
        heartbeat.start( Ext.apply( task , { interval: 1800000 } ) );
      }
      ,group: 'refresh'
      ,text: '30 Minutes'
    },{
      handler: function(){
        this.setChecked( true );
        heartbeat.start( Ext.apply( task , { interval: 3600000 } ) );
      }
      ,group: 'refresh'
      ,text: 'One Hour'
    },{
      checked: true
      ,handler: function(){
        this.setChecked( true );
        heartbeat.stopAll();
       }
      ,group: 'refresh'
      ,text: 'Disabled'
    }];
    for( var i = 0 ; i < autoMenu.length ; i++ ){
      autoMenu[ i ] = new Ext.menu.CheckItem( autoMenu[ i ] );
    }
    var autorefresh = new Ext.Toolbar.Button({
      cls: 'x-btn-text'
      ,menu: autoMenu
      ,text: 'Disabled'
      ,tooltip: 'Click to set the time for autorefresh'
    });
    autorefresh.on( 'menuhide' , function( button , menu ){
      var length = menu.items.getCount();
      for( var i = 0 ; i < length ; i++ ){
        if( menu.items.items[i].checked ){
          button.setText( menu.items.items[ i ].text );
        }
      }
    });
    bbaritems.push( 'Auto:' );
    bbaritems.push( autorefresh );
  }
  var updateStamp = new Ext.Toolbar.Button({
    disabled: true
    ,disabledClass: 'my-disabled'
    ,id: 'updatedTableButton'
    ,text: 'Updated: -'
  });
  bbaritems.push( updateStamp );
  var ipp = itemsPerPage();
  //TODO set value using passed value from extra
  ipp.on('collapse' , function(){
    if( ! this.rendered ){
      return false
    }
    var newvalue = this.getValue();
    var current = bbar.pageSize;
    if( current != newvalue ){
      bbar.pageSize = newvalue;
      datagrid.getStore().baseParams[ 'start' ] = 0;
      datagrid.getStore().baseParams[ 'limit' ] = newvalue;
      datagrid.getStore().load();
    }
  });
  if( ! cfg.disableIPP ){
    bbaritems.push( '-' );
    bbaritems.push( 'Items per page:' );
    bbaritems.push( ipp );
  }
  var pageSize = ipp.getValue();
  var bbar = new Ext.PagingToolbar({
    displayInfo: true
    ,items: bbaritems
    ,pageSize: pageSize
    ,refreshText:'Click to refresh current page'
    ,store: cfg.store ? cfg.store : new Ext.data.Store()
  });
  if( cfg.tbar ){
    var selection = [{
        cls: 'x-btn-text-icon'
        ,handler: function(){ grid.getSelectionModel().selectAll() }
        ,icon: gURLRoot + '/images/iface/checked.gif'
        ,text: 'Select All'
        ,tooltip: 'Click to select all rows'
      },{
        cls: 'x-btn-text-icon'
        ,handler: function(){ grid.getSelectionModel().clearSelections() }
        ,icon: gURLRoot + '/images/iface/unchecked.gif'
        ,text: 'Select None'
        ,tooltip: 'Click to uncheck selected row(s)'
      },'->'];
    cfg.tbar = selection.concat( cfg.tbar );
  }
  var datagrid = new Ext.grid.GridPanel({
    autoHeight: cfg.autoHeight ? cfg.autoHeight : false
    ,bbar: cfg.bbar ? cfg.bbar : bbar
    ,columns: cfg.columns ? cfg.columns : new Ext.grid.ColumnModel()
    ,id: cfg.id ? cfg.id : Ext.id()
    ,labelAlign: cfg.labelAlign ? cfg.labelAlign : 'left'
    ,loadMask: cfg.loadMask ? cfg.loadMask : true
    ,margins: cfg.margins ? cfg.margins : '2 0 2 0'
    ,menu: cfg.menu ? cfg.menu : new Ext.menu.Menu()
    ,region: cfg.region ? cfg.region : 'center'
    ,sm: cfg.params ? cfg.params : undefined
    ,split: cfg.split ? cfg.split : true
    ,store: cfg.store ? cfg.store : new Ext.data.Store()
    ,stripeRows: cfg.stripeRows ? cfg.stripeRows : true
    ,title: cfg.title ? cfg.title : undefined
    ,tbar: cfg.tbar ? cfg.tbar : undefined
    ,view: cfg.view ? cfg.view : undefined
    ,viewConfig : cfg.viewConfig ? cfg.viewConfig : undefined
  });
  datagrid.addListener( 'cellcontextmenu' , function(
    grid , rowIndex , columnIndex , e
  ){
    e.stopEvent();
    var record = grid.getStore().getAt( rowIndex ); // Get the Record for the row
    var fieldName = grid.getColumnModel().getDataIndex( columnIndex ); // Get field name for the column
    var cellvalue = new Ext.menu.Item({
      handler: function(){
        Ext.Msg.minWidth = 360;
        Ext.Msg.alert( 'Cell value is:' , record.get( fieldName ) );
      }
      ,text: 'Show value'
    });
    menu = grid.menu( record , grid );
    if( menu.items.getCount() > 0 ){
      menu.add( '-' );
    }
    menu.add( cellvalue );
    menu.showAt( Ext.EventObject.xy );
  });
  datagrid.getStore().on('load',function(){
    var date = false;
    try{
      date = this.reader.jsonData.date;
    }catch( e ){}
    if( date ){
      updateStamp.setText( 'Updated: ' + this.reader.jsonData.date );
    }else{
      var d = new Date();
      var hh = d.getUTCHours();
      if(hh < 10){
        hh = '0' + hh ;
      }
      var mm = d.getUTCMinutes();
      if(mm < 10){
        mm = '0' + mm ;
      }
      var mon = d.getUTCMonth() + 1 ;
      if(mon < 10){
              mon = '0' + mon ;
      }
      var day = d.getUTCDate();
      if(day < 10){
              day = '0' + day ;
      }
      var dateText = 'Updated: ' + d.getUTCFullYear() + '-' + mon + '-' + day ;
      dateText = dateText + ' ' + hh + ':' + mm + ' [UTC]' ;
      updateStamp.setText( dateText );
    }
    afterDataLoad();
  });
  return datagrid;
}
function showTip( text ){
  var msg = new Ext.Tip({
    baseCls:'success'
    ,floating: true
    ,html: text
    ,width: 300
  });
  var x = Ext.num( Ext.getBody().getViewSize().width , 640 );
  x = ( ( x / 2 ) - ( msg.width / 2 ) );
  setTimeout( function(){ msg.destroy() } , 3000 );
  return msg.showAt( [ x , 5 ] );
}
