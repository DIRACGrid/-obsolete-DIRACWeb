# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_link( "/OpenLayers-2.6/OpenLayers.js" ) }
${ h.javascript_link( "/javascripts/web/Lib.js" ) }
${ h.javascript_link( "/javascripts/web/Map.js" ) }
${ h.javascript_link( "/javascripts/web/mymap.js" ) }
${ h.stylesheet_link( "/stylesheets/lovCombo.css" ) }
${ h.stylesheet_link( "/stylesheets/infostyles.css" ) }
${ h.stylesheet_link( "/stylesheets/main.css" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  initSiteMap();
</script>
</%def>
