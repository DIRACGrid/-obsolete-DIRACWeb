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
<p class='error' style='text-align:center'>${ c.error }</p>
%if c.link:
<p style='text-align:center'><a href='${c.link[0]}'>${c.link[1]}</a></p>
%endif
%if not c.goBack:
<p style='text-align:center'><a href='javascript:history.go(-1)'>Go back</a></p>
%endif
</div>

</%def>
