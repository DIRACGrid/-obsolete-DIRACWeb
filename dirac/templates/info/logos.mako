# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
  <!-- add some head tags here -->
  <style>
   table.imgTable {
    text-align : left;
    border : 1px solid black;
    margin : auto;
   }
   table.imgTable tr {
    border-bottom : 1px solid black;
   }
   table.imgTable td {
    padding : 5px;
    border-right : 1px solid black;
   }
   table.imgTable tr:hover {
    background-color : #555;
    color : #FFF;
   }
   table.imgTable img {
   	height : 50px;
   	width : auto;
   }
  </style>
</%def>

<h1>DIRAC logos</h1>

<% 
import os
%>

<table class='imgTable'>
%for file in os.listdir( c.imagePath ):
 <tr><td>${ h.link_to( h.image_tag( 'logos/%s' % file, alt = file ), url = "/images/logos/%s" % file ) }</td><td>${file}</td></tr>
%endfor
</table>

<p>Click on the image to get it in full size</p>


