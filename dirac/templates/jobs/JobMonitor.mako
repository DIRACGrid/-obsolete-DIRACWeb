# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<%
import dirac.lib.credentials as credentials
import dirac.lib.webBase as webBase
credentials.checkUserCredentials()
pageTitle = webBase.htmlPageTitle()
%>
<%
areaContentsDict = {}
areasList = []
for area in webBase.schemaAreas():
  areaContentsDict[ area ] = webBase.jsSchemaSection( area, area )
  if len( areaContentsDict[ area ] ) > 2:
    areasList.append( area )
%>

<head>
<title>DIRAC: ${ pageTitle }</title>
<link rel="SHORTCUT ICON" href='${ h.url_for( "/images/favicon.ico" )}'>
${ h.stylesheet_link_tag( "/stylesheets/dirac.css" ) }
${ h.javascript_include_tag( "/ext/adapter/ext/ext-base.js" ) }
${ h.javascript_include_tag( "/ext/ext-all-debug.js" ) }
${ h.javascript_include_tag( "/javascripts/Lib.js" ) }
${ h.javascript_include_tag( "/javascripts/jobs/JobMonitor.js" ) }
${ h.stylesheet_link_tag( "/ext/resources/css/ext-all.css" ) }
</head>

<body>
<script type="text/javascript">
  init(${c.select},'${h.url_for( '/images' )}');
</script>
</body>

</html>
