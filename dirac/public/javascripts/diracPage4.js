var gURLRoot = ''; // Required to set-up the proper path to the pictures.
                    // String.
var gMainLayout = false; // Main Layout object
var gPageDescription = {}; // Main object describing the page layout

function initDiracPage( urlRoot, pageDescription )
{
  if( urlRoot[ urlRoot.length - 1 ] == "/" )
    urlRoot = urlRoot.substring( 0, urlRoot.length -1 );
  gURLRoot = urlRoot;
  gPageDescription = pageDescription;
  //Ext.QuickTips.init();
  Ext.namespace('dirac');
  //Check for lastLocationHash
  var lastHash = getCookie( "lastLocationHash" );
  if( lastHash )
  {
    document.location.hash = lastHash;
    var expiration = new Date();
    var nH = ( expiration.getHours() + 1 ) % 24;
    if( nH )
      expiration.setHours( nH )
    else
      expiration.setDate( expiration.getDate() + 1 );
    deleteCooke( 'lastLocationHash' );
  }
}

function renderInMainViewport( componentsList )
{
  var topFrame = initTopFrame( gPageDescription );
  console.log( "TOP FRAME OK" );
  var bottomFrame = initBottomFrame( gPageDescription );
  var viewportItems = [ topFrame ];
  for( var iPos = 0; iPos < componentsList.length; iPos++ )
  {
    viewportItems.push( componentsList[ iPos ] );
  }
  viewportItems.push( bottomFrame );
  gMainLayout = Ext.create( 'Ext.container.Viewport', {
      layout : 'border',
      renderTo: Ext.getBody(),
      items : viewportItems
    }
  );
  //initNotificationsChecker();
}

function __addClickHandlerToMenuSubEntries( menuEntry )
{
  var hndlMenu = [];
  for( var i = 0; i < menuEntry.length; i++ )
  {
    if( menuEntry[i].menu )
    {
      menuEntry[i].menu = __addClickHandlerToMenuSubEntries( menuEntry[i].menu );
    }
    if( menuEntry[i].url )
    {
      menuEntry[i].handler = mainPageRedirectHandler;
    }
//    if(menuEntry[i].text == 'Delimiter')
//    {
//      menuEntry[i] = '-';
//    }
    hndlMenu.push( menuEntry[i] );
  }
  return hndlMenu;
}

function initTopFrame( pageDescription ){
	
  var navItems = [];
  for( var i in pageDescription[ 'navMenu' ] ){
	  
    areaObject = pageDescription[ 'navMenu' ][i];
    
    if(areaObject.text){
    	
      var handleredMenu = __addClickHandlerToMenuSubEntries( areaObject.menu );

      var cnfObj = { text : areaObject.text, 
    		         menu : handleredMenu,
    		       };
      
      if(areaObject.text == 'Info'){
    	  
        cnfObj.cls = 'x-btn-icon';
        cnfObj.icon = gURLRoot+'/images/iface/dlogo.gif';
        delete cnfObj.text;
        
      }
      else if(cnfObj.text == 'Help'){
    	  
        cnfObj.menu.reverse();
        var tmp = new Array();
        tmp.text = 'Context Help';
        //tmp.handler = helpEntry;
        cnfObj.menu.push(tmp);
        cnfObj.menu.reverse();
        
      }
      var menuEntry = Ext.create( 'Ext.button.Split', cnfObj );
    }
    
    navItems.push( menuEntry );
  }

  navItems.push( "->" );
  navItems.push( "Selected setup:" );

  for( var i = 0; i< pageDescription[ 'setupMenu' ].length; i++ )
  {
	  pageDescription[ 'setupMenu' ][i].handler = redirectWithHashHandler;
  }
  console.log( pageDescription );
  
  var setupButton = Ext.create( 'Ext.button.Button' ,{
    text : pageDescription[ 'selectedSetup' ],
    menu : pageDescription[ 'setupMenu' ]
  } );
  navItems.push( setupButton );
  
  if( 'voIcon' in pageDescription )
	  navItems.push( Ext.create( 'Ext.button.Button', {
		  cls : 'x-btn-icon',
	      icon : pageDescription[ 'voIcon' ],
	      listeners : {
	    	  click : function(){ window.open( pageDescription[ 'voURL' ], '_newtab' ) }
	      },
	  } ) );

  var topBar = Ext.create( 'Ext.toolbar.Toolbar', {
    id:'diracTopBar',
    region:'north',
    items : navItems
  });
  return topBar
}

function initBottomFrame( pageDescription )
{
  var navItems = [];
  if( 'pagePath' in pageDescription && pageDescription['pagePath'] )
	  navItems.push( pageDescription['pagePath'] );
  navItems.push( '->' );
  navItems.push( { 'id' : 'mainNotificationStats', 'text' : '' } );
  navItems.push( "-" );
  var userObject = pageDescription[ 'userData' ];
  if( userObject.group )
  {
  	navItems.push( userObject[ 'username' ]+"@" );
  	// Set the handler
  	for( var i = 0; i< userObject.groupMenu.length; i++ )
  	{
  		userObject.groupMenu[i].handler = redirectWithHashHandler;
  	}
    var userGroupMenu = Ext.create( 'Ext.button.Button', {
      text : userObject.group,
      menu : userObject.groupMenu
      });
    navItems.push( userGroupMenu );
  }
  else
  {
  	navItems.push( userObject[ 'username' ] );
  }
  navItems.push( "("+userObject.DN+")" );
  
  console.log(navItems);
  var bottomBar = Ext.create( 'Ext.toolbar.Toolbar' , {
    region:'south',
    id:'diracBottomBar',
    items : navItems
  });
  
  return bottomBar;
}


function mainPageRedirectHandler( item, a, b )
{
  window.location = item.url;
}

function redirectWithHashHandler( item )
{
	var newLocation = item.url;
	var queryString = window.location.search.substring(1);
	if( queryString )
		newLocation += "?" + queryString;
	if( document.location.hash )
	{
	  var expiration = new Date();
    var nH = ( expiration.getHours() + 1 ) % 24;
    if( nH )
      expiration.setHours( nH )
    else
      expiration.setDate( expiration.getDate() + 1 );
		setCookie( "lastLocationHash", document.location.hash, expiration, gURLRoot || "/" );
	}
	
	window.location = newLocation;
}


// Cookie utilities
function setCookie( cookieName, value, expirationDate, path, domain, secure )
{
  var cookie_string = cookieName + "=" + escape ( value );

  if ( expirationDate )
  {
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


function getCookie( cookieName )
{
  var matchResults = document.cookie.match ( '(^|;) ?' + cookieName + '=([^;]*)(;|$)' );
  if ( matchResults )
    return ( unescape ( matchResults[2] ) );
  else
    return null;
}

function deleteCooke( cookieName )
{
  document.cookie = cookieName + '=;expires=Thu, 01-Jan-1970 00:00:01 GMT';
}
