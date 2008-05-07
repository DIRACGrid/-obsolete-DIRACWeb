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
  initPlotPage();

  appendToLeftPanel( createComboBox( "plotName", "Plot to generate", "Select a plot", plotsList ) );

  appendTimeSelectorToLeftPanel();

  if( selectionData.User.length > 1 )
  	appendToLeftPanel( createCollepsibleMultiselect( "User", "User", selectionData.User ) );
  else
  	appendToLeftPanel( createHidden( "User", selectionData.User[0] ) );

  if( selectionData.UserGroup.length > 1 )
  	appendToLeftPanel( createCollepsibleMultiselect( "UserGroup", "User Group", selectionData.UserGroup ) );
  else
  	appendToLeftPanel( createHidden( "UserGroup", selectionData.UserGroup[0] ) );

  appendToLeftPanel( createCollepsibleMultiselect( "JobGroup", "Job Group", selectionData.JobGroup ) );
  appendToLeftPanel( createCollepsibleMultiselect( "JobType", "Job Type", selectionData.JobType ) );
  appendToLeftPanel( createCollepsibleMultiselect( "JobClass", "Job Class", selectionData.JobClass ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Site", "Site", selectionData.Site ) );
  appendToLeftPanel( createCollepsibleMultiselect( "ProcessingType", "Processing Type", selectionData.ProcessingType ) );
  appendToLeftPanel( createCollepsibleMultiselect( "FinalMajorStatus", "Final major status", selectionData.FinalMajorStatus ) );
  appendToLeftPanel( createCollepsibleMultiselect( "FinalMinorStatus", "Final minor status", selectionData.FinalMinorStatus ) );
  appendToLeftPanel( createHidden( "typeName", "Job" ) );

  renderPlotPage();
}
