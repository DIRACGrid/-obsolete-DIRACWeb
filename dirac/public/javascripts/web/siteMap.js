
var gCurrentLatLong = false;
var gMapPanel = false;
var gMapToolbar = false;
var gMap = false;
var gSitesGridPanel = false;
var gTierLevelFilter = -1;
var gAutoLocationMarker = false;
var gCurrentMarkers = [];
var gSiteData = false;
var gStatusBar = false;
var gOverInfoWindow = false;
var gIconCache = {};
var gMarkers = {};
var gMarkedSites = [];

function initSiteMap() 
{
	Ext.onReady( function()
	{
		var toolBarItems = [ { text : 'Where am I?', 
			                  handler : function(){ navigator.geolocation.getCurrentPosition( autoPosition ); },
							 },
							 'Loading..', '->', 
							 'Tier filter: ', createTierFilterSelector(),
							 "" ];
		
		var buttons = [ [ 'Site mask', 'siteMask' ],
		                [ 'Job summary', 'jobSummary'],
		                [ 'Pilot summary', 'pilotSummary' ],
		                [ 'Files stored', 'filesDataSummary' ],
		                [ 'Sorage usage', 'storageDataSummary' ],
		              ];
		for( var i = 0; i < buttons.length; i++ )
		{
			var button = buttons[i];
			var toolbarButton = new Ext.Toolbar.Button({
										text : button[0],
										allowDepress : true,
										enableToggle : true,
										toggleGroup : 'MapStates',
										toggleHandler : setMapInMode,
										requestedMapMode : button[1]
			                         });
			toolBarItems.push( toolbarButton );
		}
		
		gMapToolbar = new Ext.Toolbar({ id : 'mapToolbar',
										region : 'south', 
										items : toolBarItems
								  		});
		var divPanel = new Ext.Panel({ 
									region : 'center', 
									html : '<div id="map_canvas" style="height:100%" />'
							    });
		gSitesGridPanel = createSitesGridPanel();
		gMapPanel = new Ext.Panel({
									layout: 'border',
									region : 'center',
									items : [ gMapToolbar, divPanel, gSitesGridPanel ]
							 	});
		renderInMainViewport( [ gMapPanel ] );
		initPalettes();
		initMap();
		
		//By default we set the siteMask state
		toolBarItems[ toolBarItems.length - buttons.length ].toggle();
	});
}

function setStatusMessage( msg )
{
	gMapToolbar.items.get( 1 ).el.innerHTML = msg;
}

function initMap()
{
	if( document.getElementById( 'map_canvas' ) )
	{
		gOverInfoWindow = new google.maps.InfoWindow({});
		gCurrentLatLong = new google.maps.LatLng( 46.231739, 6.053864 );
		var mapOptions = {
			      zoom: 4,
			      center: gCurrentLatLong,
			      mapTypeId: google.maps.MapTypeId.SATELLITE
			    };
		gMap = new google.maps.Map( document.getElementById("map_canvas"), mapOptions );	
		gAutoLocation = new google.maps.Marker({
		      position: gCurrentLatLong, 
		      title: "You are here!"
		  });   
	}
}

function createTierFilterSelector(){
	var store = new Ext.data.SimpleStore({
		fields:['number'],
		data:[[0],[1],[2],['All',-1]]
	});
	var combo = new Ext.form.ComboBox({
		allowBlank:false,
		displayField:'number',
		editable:false,
		maxLength:3,
		maxLengthText:'The maximum value for this field is 999',
		minLength:1,
		minLengthText:'The minimum value for this field is 1',
		mode:'local',
		name:'number',
		selectOnFocus:true,
		store:store,
		triggerAction:'all',
		typeAhead:true,
		value: 'All',
		width:50
	});
	combo.on({
		'collapse':function() {
			var filter = combo.value;
			if( filter == "All" )
				filter = -1;
			if( gTierLevelFilter != filter )
			{
				gTierLevelFilter = filter;
				applyTierFilter();
			}
			if( combo.value == -1 )
				combo.value = 'All';
		}
 	});
	return combo;
}

function createSitesGridPanel()
{
	grid = new Ext.grid.GridPanel( {
		store : new Ext.data.SimpleStore( {
			fields : [ { name : 'name' } ],
			idIndex : 0
		}),
		columns : [ { name : 'View', dataIndex : 'name', menuDisabled : true , header : 'Click on a site to center view on it' } ],
		viewConfig : { forceFit: true, autoFill : true },
		listeners : { cellclick : clickSiteInGridPanel },
		region : 'west',
		collapsible : true,
		collapsed : true,
		title : "Sites",
		width : 300
	});
	
	return grid;
}

