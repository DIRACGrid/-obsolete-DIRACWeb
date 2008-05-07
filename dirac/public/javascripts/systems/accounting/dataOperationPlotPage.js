var gPlotsList = []; //Valid list of plots
var gTypeName = ""; //Type name
var gMainPanel = false;

function initDataOpPlots( plotsList, selectionData ){
  gPlotsList = plotsList;
  Ext.onReady(function(){
    renderPage( plotsList, selectionData );
  });
}

function renderPage( plotsList, selectionData ){
  initPlotPage();

  appendToLeftPanel( createComboBox( "plotName", "Plot to generate", "Select a plot", plotsList ) );

  appendTimeSelectorToLeftPanel();

  appendToLeftPanel( createCollepsibleMultiselect( "OperationType", "Operation type", selectionData.OperationType ) );
  appendToLeftPanel( createCollepsibleMultiselect( "User", "User", selectionData.User ) );
  appendToLeftPanel( createCollepsibleMultiselect( "ExecutionSite", "Execution site", selectionData.ExecutionSite ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Source", "Source site", selectionData.Source ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Destination", "Destination site", selectionData.Destination ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Protocol", "Protocol", selectionData.Protocol ) );
  appendToLeftPanel( createCollepsibleMultiselect( "FinalStatus", "Final transfer status", selectionData.FinalStatus ) );
  appendToLeftPanel( createHidden( "typeName", "DataOperation" ) );

  renderPlotPage();
}
