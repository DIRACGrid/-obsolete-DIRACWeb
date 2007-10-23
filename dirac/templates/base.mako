# -*- coding: utf-8 -*-
<%
import dirac.lib.credentials as credentials
import dirac.lib.webBase as webBase

credentials.checkUserCredentials()

pageTitle = webBase.htmlPageTitle() 
%>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
 <head>
  <title>DIRAC: ${ pageTitle }</title>
  <link rel="SHORTCUT ICON" href='${ h.url_for( "/images/favicon.ico" )}'>
  ${ h.stylesheet_link_tag( "/yui/reset-fonts-grids/reset-fonts-grids.css" ) }
  ${ h.stylesheet_link_tag( "dirac.css" ) } 
  <!-- Font size -->
  ${ h.stylesheet_link_tag( "/yui/fonts/fonts-min.css" ) }
  <!-- Yui skins -->
  ${ h.stylesheet_link_tag( "/yui/menu/assets/skins/sam/menu.css" ) }
  <!-- js -->
  ${ h.javascript_include_tag( "/yui/yahoo-dom-event/yahoo-dom-event.js" ) }
  ${ h.javascript_include_tag( "/yui/container/container_core-min.js" ) }
  ${ h.javascript_include_tag( "/yui/yahoo/yahoo-min.js" ) }
  ${ h.javascript_include_tag( "/yui/event/event-min.js" ) }
  ${ h.javascript_include_tag( "/yui/menu/menu.js" ) }
  <!-- init YUI -->
  <script>
   function initMenuBar() { 
<% 
areaContentsDict = {}
areasList = []
for area in webBase.schemaAreas():
  areaContentsDict[ area ] = webBase.jsSchemaSection( area, area )
  if len( areaContentsDict[ area ] ) > 2:
    areasList.append( area )
%>
% for area in areasList:
     var ${area}Items = ${ areaContentsDict[ area ] }
     var o${area}Menu = new YAHOO.widget.Menu( "${area}HTMLObject" );
     o${area}Menu.addItems( ${area}Items )
     o${area}Menu.render( '${area}Position' ); 
     o${area}Menu.showEvent.subscribe( function () { this.focus(); } );
     function show${area}Menu( e ) { 
% for otherAreas in areasList:
% if otherAreas != area:
       o${otherAreas}Menu.hide()
% endif
% endfor
       o${area}Menu.show()
     };
     YAHOO.util.Event.addListener( document.getElementById( '${area}Position' ), 'click', show${area}Menu );
     YAHOO.util.Event.addListener( document.getElementById( '${area}Position' ), 'mouseover', show${area}Menu );
% endfor
   }
   YAHOO.util.Event.addListener(window, "load", initMenuBar); 
  </script>
  ${self.head_tags()}
 </head>
 <body class='yui-skin-sam'>
  <div class='topUserShortcuts'>
   ${webBase.htmlShortcuts()}
  </div>
  <div class='topUserInfo'>
   ${webBase.htmlUserInfo()}
  </div>
  <hr class='pageHorizontalDelimiter'/> 
  <table class='header'>
   <tr>
    <td>${ h.image_tag( 'DIRAC.png', alt = 'DIRAC' ) }</td>
    <td class='headerSpacer'></td>
    <td>${ h.image_tag( 'LHCbLogo.png', alt = 'LHCb' ) }</td>
   </tr>
  </table>
  <table class='menuBar'>
   <tr>
    ${ webBase.htmlSchemaAreas( areasList ) }
    <td class='menuSetup'>
       Selected Setup 
    </td>
    <td class='menuSetupChoice'>
     ${ webBase.htmlSetups() }
    </td>
   </tr>
   <tr>
    <td colspan='${ len( webBase.schemaAreas() ) + 2 }' class='menuPath'>
     ${ webBase.htmlPath() }
    </td>
   </tr>
  </table>
  ${self.body()}
  <script src="http://www.google-analytics.com/urchin.js" type="text/javascript"></script>
  <script type="text/javascript">
   _uacct = "UA-2149799-1";
   urchinTracker();
  </script>
  </div>
 </body>
</html>

