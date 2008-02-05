# -*- coding: utf-8 -*-

<%
import simplejson
%>
<%namespace file="/systems/monitoring/calendarDisplay.mako" name="calDisplay"/>

<%def name="head_tags()">
${ h.javascript_include_tag( "/yui/logger/logger-min.js" ) }
${ h.javascript_include_tag( "/yui/connection/connection-min.js" ) }
${ h.javascript_include_tag( "json2.js" ) }
${ h.javascript_include_tag( "systems/monitoring/plotView.js" ) }
${calDisplay.head_tags()}
<script>
 YAHOO.util.Event.onContentReady( 'monitoringPlotsForm', initMonitoringViews, '${h.url_for( controller='systems/monitoring' )}' );
</script>
<style>
 table.monitoringContainer
 {
 	border : 1px solid #004080;
 	margin-left : auto;
 	margin-right : auto;
 }
 table.monitoringContainer td
 {
 	vertical-align : top;
 }
 td.monitoringControl
 {
 	background : #fcfeff;
 	color : #030100;
 	text-align : left;
 	padding :  3px;
 	border-right : 1px solid #004080;
 }
 table.monitoringControl th
 {
 	font-weight : bold;
 }
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
</style>
</%def>

<%def name="monitoringViewAnchor( hideControls = True )">
<form name='monitoringPlotsForm' id='monitoringPlotsForm'>
 <table class='monitoringContainer'>
  <tr>
%if not hideControls:
   <td class='monitoringControl'>
    <table class='monitoringControl'>
     <tr>
      <th>Date</th><th>Size</th>
     </tr>
     <tr>
      <td><input type='radio' name='timeSelect' onchange='javascript:setMonitoringPlotTime("hour")'/>Last hour</td>
      <td><input type='radio' name='sizeSelect' onchange='javascript:setMonitoringPlotSize(0)'/>Small</td>
     </tr>
     <tr>
      <td><input type='radio' name='timeSelect' onchange='javascript:setMonitoringPlotTime("day")'/>Last day</td>
      <td><input type='radio' name='sizeSelect' onchange='javascript:setMonitoringPlotSize(1)'/>Medium</td>
     </tr>
     <tr>
      <td><input type='radio' name='timeSelect' onchange='javascript:setMonitoringPlotTime("week")'/>Last week</td>
      <td><input type='radio' name='sizeSelect' onchange='javascript:setMonitoringPlotSize(2)'/>Big</td>
     </tr>
     <tr>
      <td><input type='radio' name='timeSelect' onchange='javascript:setMonitoringPlotTime("month")'/>Last month</td>
      <td><input type='radio' name='sizeSelect' onchange='javascript:setMonitoringPlotSize(3)'/>Very Big</td>
     </tr>
     <tr>
      <td><input type='radio' name='timeSelect' onchange='javascript:setMonitoringPlotTime("manual")'/>Manual select ${calDisplay.calendarAnchor()}</td>
      <td><input type='submit' value='plot' onclick='javascript:plotMonitoringView();return false'/></td>
     </tr>
     <tr>
      <td colspan='2'>
       <div id='loading'>
        ${ h.image_tag( "loading.gif", alt="loading" ) } Processing...
       </div>
      </td>
     </tr
    </table>
   </td>
%endif
   <td>
    <div id='monitoringImagesContainer'/></td>
   </td>
  </tr>
 </table>
</form>
</%def>