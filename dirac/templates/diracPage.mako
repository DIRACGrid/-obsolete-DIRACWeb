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
  ${ h.javascript_include_tag( "/ext/adapter/ext/ext-base.js" ) }
  ${ h.javascript_include_tag( "/ext/ext-all-debug.js" ) }
  ${ h.javascript_include_tag( "/ext/Multiselect.js" ) }
  ${ h.javascript_include_tag( "/ext/DDView.js" ) }
  ${ h.javascript_include_tag( "/javascripts/diracPage.js" ) }
  ${ h.stylesheet_link_tag( "dirac.css" ) }
  ${ h.stylesheet_link_tag( "/ext/resources/css/ext-all.css" ) }
  ${ h.stylesheet_link_tag( "/ext/resources/css/Multiselect.css" ) }
  ${self.head_tags()}
 </head>
 <body>
  <script type="text/javascript">
   var pageDescription = ${ jsDiracPageObject };
   initDiracPage( "${ h.url_for( '/' ) }", pageDescription);
  </script>
  ${self.body()}
  <!--
  <script src="http://www.google-analytics.com/urchin.js" type="text/javascript"></script>
  <script type="text/javascript">
   _uacct = "UA-2149799-1";
   urchinTracker();
  </script>
  --/>
  </div>
 </body>
</html>

