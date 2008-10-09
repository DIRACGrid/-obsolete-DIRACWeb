# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/javascripts/systems/activitiesMonitoring/plotStaticViews.js" ) }
${ h.javascript_include_tag( "/javascripts/systems/activitiesMonitoring/plotViewPanel.js" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  initPlotViews( ${c.viewsList} );
</script>
</%def>
