var columnWidth = 3 ;         // 3 Columns per page
var refreshRate = 0 ;         // Autorefresh is off
var currentLayout = '' ;      // Layout not set by default
var currentUser = '' ;        // Owner of a layout
var currentGroup = '' ;       // Same as owner but group
var currentVO = '' ;          // VO of the layout
var heartbeat = false ;       // Updater reference
var contextMenu = false ;     // Common context menu

function initLoop(  initValues  ){
  Ext.onReady(  function(){
    heartbeat = new Ext.util.TaskRunner() ;
    initAjax() ;
    currentUser = gPageDescription.userData.username ;
    currentGroup = gPageDescription.userData.group ;
    currentVO = '' ;
    var mainContent = mainPanel( initValues ) ;
    renderInMainViewport( [ mainContent ] ) ;
  });
}
function mainPanel( initValues  ){
  heartbeat = new Ext.util.TaskRunner() ; // !!!!! Check it !!!!!
  contextMenu = new Ext.menu.Menu() ;
  if( initValues && initValues.column ){
    columnWidth = initValues.column ;
  }
  var current = {
    disabled          : true
    ,disabledClass    : 'my-disabled'
    ,id               : 'currentID'
    ,text             : 'Current Layout: <b>' + currentLayout + '</b>'
  };
  var timeStamp = new Ext.Toolbar.Button({
    disabled          : true
    ,disabledClass    : 'my-disabled'
    ,hidden           : true
    ,id               : 'timeStamp'
    ,text             : 'Updated: '
  }); 
  var add = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ addPanelForm()  }
    ,iconCls          : 'Add'
    ,id               : 'addButton'
    ,tooltip          : 'Click to add an image by providing a valid URL'
    ,text             : 'Add'
  });
  var set = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,iconCls          : 'Save'
    ,id               : 'setLayoutButton'
    ,menu             : createMenu( 'set' , initValues  )
    ,tooltip          : 'Click to save or share current layout'
    ,text             : 'Save'
  });
  var get = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,iconCls          : 'Load'
    ,id               : 'getLayoutButton'
    ,menu             : createMenu( 'get' , initValues  )
    ,tooltip          : 'Click to open yours or others layout'
    ,text             : 'Open'
  });
  var mng = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
