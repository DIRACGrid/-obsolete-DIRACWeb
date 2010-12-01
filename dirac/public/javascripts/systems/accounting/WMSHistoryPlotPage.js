var gPlotsList = []; //Valid list of plots
var gTypeName = ""; //Type name
var gMainPanel = false;

function initWMSHistoryPlots( plotsList, selectionData ){
  gPlotsList = plotsList;
  gTypeName = "WMSHistory";
  Ext.onReady(function(){
    renderPage( plotsList, selectionData );
  });
}

function renderPage( plotsList, selectionData ){
  initPlotPage( "WMS history plot generation" );

  appendToLeftPanel( createComboBox( "plotName", "Plot to generate", "Select a plot", plotsList ) );

  var orderKeys = [];
  for( key in selectionData )
  {
  	orderKeys.push( [ key, key ] );
  }
  orderKeys.push( [ 'Country', 'Country' ] );
  orderKeys.push( [ 'Grid', 'Grid' ] );
  appendToLeftPanel( createComboBox( "grouping", "Group by", "Select grouping", orderKeys ) );

  appendTimeSelectorToLeftPanel();

  var selWidgets = []

  if( selectionData.User.length > 0 )
  	 selWidgets.push( createMultiselect( "User", "User", selectionData.User ) );
  if( selectionData.UserGroup.length > 0 )
  	 selWidgets.push( createMultiselect( "UserGroup", "User Group", selectionData.UserGroup ) );

  selWidgets.push( createMultiselect( "Status", "Major status", selectionData.Status ) );
  selWidgets.push( createMultiselect( "MinorStatus", "Minor status", selectionData.MinorStatus ) );
  selWidgets.push( createMultiselect( "ApplicationStatus", "Application status", selectionData.ApplicationStatus ) );
  selWidgets.push( createMultiselect( "Site", "Site", selectionData.Site ) );
  selWidgets.push( createMultiselect( "JobGroup", "Job Group", selectionData.JobGroup ) );
  selWidgets.push( createMultiselect( "JobSplitType", "Job Split Type", selectionData.JobSplitType ) );

  selWidgets.push( createHidden( "typeName", "WMSHistory" ) );
  appendToLeftPanel( createPanel( "Selection conditions", selWidgets ) );

  appendAdvancedSettingsWidget();
  renderPlotPage();
}
