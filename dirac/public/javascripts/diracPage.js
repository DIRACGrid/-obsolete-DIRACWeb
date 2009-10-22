var gURLRoot = ''; // Required to set-up the proper path to the pictures. String.
var gMainLayout = false; // Main Layout object
var gPageDescription = {}; //Main object describing the page layout
var portalVersion = '1.1.0'; // version counter

function initDiracPage( urlRoot, pageDescription )
{
  if( urlRoot[ urlRoot.length - 1 ] == "/" )
    urlRoot = urlRoot.substring( 0, urlRoot.length -1 );
  gURLRoot = urlRoot;
  gPageDescription = pageDescription;
  Ext.QuickTips.init();
  Ext.namespace('dirac');
  initNotificationsChecker();
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
  var navItems = [];
  for( var i in pageDescription[ 'navMenu' ] )
  {
  	areaObject = pageDescription[ 'navMenu' ][i];
        if(areaObject.text){
		if(areaObject.text == 'Info'){
                        var jobMenu = new Ext.Toolbar.Button({
				cls : 'x-btn-icon',
				icon : gURLRoot+'/images/iface/dlogo.gif',
				minWidth : '16',
                                menu : areaObject.menu
                        });
		}else{
		  	var jobMenu = new Ext.Toolbar.Button({
	  			text : areaObject.text,
	  			menu : areaObject.menu
  			});
		}
	}
	navItems.push( jobMenu );
  }
  navItems.push( 
    new Ext.Toolbar.Button({
      text : "Help",
      handler : function(){
//        var url = gPageDescription.pagePath.replace(/ /g,'').split('>');
        var url = gPageDescription.pagePath.split(' ');
	for(var i = 0; i < url.length; i++ ){
          var j = url[i].substr(0,1);
          url[i] = j.toUpperCase() + url[i].substr(1);
        }
        url = url.join().replace(/,/g,'');
        url = url.split('>');
        url = 'https://twiki.cern.ch/twiki/bin/view/LHCb/DiracWebPortal' + url[url.length - 1] + '?cover=print';
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
          width:600,
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
    }) 
  );
  navItems.push( "->" );
  navItems.push( "Selected setup:" );
  var setupButton = new Ext.Toolbar.Button({
    text : pageDescription[ 'selectedSetup' ],
    menu : pageDescription[ 'setupMenu' ]
  });
  navItems.push( setupButton );
  var lhcbImg = gURLRoot+'/images/iface/lhcb.jpg';
  var lhcbLogo = '<a href="http://lhcb.cern.ch" target="_blank">'
  lhcbLogo = lhcbLogo + '<img alt="Official LHCb webpage" src="'+lhcbImg+'"/></a>'
  navItems.push( lhcbLogo )
  var topBar = new Ext.Toolbar({
    id:'diracTopBar',
    region:'north',
    items : navItems
  });
  return topBar
}

function initBottomFrame( pageDescription ){
  var navItems = [ pageDescription['pagePath'], '->', { 'id' : 'mainNotificationStats', 'text' : '' }, "-" ];
  var userObject = pageDescription[ 'userData' ];
  if( userObject.group )
  {
  	navItems.push( userObject[ 'username' ]+"@" );
	var userGroupMenu = new Ext.Toolbar.Button({
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
  var bottomBar = new Ext.Toolbar({
    region:'south',
    id:'diracBottomBar',
    items : navItems
  });
  return bottomBar;
}

function mainPageRedirectHandler( item )
{
  window.location = item.url;
}
