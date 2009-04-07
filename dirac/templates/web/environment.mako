# -*- coding: utf-8 -*-
<%inherit file="/diracPage.mako" />

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

<%def name="head_tags()">
  ${ h.javascript_link( "/javascripts/htmlPage.js" ) }
  <!-- add some head tags here -->
  <style>
   table.envVars {
    width : 90%;
    text-align : left;
    border : 1px solid black;
    margin : auto;
    background : #111;
   }
   table.envVars tr {
    border : 10px solid black;
    background-color : #FFF;
   }
   table.envVars tr td {
    padding : 5px;
    font-size : small;

   }
   table.envVars tr:hover {
    background-color : #EEE;
   }
   p.title {
   	font-size : large;
   	font-variant : small-caps;
   	text-align : center;
   	margin : 10 px;
   }
  </style>
</%def>

<%def name="body()">
<script type="text/javascript">
  initHTML( 'mainBody' );
</script>

<div id='mainBody' class="tmp">
<p class='title'>request.environ contents</p>

${showInTable( request.environ )}

% if 'apache.request' in request.environ:
<p class='title'>Apache request</p>
<%
apacheRequest = request.environ[ 'apache.request' ]
%>
${ showInTable( apacheRequest.subprocess_env ) }
% endif
</div>
</%def>