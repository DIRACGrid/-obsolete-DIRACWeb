# -*- coding: utf-8 -*-
<%
from DIRAC import gConfig
numFields = 6
%>
<%inherit file="/base.mako" />

<%def name="head_tags()">
${ h.stylesheet_link( "/yui/logger/assets/skins/sam/logger.css" ) }
${ h.stylesheet_link( "/yui/datatable/assets/skins/sam/datatable.css" ) }
${ h.javascript_link( "/yui/logger/logger-min.js" ) }
${ h.javascript_link( "/yui/element/element-beta-min.js" ) }
${ h.javascript_link( "/yui/datasource/datasource-beta-min.js" ) }
${ h.javascript_link( "/yui/dragdrop/dragdrop-min.js" ) }
${ h.javascript_link( "/yui/datatable/datatable-beta-min.js" ) }
${ h.javascript_link( "json2.js" ) }
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

 div#acTableContainer table{
 	margin-left : auto;
 	margin-right : auto;
 }

</style>
<script>
 function initDataTable()
 {
	var columnDefs = [
				{ label : 'Source', children : [
					{ key : 'Select', label : '<a href="#" onclick="javascript:deleteSelected()">Delete selected</a>' },
					{ key : 'Site', label : 'Site', sortable : true, resizable : true },
					{ key : 'Type', label : 'Type', sortable : true, resizable : true },
					{ key : 'Location', label : 'Location', sortable : true, resizable : true },
					{ key : 'Full Name', label : 'Full Name', sortable : true, resizable : true }
				] },
				{ label : 'Activity', children : [
					{ key : 'Name', label : 'Name', sortable : true, resizable : true },
					{ key : 'Category', label : 'Category', sortable : true, resizable : true },
					{ key : 'Unit', label : 'Unit', sortable : true, resizable : true },
					{ key : 'Function', label : 'Function', sortable : true, resizable : true },
					{ key : 'Description', label : 'Description', sortable : true, resizable : true },
					{ key : 'Step size', label : 'Step size', sortable : true, resizable : true },
				] }
			];
	var dataSource = new YAHOO.util.DataSource( YAHOO.util.Dom.get("activitiesTable") );
	dataSource.responseType = YAHOO.util.DataSource.TYPE_HTMLTABLE;
	dataSource.responseSchema = {
		fields: [ { key : 'Select' },
				{ key : 'Site' },
				{ key : 'Type' },
				{ key : 'Location' },
				{ key : 'Full Name' },
				{ key : 'Name' },
				{ key : 'Category' },
				{ key : 'Unit' },
				{ key : 'Function' },
				{ key : 'Description' },
				{ key : 'Step size' },
  	    ]
  	};

	var dataTable = new YAHOO.widget.DataTable( "acTableContainer", columnDefs, dataSource, {} );

 }
 YAHOO.util.Event.onContentReady( 'acTableContainer', initDataTable );

 function deleteSelected()
 {
	var deletionList = [];
	chEl = document.manageActivities.deletionSelection;
	for(var i=0; i < chEl.length; i++)
	{
		if( chEl[i].checked )
		{
			deletionList.push( chEl[i].value.split( "-" ) );
		}
	}
	if( deletionList.length == 0 )
		alert( "Nothing is selected to be deleted" );
	else
	{
		if( confirm( "Are you sure you want to delete "+ deletionList.length +" activities?" ) )
		{
			stub = JSON.stringify( deletionList );
			url = "${h.url_for( controller = 'systems/monitoring', action = 'deleteActivities' )}";
			window.location = url+"?dl="+stub
		}
	}
 }
</script>
</%def>

<h2>Manage activities</h2>
 <form name='manageActivities'>
  <div id='acTableContainer'>
   <table id='activitiesTable'>
    <thead>
     <tr>
      <th colspan='5'>Source</th>
      <th colspan='5'>Activity</th>
     </tr>
     <tr>
      <th><a href="#" onclick="javascript:deleteSelected()">Delete selected</a></th>
      <th>Site</th>
      <th>Type</th>
      <th>Location</th>
      <th>Full Name</th>

      <th>Name</th>
      <th>Category</th>
      <th>Unit</th>
      <th>Function</th>
      <th>Description</th>
      <th>Step size</th>
     </tr>
    </thead>
    <tbody>
%for sourceTuple in c.activitiesDict:
%for activityTuple in c.activitiesDict[ sourceTuple ]:
	<tr>
	 <td>
	  <input type='checkbox' name='deletionSelection' value='${sourceTuple[0]}-${activityTuple[0]}'/>
	  ${h.link_to( "delete", confirm = "Are you sure you want to delete this activity?", url = "%s?sid=%s&aid=%s" % ( h.url_for( controller = 'systems/monitoring', action = 'deleteActivity' ), sourceTuple[0], activityTuple[0] ) )}
	 </td>
	 <td>${sourceTuple[1]}</td>
	 <td>${sourceTuple[2]}</td>
	 <td>${sourceTuple[3]}</td>
	 <td>${sourceTuple[4]}</td>

     <td>${activityTuple[1]}</td>
     <td>${activityTuple[2]}</td>
     <td>${activityTuple[3]}</td>
     <td>${activityTuple[4]}</td>
     <td>${activityTuple[5]}</td>
     <td>${activityTuple[6]}</td>
	</tr>
%endfor
%endfor
    </tbody>
   </table>
  </div>
 </form>