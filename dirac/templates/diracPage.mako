# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/transitional.dtd">
<%
import dirac.lib.credentials as credentials
import dirac.lib.webBase as webBase

credentials.checkUserCredentials()

pageTitle = webBase.htmlPageTitle()
jsDiracPageObject = webBase.getJSPageData()
selectedSetup = credentials.getSelectedSetup()
selectedGroup = credentials.getSelectedGroup()
pageTitle = "%s as %s@%s" % ( pageTitle, selectedGroup, selectedSetup )
%>
<html>
 <head>
  <title>${pageTitle}</title>
  <link rel="SHORTCUT ICON" href='${ h.url_for( "/images/favicon.ico" )}'>
  ${ webBase.jsTag( "/ext/adapter/ext/ext-base.js" ) }
  ${ webBase.jsTag( "/ext/ext-all-debug.js" ) }
  ${ webBase.jsTag( "/ext/Multiselect.js" ) }
  ${ webBase.jsTag( "/ext/DDView.js" ) }
  ${ webBase.jsTag( "/javascripts/diracPage.js" ) }
  ${ webBase.cssTag( "/stylesheets/dirac.css" ) }
  ${ webBase.cssTag( "/ext/resources/css/ext-all.css" ) }
  ${ webBase.cssTag( "/ext/resources/css/Multiselect.css" ) }
  ${self.head_tags()}
 </head>
 <body>
  <script type="text/javascript">
   var pageDescription = ${ jsDiracPageObject };
   initDiracPage( "${ h.url_for( '/' ) }", pageDescription);
  </script>
  ${self.body()}
<script type="text/javascript">
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
var pageTracker = _gat._getTracker("UA-2149799-2");
pageTracker._initData();
pageTracker._trackPageview();
</script>
 </body>
</html>

