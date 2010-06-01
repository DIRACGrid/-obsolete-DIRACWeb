var gPlotsList = []; //Valid list of plots
var gTypeName = ""; //Type name
var gMainPanel = false;

function initPilotPlots( plotsList, selectionData ){
  gPlotsList = plotsList;
  gTypeName = "Pilot";
  Ext.onReady(function(){
    renderPage( plotsList, selectionData );
  });
}

function renderPage( plotsList, selectionData ){
  initPlotPage( "Pilots plot generation" );

  appendToLeftPanel( createComboBox( "plotName", "Plot to generate", "Select a plot", plotsList ) );

  var orderKeys = [];
  for( key in selectionData )
  {
  	orderKeys.push( [ key, key ] );
  }
  appendToLeftPanel( createComboBox( "grouping", "Group by", "Select grouping", orderKeys ) );

  appendTimeSelectorToLeftPanel();

  var selWidgets = []

  if( selectionData.User.length > 0 )
  	 selWidgets.push( createMultiselect( "User", "User", selectionData.User ) );
  if( selectionData.UserGroup.length > 0 )
  	 selWidgets.push( createMultiselect( "UserGroup", "User Group", selectionData.UserGroup ) );

  selWidgets.push( createMultiselect( "Site", "Site", selectionData.Site ) );
  selWidgets.push( createMultiselect( "GridCE", "Grid CE", selectionData.GridCE ) );
  selWidgets.push( createMultiselect( "GridMiddleware", "Grid Middleware", selectionData.GridMiddleware ) );
  selWidgets.push( createMultiselect( "GridResourceBroker", "Grid Resource Broker", selectionData.GridResourceBroker ) );
  selWidgets.push( createMultiselect( "GridStatus", "GridStatus", selectionData.GridStatus ) );

  selWidgets.push( createHidden( "typeName", "Pilot" ) );
  appendToLeftPanel( createPanel( "Selection conditions", selWidgets ) );

  var advWidgets = [];
  advWidgets.push( createTextField( "plotTitle", "Plot title", "" ) );
  advWidgets.push( createCheckBox( "pinDates", "Pin dates", "true" ) );
  appendToLeftPanel( createPanel( "Advanced options", advWidgets ) );

  renderPlotPage();
}
