// Main routine
var siteMapGreenLight = false;
var mapLegend = new Object();
function initSiteMap(){
  Ext.onReady(function(){
    renderData();
    var map = new Object();
    map.sitemask = 'getKML?name=sitemask.kml';
    map.jobsummary = 'getKML?name=jobsummary.kml';
    map.pilotsummary = 'getKML?name=pilotsummary.kml';
    map.datastorage = 'getKML?name=datastorage.kml';
    for(i = 0; i < 1000; i++){
      if(document.getElementById('map')){
//        initMap_SM('map', 2, 47, 14, 5, 3000, map, mapLegend);
        initMap_SM('map', 2, 47, 14, 5, 3000, map);
//        var map = new OpenLayers.Map('map');
//        var wms = new OpenLayers.Layer.WMS( "OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'} );
//        map.addLayer(wms);
//        map.zoomToMaxExtent();
        siteMapGreenLight = true;
        return
      }
    }
  });
}
// Initialisation of selection sidebar, all changes with selection items should goes here
function initSidebar(){
  var layout = createRadioBoxPanel(
    "layerSelector", "Layer to show", 
    [ 
      [ '0', 'Site Mask', true ],
      [ '1', 'Job Summary' ],
      [ '2', 'Pilot Summary' ],
      [ '3', 'Data Storage' ]
    ]
  );
  mapLegend = legend();
  mapLegend.hidden = true;
  var select = selectPanel();
  select.insert(0,layout);
  select.insert(1,mapLegend);
//  mapLegend = selectPanel();
//  mapLegend.insert(0,layout);
  var bar = sideBar();
  bar.insert(0,select);
//  bar.insert(0,mapLegend);
  return bar
}
function initMain(){
  var html = '<div id="map" style="height:100%"></div>';
  var panel = new Ext.Panel({border:0,autoScroll:false,html:html,region:'center'});
  return panel
}
function renderData(store){
  var mainContent = initMain();
  var leftBar = initSidebar();
  renderInMainViewport([ leftBar, mainContent ]);
}
