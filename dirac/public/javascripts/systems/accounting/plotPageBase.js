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
{ //When the plot edited using the presenter page a few attributes may does not exits.
  // To avoid the crash we should check its existence, before we select one of them.
	//Set the plot name
	var plotSelector = gLeftSidebarPanel.find( "name", "plotName" )[0];
	if (plotSelector){
	  plotSelector.setValue( plotRequest._plotName );
	}
	//Set grouping
	var groupingSelector = gLeftSidebarPanel.find( "name", "grouping" )[0];
	if (groupingSelector){
	  groupingSelector.setValue( plotRequest._grouping );
	}
	//Set pinned
	var pinningCheck = gLeftSidebarPanel.find( "name", "pinDates" )[0];
	if (pinningCheck){
	  pinningCheck.setValue ( '_pinDates' in plotRequest && plotRequest[ '_pinDates' ]+"" == "true" )
	}
	//Extra params
	for( k in plotRequest )
	{
		if( k.substring( 0, 4) == "_ex_" )
		{
			var wgtName = k.substring( 1 );
			var foundWdgt = gLeftSidebarPanel.find( "name", wgtName );
			if( foundWdgt.length == 0 )
				continue;
			foundWdgt = foundWdgt[0];
			foundWdgt.setValue ( plotRequest[ k ] );
		}
	}
	//Set title
	var plotTitleText = gLeftSidebarPanel.find( "name", "plotTitle" )[0];
	if (plotTitleText){
	  plotTitleText.setValue( plotRequest._plotTitle );
	}
	//Set time
	var timeSel = gLeftSidebarPanel.find( "name", "timeSelector" );
	if (timeSel){
	  for( var i = 0; i < timeSel.length; i++ )
	  {
	    if( timeSel[i].value == plotRequest._timeSelector )
	      timeSel[i].setValue( true );
	    else
	      timeSel[i].setValue( false );
	  }
	}

	if( plotRequest._timeSelector == -1 )
	{
		var timeSel = gLeftSidebarPanel.find( "name", "startTime" )[0];
		timeSel.setValue( plotRequest._startTime );
		timeSel = gLeftSidebarPanel.find( "name", "endTime" )[0];
		timeSel.setValue( plotRequest._endTime );
	}
	if( plotRequest._timeSelector == -2 )
	{
		var quartersSel = gLeftSidebarPanel.find( "name", "quartersSelector" )[0];
		quartersSel.setValue( plotRequest._quarters );
		quartersSel.show();
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

    if( ajaxParams._plotTitle )
        var tabTitle = ajaxParams._plotTitle + " by " + ajaxParams._grouping + timeSpan;
    else
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
	cbPlotRefreshHandler( refreshButton, false );
}
	
function plotAccountingPlot( ajaxResult, ajaxRequest )
{
	var result = Ext.util.JSON.decode( ajaxResult.responseText );
	if( ! result.success )
	{
		window.alert( "Request failed: " + result[ 'Message'] )
		return
	}
	var plotSpace = ajaxRequest.tabToPlotInto;
	plotSpace.body.dom.innerHTML = "<h3>Generating plot...</h3><h4>(this can take a while)</h4>";
	var img = new Image();
	var extImg = new Ext.Element( img );
        extImg.plotSpace = plotSpace;
	extImg.on( "load", setAccountingImage, extImg );
    extImg.on( "error", setAccountingImage, extImg );
	img.src = "getPlotImg?file=" + result.data + "&nocache=" + ( new Date() ).getTime();
}

function setAccountingImage( eventType, imgElement, scope, extra )
{
	var plotSpace = this.plotSpace;
	if( eventType.type == "error" )
	{
		plotSpace.body.dom.innerHTML = "<h3>Cannot load image</h3>"+imgElement.src+""; 
	} 
	else if( eventType.type == "load" )
	{
		var dom = plotSpace.body.dom;
		while( dom.hasChildNodes() )
			dom.removeChild( dom.firstChild );
		dom.appendChild( imgElement );
	}
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
	var plotParams = submitButton.plotParams;
	plotParams[ 'nocache' ] = ( new Date() ).getTime();
	plotTab.body.dom.innerHTML = "<h3>Requesting image...</h3>";
	Ext.Ajax.request( {
		timeout : 60000,
		url : 'generatePlot',
		success : plotAccountingPlot,
		failure: function() { 
				window.alert( "Oops, request failure :P ");
				activeTab.body.dom.innerHTML = "";
			},
		tabToPlotInto : plotTab,
		params : submitButton.plotParams
		}
	);
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

function appendAdvancedSettingsWidget()
{
	var advWidgets = [];
	advWidgets.push( createTextField( "plotTitle", "Plot title", "" ) );
	advWidgets.push( createCheckBox( "pinDates", "Pin dates", "true" ) );
	advWidgets.push( createCheckBox( "ex_staticUnits", "Do not scale units", "true" ) );
	appendToLeftPanel( createPanel( "Advanced options", advWidgets ) );	
}