function autoPosition( position )
{
	gCurrentLatLong = new google.maps.LatLng( position.coords.latitude, position.coords.longitude );
	gMap.set_center( gCurrentLatLong );
	if( gAutoLocationMarker )
		gAutoLocationMarker.set_map( null );
	gAutoLocation.set_map( gMap );
	gAutoLocation.set_position( gCurrentLatLong );
}

function setMapInMode( button )
{
	if( ! gSiteData )
	{
		setStatusMessage( "Getting data..." );
		Ext.Ajax.request( {
			url : 'getSitesData',
			success : resultRefreshData,
			failure: function() { window.alert( "Oops, request failure :P ") },
			requestedMapMode : button.requestedMapMode
		})
	}
	else
		toggleMapMode( button.requestedMapMode )
}

function resultRefreshData( ajaxResult, ajaxRequest )
{
	var result = Ext.util.JSON.decode( ajaxResult.responseText );
	if( ! result[ 'OK'] )
	{
		window.alert( "Request failed: " + result[ 'Message'] )
		return
	}
	gSiteData = result[ 'Value' ];
	toggleMapMode( ajaxRequest.requestedMapMode );
}

function toggleMapMode( requestedMapMode )
{
	setStatusMessage( "Cleaning markers...");
	cleanMarkers();
	setStatusMessage( "Loading...");
	switch( requestedMapMode )
	{
		case 'siteMask': 
					setSiteMaskMode();
					break;
		case 'jobSummary':
					setJobSummaryMapMode();
					break;
		case 'pilotSummary':
					setPilotSummaryMapMode();
					break;
		case 'filesDataSummary':
					setFilesSummaryMapMode();
					break;
		case 'storageDataSummary':
					setStorageSummaryMapMode();
					break;
		default:
				alert( "Invalid map mode! ");
	}
	applyTierFilter();
}

function cleanMarkers()
{
	for( siteName in gMarkers )
	{
		gMarkers[ siteName ].set_map( null );
	}
	gMarkedSites = [];
}

function addMarker( siteName, siteData, icon )
{
	if( ! siteData.longlat )
		return
	if( ! gMarkers[ siteName ] )
	{
		var longlat = siteData.longlat;
		var markerOps = {
				position:  new google.maps.LatLng( parseFloat( longlat[1] ), parseFloat( longlat[0] ) ), 
				title: siteName,
				map : gMap,
				tierLevel : siteData.tier,
				icon : icon,
				zIndex : 10 - siteData.tier
		  	}
		var marker = new google.maps.Marker( markerOps );
		attachMouseOverWindow( marker, siteName );
		attachInfoWindow( marker, siteName, siteData );
		gMarkers[ siteName ] = marker;
	}
	else
	{
		gMarkers[ siteName ].set_icon( icon );
		gMarkers[ siteName ].set_map( gMap );
	}
	gMarkedSites.push( siteName );
}

function setSiteMaskMode()
{
	for( var siteName in gSiteData )
	{
		var siteData = gSiteData[ siteName ];
		if( ! siteData.siteMaskStatus )
			continue
		var activity = 'static';
		var extension = 'png';
		if( siteData.tier < 2 )
			var siteType = 'highlight';
		else
			var siteType = 'normal';
		if( siteData.siteMaskStatus == 'Allowed')
			var status = 'green';
		else
			var status = 'red';
		if( siteData.jobSummaryRamp )
		{
			var ramp = siteData.jobSummaryRamp;
			if( ramp.Running > 10 )
			{
				var activity = 'up';
				var extension = 'gif';
			}
			if( ramp.Running < - 10 )
			{
				var activity = 'down';
				var extension = 'gif';
			}
		}
		var icon = gURLRoot + "/images/siteMap/"+siteType+"_"+status+"_"+activity+"."+extension;
		if( ! gIconCache[ icon ] )
		{
			gIconCache[ icon ] = new google.maps.MarkerImage( icon,
									new google.maps.Size(22,22),
									new google.maps.Point(0,0),
									new google.maps.Point(11,11) );
		}
		addMarker( siteName, siteData, gIconCache[ icon ] );
	}
	setStatusMessage( "" ); 
}

function getSizeScale( attr, subAttr )
{
	var min = 10000;
	var max = 0;
	var scale = {};
	var values = {};
	for( var siteName in gSiteData )
	{
		if( ! gSiteData[ siteName ][ attr ] )
		{
			continue;
		}
		var attrVal = gSiteData[ siteName ][ attr ];
		if( subAttr )
		{
			if( ! attrVal[ subAttr ] )
			{
				continue;
			}
			var val = attrVal[ subAttr ];
		}
		else
		{
			var val = 0;
			for( var j in attrVal )
			{
				if ( attrVal[j] )
					val += attrVal[j];
			}
		}
		values[ siteName ] = val;
		if( val < min )
			min = val;
		if( val > max )
			max = val;
	}
	var range = max - min;
	for( var siteName in gSiteData )
	{
		if( ! values[ siteName ] || ! range )
			scale[ siteName ] = 1;
		else
			scale[ siteName ] = 1 + ( ( values[ siteName ] - min ) / range ) / 2;
	}
	return scale;
}

