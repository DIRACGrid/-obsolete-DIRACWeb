# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.jsTag( "/javascripts/lovCombo.js" ) }
${ h.jsTag( "/javascripts/systems/Lib.js" ) }
${ h.jsTag( "/javascripts/systems/ErrorConsole.js" ) }
${ h.cssTag( "/stylesheets/lovCombo.css" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  initErrorConsole(${c.select});
</script>
</%def>
