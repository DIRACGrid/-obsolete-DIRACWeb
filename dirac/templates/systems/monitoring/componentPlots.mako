# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />
<%namespace file="/systems/monitoring/renderView.mako" name="renderView"/>

<%def name="head_tags()">
${renderView.head_tags()}
<style>
 div#plotContainer
 {
 	margin-top : 20px;
 }
</style>
<script>
 function initSystemPlots()
 {
 	setMonitoringViewId( "Dynamic component view" );
 	setMonitoringVariableData( { 'sources.componentName' : '${c.componentName}' } );
 	plotMonitoringView();
 }
 YAHOO.util.Event.onContentReady( 'plotContainer', initSystemPlots );
</script>

</%def>

<h2>Monitoring plots for ${c.componentName}</h2>


<div id='plotContainer'>
${renderView.monitoringViewAnchor(False)}
</div>