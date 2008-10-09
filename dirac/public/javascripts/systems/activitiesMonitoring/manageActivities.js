var gMainGrid = false;

function initManageActivities(){

  Ext.onReady(function(){
    renderPage();
  });
}

function renderPage()
{
/*
[ 'sources.id', 'sources.site', 'sources.componentType', 'sources.componentLocation',
               'sources.componentName', 'activities.id', 'activities.name', 'activities.category',
               'activities.unit', 'activities.type', 'activities.description',
               'activities.bucketLength', 'activities.filename', 'activities.lastUpdate' ]
               */
	var store = new Ext.data.JsonStore({
				url : "getActivitiesList",
				sortInfo: { field: 'sources_id', direction: 'ASC' },
            listeners : { beforeload : cbStoreBeforeLoad },
            root : 'activities',
            totalProperty  : 'numActivities',
            fields : [ { name : 'sources_id', type : 'int' },
            				'sources_site', 'sources_componentType', 'sources_componentLocation',
                        'sources_componentName', { name : 'activities_id', type : 'int' },
                        'activities_name', 'activities_category',
                        'activities_unit', 'activities_type', 'activities_description',
                        { name : 'activities_bucketLength', type : 'int' }, 'activities_filename',
                        { name : 'activities_lastUpdate', type : 'float' }
                         ]
        		});

	gMainGrid = new Ext.grid.GridPanel( {
		store : store,
		columns: [
            { id : 'check', header : '', width : 30, renderer : renderSelect, dataIndex : 'sources_id' },
            { header: "Site", sortable: true, dataIndex: 'sources_site'},
            { header: "Component Type", sortable: true, dataIndex: 'sources_componentType'},
            { header: "Location", sortable: true, dataIndex: 'sources_componentLocation'},
            { header: "Component name", sortable: true, dataIndex: 'sources_componentName'},
            { header: "Activity name", sortable: true, dataIndex: 'activities_name'},
            { header: "Category", sortable: true, dataIndex: 'activities_category'},
            { header: "Unit", sortable: true, dataIndex: 'activities_unit'},
            { header: "Activity type", sortable: true, dataIndex: 'activities_type'},
            { header: "Description", sortable: true, dataIndex: 'activities_description'},
            { header: "Bucket size", sortable: true, dataIndex: 'activities_bucketLength'},
            { header: "File", sortable: true, dataIndex: 'activities_filename'},
            { header: "Last update", sortable: true, dataIndex: 'activities_lastUpdate', renderer : renderLastUpdate},
        ],
      region : 'center',
   	tbar : [
   				{ handler:function(){ toggleAll(true) }, text:'Select all', width:150, tooltip:'Click to select all rows' },
    				{ handler:function(){ toggleAll(false) }, text:'Select none', width:150, tooltip:'Click to select all rows' },
    				'->',
      			{ handler:function(){ cbDeleteSelected() }, text:'Delete', width:150, tooltip:'Click to delete all selected proxies' },
   			],
		bbar: new Ext.PagingToolbar({
					pageSize: 25,
					store: store,
					displayInfo: true,
					displayMsg: 'Displaying entries {0} - {1} of {2}',
					emptyMsg: "No entries to display",
					items:['-','Items displaying per page: ', createNumItemsSelector() ],
	        }),
	   listeners : { sortchange : cbMainGridSortChange },
		} );
	renderInMainViewport( [gMainGrid] );
}

function renderSelect( value, metadata, record, rowIndex, colIndex, store )
{
	return '<input id="' + record.data.sources_id +'.'+record.data.activities_id + '" type="checkbox"/>';
}

function renderLastUpdate( value, metadata, record, rowIndex, colIndex, store )
{
	var lastUpdated = record.data.activities_lastUpdate;
	var timeLimit = 86400 * 30;
	if( lastUpdated > timeLimit )
	 lastUpdated = timeLimit;
	var green = parseInt( 200 * ( timeLimit - lastUpdated ) / timeLimit );
	var red = parseInt( 200 * ( lastUpdated ) / timeLimit );
	return '<span style="color: rgb('+red+','+green+',0);">' + lastUpdated + '</span>';
}

function toggleAll( select )
{
	var chkbox = document.getElementsByTagName('input');
	for (var i = 0; i < chkbox.length; i++)
	{
		if( chkbox[i].type == 'checkbox' )
		{
			chkbox[i].checked = select;
		}
	}
}

function getSelectedCheckboxes()
{
	var items = [];
	var inputs = document.getElementsByTagName('input');
	for (var i = 0; i < inputs.length; i++)
	{
		if( inputs[i].checked )
		{
        items.push( inputs[i].id );
      }
   }
   return items;
}

function cbStoreBeforeLoad( store, params )
{
	var sortState = store.getSortState()
	var bb = gMainGrid.getBottomToolbar();
	store.baseParams = { 'sortField' : sortState.field,
							   'sortDirection' : sortState.direction,
							   'limit' : bb.pageSize,
							 };
}

function cbMainGridSortChange( mainGrid, params )
{
	var store = mainGrid.getStore();
	store.setDefaultSort( params.field, params.direction );
	store.reload();
}

function createNumItemsSelector(){
	var store = new Ext.data.SimpleStore({
		fields:['number'],
		data:[[25],[50],[100],[150]]
	});
	var combo = new Ext.form.ComboBox({
		allowBlank:false,
		displayField:'number',
		editable:false,
		maxLength:3,
		maxLengthText:'The maximum value for this field is 999',
		minLength:1,
		minLengthText:'The minimum value for this field is 1',
		mode:'local',
		name:'number',
		selectOnFocus:true,
		store:store,
		triggerAction:'all',
		typeAhead:true,
		value:25,
		width:50
	});
	combo.on({
		'collapse':function() {
			var bb = gMainGrid.getBottomToolbar();
			if( bb.pageSize != combo.value )
			{
				bb.pageSize = combo.value;
				var store = gMainGrid.getStore()
				store.load( { params : { start : 0, limit : bb.pageSize } } );
			}
		}
 	});
	return combo;
}


function cbDeleteSelected()
{
	var selIds = getSelectedCheckboxes()
	if( window.confirm( "Are you sure you want to delete selected activities?" ) )
		Ext.Ajax.request({
			url : "deleteActivities",
			success : ajaxCBServerDeleteSelected,
			failure : ajaxFailure,
			params : { idList : Ext.util.JSON.encode( selIds ) },
		});
}

function ajaxCBServerDeleteSelected( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to delete activities: " + retVal.Message );
	}
	else
		alert( "Deleted " + retVal.Value + " activities" );
	gMainGrid.getStore().reload();
}

function ajaxFailure( ajaxResponse, reqArguments )
{
	alert( "Error in AJAX request : " + ajaxResponse.responseText );
}
