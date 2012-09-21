var gURLRoot = ''; // Required to set-up the proper path to the pictures.
                    // String.
var gMainLayout = false; // Main Layout object
var gPageDescription = {}; // Main object describing the page layout

function showError( msg ){
  if( Ext.isEmpty( msg )){
    msg = 'Error is not set or an empty value' ;
  }
  alert(
    'Error: ' + msg + '\nPlease, use the forum ' +
    'http://groups.google.com/group/diracgrid-forum' +
    ' to clarify situation'
  );
}

function initDiracPage( urlRoot, pageDescription ){
  if( urlRoot[ urlRoot.length - 1 ] == "/" ){
    urlRoot = urlRoot.substring( 0, urlRoot.length -1 );
  }
  gURLRoot = urlRoot;
  gPageDescription = pageDescription;
  Ext.QuickTips.init();
  Ext.namespace('dirac');
  //Check for lastLocationHash
  var lastHash = getCookie( "lastLocationHash" );
  if( lastHash ){
    document.location.hash = lastHash;
    var expiration = new Date();
    var nH = ( expiration.getHours() + 1 ) % 24;
    if( nH ){
      expiration.setHours( nH )
    }else{
      expiration.setDate( expiration.getDate() + 1 );
    }
    deleteCooke( 'lastLocationHash' );
  }
}

function renderInMainViewport( componentsList ){
  var topFrame = initTopFrame( gPageDescription );
  var bottomFrame = initBottomFrame( gPageDescription );
  var viewportItems = [ topFrame ];
  for( var iPos = 0; iPos < componentsList.length; iPos++ ){
    viewportItems.push( componentsList[ iPos ] );
  }
  viewportItems.push( bottomFrame );
  gMainLayout = new Ext.Viewport({
    layout : 'border',
    plain : true,
    items : viewportItems
  });
  initNotificationsChecker();
}

function __addClickHandlerToMenuSubEntries( menuEntry ){
  var hndlMenu = [];
  for( var i = 0; i < menuEntry.length; i++ ){
    if( menuEntry[i].menu )
    {
      menuEntry[i].menu = __addClickHandlerToMenuSubEntries( menuEntry[i].menu );
    }
    if( menuEntry[i].url )
    {
      menuEntry[i].handler = mainPageRedirectHandler;
    }
    hndlMenu.push( menuEntry[i] );
  }
  return hndlMenu;
}
function helpEntry(){
  var url = 'http://marwww.in2p3.fr/~atsareg/Docs/DIRAC/build/html/diracindex.html';
  if(gPageDescription.helpURL){
    url = gPageDescription.helpURL
  }
  var html = '<iframe id="help_frame" src =' + url + '></iframe>';
  var panel = new Ext.Panel({border:0,autoScroll:false,html:html});
  panel.on('resize',function(){
    var wwwFrame = document.getElementById('help_frame');
    wwwFrame.height = panel.getInnerHeight() - 4;
    wwwFrame.width = panel.getInnerWidth() - 4;
  });
  var title = 'Help for ' + gPageDescription.pagePath;
  var window = new Ext.Window({
    iconCls:'icon-grid',
    closable:true,
    width:800,
    height:400,
    border:true,
    collapsible:false,
    constrain:true,
    constrainHeader:true,
    maximizable:true,
    modal:true,
    layout:'fit',
    plain:true,
    shim:false,
    title:title,
    items:[panel]
  });
  window.show();
}
function initTopFrame( pageDescription ){
  var navItems = [];
  for( var i in pageDescription[ 'navMenu' ] ){
    areaObject = pageDescription[ 'navMenu' ][i];
    if(areaObject.text){
      var handleredMenu = __addClickHandlerToMenuSubEntries( areaObject.menu );
      var cnfObj = { text : areaObject.text, menu : handleredMenu };
      if(areaObject.text == 'Info'){
        cnfObj.cls = 'x-btn-icon';
        cnfObj.icon = gURLRoot+'/images/iface/dlogo.gif';
        cnfObj.minWidth = '16';
        delete cnfObj.text;
      }
      if(cnfObj.text == 'Help'){
        cnfObj.menu.reverse();
        var tmp = new Array();
        tmp.text = 'Context Help';
        tmp.handler = helpEntry;
        cnfObj.menu.push(tmp);
        cnfObj.menu.reverse();
      }
      var menuEntry = new Ext.Toolbar.Button( cnfObj );
    }
    navItems.push( menuEntry );
  }
  if( gPageDescription.userData &&
        gPageDescription.userData.username &&
        gPageDescription.userData.username != 'Anonymous'
  ){
    var upmenu = new Ext.menu.Menu({
      items:[{
        handler:proxyUpload // look in /javascripts/systems/ProxyUpload.js
        ,text:'Proxy Upload'
      },{
        handler:submitJobNew // check it at /javascripts/jobs/Launchpad.js
        ,text:'Job Launchpad'
      }]
    });
    var tools = new Ext.Toolbar.Button({
      text:'Tools',
      id:'mainTopbarToolsButton',
      menu:upmenu
    });
    navItems.push(tools);
  }
  navItems.push( "->" );
  navItems.push( "Selected setup:" );
  // Set the handler
  for( var i = 0; i< pageDescription[ 'setupMenu' ].length; i++ ){
	  pageDescription[ 'setupMenu' ][i].handler = redirectWithHashHandler;
  }
  var setupButton = new Ext.Toolbar.Button({
    text : pageDescription[ 'selectedSetup' ],
    menu : pageDescription[ 'setupMenu' ]
  });
  navItems.push( setupButton );
  if( 'voIcon' in pageDescription && pageDescription[ 'voIcon' ] ){
	  var iconLogo = '<a href=' + pageDescription[ 'voURL' ]  + ' target="_blank">'
	  var iconLocation = pageDescription[ 'voIcon' ]
	  while( iconLocation[0 ] == "/" )
		  iconLocation = iconLocation.substring( 1, iconLocation.length );
	  var iconLocation = gURLRoot+"/"+iconLocation;
	  iconLogo = iconLogo + '<img src="' + iconLocation + '"/></a>'
	  navItems.push( iconLogo )
  }
  var topBar = new Ext.Toolbar({
    id:'diracTopBar',
    region:'north',
    items : navItems
  });
  return topBar
}

