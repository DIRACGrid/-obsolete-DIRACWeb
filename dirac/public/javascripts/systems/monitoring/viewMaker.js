
var fieldsDict = { "Site": "sources.site",
					 "Component type" : "sources.componentType",
					 "Component location" : "sources.componentLocation",
					 "Component name" : "sources.componentName",
					 "Activity" : "activities.description",
					 "Activity category" : "activities.category",
				   };

//var usedFields = [ 'Site', "Activity category" ];
//var definedFields = { 'sources.site' : ['mrcoffee.pic.es', 'micasa'], 'activities.category':["web"] };
var usedFields = [];
var definedFields = {};
var variableFields = [];
var numDefinedFields = 0;

function initViewMaker()
{
	var yuiLogger = new YAHOO.widget.LogReader();
  	YAHOO.widget.Logger.enableBrowserConsole();
  	yuiLogger.thresholdMax = 100;
  	yuiLogger.hide();
  	disableSelectors( 0 );
	initField( 0 );
	stubEl = document.getElementById( 'plotRequestStub' );
	stubEl.value= "";
}

function disableSelectors( startingIndex )
{
	var i = startingIndex;
	for( key in fieldsDict )
	{
		typEl = document.getElementById( "type-"+i );
		if( typEl == null )
		{
			break;
		}
  		while( typEl.length > 0 )
  		{
    		typEl.remove( typEl.length - 1 );
  		}
		YAHOO.util.Dom.setStyle( "type-"+i, "visibility", "hidden" );
		YAHOO.util.Dom.setStyle( "values-"+i, "visibility", "hidden" );
		YAHOO.util.Dom.setStyle( "variable-"+i, "visibility", "hidden" );
		YAHOO.util.Dom.setStyle( "variableValue-"+i, "visibility", "hidden" );
		var valEl = document.getElementById( "values-"+i );
		valEl.size=1;
		valEl.multiple = false;
  		while( valEl.length > 0 )
  		{
    		valEl.remove( valEl.length - 1 );
  		}
  		document.getElementById( "variable-"+i ).checked = false;
  		document.getElementById( "variableValue-"+i ).value = "";
		YAHOO.util.Dom.setStyle( "fieldContainer-"+i, "visibility", "hidden" );
		groupsEl = document.getElementById( "group-"+i );
		groupsEl.checked = false;
		i+=1;
	}
	stackEl = document.getElementById( "stackOption" );
	stackEl.checked = false;
}

function enableSelector( idSelector )
{
	YAHOO.util.Dom.setStyle( "type-"+idSelector, "visibility", "visible" );
	YAHOO.util.Dom.setStyle( "values-"+idSelector, "visibility", "visible" );
	YAHOO.util.Dom.setStyle( "variable-"+idSelector, "visibility", "visible" );
	YAHOO.util.Dom.setStyle( "variableValue-"+idSelector, "visibility", "visible" );
	var valEl = document.getElementById( "values-"+idSelector );
	valEl.size=10;
	valEl.multiple = "multiple";
	YAHOO.util.Dom.setStyle( "fieldContainer-"+idSelector, "visibility", "visible" );
}

function appendToSelect( selEl, optEl )
{
	try
	{
		selEl.add( optEl, null );
	}
	catch(ex)
	{
		selEl.add( optEl );
	}
}


function selectedField( key )
{
	var dbField = fieldsDict[ key ];
	for( var index in usedFields )
		if( dbField == usedFields[ index ] )
			return true;
	for( var index in variableFields )
		if( dbField == variableFields[ index ] )
			return true;
	return false;
}

function initField( idSelector )
{
	enableSelector( idSelector );
	var fieldEl = document.getElementById( "type-"+idSelector );
  	while( fieldEl.length > 0 )
  	{
    	fieldEl.remove( fieldEl.length - 1 );
  	}
  	var optEl = document.createElement( 'option' );
  	optEl.text = "-Select a field-";
  	optEl.value = "";
  	appendToSelect( fieldEl, optEl );
	for( key in fieldsDict )
	{
		if( selectedField( key ) )
			continue;
		var optEl = document.createElement('option');
		optEl.text = key;
		optEl.value = key;
		appendToSelect( fieldEl, optEl );
	}
}

function deleteFields( maxEntries )
{
	document.getElementById( "saveViewButton" ).disabled = true;
	while( maxEntries < numDefinedFields )
	{
		numDefinedFields -= 1;
		if( isVariableField( numDefinedFields ) )
			var key = variableFields.pop();
		else
			var key = usedFields.pop();
		delete definedFields[ key ];
	}
	YAHOO.log( "USED FIELDS " + usedFields );
	for( key in definedFields )
		YAHOO.log( "DEF FI " + key );
}