//    ,handler          : manager
    ,iconCls          : 'Act'
    ,id               : 'mngLayoutButton'
    ,tooltip          : 'Click to set permissions or delete your layouts'
    ,text             : 'Manage'
  });
  var del = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ deleteLayout( currentLayout ) }
    ,iconCls          : 'Delete'
    ,id               : 'deleteLayoutButton'
    ,tooltip          : 'Click to remove current layout and load previous one'
    ,text             : 'Delete'
  });
  var column = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,iconCls          : 'columnSplitButton'
    ,id               : 'columnButton'
    ,menu             : createMenu( 'column' )
    ,text             : 'Columns'
    ,tooltip          : 'Click to change number of columns'
  });
  var refresh = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ refreshCycle() }
    ,iconCls          : 'Refresh'
    ,id               : 'refreshButton'
    ,text             : 'Refresh'
    ,tooltip          : 'Click the button for manual refresh'
  });
  var auto = new Ext.Toolbar.Button({
    cls               : 'x-btn-text'
    ,id               : 'autoButton'
    ,menu             : createMenu( 'auto' )
    ,text             : 'Disabled'
    ,tooltip          : 'Click to set the time for autorefresh'
  });
  auto.on( 'menuhide'  , function( button  , menu  ){
    var length = menu.items.getCount();
    for(  var i = 0; i < length; i++  ){
      if( menu.items.items[ i ].checked ){
        button.setText( menu.items.items[ i ].text  );
      }
    }
  });
  var panel = new Ext.Panel({
    autoScroll        : true
    ,bbar             : [ 
                          refresh 
                          , '-' 
                          , 'Auto:' 
                          , auto  
                          , timeStamp 
                          , '->' 
                          , column
                        ]
    ,bodyStyle        : 'padding:5px;'
    ,defaults         : { bodyStyle : 'padding:5px' }
    ,id               : 'mainConteiner'
    ,items            : [ newLayout() ]
    ,layout           : 'column'
    ,margins          : '2 0 2 0'
    ,monitorResize    : true
    ,region           : 'center'
    ,tbar             : [ 
                          current
                          , '->'
                          , add
                          , '-'
                          , get
                          , set
//                          , mng
                          , del
                        ]
  });
  panel.on( 'render'  , function(){
    var params = [ 'name' , 'user' , 'group' ] ;
    var hash = false ;
    var layout = false ;
    if( window.location.hash  ){
      hash = window.location.hash.split( '#' ) ;
      if( hash.length == 2 ){
        hash = Ext.urlDecode( hash[ 1 ] ) ;
      }
    }
    if( initValues && initValues.layout ){
      layout = initValues.layout ;
    }
    var loadHash = true ;
    var loadLayout = true ;
    var testHash = '' ;
    var testLayout = '' ;
    for( var i = 0 ; i < params.length ; i++ ){
      var tName = params[ i ] ;
      if( hash && hash[ tName ] ){
        testHash = testHash + hash[ tName ] ;
      }else{
        loadHash = false ;
      }
      if( layout && layout[ tName ] ){
        testLayout = testLayout + layout[ tName ] ;
      }else{
        loadLayout = false ;
      }
    }
    if( loadHash && loadLayout && testHash === testLayout ){
      return redoLayout( initValues.layout ) ;
    }
    if( loadHash ){
      hash[ 'loadLayout' ] = true ;
      ajax({
        mask          : true
        ,params       : hash
        ,success      : actionSuccess
      }) ;
      return true ;
    }
    if( loadLayout ){
      return redoLayout( initValues.layout ) ;
    }
  });
  return panel
}
function actionSuccess( response , options ){
  if( ! options || ! options.params ){
    return false ;
  }
  var kind = false ;
  if( options.params.saveLayout ){
    kind = 'save' ;
  }else if( options.params.loadLayout ){
    kind = 'load' ;
  }else if( options.params.deleteLayout ){
    kind = 'delete' ;
  }
  if( ! kind ){
    return showError( 'Unable to get the type of operation' ) ;
  }
  var response = Ext.util.JSON.decode( response.responseText ) ;
  if( response.success != 'true' ){
    return showError( response.error ) ;
  }
  if( response[ 'history' ] ){
    if( kind == 'save' ){
      Ext.getCmp( 'setLayoutButton' ).menu = createMenu( 'set' , response );
    }else if( kind == 'load' ){
      Ext.getCmp( 'getLayoutButton' ).menu = createMenu( 'get' , response );
    }else if( kind == 'delete'){
      deleteCooke( "lastLocationHash" );
      Ext.getCmp( 'setLayoutButton' ).menu = createMenu( 'set' , response );
      Ext.getCmp( 'getLayoutButton' ).menu = createMenu( 'get' , response );
    }
  }
  if( kind == 'delete' ){
    return deleteOptions() ;
  }
  redoLayout( response[ 'result' ] ) ;
  var mainPanel = Ext.getCmp( 'mainConteiner' );
  if( mainPanel ){
    mainPanel.doLayout() ;
  }
  return true ;
}
function deleteOptions(){
  var title = 'Choose layout to load' ;
  var msg = 'Do you want to load last used layout? ' ;
  msg = msg + 'Press "No" to load a start-up screen';
  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      var params = new Object() ;
      params[ 'loadLayout' ] = true ;
      params[ 'loadLast' ] = true ;
      ajax({
        mask          : true
        ,params       : params
        ,success      : actionSuccess
      }) ;
      return true ;
    }else{
      var mainPanel = Ext.getCmp( 'mainConteiner' );
      if( !mainPanel ){
        return showError( 'Function deleteOptions: Failed to get main container' );
      }
      var length = mainPanel.items.getCount() - 1 ;
      for( var i = length ; i >= 0 ; i-- ){
        var tmp = mainPanel.getComponent( i );
        mainPanel.remove( tmp , true );
      }
      mainPanel.add( newLayout() );
      currentLayout = '' ;
      var current = Ext.getCmp( 'currentID' );
      if( current ){
        current.setText( 'Current Layout: <b>' + currentLayout + '</b>' );
      }
      document.title = currentLayout ;
      mainPanel.doLayout();
      window.location.hash = '' ;
    }
  });
}
function deleteLayout( name ){
  if( ! name ){
    return showError( 'Name of the layout to delete is absent' ) ;
  }
  var welcome = Ext.getCmp('welcomeMessage') ;
  if(welcome){
    return showError( 'This is the default layout and can not be deleted' ) ;
  }
  var params = new Object() ;
  if( currentUser != gPageDescription.userData.username ){
    return showError( 'Unable to delete layout of user ' + currentUser ) ;
  }
  params[ 'deleteLayout' ] = true ;
  params[ 'name' ] = name ;
  params[ 'user' ] = gPageDescription.userData.username ;
  params[ 'group' ] = gPageDescription.userData.group ;
  var title = 'Delete Layout' ;
  var msg = 'Delete layout: ' + name + ' by ' + currentUser +  '@' + currentGroup + ' ?';
  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      ajax({
        mask          : true
        ,params       : params
        ,success      : actionSuccess
      }) ;
    }
  });
  return true ;
}
function loadLayout( layout , win ){
  if( ! layout ){
    return showError( 'loadLayout function: Layout object is absent' ) ;
  }
  if( ! layout.name ){
    return showError( 'loadLayout function: Layout name is absent' ) ;
  }
  if( ! layout.user ){
    return showError( 'loadLayout function: Owner username is absent' ) ;
  }
  if( ! layout.group ){
    return showError( 'loadLayout function: Owner group is absent' ) ;
  }
  var params = new Object() ;
  params[ 'loadLayout' ] = true ;
  params[ 'name' ] = layout.name ;
  params[ 'user' ] = layout.user ;
  params[ 'group' ] = layout.group ;
  var title = 'Load Layout' ;
  var msg = 'Load the layout: ' + layout.name + ' ?';
  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      ajax({
        mask          : true
        ,params       : params
        ,success      : actionSuccess
      }) ;
      if( win ){
        win.close() ;
      }
    }
  });
  return true ;
}
function saveLayout( name , perm , win ){
  if( ! name ){
    return showError( 'saveLayout function: Name of the layout is absent' ) ;
  }
  if( ! perm ){
    perm = 'User' ;
  }
  var params = gatherInfo() ;
  params[ 'saveLayout' ] = true ;
  params[ 'name' ] = name ;
  params[ 'permissions' ] = perm ;
  params[ 'user' ] = gPageDescription.userData.username ;
  params[ 'group' ] = gPageDescription.userData.group ;
  var title = 'Save Layout' ;
  var welcome = Ext.getCmp( 'welcomeMessage' ) ;
  if(welcome){
    return showError( 'This is the default layout and can not be saved' ) ;
  }
  var msg = 'Save current layout to: \'' + name + '\' with ';
  msg = msg + 'permissions: \'' + perm + '\'?';
  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      ajax({
        mask          : true
        ,params       : params
        ,success      : actionSuccess
      }) ;
      if( win ){
        win.close() ;
      }
    }
  });
  return true ;
}
function load( name ){
  if( name ){
    return loadLayout( name ) ;
  }
  var store = new Ext.data.JsonStore({
    autoLoad          : true
    ,baseParams       : { 'getAvailbleLayouts' : true }
    ,fields           : [ 'name' , 'user' , 'group' ]
    ,idProperty       : 'name'
    ,root             : 'result'
    ,url              : 'action'
  }) ;
  store.on( 'load' , function( store, record ){
    if( store.reader.jsonData ){
      userStore.loadData( store.reader.jsonData ) ;
    }
  }) ;
  var columns = [{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'name'
    ,editable         : false
    ,id               : 'sl1'
    ,sortable         : false
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'user'
    ,editable         : false
    ,id               : 'sl2'
    ,sortable         : false
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'group'
    ,editable         : false
    ,id               : 'sl3'
    ,sortable         : false
  }] ;
  var userStore = new Ext.data.JsonStore({
    fields            : [ { name : 'user' } ]
    ,root             : 'users'
  }) ;
  var user = new dropdownMenu({
    combo             : false
    ,displayField     : 'user'
    ,emptyText        : 'Select Owner'
    ,name             : 'selectOwner'
    ,maxLength        : 20
    ,store            : userStore
    ,valueField       : 'user'
    ,width            : 80
  }) ;
  user.addListener( 'valid' , function( combo ){
    var value = combo.getValue() ;
    store.filter( 'user' , value ) ;
  }) ;
  var reset = new Ext.Button({
    cls               : 'x-btn-icon'
    ,ctCls            : 'paddingButton'
    ,handler          : function(){
                          user.reset() ;
                          store.clearFilter() ;
                        }
    ,icon             : gURLRoot + '/images/iface/reset.gif'
    ,minWidth         : '25'
    ,tooltip          : 'Resets list of users menu'
  }) ;
  var tbar = new Ext.Toolbar({
    items             : [
                          user
                          , reset
                        ]
  }) ;
  var grid = new Ext.grid.GridPanel({
    anchor            : '-15'
    ,autoScroll       : true
    ,border           : false
    ,columns          : columns
    ,enableHdMenu     : false
    ,hideHeaders      : true
    ,loadMask         : true
    ,split            : true    
    ,store            : store
    ,stripeRows       : true
    ,tbar             : tbar
    ,width            : 200
    ,viewConfig       : { forceFit  : true , scrollOffset : 1 }
  });
  grid.addListener( 'cellclick' , function( table , rowIndex , columnIndex ){
    var record = table.getStore().getAt( rowIndex ) ;
    var name = record.get( table.getColumnModel().getDataIndex( 0 ) ) ;
    var user = record.get( table.getColumnModel().getDataIndex( 1 ) ) ;
    var group = record.get( table.getColumnModel().getDataIndex( 2 ) ) ;
    loadLayout({
      group           : group
      ,name           : name
      ,user           : user
    }, win ) ;
  });
  grid.on( 'resize' , function(){
    toolbarElementsAutoresize( tbar , [ user ] ) ;
  }) ;
  var win = formWindow({
    icon              : 'Load'
    ,title            : 'Load layout'
  }) ;
  win.add( grid ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Refresh' ) ;
  submit.setIconClass( 'Refresh' ) ;
  submit.setHandler( function(){
    store.reload()
  }) ;
  win.buttons[ 1 ].hide() ; // Hide reset button
  win.show() ;
}
function save(){
  var params = gatherInfo() ;
  var welcome = Ext.getCmp('welcomeMessage') ;
  if(welcome){
    return showError( 'This is the default layout and can not be saved' ) ;
  }
  var store = new Ext.data.JsonStore({
    autoLoad          : true
    ,baseParams       : { 'getUserLayouts' : true }
    ,fields           : [ 'name' , 'group' , 'permission' ]
    ,idProperty       : 'name'
    ,root             : 'result'
    ,url              : 'action'
  }) ;
  var columns = [{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'name'
    ,editable         : false
    ,id               : 's1'
    ,sortable         : false
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'group'
    ,editable         : false
    ,id               : 's2'
    ,sortable         : false
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'permission'
    ,editable         : false
    ,id               : 's3'
    ,sortable         : false
  }] ;
  var shareStore = new Ext.data.SimpleStore({
    data              : [ [ 'All' ] , [ 'VO' ] , [ 'Group' ] ]
    ,fields           : [ 'value' ]
  });
  var share = new dropdownMenu({
    combo             : false
    ,name             : 'shareWith'
    ,maxLength        : 20
    ,store            : shareStore
    ,width            : 80
  }) ;
  var bbar = new Ext.Toolbar({
    items             : [
                          'Share profile with: '
                          , share
                        ]
  }) ;
  var regexp = new RegExp( /^[0-9a-zA-Z]+$/ ) ;
  var regmsg = 'Letters and numbers only are allowed' ;
  var save = genericID( 'save' , '' , regexp , regmsg , 'None' ) ;
  if( currentLayout.length > 0 && currentLayout.charAt( 0 ) == '*' ){
    save.setValue( currentLayout.slice( 1 ) ) ;
  }else{
    save.setValue( currentLayout ) ;
  }
  save.on( 'keyup' , function(){
    var tmpValue = save.getRawValue() ;
    if( tmpValue.length > 0 ){
      submit.enable() ;
    }else{
      submit.disable() ;
    }
  }) ;
  var tbar = new Ext.Toolbar({
    items             : [
                          'Save as:'
                          , save
                        ]
  });
  var grid = new Ext.grid.GridPanel({
    anchor            : '-15'
    ,autoScroll       : true
    ,bbar             : bbar
    ,border           : false
    ,columns          : columns
    ,enableHdMenu     : false
    ,hideHeaders      : true
    ,loadMask         : true
    ,split            : true    
    ,store            : store
    ,stripeRows       : true
    ,tbar             : tbar
    ,width            : 200
    ,viewConfig       : { forceFit  : true , scrollOffset : 1 }
  });
  grid.addListener( 'cellclick' , function( table , rowIndex , columnIndex ){
    var record = table.getStore().getAt( rowIndex ) ;
    var layoutName = record.get( table.getColumnModel().getDataIndex( 0 ) ) ;
    var group = record.get( table.getColumnModel().getDataIndex( 1 ) ) ;
    var permission = record.get( table.getColumnModel().getDataIndex( 2 ) ) ;
    if( ! layoutName ){
      return showError( 'Failed to get name variable from the record' ) ;
    }
    if( ! permission ){
      return showError( 'Failed to get permission variable from the record' ) ;
    }
    save.setValue( layoutName ) ;
    share.setValue( permission ) ;
    submit.enable() ;
  });
  grid.on({
    'resize'          : function(){
                          toolbarElementsAutoresize( tbar , [ save , chkBox ] ) ;
                          toolbarElementsAutoresize( bbar , [ share ] ) ;
                        }
  }) ;
  var win = formWindow({
    icon              : 'Save'
    ,title            : 'Save as new layout'
  }) ;
  win.add( grid ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Save' ) ;
  submit.setIconClass( 'Save' ) ;
  if( ! currentLayout ){
    submit.disable() ;
  }
  submit.setHandler( function(){
    var layoutName = save.getValue() ;
    var perm = 'USER' ;
    perm = share.getRawValue() ;
    saveLayout( layoutName , perm , win ) ;
  }) ;
  win.buttons[ 1 ].hide() ; // Hiding reset button
  win.show() ;
}
function layoutDirty(){
  if( currentLayout.length > 0 && currentLayout.charAt( 0 ) != '*' ){
    currentLayout = '*' + currentLayout ;
  }
  var current = Ext.getCmp( 'currentID' ) ;
  if( current ){
    current.setText( 'Current Layout: <b>' + currentLayout + '</b>' ) ;
  }
}
function addPanel( init ){
  var url = false ;
  try{
    url = init[ 'url' ] ;
  }catch( e ){
    return showError( e.name + ': ' + e.message );
  }
  if( ! url ){
    return showError( 'The Path input field is empty or invalid' );
  }
  try{
    var mainPanel = new Ext.getCmp( 'mainConteiner' );
    var width = 0 ;
    if( columnWidth > 0 ){
      width = ( mainPanel.getInnerWidth() - 30 ) / columnWidth ;
    }
    width = Math.round( width );
    var tmpPanel = createPanel( url );
    tmpPanel.setWidth( width );
    mainPanel.add( tmpPanel );
    layoutDirty();
    document.title = currentLayout ;
    mainPanel.doLayout();
    enableButtons( true );
  }catch( e ){
    return showError( e.name + ': ' + e.message );
  }
}
function addPanelForm(){
  var html = 'In the Path field put URL of an image to display.<br>' ;
  html = html + 'To remove an image use context menu available with ';
  html = html + 'the right mouse click on the image itself' ;
  var regexp = new RegExp( /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s(<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i );
  var url = genericID('url','Path',regexp,'Only a valid URL is allowed','None');
  var label = new Ext.form.Label({
    anchor            : '100%'
    ,fieldLabel       : 'Tip'
    ,html             : html
  }) ;
  var panel = new Ext.FormPanel({
    bodyStyle         : 'padding: 5px'
    ,border           : false
    ,buttonAlign      : 'center'
    ,items            : [ url , label ]
    ,labelWidth       : 50
  }) ;
  var win = formWindow({
    title             : 'Add new image to current layout'
  }) ;
  win.add( panel ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Add panel' ) ;
  submit.on({
    'click'           : function(){
                          addPanel( panel.form.getValues( false ) ) ;
                          win.close() ;
                        }
  }) ;
  var reset = win.buttons[ 1 ] ;
  reset.on({
    'click'           : function(){ panel.form.reset() }
  }) ;
  win.show() ;
}
function enableButtons( enable ){
  var buttonsID = [ 
                    'autoButton'
                    , 'deleteLayoutButton'
                    , 'columnButton'
                    , 'refreshButton'
                    , 'setLayoutButton'
                  ] ;
  for( var i = 0 ; i < buttonsID.length ; i++ ){
    var button = Ext.getCmp( buttonsID[ i ] ) ;
    if( ! button ){
      continue
    }
    if( enable ){
      button.enable() ;
    }else{
      button.disable() ;
    }
  }
}
function setRefresh( time ){
  if( time == 0 ){
    heartbeat.stopAll();
  }else{
    heartbeat.start({
      run             : refreshCycle
      ,interval       : time
    });
  }
}
function newLayout(){
  var html = '<br><center><h1>Information Presenter</h1></center><br><p>With this page you can build your own collection of monitoring tools.';
  html = html + 'Currently only plots can be presented in a grid like layout. The layouts can be saved in the User Profile and recalled back.';
  html = html + ' You can define as many layouts as you need.</p><br>';
  html = html + '<h1>Managing layouts</h1><br><h3>Adding image</h3><p>To start with, press <b>Add</b> button and enter an image URL in the <i>Path</i> field.';
  html = html + 'You can enter any URL of a plot not only the DIRAC accounting plots. The image will be added to the layout.';
  html = html + ' The number of columns of the layout grid can be chosen with the <b>Columns</b> selector.</p>';
  html = html + '<br><h3>Removing image</h3><p>To remove an image do mouse right click on it and select <i>Remove</i> in the drop-down menu.</p>';
  html = html + '<br><h3>Saving layout</h3><p>You can always save the current layout on the server side by clicking ';
  html = html + '<b>Save</b> -&gt; <b>Save as new</b> button.</p><br><h3>Loading layout</h3>';
  html = html + '<p>If you want to load layout or to discard the changes, just click the <b>Load</b> button and select layout to restore</p>';
  html = html + '<br><h3>Exporting and importing layouts</h3><p>If you want to share your layout with others, you can choose ';
  html = html + '<b>Actions</b> -&gt; <b>Export</b> menu item and copy the layout description from a pop-up panel as a long string.';
  html = html + ' This string can now be sent to other users. To use it, choose <b>Actions</b> -&gt; <b>Import</b>';
  html = html + ' and paste the layout description.</p><center>';

  html = html + '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/TSY4y-Qr_LM&hl=en&fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/TSY4y-Qr_LM&hl=en&fs=1"type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="425" height="344"></embed></object>';
  html = html + '</center>';
  var message = {
    anchor            : '100%'
    ,columnWidth      : .99
    ,fieldLabel       : 'Tip'
    ,html             : html
    ,id               : 'welcomeMessage'
    ,xtype            : 'label'
  };
  enableButtons( false ) ;
//  currentLayout = 'welcome' ;
//  var current = Ext.getCmp( 'currentID' ) ;
//  if( current ){
//    current.setText( 'Current Layout: <b>' + currentLayout + '</b>' ) ;
//    document.title = currentLayout ;
//  }
  return message
}
function setChk( value ){
  if( value == columnWidth ){
    return true
  }else if( value == refreshRate ){
    return true
  }else{
    return false
  }
}
function createColumnMenuItem( num ){
  var width = 99 ;
  if( num > 0 ){
    width = Math.floor( 99 / num ) ;
  }
  width = width - 1 ;
  width = '.' + width ;
  var item = new Ext.menu.CheckItem({
    checked           : setChk( num )
    ,checkHandler     : function( item , checked ){
                          if( checked ){
                            columnWidth = num ;
                            setColumnWidth( width ) ;
                          }
                        }
    ,group            : 'column'
    ,text             : ( num > 1 ) ? num + ' Columns' : num + ' Column'
  });
  return item
}
function createAutoMenuItem( num , text ){
  var item = new Ext.menu.CheckItem({
    checked           : setChk( num )
    ,checkHandler     : function( item , checked ){
                          if( checked ){
                            setRefresh( num ) ;
                          }
                        }
    ,group            : 'refresh'
    ,text             : text
  });
  return item
}
function createLayoutMenuItem( layout , mode ){
  if( ! layout.name ){
    return showError( 'createLayoutMenuItem function: Layout name is absent' ) ;
  }
  var text = layout.name ;
  if( mode == 'get' ){
    var handler = function(){ load( layout ) } ;
    if( layout.user && layout.group ){
      text = text + ' by ' + layout.user + '@' + layout.group ;
    }
  }else{
    var permissions = 'User' ;
    if( layout.permissions ){
      permissions = layout.permissions ;
    }
    var handler = function(){ saveLayout( layout.name , permissions ) } ;
    if( layout.group ){
      text = text + ' @' + layout.group ;
    }
  }
  var item = new Ext.menu.Item({
    handler           : handler
    ,text             : text
  });
  return item
}
function createMenu( mode , init ){
  var menu = new Ext.menu.Menu() ;
  var historySave = false ;
  var historyLoad = false ;
  var err = false ;
  if( init && init.history ){
    var history = init.history ;
    if( history[ 'Save' ] && history[ 'Save' ].length > 0 ){
      if( Ext.isArray( history[ 'Save' ] ) ){
        historySave = history[ 'Save' ] ;
      }else{
        err = err + history[ 'Save' ].toString() ;
      }
    }
    if( history[ 'Load' ] && history[ 'Load' ].length > 0 ){
      if( Ext.isArray( history[ 'Load' ] ) ){
        historyLoad = history[ 'Load' ] ;
      }else{
        err = err + history[ 'Load' ].toString() ;
      }
    }
  }
  if( err ){
    err = 'Due an error history can not be displayed: \n' + err ;
    showError( err ) ;
  }
  if( mode == 'set' ){
    var saveNew = new Ext.menu.Item({
      handler         : function(){ save() }
      ,icon           : gURLRoot + '/images/iface/save.gif'
      ,text           : 'Save as new layout'
    });
    menu.addItem( saveNew ) ;
    if( historySave ){
      menu.addItem( new Ext.menu.Separator() ) ;
      var len = historySave.length ;
      for( var i = 0 ; i < len ; i++ ){
        menu.addItem( createLayoutMenuItem( historySave[ i ] , mode ) ) ;
      }
    }
  }else if( mode == 'get' ){
    var open = new Ext.menu.Item({
      handler         : function(){ load() }
      ,icon           : gURLRoot + '/images/iface/export.gif'
      ,text           : 'Load a new layout'
    });
    menu.addItem( open ) ;
    if( historyLoad ){
      menu.addItem( new Ext.menu.Separator() ) ;
      var len = historyLoad.length ;
      for( var i = 0 ; i < len ; i++ ){
        menu.addItem( createLayoutMenuItem( historyLoad[ i ] , mode ) ) ;
      }
    }
  }else if( mode == 'column' ){
    for( var i = 1 ; i < 6 ; i++ ){
      menu.addItem( createColumnMenuItem( i ) ) ;
    }
  }else if( mode == 'auto' ){
// TODO Get init values from the CS  
    var initObj = {
      0               : 'Disabled'
      ,900000         : '15 Minutes'
      ,1800000        : '30 Minutes'
      ,3600000        : 'One Hour'
      ,86400000       : 'One Day'
    }
    for ( var i in initObj ){
      menu.addItem( createAutoMenuItem( i , initObj[ i ] ) ) ;
    }
  }else{
    return false ;
  }
  return menu ;
}
function refreshCycle(){
  try{
    var mainPanel = Ext.getCmp( 'mainConteiner' ) ;
    var length = mainPanel.items.getCount() ;
    for( var i = 0 ; i < length ; i++ ){
      var item = mainPanel.getComponent( i ) ;
      if( item.id == 'welcomeMessage' ){
        continue ;
      }
      var tmpSrc = item.autoEl.src ;
      if( tmpSrc.search( /&dummythingforrefresh/i ) > 0 ){
        tmpSrc = tmpSrc.split( '&dummythingforrefresh' )[ 0 ] ;
      }
      tmpSrc = tmpSrc + '&dummythingforrefresh=' + Ext.id() ;
      tmpSrc = tmpSrc + '_' + Math.floor( Math.random() * 101 );
      var tmpItem = createPanel( tmpSrc ) ;
      mainPanel.remove( i ) ;
      mainPanel.insert( i , tmpItem ) ;
    }
    mainPanel.doLayout() ;
    updateTimestamp() ;
  }catch(e){
    return showError( e.name + ': ' + e.message ) ;
  }
}
function setColumnWidth( width ){
  try{
    var mainPanel = Ext.getCmp( 'mainConteiner' ) ;
    var length = mainPanel.items.getCount() ;
    for( var i = 0 ; i < length ; i++ ){
      var item = mainPanel.getComponent( i ) ;
      if( item.id == 'welcomeMessage' ){
        continue ;
      }
      item.columnWidth = width ;
    }
    mainPanel.doLayout() ;
  }catch(e){
    return showError( e.name + ': ' + e.message ) ;
  }
}
function updateTimestamp(){
  var stamp = Ext.getCmp( 'timeStamp' ) ;
  if( stamp ){
    var d = new Date() ;
    var hh = d.getHours() ;
    if(hh < 10){
      hh = '0' + hh ;
    }
    var mm = d.getMinutes() ;
    if(mm < 10){
      mm = '0' + mm ;
    }
    stamp.setText( 'Updated: ' + hh + ":" + mm) ;
    stamp.show() ;
  }
}
function gatherInfo(){
  var url = '' ;
  var mainPanel = Ext.getCmp( 'mainConteiner' );
  if( ! mainPanel ){
    return showError( 'Can not get mainConteiner in gatherInfo function' );
  }
  var length = mainPanel.items.getCount();
  for( var i = 0 ; i < length ; i++ ){
    if( mainPanel.getComponent( i ).id == 'welcomeMessage'){
      continue ;
    }
    var tmpSrc = mainPanel.getComponent( i ).autoEl.src ;
    url = url + normalizeURL( tmpSrc ) + ';' ;
  }
  url = url.replace( /&/g , '[ampersand]' );
  return { 'columns' : columnWidth , 'refresh' : refreshRate , 'url' : url };  
}
function redoLayout( layout ){
  if( !layout ){
    return showError( 'Function redoLayout expects at least one argument' ) ;
  }
  if( !layout.name ){
    return showError( 'Function redoLayout: layout object has no name' ) ;
  }
  if( !layout.url ){
    return showError( 'Function redoLayout: layout object should have url property' ) ;
  }
  columnWidth = layout[ 'columns' ] / 1 ;
  Ext.num( columnWidth , -1 ) ; 
  if( columnWidth == -1 ){
    showError( 'Function redoLayout: failed to covert columns to a number' ) ;
  }
  Ext.getCmp( 'columnButton' ).menu = createMenu( 'column' ) ;
  refreshRate = layout[ 'refresh' ] / 1 ;
  refreshRate = Ext.num( refreshRate , -1 ) ;
  if( refreshRate == -1 ){
    showError( 'Function redoLayout: failed to covert refreshRate to a number' ) ;
  }
  var plotSrc = layout.url ;
  plotSrc = plotSrc.replace( /\[ampersand\]/g , '&' ) ;
  var plots = plotSrc.split( ';' ) ;
  for( var i = 0 ; i < plots.length ; i++ ){
    if( Ext.isEmpty( plots[ i ] ) ){
      continue;
    }
    plots[ i ] = normalizeURL( plots[ i ] );
  }
  var mainPanel = Ext.getCmp( 'mainConteiner' );
  if( !mainPanel ){
    return showError( 'Function redoLayout: Failed to get main container' ) ;
  }
  if( !plots ){
    return true ;
  }
  var length = mainPanel.items.getCount() - 1 ;
  for( var i = length ; i >= 0 ; i-- ){
    var tmp = mainPanel.getComponent( i ) ;
    mainPanel.remove( tmp , true ) ;
  }
  if( plots.length > 0 ){
    for( var i = 0 ; i < plots.length ; i++ ){
      if( plots[ i ].length < 1 ){
        continue ;
      }
      mainPanel.add( createPanel( plots[ i ] ) ) ;
    }
  }else{
    mainPanel.add( newLayout() ) ;
  }
  var hash = Ext.urlEncode({
    group             : layout.group
    ,name           : layout.name
    ,user            : layout.user
  }) ;
  window.location.hash = hash ;
  var current = Ext.getCmp( 'currentID' ) ;
  if( current ){
    current.setText( 'Current Layout: <b>' + layout.name + '</b>' ) ;
    document.title = layout.name ;
  }
  currentLayout = layout.name ;
  currentUser = layout.user ;
  currentGroup = layout.group ;
  updateTimestamp() ;
  enableButtons( true ) ;
}
function fullSize( link ){
  var html = '<img src="' + link + '" />' ;
  var win = new Ext.Window({
    collapsible: true
    ,constrain: true
    ,constrainHeader: true
    ,html: html
    ,layout: 'fit'
    ,minHeight: 200
    ,minWidth: 320
    ,title: 'Actual size'
  });
  win.show();
}
function normalizeURL( url ){
  if( Ext.isEmpty( url ) ){
    return showError( 'url parameter in normalizeURL function is missing' );
  }
  if( url.search( /&dummythingforrefresh/i ) > 0 ){
    url = url.split( '&dummythingforrefresh' )[ 0 ];
  }
  if( url.search( /&nocache/i ) > 0 ){
    url = url.split( '&nocache' )[ 0 ];
  }
  if( url.slice( -1 ) == '?' ){
    url = url.slice( 0 , -1 ) ;
  }
  return url
}
function createPanel( img ){
  var welcome = Ext.getCmp( 'welcomeMessage' );
  if( welcome ){
    var mainPanel = Ext.getCmp( 'mainConteiner' );
    mainPanel.remove( welcome );
  }
  var width = 99 / columnWidth ;
  width = '.' + Math.round( width );
  var box = new Ext.BoxComponent({
    autoEl: {
      src: img
      ,style: 'cursor:pointer;cursor:hand;'
      ,tag: 'img'
    }
    ,columnWidth: width
    ,cls: 'pointer'
  });
  box.on( 'render' , function(){
    var notAccountingPlot = true ;
    if( img.search( 'accountingPlots\/getPlotImg' ) > 0 ){
      notAccountingPlot = false ;
    }
    box.el.on( 'click' , function(){
      fullSize( img );
    });
    box.el.on( 'contextmenu' , function( evt ){
      evt.stopEvent();
      contextMenu.removeAll();
      contextMenu.add({
//        disabled: notAccountingPlot
//        ,handler: function(){
//          
//        }
//        ,icon:gURLRoot + '/images/iface/edit.gif'
//        ,text:'Edit Selections'
//      },{
//        disabled: notAccountingPlot
//        ,handler: function(){
//          
//        }
//        ,icon:gURLRoot + '/images/iface/edit.gif'
//        ,text:'Edit Plot'
//      },{
        handler: function(){
          var mainPanel = Ext.getCmp( 'mainConteiner' );
          mainPanel.remove( box );
          layoutDirty();
        }
        ,icon: gURLRoot + '/images/iface/close.gif'
        ,text: 'Remove'
      },{
        handler: function(){
          window.open( img );
        }
        ,icon: gURLRoot + '/images/iface/new-window.gif'
        ,text: 'Open in new window'
      },{
        handler: function(){
          changeURL( box , img );
        }
        ,icon: gURLRoot + '/images/iface/edit.gif'
        ,text: 'Change URL'
      },{
        handler: function(){
          var url = normalizeURL( img )
          Ext.Msg.alert( 'Show URL' , url );
        }
        ,icon: gURLRoot + '/images/iface/url.gif'
        ,text: 'Show URL'
//      },{
//        disabled: notAccountingPlot
//        ,handler:function(){
//          plotDetails( img );
//        }
//        ,icon: gURLRoot + '/images/iface/info.gif'
//        ,text: 'Plot details'
      });
      contextMenu.showAt( evt.xy );
    });
  });
  return box
}
function plotDetails( url ){

}
function changeURL( box , url ){
  if( Ext.isEmpty( box ) ){
    return showError( 'first parameter in changeURL function is missing' ) ;
  }
  if( Ext.isEmpty( url ) ){
    return showError( 'url parameter in changeURL function is missing' ) ;
  }
  var textarea = new Ext.form.TextArea({
    allowBlank: false
    ,anchor: '100%'
    ,enableKeyEvents: true
    ,fieldLabel: 'Path'
    ,selectOnFocus: true
    ,value: url
  });
  var win = formWindow({
    icon: 'Change'
    ,title: 'Change URL'
  }) ;
  win.add( textarea ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Change URL' ) ;
  submit.setIconClass( 'Change' ) ;
  submit.setHandler( function(){
    var value = textarea.getValue();
    if( Ext.isEmpty( value ) ){
      return showError( 'Textarea seems to be empty, please put an url there' ) ;
    }
    var mainPanel = Ext.getCmp( 'mainConteiner' );
    var index = mainPanel.items.indexOf( box );
    var newPanel = createPanel( value );
    mainPanel.remove( box );
    mainPanel.insert( index , newPanel );
    mainPanel.doLayout();
    layoutDirty();
  }) ;
  win.buttons[ 1 ].hide();
  win.show();
}
