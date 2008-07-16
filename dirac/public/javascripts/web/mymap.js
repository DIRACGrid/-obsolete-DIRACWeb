/*

This version loads only one layer at a time.
Utilizes a single global object
All functions appended with _SM

*/

var mapDataObject = new Object();

function LayerData_SM(name, file, index, legend, popupWidth, popupHeight)
{
	// Just take care of the layerData structure
	this.name = name;
	this.file = file;
	this.index = index;
	this.legend = legend;
	this.popupWidth = popupWidth
	this.popupHeight = popupHeight
}

function initLayers_SM()
{
	// Set defaults
	var sitemask = "sitemask.kml";
	var jobsummary = "jobsummary.kml";
	var pilotsummary = "pilotsummary.kml";
	var datastorage = "datastorage.kml";
	if (mapDataObject.mapFileObject)
	{
		if (mapDataObject.mapFileObject.sitemask)
			sitemask = mapDataObject.mapFileObject.sitemask;
		if (mapDataObject.mapFileObject.jobsummary)
			jobsummary = mapDataObject.mapFileObject.jobsummary;
		if (mapDataObject.mapFileObject.pilotsummary)
			pilotsummary = mapDataObject.mapFileObject.pilotsummary;
		if (mapDataObject.mapFileObject.datastorage)
			datastorage = mapDataObject.mapFileObject.datastorage;
	}

	// Set the static layer information
	mapDataObject.layerData[0] = new LayerData_SM("Site Mask", sitemask, 0, "SM-Legend.png", 0, 0);
	mapDataObject.layerData[1] = new LayerData_SM("Job Summary", jobsummary, 1, "JS-Legend.png", 200, 170);
	mapDataObject.layerData[2] = new LayerData_SM("Pilot Summary", pilotsummary, 2, "PS-Legend.png", 0, 0);
	mapDataObject.layerData[3] = new LayerData_SM("Data Storage", datastorage, 3, "DS-Legend.png", 0, 0);
	
	mapDataObject.numLayers = 4;
}