function updateFieldsSelector( idSelector, valuesList )
{
	disableSelectors( idSelector + 1 );
	deleteFields( idSelector );
	var valEl = document.getElementById( "values-" + idSelector);
	while( valEl.length > 0 )
	{
 		valEl.remove( valEl.length - 1 );
	}
	for( index in valuesList )
	{
		var value = valuesList[ index ]
		var optEl = document.createElement('option');
		optEl.text = value;
		optEl.value = value;
		appendToSelect( valEl, optEl );
	}
}

function getFieldSelected( idSelector )
{
	typEl = document.getElementById( "type-" + idSelector );
	return typEl.options[ typEl.selectedIndex ].value;
}

function valuesSelected( idSelector )
{
	disableSelectors( idSelector + 1 );
	deleteFields( idSelector );
	numDefinedFields += 1;
	var fieldSelected = getFieldSelected( idSelector );
	var dbField = fieldsDict[ fieldSelected ];
	usedFields.push( dbField );
	definedFields[ dbField ] = [];
	var valEl = document.getElementById( "values-" + ( idSelector) );
	for( index in valEl.options )
	{
		if( valEl.options[ index ].selected )
		{
			definedFields[ dbField ].push( valEl.options[ index ].value );
		}
	}
	if( definedFields[ dbField ].length == 0 )
	{
		deleteFields( idSelector );
	}
}

function fieldSelected( idSelector )
{
	selectedAttrib = getFieldSelected( idSelector )
	if( selectedAttrib == "" )
	{
		alert( "Select a valid field" );
		return
	}
	deleteFields( idSelector );
	sendQuery( "queryAttribs",
				{
				query : fieldsDict[ selectedAttrib ],
				defined : JSON.stringify( definedFields )
				},
				serverAttribQuery, idSelector );
}

function serverAttribQuery( respObj )
{
  var retDict = eval("(" + respObj.responseText + ")");
  if( retDict[ 'OK' ] )
  {
	var selectorId = respObj.argument;
	YAHOO.log( "Selector " + selectorId );
	var values = retDict[ 'Value' ];
	YAHOO.log( "Received " + values );
	updateFieldsSelector( selectorId, values );
  }
  else
    alert( "There was a problem querying fields : " + retDict[ 'Message' ] )
}

function enableSelect( idSelector )
{
	YAHOO.log( "Defined fields " + numDefinedFields );
	if( numDefinedFields < idSelector )
	{
		alert( "Select a value for the previous field first!" );
		return;
	}
	initField( idSelector );
}

function generatePlotRequest()
{
	var maxGrouping = 2;
	var minFields = 1;
	var i = 0;
	var groupList = [];
	var fieldsCond = {};
	for( var i = 0; i< usedFields.length; i++ )
	{
		var field = getFieldSelected( i );
		var dbField = fieldsDict[ field ];
		if( field == "" )
			break;
		groupEl = document.getElementById( "group-"+i );
		if( groupEl.checked )
		{
			groupList.push( dbField );
		}
		var valList = [];
		valEl = document.getElementById( "values-"+i );
		for( valIndex in valEl.options )
		{
			if( valEl.options[ valIndex ].selected )
			{
				valList.push( valEl.options[ valIndex ].value );
			}
		}
		if( valList.length > 0 )
			fieldsCond[ dbField ] = valList;
	}
	if( groupList.length > maxGrouping )
	{
		alert( "Don't group by more that "+maxGrouping+" fields" );
		return "";
	}
	if( numDefinedFields < minFields )
	{
		alert( "Select at least "+minFields+" fields" );
		return "";
	}
	legendEl = document.getElementById( "plotLabel" );
	legend = legendEl.value;
	if( ! legend.length )
	{
		alert( "Write plot description" );
		return "";
	}
	return JSON.stringify( { 'groupBy' : groupList,
								 'definition' : fieldsCond,
								 'variable' : variableFields,
								 'stacked' : document.getElementById( "stackOption" ).checked,
								 'label' : legend
								} );
}

function requestPlots()
{
	var jsonPlot = generatePlotRequest();
	if( jsonPlot.length == 0 )
		return;
	sendQuery( "tryView",
				{
				plotRequest : jsonPlot,
				timeLength : 'hour'
				},
				serverPlotsDone, 0 );
}

