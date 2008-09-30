# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/javascripts/htmlPage.js" ) }
<style type="text/css">
<!--
   table.imgTable td {
    padding : 5px;
    text-align : left;
   }
   table.imgTable tr:hover {
    background-color : #555;
    color : #FFF;
   }
   table.imgTable img {
        height : 50px;
        width : auto;
   }
-->
</style>
</%def>

<%def name="body()">
<script type="text/javascript">
  initHTML( 'mainBody' );
</script>

<div id='mainBody' style="text-align:center">
<h6>DIRAC logos</h6>

<%
import os
%>

<table class='imgTable' border="1px" align="center" cellpadding="5" cellspacing="0" bordercolor="#000000">
%for file in os.listdir( c.imagePath ):
 %if file != 'CVS':
   <tr><td>${ h.link_to( h.image_tag( 'logos/%s' % file, alt = file ), url = h.url_for( "/images/logos/%s" % file ) ) }</td><td>${file}</td></tr>
 %endif
%endfor
</table>

<p>Click on the image to get it in full size</p>
</%def>
