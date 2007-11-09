# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
<style>
 table.pageSchema {
  margin-left : auto;
  margin-right : auto;
 }
 table.pageSchema td.commands {
  vertical-align : top;
  padding : 0% 5% 0% 5%;
 }
 div.commands {
  border : 1px solid #AAA;
  background : #EEE;
  text-align : right;
  padding : 5%;
 }
 table.cfgChanges {
  border : 1px solid #AAA;
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
 function getSelectedIndex( radioObj )
 {
	var radioLength = radioObj.length;
	if( radioLength == null )
		if( radioObj.checked )
			return 0;
	for( var i = 0; i< radioLength; i++ )
	{
		if( radioObj[i].checked )
			return i;
	}
	return 0;
 }
 function checkEnabledDiff()
 {
 	var selectedFrom = getSelectedIndex( document.versions.fromVersion );
 	var selectedTo = getSelectedIndex( document.versions.toVersion );
 	fromObj = document.versions.fromVersion;
	for( var i = 0; i< fromObj.length; i++ )
	{
		if( i <= selectedTo )
			fromObj[ i ].style.visibility = "hidden";
		else
			fromObj[ i ].style.visibility = "visible";
	}
 	toObj = document.versions.toVersion;
	for( var i = 0; i< toObj.length; i++ )
	{
		if( i >= selectedFrom )
			toObj[ i ].style.visibility = "hidden";
		else
			toObj[ i ].style.visibility = "visible";
	}
 }
 function initRadios()
 {
 	toObj = document.versions.toVersion;
	for( var i = 0; i< toObj.length; i++ )
	{
		if( i == 0 )
			toObj[ i ].checked = true;
		else
			toObj[ i ].checked = false;
	}
 	fromObj = document.versions.fromVersion;
	for( var i = 0; i< fromObj.length; i++ )
	{
		if( i == 1 )
			fromObj[ i ].checked = true;
		else
			fromObj[ i ].checked = false;
	}
 	rollObj = document.versions.rollbackVersion;
	for( var i = 0; i< rollObj.length; i++ )
	{
		rollObj[ i ].checked = false;
	}
	checkEnabledDiff();
 }
 YAHOO.util.Event.onContentReady( 'versionsForm', initRadios );
</script>

</%def>

<h2>History of configuration changes</h2>

<form id='versionsForm' name='versions'>
 <table class='pageSchema'>
  <tr>
   <td>
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
%if index == 0:
      <td></td>
%else:
      <td><input type='radio' name='rollbackVersion' value='${entry[0]}'/></td>
%endif
      <td>${entry[0]}</td>
      <td>${entry[1]}</td>
%if index == 0:
      <td><input type='radio' onclick='javascript:checkEnabledDiff()' name='fromVersion' value='${entry[0]}'/></td>
      <td><input type='radio' onclick='javascript:checkEnabledDiff()' name='toVersion' value='${entry[0]}' checked/></td>
%elif index == 1:
      <td><input type='radio' onclick='javascript:checkEnabledDiff()' name='fromVersion' value='${entry[0]}' checked/></td>
      <td><input type='radio' onclick='javascript:checkEnabledDiff()' name='toVersion' value='${entry[0]}'/></td>
%else:
      <td><input type='radio' onclick='javascript:checkEnabledDiff()' name='fromVersion' value='${entry[0]}' /></td>
      <td><input type='radio' onclick='javascript:checkEnabledDiff()' name='toVersion' value='${entry[0]}'/></td>
%endif
     </tr>
%endfor
    </table>
   </td>
   <td class='commands'>
    <div class='commands'>
     <input type='submit' value='Show differences' onclick='javascript:checkDiff()'/>
     <input type='submit' value='Rollback configuration' onclick='javascript:checkRollback()'/>
    </div>
   </td>
  </tr>
 </table>
</form>