# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />
<%namespace file="/systems/configuration/cfgTree.mako" name="cfgTree"/>

<%def name="head_tags()">
<style>
 table.split {
  width : 95%;
  margin-right : auto;
  margin-left : auto;
 }
 table.split td.pageOptions
 {
  width : 20%;
  vertical-align : top;
  text-align : right;
 }
 ul.pageOptions {
  padding : 10px;
  border : 1px solid #AAA;
  background-color : #EEE;
 }
 div#treeContainer a {
  color : #000;
 }
 div#loading img
 {
  height : 12px;
  width : auto;
 }
 div#loading{
  padding : 5px 0px 5px 0px;
  text-align : left;
  visibility : hidden;
 }
</style>
${cfgTree.head_tags()}
</%def>

<table class='split'>
 <tr>
  <td class='pageTree'>
   ${cfgTree.treeAnchor()}
  </td>
  <td class='pageOptions'>
   <div id='loading'>
    ${ h.image_tag( "loading.gif", alt="loading" ) } Processing...
   </div>
   <ul class='pageOptions'>
    <li>${h.link_to( "View configuration as text", popup=['new_window', 'height=300,width=600,scrollbars=yes,resizable=yes'] , url = h.url_for( action='showTextConfiguration' ) )}</li>
    <li>${h.link_to( "Download configuration text", url = "%s?download=yes" % h.url_for( action='showTextConfiguration' ) )}</li>
   </ul>
   <ul id='console'>
   </ul>
  </td>
 </tr>
</table>
