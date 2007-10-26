# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
<style>
 table.cfgChanges {
  margin-left : auto;
  margin-right : auto;
 }
 table.cfgChanges th {
  font-weight : bold;
  text-align : center; 
  padding : 3px 10px 3px 10px;
 }
 table.cfgChanges td {
  border : 1px solid #004080;
  padding : 3px 10px 3px 10px;
 }
</style>
</%def>

<h2>History of configuration changes</h2>

<table class='cfgChanges'>
 <tr>
  <th>Version</th><th>Commiter</th>
 </tr>
%for entry in c.changes:
 <tr>
  <td>${entry[1]}</td><td>${entry[0]}</td>
 </tr>
%endfor
</table>