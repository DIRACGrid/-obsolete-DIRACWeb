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
		plotRequest = DEncode.decode( hash.substr(1) );
		if( validateSelection( plotRequest ) )
		{
			fillSelectionPanel( plotRequest );
			executeAJAXRequest( plotRequest );
		}
  }
}

function fillSelectionPanel( plotRequest )
{
	//Set the plot name
	var plotSelector = gLeftSidebarPanel.find( "name", "plotName" )[0];
	plotSelector.setValue( plotRequest._plotName );
	//Set grouping
	var groupingSelector = gLeftSidebarPanel.find( "name", "grouping" )[0];
	groupingSelector.setValue( plotRequest._grouping );
	//Set pinned
	var pinningCheck = gLeftSidebarPanel.find( "name", "pinDates" )[0];
	pinningCheck.setValue ( '_pinDates' in plotRequest && plotRequest[ '_pinDates' ]+"" == "true" )
	//Set title
	var plotTitleText = gLeftSidebarPanel.find( "name", "plotTitle" )[0];
	plotTitleText.setValue( plotRequest._plotTitle );
	//Set time
	var timeSel = gLeftSidebarPanel.find( "name", "timeSelector" );
	for( var i = 0; i < timeSel.length; i++ )
	{
		if( timeSel[i].value == plotRequest._timeSelector )
			timeSel[i].setValue( true );
		else
			timeSel[i].setValue( false );
	}
	if( plotRequest._timeSelector == -1 )
	{
		var timeSel = gLeftSidebarPanel.find( "name", "startTime" )[0];
		timeSel.setValue( plotRequest._startTime );
		timeSel = gLeftSidebarPanel.find( "name", "endTime" )[0];
		timeSel.setValue( plotRequest._endTime );
	}
	//Restrictions Magic!
	var selections = gLeftSidebarPanel.find( "name", "Selection conditions" )[0].items.items;
	for( var i = 0; i< selections.length; i++ )
	{
		var selection = selections[i];
		var name = "_" + selection.name;
		if( name in plotRequest )
		{
			selection.setValue( plotRequest[ name ] );
		}
		else
		{
			selection.setValue( false );
		}
	}
}

function humanReadableDate( dateObj )
{
	return dateObj.getFullYear() + "-" + ( dateObj.getMonth() + 1 ) + "-" + dateObj.getDate();
}

function activeTabChanged( tabPanel, tab )
{
	if( tab.uDETabDef )
		parent.location.hash = tab.uDETabDef;
	if( tab.uPlotRequest )
		fillSelectionPanel( tab.uPlotRequest );
}

function createNewTab()
{
	var refreshButton = new Ext.Toolbar.Button({
    	text : "Refresh",
    	plotParams : {},
    	handler : cbPlotRefreshHandler,
  		});
  	var autoRefreshMenu = new Ext.menu.Menu( {
  			items : [ { text : 'Disabled', value : 0 },
  					  { text : 'Each 15m', value : 900 },
  					  { text : 'Each hour', value : 3600 },
  					  { text : 'Each day', value : 86400 }
  				    ],
  			listeners : { itemclick : cbPlotAutoRefreshHandler },
  			plotParams : {},
  			} );
  	var autoRefreshButton = new Ext.Toolbar.Button({
  		text : "Auto refresh :  Disabled",
  		menu : autoRefreshMenu ,
  		});
  	autoRefreshMenu.parentButton = autoRefreshButton;
   var refreshBar = new Ext.Toolbar({
    	items : [ refreshButton,
    				 "<a target='_blank' href='getPlotData'>CSV data</a>",
    				 "->",
    				 autoRefreshButton ],
   		margins: '0 0 0 0'
  		});
	var tab = gMainPanel.add( {
		title : "Empty tab",
		uDETabDef : "",
		uPlotRequest : {},
		closable : true,
		iconCls: 'tabs',
		//html : "",
		// Plots are generated on the fly now
		//"<img src='getPlotImg?file="+imgFile+"' style='margin:5px'/>",
		tbar : refreshBar,
		listeners : { close : cbTabDeactivate, deactivate : cbTabDeactivate },
		uAutoRefreshButton : autoRefreshButton,
		} );
	tab.show();
	refreshButton.plotTab = tab;
	autoRefreshMenu.plotTab = tab;
}

