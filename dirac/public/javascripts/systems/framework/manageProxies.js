var gMainGrid = false;

function initManageProxies(){

  Ext.onReady(function(){
    renderPage();
  });
}

function renderPage()
{
	var reader = new Ext.data.JsonReader({
		root : 'proxies',
		totalProperty : 'numProxies',
		id : 'proxyid',
		fields : [ 'username', 'UserDN', 'UserGroup', 'ExpirationTime', 'PersistentFlag' ]
    });

	var store = new Ext.data.GroupingStore({
				reader: reader,
				url : "getProxiesList",
				autoLoad : true,
				sortInfo: { field: 'UserDN', direction: 'ASC' },
            groupField : 'username',
            listeners : { beforeload : cbStoreBeforeLoad },
        		});

	gMainGrid = new Ext.grid.GridPanel( {
		store : store,
		view: new Ext.grid.GroupingView({
            groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})',
            emptyText: 'No data',
            startCollapsed : false,
        }),
		columns: [
            { id : 'check', header : '', width : 30, dataIndex: 'proxyid', renderer : renderSelect },
            { header: "User", width: 100, sortable: false, dataIndex: 'username'},
            { header: "DN", width: 350, sortable: true, dataIndex: 'UserDN'},
            { header: "Group", width: 100, sortable: true, dataIndex: 'UserGroup'},
            { header: "Expiration date (UTC)", width: 150, sortable: true, dataIndex: 'ExpirationTime'},
            { header: "Persistent", width: 100, sortable: true, dataIndex: 'PersistentFlag' },
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
	return '<input id="' + record.id + '" type="checkbox"/>';
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
	if( window.confirm( "Are you sure you want to delete selected proxies?" ) )
		Ext.Ajax.request({
			url : "deleteProxies",
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
		alert( "Failed to delete proxies: " + retVal.Message );
	}
	else
		alert( "Deleted " + retVal.Value + " proxies" );
	gMainGrid.getStore().reload();
}

function ajaxFailure( ajaxResponse, reqArguments )
{
	alert( "Error in AJAX request : " + ajaxResponse.responseText );
}
