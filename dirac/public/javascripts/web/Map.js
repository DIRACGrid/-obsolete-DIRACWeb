// Main routine
var siteMapGreenLight = false;
var mapLegend = new Object();
function initSiteMap(){
  Ext.onReady(function(){
    renderData();
    var map = new Object();
    map.sitemask = ['getKML?name=sitemask.kml'];
    map.jobsummary = ['getKML?name=jobsummary.kml'];
    map.pilotsummary = ['getKML?name=pilotsummary.kml'];
    map.datastorage = ['getKML?name=datastorage.kml'];
    //map.animated = ['getKML?name=animated-green.kml', 'getKML?name=animated-yellow.kml', 'getKML?name=animated-gray.kml']
    if(document.getElementById('map')){
        initMap_SM('map', 0, 47, 14, 5, 600, map, mapLegend);
        siteMapGreenLight = true;
        return
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
      [ '3', 'Data Storage' ],
      [ '4', 'Animated' ]
    ]
  );
  mapLegend = legend();
  mapLegend.hidden = true;
  var select = selectPanel();
  select.insert(0,layout);
  select.insert(1,mapLegend);
  var button = new Ext.Button({text:'Test widget',handler:function(){siteControl('LCG.PIC.es')}})
  select.addButton(button);
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
  panel.on('load',function(){
    var leftBar = new Ext.Window({
      x:200,
      y:200,
      text:'MegaTEST'
    })
    return leftBar
  });
  return panel
}
function renderData(store){
  var mainContent = initMain();
  // Kill off the sidebar
//  var leftBar = initSidebar();
//  renderInMainViewport([ leftBar, mainContent ]);
  renderInMainViewport([mainContent]);
}
