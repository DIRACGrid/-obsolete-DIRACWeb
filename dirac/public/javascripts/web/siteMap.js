
var gCurrentLatLong = false;
var gMapPanel = false;
var gMapToolbar = false;
var gMap = false;
var gTierLevelFilter = 0;
var gAutoLocationMarker = false;
var gCurrentMarkers = [];
var gSiteData = false;
var gStatusBar = false;
var gIconCache = {};
var gMarkers = {};
var gShownSites = [];

function initSiteMap() 
{
	Ext.onReady( function()
	{
		var toolBarItems = [ { text : 'Where am I?', 
			                  handler : function(){ navigator.geolocation.getCurrentPosition( autoPosition ); },
							 },
							 'Loading..', '->', 
							 'Display sites with Tier level <=', createTierFilterSelector(),
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
		gMapPanel = new Ext.Panel({
									layout: 'border',
									region : 'center',
									items : [ gMapToolbar, divPanel ]
							 	});
		renderInMainViewport( [ gMapPanel ] );
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
		data:[[1],[2],[3],['All',0]]
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
				filter = 0;
			if( gTierLevelFilter != filter )
			{
				gTierLevelFilter = filter;
				applyTierFilter();
			}
			if( combo.value == 0 )
				combo.value = 'All';
		}
 	});
	return combo;
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
					setSiteMapMode();
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
	setStatusMessage( "Aplying filter...");
	applyTierFilter();
	setStatusMessage( "")
}

function cleanMarkers()
{
	for( siteName in gMarkers )
	{
		gMarkers[ siteName ].set_map( null );
	}
	gShownSites = [];
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
				icon : icon
		  	}
		var marker = new google.maps.Marker( markerOps );   
		attachInfoWindow( marker, siteName, siteData );
		gMarkers[ siteName ] = marker;
	}
	else
	{
		gMarkers[ siteName ].set_icon( icon );
		gMarkers[ siteName ].set_map( gMap );
	}
	gShownSites.push( siteName );
}

function setSiteMapMode()
{
	for( var siteName in gSiteData )
	{
		var siteData = gSiteData[ siteName ];
		if( ! siteData.siteMaskStatus )
			continue
		if( siteData.tier < 2 )
			var type = 'highlight';
		else
			var type = 'normal';
		if( siteData.siteMaskStatus == 'Allowed')
			var status = 'green';
		else
			var status = 'red';
		var icon = gURLRoot + "/images/siteMap/"+type+"_static_"+status+".png";
		if( ! gIconCache[ icon ] )
		{
			gIconCache[ icon ] = new google.maps.MarkerImage( icon,
									new google.maps.Size(22,22),
									new google.maps.Point(0,0),
									new google.maps.Point(11,11) );
		}
		addMarker( siteName, siteData, gIconCache[ icon ] );
	}
}

function setJobSummaryMapMode()
{
	for( var siteName in gSiteData )
	{
		var siteData = gSiteData[ siteName ];
		var icon = generatePiePlot( 'jobSummary', siteName, siteData );
		if( icon.indexOf( "http://") == 0 )
			addMarker( siteName, siteData, icon );
	}
}

function setPilotSummaryMapMode()
{
	for( var siteName in gSiteData )
	{
		var siteData = gSiteData[ siteName ];
		var icon = generatePiePlot( 'pilotSummary', siteName, siteData );
		if( icon.indexOf( "http://") == 0 )
			addMarker( siteName, siteData, icon );
	}
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
}

function applyTierFilter()
{
	for( siteName in gMarkers )
	{
		var showSite = gShownSites.indexOf( siteName ) > -1;
		var passFilter = ( gTierLevelFilter == 0 || gSiteData[ siteName ].tier <= gTierLevelFilter );
		if( showSite && passFilter )  
			gMarkers[ siteName ].set_map( gMap );
		else
			gMarkers[ siteName ].set_map( null );
	}
}

function attachInfoWindow( marker, site, siteData )
{
	marker.siteListener = google.maps.event.addListener( marker, 'click', function() {
		showSiteStatusInfo( marker, site, siteData );
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
		    content: contentString
		});
	}
	siteData.infoWindow.open( gMap, marker );
}

function rendereSiteMaskStatus(value)
{
	switch( value )
	{
		case 'Active' :
			return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
			break;
		case 'Banned' :
			return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
			break;
		default:
			return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
			break;
	}
}

