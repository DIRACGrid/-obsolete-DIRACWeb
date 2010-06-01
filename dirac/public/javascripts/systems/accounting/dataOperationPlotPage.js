var gPlotsList = []; //Valid list of plots
var gTypeName = ""; //Type name
var gMainPanel = false;

function initDataOpPlots( plotsList, selectionData ){
  gPlotsList = plotsList;
  gTypeName = "DataOperation";
  Ext.onReady(function(){
    renderPage( plotsList, selectionData );
  });
}

function renderPage( plotsList, selectionData ){
  initPlotPage( "Data Operation plot generation" );

  appendToLeftPanel( createComboBox( "plotName", "Plot to generate", "Select a plot", plotsList ) );

  var orderKeys = [ [ 'Channel', 'Channel' ] ]
  for( key in selectionData )
  {
  	orderKeys.push( [ key, key ] );
  }
  appendToLeftPanel( createComboBox( "grouping", "Group by", "Select grouping", orderKeys ) );

  appendTimeSelectorToLeftPanel();

  var selWidgets = []

  selWidgets.push( createMultiselect( "OperationType", "Operation type", selectionData.OperationType ) );
  selWidgets.push( createMultiselect( "User", "User", selectionData.User ) );
  selWidgets.push( createMultiselect( "ExecutionSite", "Execution site", selectionData.ExecutionSite ) );
  selWidgets.push( createMultiselect( "Source", "Source site", selectionData.Source ) );
  selWidgets.push( createMultiselect( "Destination", "Destination site", selectionData.Destination ) );
  selWidgets.push( createMultiselect( "Protocol", "Protocol", selectionData.Protocol ) );
  selWidgets.push( createMultiselect( "FinalStatus", "Final transfer status", selectionData.FinalStatus ) );
  selWidgets.push( createHidden( "typeName", "DataOperation" ) );
  appendToLeftPanel( createPanel( "Selection conditions", selWidgets ) );

  var advWidgets = [];
  advWidgets.push( createTextField( "plotTitle", "Plot title", "" ) );
  advWidgets.push( createCheckBox( "pinDates", "Pin dates", "true" ) );
  appendToLeftPanel( createPanel( "Advanced options", advWidgets ) );

  renderPlotPage();
}
