var gLeftSidebarPanel = false;

function createLeftPanel( itemsList )
{
  gLeftSidebarPanel = new Ext.Panel({
    	id:'action-panel',
    	region:'west',
    	split:true,
    	collapsible: true,
    	collapseMode: 'mini',
    	width:200,
    	minWidth: 150,
    	border: false,
    	baseCls:'x-plain',
    	items: itemsList
  });
  return gLeftSidebarPanel;
}

function appendToLeftPanel( extElement )
{
	return gLeftSidebarPanel.insert( gLeftSidebarPanel.items.length - 1, extElement );
}

function createActionPanel( panelTitle, actionsList )
{
	panelHtml = "<ul>"
	for( var i = 0; i < actionsList.length; i++ )
	 panelHtml += "<li>"+actionsList[i]+"</li>";
	panelHtml += "</ul>";
    var actionPanel = new Ext.Panel({
    	frame:true,
    	title: panelTitle,
    	collapsible:true,
    	titleCollapse: true,
    	html : panelHtml
    });
    return actionPanel;
}
