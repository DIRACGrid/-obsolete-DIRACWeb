# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/javascripts/htmlPage.js" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  initHTML( 'mainBody' );
</script>

<div id='mainBody'>
<p style='text-align:center;font-size:x-big;font-variant:small-caps;margin:1em;'>Hello!</p>
<p style='text-align:center;font-size:big;font-variant:small-caps;margin:1em;'>Bow before the mighty DIRAC for it handles your jobs (and data)! ;)</p>
</div>

</%def>
