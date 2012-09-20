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
function ajax( cfg ){
  if( typeof cfg === 'undefined' ){
    return false ;
  }
  if( ! cfg.success ){
    return false ;
  }
  if( cfg.mask ){
    Ext.getBody().mask( cfg.msg ? cfg.msg : 'Communicating with server' ) ;
  }
  Ext.Ajax.request({
    failure           : cfg.failure ? cfg.failure : errorReport 
    ,headers          : cfg.headers ? cfg.headers : undefined 
    ,method           : cfg.method ? cfg.method : 'POST'
    ,params           : cfg.params ? cfg.params : undefined
    ,success          : cfg.success
    ,timeout          : cfg.timeout ? cfg.timeout : 60000
    ,url              : cfg.url ? cfg.url : 'action'
  });
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
function chkBox( id ){
  return '<input id="' + id + '" type="checkbox"/>' ;
}
function flag( code ){
  return '<img src="'+gURLRoot+'/images/flags/' + code + '.gif">' ;
}
function selectAll( selection ){
  var inputs = document.getElementsByTagName( 'input' ) ;
  var checked = false ;
  if( selection == 'all' ){
    checked = true ;
  }
  for ( var i = 0 ; i < inputs.length ; i++ ) {
    if ( inputs[i].type && inputs[i].type == 'checkbox' ){
      inputs[i].checked = checked ;
    }
  }
}
function genericID(name,fieldLabel,altRegex,altRegexText,hide){
  var value = '';
// Checking if value is exists for this field
  try{
    value = dataSelect.extra[name];
    delete dataSelect.extra[name];
  }catch(e){}
  var regex = new RegExp( /^[0-9, ]+$/);
  var regexText = 'Only digits separated by semicolons are allowed';
  try{
    if(altRegex){
      regex = altRegex;
    }
  }catch(e){}
  try{
    if(altRegexText){
      regexText = altRegexText;
    }
  }catch(e){}
  if((hide == null) || (hide == '')){
    hide = true;
  }
  var textField = new Ext.form.TextField({
    anchor:'-15',
    allowBlank:true,
    enableKeyEvents:true,
    fieldLabel:fieldLabel,
    id:name,
    mode:'local',
    name:name,
    regex:regex,
    regexText:regexText,
    selectOnFocus:true,
    value:value
  });
  if(hide == true){
    textField.on({
      'render':function(){
        if(textField.value !== ''){
          hideControls(textField);
        }
      },
      'blur':function(){
        hideControls(textField);
      },
      'keyup':function(){
        hideControls(textField);
      }
    });
  }
  return textField;
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

