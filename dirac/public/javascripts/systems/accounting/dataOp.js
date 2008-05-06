var gPlotsList = []; //Valid list of plots
var gMainPanel = false;

function initDataOp( plotsList, selectionData ){
  gPlotsList = plotsList;
  Ext.onReady(function(){
    renderPage( plotsList, selectionData );
  });
}
/*
		dataFields : elValues.dataFieldsName,
		valueField : elValues.valueFieldName,
		displayField : elValues.displayFieldName
*/

function renderPage( plotsList, selectionData ){
  var leftBar = createLeftSelectPanel( "Query fields",
  									   "generatePlot",
  									   parseLeftPanelSelections,
  									   serverGeneratedPlots,
  									   validateSelection );
  gMainPanel = new Ext.TabPanel( {
  							region : 'center',
  							enableTabScroll : true,
  							defaults: { autoScroll:true },
  							 } );

  appendToLeftPanel( createComboBox( "plotName", "Plot to generate", "Select a plot", plotsList ) );

  appendTimeSelectorToLeftPanel();

  appendToLeftPanel( createCollepsibleMultiselect( "OperationType", "Operation type", selectionData.OperationType ) );
  appendToLeftPanel( createCollepsibleMultiselect( "User", "User", selectionData.User ) );
  appendToLeftPanel( createCollepsibleMultiselect( "ExecutionSite", "Execution site", selectionData.ExecutionSite ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Source", "Source site", selectionData.Source ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Destination", "Destination site", selectionData.Destination ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Protocol", "Protocol", selectionData.Protocol ) );
  appendToLeftPanel( createCollepsibleMultiselect( "FinalStatus", "Final transfer status", selectionData.FinalStatus ) );


  renderInMainViewport([ leftBar, gMainPanel ]);
}

function serverGeneratedPlots( panel, ajaxEvent )
{
	console.log( ajaxEvent );
	var imgFile = ajaxEvent.result.data;
	gMainPanel.add( {
		title : ajaxEvent.options.params._plotName,
		closable : true,
		iconCls: 'tabs',
		html : "<img src='getPlotImg?file="+imgFile+"'/>"
		} ).show();
}

function validateSelection( parsedSelection )
{
	console.log( parsedSelection );
	if( ! parsedSelection._plotName  )
	{
		alert( "Select a plot to be generated!" );
		return false;
	}
	if( parsedSelection._timeSelector == -1 )
	{
		if ( ! parsedSelection._endTime || ! parsedSelection._startTime )
		{
			alert( "Start and end dates?" );
			return false;
		}
		else if( parsedSelection._endTime <= parsedSelection._startTime )
		{
			alert( "End time has to be greater than start time" );
			return false;
		}
	}
	return true;
}