function createPage_SM()
{
	if (!document.getElementById(mapDataObject.wrapperDiv))
	{
		alert("The wrapper ID passed to initMap_SM() is invalid.");
		return;
	}

	var stringToAdd = "";

	if (!mapDataObject.panelObject)
	{
		stringToAdd += "<div id=\"SMcontrols\"><ul>\
		                <li><a onclick=\"activateLayer_SM(0)\">Site Mask</a></li>\
	                        <li><a onclick=\"activateLayer_SM(1)\">Job Summary</a></li>\
	                        <li><a onclick=\"activateLayer_SM(2)\">Pilot Summary</a></li>\
	                        <li><a onclick=\"activateLayer_SM(3)\">Data Storage</a></li>\
	                        </ul></div>";
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
	mapDataObject.currentLayer = null;
	mapDataObject.currentLayerIndex = -1
	mapDataObject.selectedFeature = null;
	mapDataObject.featureHandle = null;
	mapDataObject.lastFeature = null;
	mapDataObject.map = null;

	mapDataObject.wrapperDiv = wrapperDiv;
	mapDataObject.mapFileObject = mapFileObject;
	mapDataObject.panelObject = panelObject;

	// Dynamically create menu, map, and detail container
	createPage_SM();

	// Set the initial layer information
	initLayers_SM();
	
	// Create the map
	mapDataObject.map = new OpenLayers.Map("SMmap", {
							 controls: [
										new OpenLayers.Control.PanZoomBar(),
										new OpenLayers.Control.NavToolbar(),
										new OpenLayers.Control.LayerSwitcher(),
										new OpenLayers.Control.MousePosition(),
										new OpenLayers.Control.OverviewMap(),
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

function activateLayer_SM(layer)
{
	// Don't activate the layer if it is already active
	if (mapDataObject.currentLayerIndex == layer)
		return;
	if (layer < 0 || layer >= mapDataObject.numLayers)
		layer = 0;
		
	// Remove the previous layer
	if (mapDataObject.currentLayer)
		mapDataObject.map.removeLayer(mapDataObject.currentLayer);
		
	// Delete any previously open popups
	if (mapDataObject.featureHandle != null)
	{
		if (mapDataObject.selectedFeature != null)
			onFeatureUnselect_SM(mapDataObject.selectedFeature);
		mapDataObject.map.removeControl(mapDataObject.featureHandle);
		mapDataObject.featureHandle = null;
	}

	// Add the layer
	mapDataObject.currentLayerIndex = layer;
	mapDataObject.currentLayer = new OpenLayers.Layer.GML(mapDataObject.layerData[mapDataObject.currentLayerIndex].name, mapDataObject.layerData[mapDataObject.currentLayerIndex].file, {format: OpenLayers.Format.KML, formatOptions: {extractStyles: true, extractAttributes: true}, displayInLayerSwitcher: false});
	mapDataObject.map.addLayer(mapDataObject.currentLayer);
	mapDataObject.map.setLayerIndex(mapDataObject.currentLayer, 0);
	
	// Add controls to the active layer
	mapDataObject.featureHandle = new OpenLayers.Control.SelectFeature(mapDataObject.currentLayer, {onSelect: onFeatureSelect_SM, onUnselect: onFeatureUnselect_SM});
	mapDataObject.map.addControl(mapDataObject.featureHandle);
	mapDataObject.featureHandle.activate();

	if (mapDataObject.layerData[mapDataObject.currentLayerIndex].legend)
		document.getElementById("SMlegend").innerHTML = "<img src=\"" + mapDataObject.layerData[mapDataObject.currentLayerIndex].legend + "\"/>";
	else
		document.getElementById("SMlegend").innerHTML = "";

}

function reloadData_SM()
{
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
	
	// Reload the layer
	mapDataObject.map.removeLayer(mapDataObject.currentLayer);
	mapDataObject.currentLayer = new OpenLayers.Layer.GML(mapDataObject.layerData[mapDataObject.currentLayerIndex].name, mapDataObject.layerData[mapDataObject.currentLayerIndex].file, {format: OpenLayers.Format.KML, formatOptions: {extractStyles: true, extractAttributes: true}, displayInLayerSwitcher: false});
	mapDataObject.map.addLayer(mapDataObject.currentLayer);
	mapDataObject.map.setLayerIndex(mapDataObject.currentLayer, 0);
	
	// Recreate the layer
	mapDataObject.featureHandle = new OpenLayers.Control.SelectFeature(mapDataObject.currentLayer, {onSelect: onFeatureSelect_SM, onUnselect: onFeatureUnselect_SM});
	mapDataObject.map.addControl(mapDataObject.featureHandle);
	mapDataObject.featureHandle.activate();
		
	// HACK: This is really annoying, but currentLayer.features.length isn't updated until this method returns.
	// Damn, this bug took a long time to find... :)
	if (mapDataObject.lastFeature)
		setTimeout("reselectFeature_SM()", 1);
}

function reselectFeature_SM()
{
	// Look around for lastFeature and re-select it
	matchingFeature = -1;
	for (var i = 0; i < mapDataObject.currentLayer.features.length; i = i + 1)
	{
		if (mapDataObject.currentLayer.features[i].attributes.name.indexOf(mapDataObject.lastFeature) == 0)
		{
			if (mapDataObject.currentLayer.features[i].attributes.name.length == mapDataObject.lastFeature.length)
			{
				matchingFeature = i;
				break;
			}
		}
	}
		
	if (matchingFeature != -1)
	{
		mapDataObject.featureHandle.select(mapDataObject.currentLayer.features[matchingFeature]);
	}
	
	mapDataObject.lastFeature = null;
}

function onFeatureSelect_SM(feature)
{
	// Should we cross-reference layer/node data?
	if (mapDataObject.layerData[mapDataObject.currentLayerIndex].parent)
	{
		matchingFeature = -1;
		for (var i = 0; i < mapDataObject.numLayers; i = i + 1)
		{
			if (feature.attributes.name.indexOf(mapDataObject.layerData[i].extra) == 0)
			{
				if (feature.attributes.name.length == mapDataObject.layerData[i].extra.length)
				{
					matchingFeature = i;
					break;
				}
			}
		}
		
		if (matchingFeature != -1)
		{
			// We found a name match; switch layers
			activateLayer_SM(matchingFeature);
			return;
		}
	}
	
	// No, don't cross-reference. Just do the normal stuff.
	
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
