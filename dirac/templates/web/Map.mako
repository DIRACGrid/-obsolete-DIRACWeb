# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.jsTag( "/OpenLayers-2.6/OpenLayers.js" ) }
${ h.jsTag( "/javascripts/web/Lib.js" ) }
${ h.jsTag( "/javascripts/web/Map.js" ) }
${ h.jsTag( "/javascripts/web/mymap.js" ) }
${ h.cssTag( "/stylesheets/lovCombo.css" ) }
${ h.cssTag( "/stylesheets/infostyles.css" ) }
${ h.cssTag( "/stylesheets/main.css" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  initSiteMap();
</script>
</%def>
