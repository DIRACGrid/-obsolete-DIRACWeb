# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3c.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag("/ext/examples/grid/RowExpander.js") }
${ h.stylesheet_link_tag(   "/TreeGrid/css/TreeGrid.css") }
${ h.javascript_include_tag("/TreeGrid/TreeGrid.js") }
${ h.stylesheet_link_tag(   "/javascripts/production/ProductionRequest.css") }
${ h.javascript_include_tag("/javascripts/production/ProductionRequest.js") }
</%def>

<%def name="body()">
<script type="text/javascript">

Ext.onReady(function() {
  mgr = Ext.ComponentMgr.create({xtype: 'prmanager'});
  renderInMainViewport( [mgr] );
}); 
</script>
</%def>
