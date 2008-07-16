var gPlotsList = []; //Valid list of plots
var gTypeName = ""; //Type name
var gMainPanel = false;

function initJobPlots( plotsList, selectionData ){
  gPlotsList = plotsList;
  Ext.onReady(function(){
    renderPage( plotsList, selectionData );
  });
}

function renderPage( plotsList, selectionData ){
  initPlotPage( "WMS history plot generation" );

  appendToLeftPanel( createComboBox( "plotName", "Plot to generate", "Select a plot", plotsList ) );

  appendTimeSelectorToLeftPanel();

  var selWidgets = []

  	selWidgets.push( createMultiselect( "User", "User", selectionData.User ) );
  	selWidgets.push( createMultiselect( "UserGroup", "User Group", selectionData.UserGroup ) );

  selWidgets.push( createMultiselect( "Status", "Major status", selectionData.Status ) );
  selWidgets.push( createMultiselect( "MinorStatus", "Minor status", selectionData.MinorStatus ) );
  selWidgets.push( createMultiselect( "ApplicationStatus", "Application status", selectionData.ApplicationStatus ) );
  selWidgets.push( createMultiselect( "Site", "Site", selectionData.Site ) );
  selWidgets.push( createMultiselect( "JobGroup", "Job Group", selectionData.JobGroup ) );
  selWidgets.push( createMultiselect( "JobSplitType", "Job Split Type", selectionData.JobSplitType ) );

  selWidgets.push( createHidden( "typeName", "WMSHistory" ) );
  appendToLeftPanel( createPanel( "Selection conditions", selWidgets ) );

  var orderKeys = []
  for( key in selectionData )
  {
  	orderKeys.push( [ key, key ] );
  }

  appendToLeftPanel( createRadioBoxPanel( "grouping", "Group by", orderKeys ) );

  renderPlotPage();
}
