# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/javascripts/dencodelight.js" ) }
${ h.javascript_include_tag( "/javascripts/systems/accounting/accountingBase.js" ) }
${ h.javascript_include_tag( "/javascripts/systems/accounting/plotPageBase.js" ) }
${ h.javascript_include_tag( "/javascripts/systems/accounting/PilotPlotPage.js" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  var plotsList = ${c.plotsList};
  var queryOptions = ${c.selectionValues};
  initPilotPlots( plotsList, queryOptions );
</script>
</%def>