function initBottomFrame( pageDescription ){
  var navItems = [
                    pageDescription['pagePath']
                    , '->'
                    , { 'id' : 'mainNotificationStats', 'text' : '' }
                    , "-"
                  ] ;
  var userObject = pageDescription[ 'userData' ] ;
  if( userObject.group ){
  	navItems.push( userObject[ 'username' ] + "@" ) ;
  	// Set the handler
  	for( var i = 0; i< userObject.groupMenu.length; i++ ){
  		userObject.groupMenu[i].handler = redirectWithHashHandler ;
  	}
    var userGroupMenu = new Ext.Toolbar.Button({
      menu: userObject.groupMenu
      ,text: userObject.group
    });
    navItems.push( userGroupMenu ) ;
  }else{
  	navItems.push( userObject[ 'username' ] ) ;
  }
  navItems.push( "(" + userObject.DN + ")" ) ;
  var bottomBar = new Ext.Toolbar({
    id: 'diracBottomBar'
    ,items: navItems
    ,region: 'south'
  }) ;
  return bottomBar ;
}

function mainPageRedirectHandler( item, a, b ){
  window.location = item.url;
}

function redirectWithHashHandler( item ){
	var newLocation = item.url;
	var queryString = window.location.search.substring(1);
	if( queryString )
		newLocation += "?" + queryString;
	if( document.location.hash ){
	  var expiration = new Date();
    var nH = ( expiration.getHours() + 1 ) % 24;
    if( nH ){
      expiration.setHours( nH )
    }else{
      expiration.setDate( expiration.getDate() + 1 );
    }
		setCookie( "lastLocationHash", document.location.hash, expiration, gURLRoot || "/" );
	}
	
	window.location = newLocation;
}

// Cookie utilities
function setCookie( cookieName, value, expirationDate, path, domain, secure ){
  var cookie_string = cookieName + "=" + escape ( value );

  if ( expirationDate ){
    cookie_string += "; expires=" + expirationDate.toGMTString();
  }

  if ( path )
        cookie_string += "; path=" + escape ( path );

  if ( domain )
        cookie_string += "; domain=" + escape ( domain );
  
  if ( secure )
        cookie_string += "; secure";
 
  document.cookie = cookie_string;
}


function getCookie( cookieName ){
  var matchResults = document.cookie.match( '(^|;) ?' + cookieName + '=([^;]*)(;|$)' );
  if( matchResults ){
    return ( unescape ( matchResults[2] ) );
  }else{
    return null;
  }
}

function deleteCooke( cookieName ){
  document.cookie = cookieName + '=;expires=Thu, 01-Jan-1970 00:00:01 GMT';
}
