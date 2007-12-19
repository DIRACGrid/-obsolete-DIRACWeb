
var gPlotSize=-1;
var gPlotTime="unknown";
var gViewId=-1;
var gVarData="";
var gURLRoot="";

function initMonitoringViews( urlRoot )
{
	gURLRoot = urlRoot + "/";
	setMonitoringPlotTime('hour');
	setMonitoringPlotSize(0);
	var timeEl = document.monitoringPlotsForm.timeSelect;
	if( ! timeEl )
		return;
	timeEl[0].checked = true;
	for(var i = 1 ; i < timeEl.length - 1 ; i++)
	{
		timeEl[i].checked = false;
	}
	var sizeEl = document.monitoringPlotsForm.sizeSelect;
	sizeEl[0].checked = true;
	for(var i = 1 ; i < sizeEl.length - 1 ; i++)
	{
		sizeEl[i].checked = false;
	}

}


function setMonitoringPlotTime( timeLength )
{
	var fromDateEl = document.getElementById( 'fromDate' );
	var toDateEl = document.getElementById( 'toDate' );
	switch( timeLength )
	{
		case 'hour':
		case 'day':
		case 'week':
		case 'month':
			fromDateEl.disabled=true;
			toDateEl.disabled=true;
			gPlotTime = timeLength;
			break;
		case 'manual':
			fromDateEl.disabled=false;
			toDateEl.disabled=false;
			gPlotTime = timeLength;
			break;
		default:
			alert( "Invalid time length selected!" );
	}
}

function setMonitoringPlotSize( sizeId )
{
	if( sizeId < 0 || sizeId > 4 )
		alert( "Invalid size! ");
	else
		gPlotSize = sizeId;
}

function setMonitoringViewId( viewId )
{
	gViewId = viewId;
}

function setMonitoringVariableData( varData )
{
	gVarData = varData;
}

function plotMonitoringView()
{
	if( gViewId == -1 )
	{
		alert( "Select a valid view!" );
		return
	}
	request = { 'id' : gViewId,
				'timeLength' : gPlotTime,
				'size' : gPlotSize,
				'varData' : gVarData
			  };
	if( gPlotTime == "manual" )
	{
		var fromDateEl = document.getElementById( 'fromDate' );
		if( fromDateEl.value.length == 0 )
		{
			alert( "Select a valid date!" );
			return;
		}
		request[ 'fromDate' ] = fromDateEl.value;
		var toDateEl = document.getElementById( 'toDate' );
		if( toDateEl.value.length == 0 )
		{
			alert( "Select a valid date!" );
			return;
		}
		request[ 'toDate' ] = toDateEl.value;
	}
	var request = JSON.stringify( request );
	sendQuery( gURLRoot + "plotView",
			{
			plotRequest : request,
			},
			servierViewPlotted, 0 );
}

function servierViewPlotted( respObj )
{
  var retDict = JSON.parse( respObj.responseText );
  if( retDict[ 'OK' ] )
  {
	var plotsList = retDict[ 'Value' ];
	updatePlots( plotsList );
  }
  else
    alert( "There was a problem plotting : " + retDict[ 'Message' ] );
}

function updatePlots( plotsList, plotsRequest )
{
	var containerEl = document.getElementById( 'monitoringImagesContainer' );
	childrenList = YAHOO.util.Dom.getChildren( containerEl );
	for( var i = 0; i< childrenList.length; i++ )
	{
		containerEl.removeChild( childrenList[ i ] );
	}
	for( var i = 0; i< plotsList.length; i++ )
	{
		YAHOO.log( "Adding image " + plotsList[i] );
		imgEl = document.createElement( 'img' );
		imgEl.src = "getPlotImg?file="+plotsList[i];
		imgEl.id = plotsList[i];
		YAHOO.util.Dom.setStyle( imgEl, "margin", "1px" );
		YAHOO.util.Dom.setStyle( imgEl, "display", "inline" );
		containerEl.appendChild( imgEl );
	}
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