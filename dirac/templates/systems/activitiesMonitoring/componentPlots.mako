# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/javascripts/htmlPage.js" ) }
${ h.javascript_include_tag( "/javascripts/systems/activitiesMonitoring/plotViewPanel.js" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  initHTML( 'mainBody' );
  Ext.onReady( initPlotView );
  function initPlotView()
  {
  	plotViewPanel = new plotViewPanel( { anchor :'viewPanelAnchor' } );
  	plotViewPanel.setViewID( "Dynamic component view" );
  	plotViewPanel.setVariableData( { 'sources.componentName' : '${c.componentName}' } );
  	plotViewPanel.draw();
  }
</script>

<div id='mainBody'>
 <h1 style='text-align:center;margin:10px'>Component plots for ${c.componentName}</h1>
 <div style='text-align:center;align:center'>
	 <div id='viewPanelAnchor' style='margin-left:auto;margin-right:auto;align:center'/>
 </div>
</div>

</%def>