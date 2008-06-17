
function initEditConfig( csName, remote ){

  Ext.onReady(function(){
    renderPage( csName, remote );
  });
}

function resetChanges()
{
	if( window.confirm( "You will lose all your changes, are you sure? " ) )
		document.location="resetConfigurationToRemote"
}

function renderPage( csName, remote )
{
	var panels = [];
	var textPanel = createActionPanel( "Text actions", [ '<a href="showTextConfiguration" onclick="javascript:window.open(this.href,\'new_window\',\'height=300,width=600,scrollbars=yes,resizable=yes\');return false;">View configuration as text</a>',
  	  																	  '<a href="showTextConfiguration?download=yes">Download configuration</a>' ] );
	panels.push( textPanel );
	if( remote )
	{
		var editPanel = createActionPanel( "Modification actions", [ '<a onclick="javascript:resetChanges()">Redownload configuration data from server</a>',
  		     																			 '<a href="showCurrentDiff" onclick="window.open(this.href,\'new_window\',\'height=300,width=600,scrollbars=yes,resizable=yes\');return false;">Show differences with server</a>',
  																					    '<a onclick="javascript:cbCommitConfiguration()">Commit configuration</a>' ] );
		panels.push( editPanel );
	}
	var leftBar = createLeftPanel( panels );
	var mainTreePanels = createCSTree( csName );
	var panels = [ leftBar ];
	for( var i=0; i< mainTreePanels.length; i++ )
	{
		panels.push( mainTreePanels[i] );
	}
	renderInMainViewport( panels );
}