function serverPlotsDone( respObj )
{
  var retDict = JSON.parse( respObj.responseText );
  if( retDict[ 'OK' ] )
  {
	var plotsList = retDict[ 'Value' ][ 'images' ];
	var plotsRequest = retDict[ 'Value' ][ 'stub' ];
	YAHOO.log( "Received " + plotsList );
	updatePlots( plotsList, plotsRequest );
	document.getElementById( "saveViewButton" ).disabled = false;
  }
  else
    alert( "There was a problem plotting : " + retDict[ 'Message' ] );
}

function updatePlots( plotsList, plotsRequest )
{
	var containerEl = document.getElementById( 'imgContainer' );
	childrenList = YAHOO.util.Dom.getChildren( containerEl );
	for( var i = 0; i< childrenList.length; i++ )
	{
		YAHOO.log( "Deleting child " + i );
		containerEl.removeChild( childrenList[ i ] );
	}
	reqEl = document.getElementById( 'plotRequestStub' );
	reqEl.value = plotsRequest;
	for( var i = 0; i< plotsList.length; i++ )
	{
		YAHOO.log( "Adding image " + plotsList[i] );
		imgEl = document.createElement( 'img' );
		imgEl.src = "getPlotImg?file="+plotsList[i];
		imgEl.id = plotsList[i];
		YAHOO.util.Dom.setStyle( imgEl, "margin", "5px" );
		YAHOO.util.Dom.setStyle( imgEl, "display", "inline" );
		containerEl.appendChild( imgEl );
	}
}

function isVariableField( idSelector )
{
	return document.getElementById( "variable-" + idSelector ).checked;
}

function toggleVariableField( idSelector )
{
	var variableEnabled = isVariableField( idSelector );
	var selectValEl = document.getElementById( "values-" + idSelector );
	var editValEl = document.getElementById( "variableValue-" + idSelector )
	selectValEl.disabled = variableEnabled;
	editValEl.disabled = !variableEnabled;
	deleteFields( idSelector );
	disableSelectors( idSelector + 1 );
	if( variableEnabled )
	{
		for( index in selectValEl.options )
			selectValEl.options[ index ].selected = false;
	}
	else
	{
		editValEl.value = "";
	}
}

function updateVariableField( idSelector )
{
	disableSelectors( idSelector + 1 );
	deleteFields( idSelector );
	numDefinedFields += 1;
	var fieldSelected = getFieldSelected( idSelector );
	var dbField = fieldsDict[ fieldSelected ];
	variableFields.push( dbField );
	definedFields[ dbField ] = [ document.getElementById( "variableValue-" + idSelector ).value ];
}

function saveView()
{
	var titleEl = document.getElementById( "viewName" );
	var viewTitle = titleEl.value;
	if( viewTitle.length == 0 )
	{
		alert( "Write a name for the vie before saving it" );
		return;
	}
	var jsonPlot = generatePlotRequest();
	sendQuery( "saveView",
			{
			plotRequest : jsonPlot,
			viewName : viewTitle
			},
			serverViewSaved, 0 );
}

function serverViewSaved( respObj )
{
  var retDict = JSON.parse( respObj.responseText );
  if( retDict[ 'OK' ] )
  {
	alert( "View has been saved" );
  }
  else
    alert( "There was a problem plotting : " + retDict[ 'Message' ] );
}

/* AJAX REMOTE QUERY */
function sendQuery( action, params, successCallback, callbackArgs )
{
  postArgs = "";
  for(key in params)
  {
    postArgs += escape( key ) + "=" + escape( params[ key ] ) + "&";
  }
  postArgs = postArgs.substring( 0, postArgs.length - 1 );
  var callbackObj =
  {
    success : successRemoteQuery,
    failure : failedRemoteQuery,
    timeout : 60000,
    argument : [ successCallback, callbackArgs ]
  }
  showLoading();
  var transaction = YAHOO.util.Connect.asyncRequest( 'POST' , action , callbackObj, postArgs );
}

/* AJAX FAILED REMOTE QUERY */
function failedRemoteQuery( respObj )
{
  hideLoading();

  alert( "Failed remote query: " + respObj.statusText );
}

/* AJAX SUCEEDED REMOTE QUERY */
function successRemoteQuery( respObj )
{
  hideLoading();
  var userCallback = respObj.argument[0];
  respObj.argument = respObj.argument[1];
  userCallback( respObj );
}

function showLoading()
{
  YAHOO.util.Dom.setStyle( 'loading', "visibility", "visible" );
}


function hideLoading()
{
  YAHOO.util.Dom.setStyle( 'loading', "visibility", "hidden" );
}