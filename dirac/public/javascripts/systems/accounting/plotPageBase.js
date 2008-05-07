var gPlotsList = []; //Valid list of plots
var gMainPanel = false;

function initPlotPage(){
  createLeftSelectPanel( "Query fields",
  						 "generatePlot",
  						 parseLeftPanelSelections,
  						 serverGeneratedPlots,
  						 validateSelection );
  gMainPanel = new Ext.TabPanel( {
  							region : 'center',
  							enableTabScroll : true,
  							defaults: { autoScroll:true },
  							 } );
}

function renderPlotPage()
{
  renderInMainViewport([ gLeftSidebarPanel, gMainPanel ]);
}

function serverGeneratedPlots( panel, ajaxEvent )
{
	console.log( ajaxEvent );
	var imgFile = ajaxEvent.result.data;
	gMainPanel.add( {
		title : ajaxEvent.options.params._plotName,
		closable : true,
		iconCls: 'tabs',
		html : "<img src='getPlotImg?file="+imgFile+"' style='margin:5px'/>"
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