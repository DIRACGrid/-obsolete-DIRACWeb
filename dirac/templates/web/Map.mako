# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/OpenLayers-2.6/OpenLayers.js" ) }
${ h.javascript_include_tag( "/javascripts/web/Lib.js" ) }
${ h.javascript_include_tag( "/javascripts/web/Map.js" ) }
${ h.javascript_include_tag( "/javascripts/web/mymap.js" ) }
${ h.stylesheet_link_tag( "/stylesheets/lovCombo.css" ) }
${ h.stylesheet_link_tag( "/stylesheets/infostyles.css" ) }
${ h.stylesheet_link_tag( "/stylesheets/main.css" ) }
${ h.stylesheet_link_tag( "/stylesheets/myTable.css" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  initSiteMap();
</script>
</%def>
