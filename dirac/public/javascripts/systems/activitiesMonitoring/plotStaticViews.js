var gTabPanel = false //Sidebar panel

function initPlotViews( views ){
  Ext.onReady( function(){
    renderPage( views );
  });
}

function renderPage( views ){
  var gridBar = createGridPanel( views );
  gTabPanel = new Ext.TabPanel( {
  							region : 'center',
  							enableTabScroll : true,
  							defaults: { autoScroll:true },
  							 } );
  renderInMainViewport([ createGridPanel( views ), gTabPanel ]);
}

function createGridPanel( views )
{
	grid = new Ext.grid.GridPanel( {
		store : new Ext.data.SimpleStore( {
			data : views,
			fields : [ { name : 'id', type : 'int' },
			           { name : 'name' },
			           { name : 'varField' } ],
		}),
		columns : [ { name : 'View', dataIndex : 'name', menuDisabled : true , header : 'Click on a view to plot it' } ],
		viewConfig : { forceFit: true, autoFill : true },
		listeners : { cellclick : cellSelected },
		title : 'Activities views',
		region : 'west',
		collapsible : true,
		width : 300
	});

	return grid;
}

function cellSelected( grid, rowIndex, columnIndex, event )
{
	var record = grid.getStore().getAt( rowIndex );
	var viewName = record.data.name;

	var existingTabs = gTabPanel.items;
	for( var i = 0; i<existingTabs.length; i++ )
	{
		var tab = existingTabs.get(i);
		if( tab.title == viewName )
		{
			gTabPanel.setActiveTab( tab );
			return
		}
	}

	var tab = gTabPanel.add( {
		title : viewName,
		closable : true,
		iconCls: 'tabs',
		html : "<div id='tab-"+viewName+"' style='margin:5px'/>"
		} );
	tab.show();
	tab.plotViewPanel = new plotViewPanel( { anchor : "tab-"+viewName } );
  	tab.plotViewPanel.setViewID( viewName );
  	tab.plotViewPanel.draw();
}
