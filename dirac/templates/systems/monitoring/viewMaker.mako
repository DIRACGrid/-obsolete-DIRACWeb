# -*- coding: utf-8 -*-
<%
from DIRAC import gConfig
numFields = 6
%>
<%inherit file="/base.mako" />
<%namespace file="/systems/monitoring/calendarDisplay.mako" name="calDisplay"/>

<%def name="head_tags()">
${calDisplay.head_tags()}
${ h.stylesheet_link_tag( "/yui/logger/assets/skins/sam/logger.css" ) }
${ h.javascript_include_tag( "/yui/logger/logger-min.js" ) }
${ h.javascript_include_tag( "/yui/connection/connection-min.js" ) }
${ h.javascript_include_tag( "systems/monitoring/viewMaker.js" ) }
${ h.javascript_include_tag( "json2.js" ) }
<style>
 div#loading
 {
 	height : 30px;
 	width : auto;
 	vertical-align : top;
 	visibility : hidden;
 	padding : 5px;
 }
 div#loading img
 {
 	height : 20px;
 	width : auto;
 }

 table.field {
 	width : 250px;
 	display : inline;
 }
 table.field td{
 	padding : 5px 2px 0px 0px;
 }
 div.imgContainer {
 	width : 97%;
 }


 table.pageSchema {
  margin-left : auto;
  margin-right : auto;
 }
 table.pageSchema td.commands {
  vertical-align : top;
  padding : 0% 5% 0% 5%;
 }
 ul.commands {
  border : 1px solid #AAA;
  background : #EEE;
  text-align : right;
  padding : 5%;
 }

 .clearfix:after
 {
    content: ".";
    display: block;
    height: 0;
    clear: both;
    visibility: hidden;
  }
  .clearfix {display: inline-block;}
  /* Hides from IE-mac \*/
  * html .clearfix {height: 1%;}
  .clearfix {display: block;}
  /* End hide from IE-mac */
</style>
<script>
 YAHOO.util.Event.onContentReady( 'fieldSelectors', initViewMaker );
</script>
</%def>

<h2>Creation of monitoring views</h2>

<table class='pageSchema'>
 <tr>
  <td id='fieldSelectors'>
%for i in range( numFields ):
   <table class='field' id='fieldContainer-${i}'>
    <tr>
     <td><input type='checkbox' id='group-${i}'/> Group by this field</td><td></td>
    <tr>
    <tr>
     <td><select type='select' id='type-${i}' onChange='javascript:fieldSelected(${i})'></select></td>
%if i < numFields - 1:
     <td rowspan='2'><a href='#' onclick='javascript:enableSelect(${i+1})'>NEXT</td>
%endif
    </tr>
    <tr>
     <td>
      <select type='select' id='values-${i}' onChange='javascript:valuesSelected(${i})' size='10' multiple='multiple' style='width:200px'></select>
     </td>
    </tr>
    <tr>
     <td><input type='checkbox' id='variable-${i}' onChange='javascript:toggleVariableField(${i})'/> Variable field</td>
    </tr>
    <tr>
     <td><input type='text' id='variableValue-${i}' size='25' onKeyUp='javascript:updateVariableField(${i})' disabled/></td>
    </tr>
   </table>
%endfor
  </td>
  <td class='commands'>
   <div id='loading'>
   ${ h.image_tag( "loading.gif", alt="loading" ) } Processing...
   </div>
   <ul class='commands'>
    <li>Plot description${h.link_to( "?", popup=['new_window', 'height=300,width=600,scrollbars=yes,resizable=yes'] , url = h.url_for( action='variablesHelp.html' ) )}<input type='text' id='plotLabel' size='30'/></li>
    <li>Stack activities<input type='checkbox' id='stackOption'/></li>
    <li><input type='submit' value='Test View' onclick='javascript:requestPlots()'/></li>
    <li>Plot request<input type='text' id='plotRequestStub' size='30' readonly/></li>
    <li>View name<input type='text' id='viewName' size='30'/></li>
    <li><input type='submit' value='Save View' id='saveViewButton' onclick='javascript:saveView()' disabled/></li>
   </ul>
  </td>
 </tr>
</table>

<div id='imgContainer'/>