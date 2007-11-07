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
 table.cfgChanges tr:hover {
  background-color : #EEE;
 }
 table.cfgChanges td {
  padding : 5px 10px 5px 10px;
 }
</style>

<script>
function getRadioValue( radioObj )
{
	var radioLength = radioObj.length;
	if( radioLength == null )
		if( radioObj.checked )
			return radioObj.value;
		else
			return "";
	for( var i = 0; i< radioLength; i++ )
	{
		if( radioObj[i].checked )
			return radioObj[ i ].value;
	}
	return "";
 }
 function checkDiff()
 {
 	fromTime = getRadioValue( document.versions.fromVersion );
 	toTime = getRadioValue( document.versions.toVersion );
 	if( fromTime == toTime )
 	{
 		alert( "Both versions are the same!" );
 		return false;
 	}
 	windowOpts = "['new_window', 'height=300,width=600,scrollbars=yes,resizable=yes']";
 	window.open( "", "Version differences", windowOpts );
 	document.versions.target="Version differences";
 	document.versions.method="post";
 	document.versions.action='showDiff';
 	document.versions.submit();
 }
 function checkRollback()
 {
 	rollbackTime = getRadioValue( document.versions.rollbackVersion );
 	if( rollbackTime == "" )
 	{
 		alert( "Select some version to rollback!" );
 		return false;
 	}

 	if( window.confirm( "Are you sure you want to rollback to version " + rollbackTime + "?" ) )
	{
		document.versions.target=null;
	 	document.versions.method="post";
 		document.versions.action='rollbackToVersion';
	 	document.versions.submit();
	}
 }
</script>

</%def>

<h2>History of configuration changes</h2>

<form name='versions'>
<table class='cfgChanges'>
 <tr>
  <th colspan='3'></th><th colspan='2'>Show differences</th>
 </tr>
 <tr>
  <th>Select</th><th>Version</th><th>Commiter</th><th>From</th><th>To</th>
 </tr>
%for index in range( len( c.changes ) ) :
<% entry = c.changes[ index ] %>
 <tr>
  <td><input type='radio' name='rollbackVersion' value='${entry[0]}'/></td>
  <td>${entry[0]}</td>
  <td>${entry[1]}</td>
%if index == 1:
  <td><input type='radio' name='fromVersion' value='${entry[0]}' checked/></td>
%else:
  <td><input type='radio' name='fromVersion' value='${entry[0]}'/></td>
%endif
%if index == 0:
  <td><input type='radio' name='toVersion' value='${entry[0]}' checked/></td>
%else:
  <td><input type='radio' name='toVersion' value='${entry[0]}'/></td>
%endif
 </tr>
%endfor
</table>
<input type='submit' value='Rollback configuration' onclick='javascript:checkRollback()'/>
<input type='submit' value='Show differences' onclick='javascript:checkDiff()'/>
</form>