function serverGeneratedPlots( panel, ajaxEvent, submitButton )
{
	var imgFile = ajaxEvent.result.data;

	var ajaxParams = ajaxEvent.options.params;
	if( ajaxParams._timeSelector == '86400' )
		var timeSpan = " for last day";
	else if ( ajaxParams._timeSelector == '604800' )
		var timeSpan = " for last week";
	else if ( ajaxParams._timeSelector == '2592000' )
		var timeSpan = " for last month";
	else {
		var timeSpan = " since " + ajaxParams._startTime;
		if( ajaxParams._endTime )
			timeSpan = timeSpan + " until " + ajaxParams._endTime;
	}

	var tabTitle = ajaxParams._plotName + " by " + ajaxParams._grouping + timeSpan;

  	var urlParams = []
  	for( a in ajaxEvent.options.params )
  		urlParams.push( a+"="+escape(ajaxEvent.options.params[a]).replace('+', '%2B').replace('%20', '+').replace('*', '%2A').replace('/', '%2F').replace('@', '%40') );

	if ( 0 == gMainPanel.items.length || ( 'createNewTab' in submitButton && submitButton.createNewTab ) )
	{
		createNewTab();
		fillSelectionPanel( ajaxParams )
	}

	var activeTab = gMainPanel.getActiveTab();

	activeTab.setTitle( tabTitle );
	activeTab.uDETabDef = ajaxEvent.options.sDEParams;
	activeTab.uPlotRequest = ajaxParams;

	var tabBar = activeTab.getTopToolbar();
	var barItems = tabBar.items;
	var refreshButton = barItems.items[0];
	refreshButton.plotParams = ajaxParams;
	var csvLink = barItems.items[1];
	csvLink.el.innerHTML = "<a target='_blank' href='getPlotData?"+urlParams.join("&")+"'>CSV data</a>";
	var autoRefreshButton = barItems.items[3];
	autoRefreshButton.menu.plotParams = ajaxParams;

	//Set the anchor
	parent.location.hash = ajaxEvent.options.sDEParams;
	//Trigger fist update of the tab
	activeTab.getUpdater().update({ url : gHTMLPlottingURL, params : ajaxParams, text : 'Generating plot...' });

}

function OLDserverGeneratedPlots( panel, ajaxEvent, submitButton )
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
		uDETabDef : ajaxEvent.options.sDEParams,
		uPlotRequest : ajaxParams,
		closable : true,
		iconCls: 'tabs',
		html : "",
		// Plots are generated on the fly now
		//"<img src='getPlotImg?file="+imgFile+"' style='margin:5px'/>",
		tbar : refreshBar,
		listeners : { close : cbTabDeactivate, deactivate : cbTabDeactivate },
		uAutoRefreshButton : autoRefreshButton,
		} );
	tab.show();
	refreshButton.plotTab = tab;
	autoRefreshMenu.plotTab = tab;
	//Set the hash anchor
	parent.location.hash = ajaxEvent.options.sDEParams;
	//Trigger fist update of the tab
	tab.getUpdater().update({ url : gHTMLPlottingURL, params : ajaxParams, text : 'Generating plot...' });
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
		if ( ! parsedSelection._startTime )
		{
			alert( "Start date?" );
			return false;
		}
		else if( parsedSelection._endTime && parsedSelection._endTime <= parsedSelection._startTime )
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


function orderSiteList( siteList )
{
  var firstSites = [ "LCG.CERN.ch", "LCG.CNAF.it", "LCG.GRIDKA.de", "LCG.IN2P3.fr",
                     "LCG.NIKHEF.nl", "LCG.PIC.es", "LCG.RAL.uk" ];
  var orderedSites = [];
  for( var i = 0; i < firstSites.length; i++ )
  {
    site = firstSites[i];
    for( var j = 0; j < siteList.length; j++ )
    {
      if( site == siteList[j] )
      {
        orderedSites.push( site );
        delete siteList[j];
        break;
      }
    }
  }
  for( var i = 0; i < siteList.length; i++ )
    orderedSites.push( siteList[i] );
  return orderedSites;
}
