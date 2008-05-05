function initDataOp( selectionData ){
  Ext.onReady(function(){
    renderPage( selectionData );
  });
}
/*
		dataFields : elValues.dataFieldsName,
		valueField : elValues.valueFieldName,
		displayField : elValues.displayFieldName
*/

function renderPage( selectionData ){
  console.log( selectionData );
  var leftBar = createLeftSelectPanel( "Query fields", "ajaxCall", parseLeftPanelSelections, serverGeneratedReports );
  var mainContent = new Ext.Panel( { html : '', region : 'center' } );

  appendToLeftPanel( createDateField( "startTime", "Initial time" ) );
  var now = new Date();
  var todayString = now.getFullYear()+"-"+now.getMonth()+"-"+now.getDate();
  appendToLeftPanel( createDateField( "endTime", "End time", todayString ) );

  appendToLeftPanel( createCollepsibleMultiselect( "OperationType", "Operation type", selectionData.OperationType ) );
  appendToLeftPanel( createCollepsibleMultiselect( "User", "User", selectionData.User ) );
  appendToLeftPanel( createCollepsibleMultiselect( "ExecutionSite", "Execution site", selectionData.ExecutionSite ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Source", "Source site", selectionData.Source ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Destination", "Destination site", selectionData.Destination ) );
  appendToLeftPanel( createCollepsibleMultiselect( "Protocol", "Protocol", selectionData.Protocol ) );
  appendToLeftPanel( createCollepsibleMultiselect( "FinalStatus", "Final transfer status", selectionData.FinalStatus ) );


  renderInMainViewport([ leftBar, mainContent ]);
}

function serverGeneratedReports( panel, ajaxEvent )
{
	console.log( ajaxEvent );
}