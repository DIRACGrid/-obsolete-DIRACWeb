# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_link( "http://maps.google.com/maps/api/js?sensor=false" ) }
${ h.javascript_link( "/javascripts/web/siteMap.js" ) }
${ h.javascript_link( "/javascripts/web/siteControlWindow.js" ) }
${ h.stylesheet_link( "/stylesheets/lovCombo.css" ) }
${ h.stylesheet_link( "/stylesheets/infostyles.css" ) }
${ h.stylesheet_link( "/stylesheets/main.css" ) }
</%def>

<%def name="body()">

<script type="text/javascript">
%if c.allowActions:
  initSiteMap( true );
%else:
  initSiteMap( false );
%endif
</script>
</%def>
