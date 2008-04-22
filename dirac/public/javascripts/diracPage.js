var gURLRoot = ''; // Required to set-up the proper path to the pictures. String.
var gMainLayout = false; // Main Layout object
var gPageDescription = {}; //Main object describing the page layout

function initDiracPage( urlRoot, pageDescription )
{
  if( urlRoot[ urlRoot.length - 1 ] == "/" )
    urlRoot = urlRoot.substring( 0, urlRoot.length -1 );
  gURLRoot = urlRoot;
  gPageDescription = pageDescription;
  Ext.QuickTips.init();
  Ext.namespace('dirac');
}

function renderInMainViewport( componentsList )
{
  var topFrame = initTopFrame( gPageDescription );
  var bottomFrame = initBottomFrame( gPageDescription );
  var viewportItems = [ topFrame ];
  for( var iPos = 0; iPos < componentsList.length; iPos++ )
  {
    viewportItems.push( componentsList[ iPos ] );
  }
  viewportItems.push( bottomFrame );
  gMainLayout = new Ext.Viewport( {
      layout : 'border',
      plain : true,
      items : viewportItems
    }
  );
}

function initTopFrame( pageDescription ){
  var diracImgPath = gURLRoot+'/images/logos/DIRAC-logo-transp.png';
  var voImgPath = gURLRoot+'/images/LHCbLogo.png';
  var html = '<table class="header"><tr><td><img alt="DIRAC" src="'+diracImgPath+'" /></td><td class="headerSpacer"></td><td><img alt="LHCb" src="'+voImgPath+'" /></td></tr></table>'
  var navItems = [];
  for( i in pageDescription[ 'navMenu' ] )
  {
  	areaObject = pageDescription[ 'navMenu' ][i];
  	var jobMenu = new Ext.Toolbar.Button({
  		text : areaObject.text,
  		menu : areaObject.menu
  		}
  	);
	navItems.push( jobMenu );
  }
  navItems.push( "->" );
  navItems.push( "Selected setup:" );
  var setupButton = new Ext.Toolbar.Button({
    text : pageDescription[ 'selectedSetup' ],
    menu : pageDescription[ 'setupMenu' ]
  });
  navItems.push( setupButton );
  var topBar = new Ext.Toolbar({
    items : navItems,
    margins: '0 0 0 0'
  });
  var topPanel = new Ext.Panel({
    html : html,
    region:'north',
    margins: '0 0 0 0',
    bbar : topBar
  });
  return topPanel;
}

function initBottomFrame( pageDescription ){
  var navItems = [ pageDescription['pagePath'], '->' ];
  var userObject = pageDescription[ 'userData' ];
  if( userObject.group )
  {
  	navItems.push( userObject[ 'username' ]+"@" );
	var userGroupMenu = new Ext.Toolbar.Button({
	    text : userObject.group,
	    menu : userObject.groupMenu,
	  });
	navItems.push( userGroupMenu );
  }
  else
  {
  	navItems.push( userObject[ 'username' ] );
  }
  navItems.push( "("+userObject.DN+")" );
  var bottomBar = new Ext.Toolbar({
    region:'south',
    items : navItems
  });
  return bottomBar;
}

function mainPageRedirectHandler( item )
{
  window.location = item.url;
}