var gPlotsList = []; //Valid list of plots
var gMainPanel = false;
var gPlottingURL = "generatePlot";
var gHTMLPlottingURL = "generatePlotAndGetHTML";

function initPlotPage(){
  createLeftSelectPanel( "Query fields",
  						 gPlottingURL,
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

function humanReadableDate( dateObj )
{
	return dateObj.getFullYear() + "-" + ( dateObj.getMonth() + 1 ) + "-" + dateObj.getDate();
}

function serverGeneratedPlots( panel, ajaxEvent )
{
	var imgFile = ajaxEvent.result.data;

	var ajaxParams = ajaxEvent.options.params;
	if( ajaxParams._timeSelector == '86400' )
		var timeSpan = " for last day";
	else if ( ajaxParams._timeSelector == '604800' )
		var timeSpan = " for last week";
	else if ( ajaxParams._timeSelector == '2592000' )
		var timeSpan = " for last month";
	else var timeSpan = " since " + humanReadableDate( ajaxParams._startTime ) + " until " + humanReadableDate( ajaxParams._endTime );

	var tabTitle = ajaxParams._plotName + " by " + ajaxParams._grouping + timeSpan;

	var refreshButton = new Ext.Toolbar.Button({
    	text : "Refresh",
    	plotParams : ajaxParams,
    	handler : cbPlotRefreshHandler,
  		});
  	var autoRefreshMenu = new Ext.menu.Menu( {
  			items : [ { text : 'Disabled', value : 0 },
  					  { text : 'Each 15m', value : 900 },
  					  { text : 'Each hour', value : 3600 },
  					  { text : 'Each day', value : 86400 }
  				    ],
  			listeners : { itemclick : cbPlotAutoRefreshHandler },
  			plotParams : ajaxParams,
  			} );
  	var autoRefreshButton = new Ext.Toolbar.Button({
  		text : "Auto refresh :  Disabled",
  		menu : autoRefreshMenu ,
  		});
  	autoRefreshMenu.parentButton = autoRefreshButton;
    var refreshBar = new Ext.Toolbar({
    	items : [ refreshButton, "->", autoRefreshButton ],
   		margins: '0 0 0 0'
  		});
	var tab = gMainPanel.add( {
		title : tabTitle,
		closable : true,
		iconCls: 'tabs',
		html : "<img src='getPlotImg?file="+imgFile+"' style='margin:5px'/>",
		tbar : refreshBar,
		listeners : { close : cbTabDeactivate, deactivate : cbTabDeactivate },
		uAutoRefreshButton : autoRefreshButton,
		} );
	tab.show();
	refreshButton.plotTab = tab;
	autoRefreshMenu.plotTab = tab;
}

function cbPlotAutoRefreshHandler( menuItem, clickEvent )
{
  var plotTab = menuItem.parentMenu.plotTab;
  var updateMgr = plotTab.getUpdater();

  if( menuItem.value == 0 )
  {
  	updateMgr.stopAutoRefresh();
  }
  else
  	updateMgr.startAutoRefresh( menuItem.value, gHTMLPlottingURL, menuItem.parentMenu.plotParams );

  menuItem.parentMenu.parentButton.setText( "Auto refresh : " + menuItem.text );
}

function cbPlotRefreshHandler( submitButton, clickEvent )
{
  var plotTab = submitButton.plotTab;
  var updateMgr = plotTab.getUpdater();
  updateMgr.update ({
  	url : gHTMLPlottingURL,
  	params : submitButton.plotParams,
    text : "Regenerating plot...",
    } );
}

function cbTabDeactivate( tabPanel )
{
	tabPanel.getUpdater().stopAutoRefresh();
	tabPanel.uAutoRefreshButton.setText("Auto refresh :  Disabled");
}

function validateSelection( parsedSelection )
{
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
	if( ! parsedSelection._grouping )
	{
		alert( "Select a grouping for the plot!" );
		return false;
	}
	return true;
}