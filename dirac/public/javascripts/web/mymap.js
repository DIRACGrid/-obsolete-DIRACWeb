var mapDataObject = new Object();

function initMap_SM(wrapperDiv, showLayer, init_lat, init_lon, init_zoom, refresh_rate, mapFileObject, panelObject)
{
	/*
		Parameters:
		wrapperDiv = name of DIV tag where all of the controls, maps, etc., should be dynamically loaded
		showLayer = the zero-based index of the layer to initially display
		init_lat, init_long, init_zoom = which part of the world the map should initially load to
		refresh_rate = how often the script should reload KML data
		mapFileObject = Object with KML files to load
		panelObject = Panel object into which the details information should be loaded
	*/

	// Initialize the map data object
	mapDataObject.layerData = new Object();
	mapDataObject.currentLayerIndex = -1;
	mapDataObject.selectedFeature = null;
	mapDataObject.featureHandle = null;
	mapDataObject.lastFeature = null;
	mapDataObject.map = null;

	mapDataObject.wrapperDiv = wrapperDiv;
	mapDataObject.mapFileObject = mapFileObject;
	mapDataObject.panelObject = panelObject;

	// Load the layer information
	initLayers_SM();

	// Dynamically create menu, map, and detail container
	createPage_SM();
	
	// Create the map
	mapDataObject.map = new OpenLayers.Map("SMmap", {
							 controls: [
										new OpenLayers.Control.PanZoomBar(),
										new OpenLayers.Control.NavToolbar(),
										new OpenLayers.Control.LayerSwitcher(),
										new OpenLayers.Control.MousePosition(),
										//new OpenLayers.Control.OverviewMap(),
										new OpenLayers.Control.KeyboardDefaults()
							 ],
							 numZoomLevels: 10
			   });
	
	// Load the basemaps
	var wms = new OpenLayers.Layer.WMS("Base Map", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'}, {'isBaseLayer': true});
	var wms2 = new OpenLayers.Layer.WMS("Satellite", "http://labs.metacarta.com/wms-c/Basic.py", {'layers':'satellite'}, {'isBaseLayer' : true});
	
	// Add the base maps to the map
	mapDataObject.map.addLayers([wms2, wms]);
	
	// Activate the initial layer
	activateLayer_SM(showLayer);
	
	// Last minute map stuff
	if (!init_lon)
		init_lon = 14;
	if (!init_lat)
		init_lat = 47;
	if (!init_zoom)
		init_zoom = 5;
	mapDataObject.map.setCenter(new OpenLayers.LonLat(init_lon, init_lat), init_zoom);
	mapDataObject.map.fractionalZoom = 1;
	
	// Activate the refresh timer
	var timerId;
	if (refresh_rate)
		timerId = setInterval("reloadData_SM()", 1000 * refresh_rate);
}

function LayerData_SM(name, files, legend, popupWidth, popupHeight, clickLayer)
{
	// Just take care of the layerData structure
	this.name = name;		// Name of the layer
	this.files = files;		// Array of files to attach to this layer
	this.legend = legend;		// Image to display underneath map
	this.popupWidth = popupWidth;	// Width, height of feature popup
	this.popupHeight = popupHeight;
	this.clickLayer = clickLayer;	// -1 = disable feature handle; otherwise, child layer index to attach handle to
	this.layers = new Array();	// Array of child layers
}

function initLayers_SM()
{
	// Set defaults
	var sitemask = new Array();
	var jobsummary = new Array();
	var pilotsummary = new Array();
	var datastorage = new Array();
	var animated = new Array();

	sitemask[0] = "sitemask.kml";
	jobsummary[0] = "jobsummary.kml";
	pilotsummary[0] = "pilotsummary.kml";
	datastorage[0] = "datastorage.kml";
	animated[0] = "animated-green.kml";
	animated[1] = "animated-yellow.kml";
	animated[2] = "animated-gray.kml";

	if (mapDataObject.mapFileObject)
	{
		if (mapDataObject.mapFileObject.sitemask)
			sitemask[0] = mapDataObject.mapFileObject.sitemask;
		if (mapDataObject.mapFileObject.jobsummary)
			jobsummary[0] = mapDataObject.mapFileObject.jobsummary;
		if (mapDataObject.mapFileObject.pilotsummary)
			pilotsummary[0] = mapDataObject.mapFileObject.pilotsummary;
		if (mapDataObject.mapFileObject.datastorage)
			datastorage[0] = mapDataObject.mapFileObject.datastorage;
		if (mapDataObject.mapFileObject.animated)
		{
			if (mapDataObject.mapFileObject.animated.length == 3)
			{
				animated[0] = mapDataObject.mapFileObject.animated[0]
				animated[1] = mapDataObject.mapFileObject.animated[1]
				animated[2] = mapDataObject.mapFileObject.animated[2]
			}
		}
	}

	// Set the static layer information
	mapDataObject.layerData[0] = new LayerData_SM("Site Mask", sitemask, "SM-Legend.png", 0, 0, 0);
	mapDataObject.layerData[1] = new LayerData_SM("Job Summary", jobsummary, "JS-Legend.png", 200, 170, 0);
	mapDataObject.layerData[2] = new LayerData_SM("Pilot Summary", pilotsummary, "PS-Legend.png", 0, 0, 0);
	mapDataObject.layerData[3] = new LayerData_SM("Data Storage", datastorage, "DS-Legend.png", 0, 0, 0);
	mapDataObject.layerData[4] = new LayerData_SM("Animated", animated, null, 0, 0, -1);

	mapDataObject.numLayers = 5;
	
	// Load all layers into memory
	for (var i = 0; i < mapDataObject.numLayers; i++)
	{
		for (var j = 0; j < mapDataObject.layerData[i].files.length; j++)
		{
			mapDataObject.layerData[i].layers[j] = new OpenLayers.Layer.GML(mapDataObject.layerData[i].name + j, mapDataObject.layerData[i].files[j], {format: OpenLayers.Format.KML, formatOptions: {extractStyles: true, extractAttributes: true}, displayInLayerSwitcher: false});
		}
	}
}

function createPage_SM()
{
	if (!document.getElementById(mapDataObject.wrapperDiv))
	{
		alert("The wrapper ID passed to initMap_SM() is invalid.");
		return;
	}

	var stringToAdd = "";

	//if (!mapDataObject.panelObject)
	{
		/*stringToAdd += "<div id=\"SMcontrols\"><ul>\
		                <li><a class=\"SMcurrentLink\" onclick=\"activateLayer_SM(0)\">Site Mask</a></li>\
	                        <li><a onclick=\"activateLayer_SM(1)\">Job Summary</a></li>\
	                        <li><a onclick=\"activateLayer_SM(2)\">Pilot Summary</a></li>\
	                        <li><a onclick=\"activateLayer_SM(3)\">Data Storage</a></li>\
	                        <li><a onclick=\"activateLayer_SM(4)\">Animated</a></li>\
	                        </ul></div>";*/
		stringToAdd += "<div id=\"SMcontrols\"></div>"
	}

	stringToAdd += "<div id=\"SMmap\"></div>";
	stringToAdd += "<div id=\"SMlegend\"></div>";

	if (!mapDataObject.panelObject)
		stringToAdd += "<div id=\"SMdetail_container\"><div id=\"SMdetails\"></div></div>";
	
	document.getElementById(mapDataObject.wrapperDiv).innerHTML = stringToAdd;

	if (mapDataObject.panelObject)
	{
		mapDataObject.panelObject.show();
		document.getElementById("SMmap").style.height = "95%";
		document.getElementById("SMlegend").style.height = "5%";
	}
	else
	{
		document.getElementById("SMmap").style.height = "60%";
	}
}

function updateMenu_SM(layer)
{
	menuString = "<ul>";
	for (var i = 0; i < mapDataObject.numLayers; i++)
	{
		if (i == layer)
			menuString += "<li><a class=\"SMcurrentLink\" onclick=\"activateLayer_SM(" + i + ")\">" + mapDataObject.layerData[i].name + "</a></li>";
		else
			menuString += "<li><a onclick=\"activateLayer_SM(" + i + ")\">" + mapDataObject.layerData[i].name + "</a></li>";
	}
	menuString += "</ul>";
	document.getElementById("SMcontrols").innerHTML = menuString;
}

function activateLayer_SM(layer)
{
	// Don't activate the layer if it is already active
	if (mapDataObject.currentLayerIndex == layer)
		return;
	if (layer < 0 || layer >= mapDataObject.layerData.length)
		layer = 0;

	// Update the menu
//	if (!mapDataObject.panelObject)
		updateMenu_SM(layer);
		
	// Remove the previous layer(s)
	if (mapDataObject.currentLayerIndex != -1)
	{
		for (var i = 0; i < mapDataObject.layerData[mapDataObject.currentLayerIndex].layers.length; i++)
			mapDataObject.map.removeLayer(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[i])
	}
		
	// Delete any previously open popups
	if (mapDataObject.featureHandle != null)
	{
		if (mapDataObject.selectedFeature != null)
			onFeatureUnselect_SM(mapDataObject.selectedFeature);
		mapDataObject.map.removeControl(mapDataObject.featureHandle);
		mapDataObject.featureHandle = null;
	}

	// Add the layer(s)
	mapDataObject.currentLayerIndex = layer;
	for (var i = 0; i < mapDataObject.layerData[mapDataObject.currentLayerIndex].layers.length; i++)
	{
		mapDataObject.map.addLayer(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[i]);
		mapDataObject.map.setLayerIndex(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[i], i);
	}
	
	// Add controls to the active layer
	if (mapDataObject.layerData[mapDataObject.currentLayerIndex].clickLayer >= 0)
	{
		mapDataObject.featureHandle = new OpenLayers.Control.SelectFeature(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[mapDataObject.layerData[mapDataObject.currentLayerIndex].clickLayer], {onSelect: onFeatureSelect_SM, onUnselect: onFeatureUnselect_SM});
		mapDataObject.map.addControl(mapDataObject.featureHandle);
		mapDataObject.featureHandle.activate();
	}

	if (mapDataObject.layerData[mapDataObject.currentLayerIndex].legend)
		document.getElementById("SMlegend").innerHTML = "<img src=\"" + mapDataObject.layerData[mapDataObject.currentLayerIndex].legend + "\"/>";
	else
		document.getElementById("SMlegend").innerHTML = "";
}

function reloadData_SM()
{
	// Set the function counter (for sequentially reloading multiple child layers)
	if (typeof reloadData_SM.counter == 'undefined')
		reloadData_SM.counter = 0;
	if (++reloadData_SM.counter >= 10000)
		reloadData_SM.counter = 0;

	// Reset the lastFeature placeholder
	mapDataObject.lastFeature = null;
	if (mapDataObject.selectedFeature)
		mapDataObject.lastFeature = mapDataObject.selectedFeature.attributes.name;
	
	// We have the lastFeature name, so delete the previous popups/controls
	if (mapDataObject.featureHandle != null)
	{
		if (mapDataObject.selectedFeature != null)
			onFeatureUnselect_SM(mapDataObject.selectedFeature);
		mapDataObject.map.removeControl(mapDataObject.featureHandle);
		mapDataObject.featureHandle = null;
	}
	
	// Reload the layer (this sequentially reloads child layers; that's why we have the counter)
	var layerToReload = 0;
	if (mapDataObject.layerData[mapDataObject.currentLayerIndex].layers.length > 1)
		layerToReload = reloadData_SM.counter % mapDataObject.layerData[mapDataObject.currentLayerIndex].layers.length;

	mapDataObject.map.removeLayer(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[layerToReload]);
	mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[layerToReload] = new OpenLayers.Layer.GML(mapDataObject.layerData[mapDataObject.currentLayerIndex].name + layerToReload, mapDataObject.layerData[mapDataObject.currentLayerIndex].files[layerToReload], {format: OpenLayers.Format.KML, formatOptions: {extractStyles: true, extractAttributes: true}, displayInLayerSwitcher: false});
	mapDataObject.map.addLayer(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[layerToReload]);
	mapDataObject.map.setLayerIndex(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[layerToReload], layerToReload);
	
	// Recreate the feature handle
	if (mapDataObject.layerData[mapDataObject.currentLayerIndex].clickLayer >= 0)
	{
		mapDataObject.featureHandle = new OpenLayers.Control.SelectFeature(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[mapDataObject.layerData[mapDataObject.currentLayerIndex].clickLayer], {onSelect: onFeatureSelect_SM, onUnselect: onFeatureUnselect_SM});
		mapDataObject.map.addControl(mapDataObject.featureHandle);
		mapDataObject.featureHandle.activate();
	}
		
	// HACK: This is really annoying, but currentLayer.features.length isn't updated until this method returns.
	// Damn, this bug took a long time to find... :)
	if (mapDataObject.lastFeature)
		setTimeout("reselectFeature_SM()", 1);
}

function reselectFeature_SM()
{
	// Look around for lastFeature and re-select it
	matchingFeature = -1;
	for (var i = 0; i < mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[mapDataObject.layerData[mapDataObject.currentLayerIndex].clickLayer].features.length; i++)
	{
		// Do both strings begin at the index 0?
		if (mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[mapDataObject.layerData[mapDataObject.currentLayerIndex].clickLayer].features[i].attributes.name.indexOf(mapDataObject.lastFeature) == 0)
		{
			// Okay, but are they also the same length
			if (mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[mapDataObject.layerData[mapDataObject.currentLayerIndex].clickLayer].features[i].attributes.name.length == mapDataObject.lastFeature.length)
			{
				// Bingo.
				matchingFeature = i;
				break;
			}
		}
	}
		
	if (matchingFeature != -1)
		mapDataObject.featureHandle.select(mapDataObject.layerData[mapDataObject.currentLayerIndex].layers[mapDataObject.layerData[mapDataObject.currentLayerIndex].clickLayer].features[matchingFeature]);
	
	mapDataObject.lastFeature = null;
}

function onFeatureSelect_SM(feature)
{	
	// Set the details container
//	featureInfo = "<h2>" + feature.attributes.name + "</h2>" + "<h3>" + feature.attributes.description + "</h3>"
	featureInfo = feature.attributes.description
	if (mapDataObject.panelObject)
		mapDataObject.panelObject.body.update(featureInfo);
	else
		document.getElementById("SMdetails").innerHTML = featureInfo;

	popupWidth = mapDataObject.layerData[mapDataObject.currentLayerIndex].popupWidth;
	popupHeight = mapDataObject.layerData[mapDataObject.currentLayerIndex].popupHeight;

	var divIn = "", divOut = "";
	if (popupWidth && popupHeight)
	{
		divIn = "<div style=\"width: " + popupWidth + "px; height: " + popupHeight + "px;\">"
		divOut = "</div>"
	}
	if (!popupWidth)
		popupWidth = 200;
	if (!popupHeight)
		popupHeight = 200;
	
	// Create the popup
	mapDataObject.selectedFeature = feature;
	popup = new OpenLayers.Popup.FramedCloud("foobar",
						feature.geometry.getBounds().getCenterLonLat(),
						new OpenLayers.Size(popupWidth,popupHeight),
						divIn+feature.attributes.name+divOut,
						null,
						true,
						onPopupClose_SM);
	feature.popup = popup;
	mapDataObject.map.addPopup(popup);
}

function onFeatureUnselect_SM(feature)
{
	// If lastFeature is active, don't blank out innerHTML;
	// otherwise, you'll get a flashing 'details' container
	if (mapDataObject.lastFeature == null)
	{
		if (mapDataObject.panelObject)
			mapDataObject.panelObject.body.update("");
		else
			document.getElementById("SMdetails").innerHTML = "";
	}
	
	mapDataObject.map.removePopup(feature.popup);
	feature.popup.destroy();
	feature.popup = null;
	mapDataObject.selectedFeature = null;
}

function onPopupClose_SM()
{
	mapDataObject.featureHandle.unselect(mapDataObject.selectedFeature);
}