function setJobSummaryMapMode()
{
	var scale = getSizeScale( 'jobSummary', 'Running' );
	for( var siteName in gSiteData )
	{
		var siteData = gSiteData[ siteName ];
		var extraArgs = {};
		if( scale[ siteName ] )
			extraArgs.scaleSize = scale[ siteName ];
		var icon = generatePiePlot( 'jobSummary', siteName, siteData, extraArgs );
		if( icon.indexOf( "http://") == 0 )
			addMarker( siteName, siteData, icon );
	}
	setStatusMessage( getLegendForPalette( 'jobSummary' ) );
}

function setPilotSummaryMapMode()
{
	var scale = getSizeScale( 'pilotSummary' );
	for( var siteName in gSiteData )
	{
		var siteData = gSiteData[ siteName ];
		var extraArgs = {};
		if( scale[ siteName ] )
			extraArgs.scaleSize = scale[ siteName ];
		var icon = generatePiePlot( 'pilotSummary', siteName, siteData, extraArgs );
		if( icon.indexOf( "http://") == 0 )
			addMarker( siteName, siteData, icon );
	}
	setStatusMessage( getLegendForPalette( 'pilotSummary' ) );
}

function setFilesSummaryMapMode()
{
	for( var siteName in gSiteData )
	{
		var siteData = gSiteData[ siteName ];
		var icon = generateBarPlot( 'filesDataSummary', siteName, siteData );
		if( icon.indexOf( "http://") == 0 )
			addMarker( siteName, siteData, icon );
	}
	setStatusMessage( getLegendForPalette( "filesDataSummary" ) );
}

function setStorageSummaryMapMode()
{
	for( var siteName in gSiteData )
	{
		var siteData = gSiteData[ siteName ];
		var icon = generateBarPlot( 'usageDataSummary', siteName, siteData );
		if( icon.indexOf( "http://") == 0 )
			addMarker( siteName, siteData, icon );
	}
	setStatusMessage( getLegendForPalette( "usageDataSummary" ) );
}

function applyTierFilter()
{
	var shownSites = {};
	for( siteName in gMarkers )
	{
		var markedSite = gMarkedSites.indexOf( siteName ) > -1;
		var passFilter = ( gTierLevelFilter == -1 || gSiteData[ siteName ].tier == gTierLevelFilter );
		if( markedSite && passFilter )
		{
			gMarkers[ siteName ].set_map( gMap );
			var tier = gSiteData[ siteName ].tier;
			if( ! shownSites[ tier ] )
				shownSites[ tier ] = [];
			shownSites[ tier ].push( siteName )
		}
		else
			gMarkers[ siteName ].set_map( null );
	}
	var ordered = [];
	var tiers = [];
	for( var tier in shownSites )
	{
		tiers.push( tier );
	}
	tiers.sort();
	for( var i = 0; i < tiers.length; i++ )
	{
		var tier = tiers[ i ]; 
		shownSites[ tier ].sort();
		for( var j = 0; j< shownSites[ tier ].length; j++ )
			ordered.push( [ shownSites[ tier ][ j ] ] );
	}
	gSitesGridPanel.store.loadData( ordered );
}

function attachMouseOverWindow( marker, siteName )
{
	return;
	google.maps.event.addListener( marker, 'mouseover', function() {
		gOverInfoWindow.setContent( siteName );
		gOverInfoWindow.setPosition( marker.getPosition() );
		gOverInfoWindow.open( gMap );
	});
	
}

function attachInfoWindow( marker, siteName, siteData )
{
	marker.siteListener = google.maps.event.addListener( marker, 'click', function() {
		gOverInfoWindow.close();
		showSiteStatusInfo( marker, siteName, siteData );
	  });
}

function showSiteStatusInfo( marker, site, siteData )
{
	if( ! siteData.infoWindow )
	{
		var contentString = '<div style="width:100%">'+
		getSiteDescriptionHTML( site, siteData )+
	    '<h2 style="border-top:1px solid;font-variant:small-caps;text-align:center;background-color:#EEE;width:100%" onclick="javascript:showSiteControlWindow(\''+site+'\')">More info</h2>'+
	    '</div>'+
	    '</div>';

		siteData.infoWindow = new google.maps.InfoWindow({
									content : contentString
								});

	}
	siteData.infoWindow.open( gMap, marker );
}

function clickSiteInGridPanel( gridPanel, row )
{
	var siteName = gridPanel.getStore().data.items[row].data.name;
	showSiteStatusInfo( gMarkers[ siteName ], siteName, gSiteData[ siteName ] )
}

