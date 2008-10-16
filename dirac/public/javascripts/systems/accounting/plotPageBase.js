var gPlotsList = []; //Valid list of plots
var gMainPanel = false;
var gPlottingURL = "generatePlot";
var gHTMLPlottingURL = "generatePlotAndGetHTML";

function initPlotPage( panelName ){
  createLeftSelectPanel( panelName,
  						 gPlottingURL,
  						 parseLeftPanelSelections,
  						 serverGeneratedPlots,
  						 validateSelection );
  gMainPanel = new Ext.TabPanel( {
  							region : 'center',
  							enableTabScroll : true,
  							defaults: { autoScroll:true },
  							listeners : { tabchange : activeTabChanged },
  							 } );
}

function renderPlotPage()
{
  renderInMainViewport([ gLeftSidebarPanel, gMainPanel ]);
  var hash = parent.location.hash;
  if( hash )
  {
		plotRequest = Ext.util.JSON.decode( hash.substr(1) );
		if( validateSelection( plotRequest ) )
		{
			executeAJAXRequest( plotRequest );
		}
  }
}

function humanReadableDate( dateObj )
{
	return dateObj.getFullYear() + "-" + ( dateObj.getMonth() + 1 ) + "-" + dateObj.getDate();
}

function activeTabChanged( tabPanel, tab )
{
	parent.location.hash = tab.sJSONTabDef;
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
	else var timeSpan = " since " + ajaxParams._startTime + " until " + ajaxParams._endTime;

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
  	urlParams = []
  	for( a in ajaxEvent.options.params )
  		urlParams.push( a+"="+escape(ajaxEvent.options.params[a]).replace('+', '%2B').replace('%20', '+').replace('*', '%2A').replace('/', '%2F').replace('@', '%40') );

   var refreshBar = new Ext.Toolbar({
    	items : [ refreshButton,
    				 "<a target='_blank' href='getPlotData?"+urlParams.join("&")+"'>CSV data</a>",
    				 "->",
    				 autoRefreshButton ],
   		margins: '0 0 0 0'
  		});
	var tab = gMainPanel.add( {
		title : tabTitle,
		sJSONTabDef : ajaxEvent.options.sJSONParams,
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
	//Set the hash anchor
	parent.location.hash = ajaxEvent.options.sJSONParams;
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