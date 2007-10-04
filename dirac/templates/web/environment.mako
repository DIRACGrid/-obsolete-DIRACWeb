# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
  <!-- add some head tags here -->
  <style>
   table.envVars {
    width : 90%;
    text-align : left;
    border : 1px solid black;
    margin : auto;
   }
   table.envVars tr {
    border-bottom : 1px solid black;
   }
   table.envVars td {
    padding : 5px;
    border-right : 1px solid black;
   }
   table.envVars tr:hover {
    background-color : #EEE;
   }
  </style>
</%def>

<%
from pylons import request
%>

<%def name='showInTable(d)'>
<%
    keys = d.keys()
    keys.sort()
%>
    <table class='envVars'>
    % for key in keys:
        <tr><td>${ key } </td><td> ${ str( d[ key ] ) } </td></tr>
    % endfor
    </table>
</%def>

<h2>request.environ contents</h2>

${showInTable( request.environ )}

% if 'apache.request' in request.environ:
<h2>Apache request</h2>
<%
apacheRequest = request.environ[ 'apache.request' ]
%>
${ showInTable( apacheRequest.subprocess_env ) }
% endif
