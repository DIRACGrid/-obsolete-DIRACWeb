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

<div id='mainBody' style='text-align:center;margin-top:30px;'>
<h1 style='margin:10px'> Upload a configuration file to modify </h1>

${ h.form( h.url( action = 'doUploadConfig' ), multipart=True ) }
Upload file:      ${h.file_field('cfgFile')} <br />
                  ${h.submit('Submit')}
${h.end_form()}
</div>
</%def>
