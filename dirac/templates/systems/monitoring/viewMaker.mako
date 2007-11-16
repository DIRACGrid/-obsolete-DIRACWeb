# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />
<%namespace file="/systems/monitoring/calendarDisplay.mako" name="calDisplay"/>

<%def name="head_tags()">
${calDisplay.head_tags()}
<style>
 table.propSelector {
  margin : auto;
  border : 1px solid #0A0;
  background-color : #EFE;
  padding : 5px;
  width : 97%;
 }
 table.propSelector td.dates {
  padding : 10px;
  width : 30px;
 }

</style>
</%def>


<table class='propSelector'>
 <tr>
  <td class='dates'>${calDisplay.calendarAnchor()}</td>
  <td class='selectors'>SELECTORS</td>
 </tr>
 <tr>
  <td></td>
  <td>DOWN</td>
 </tr>
</table>