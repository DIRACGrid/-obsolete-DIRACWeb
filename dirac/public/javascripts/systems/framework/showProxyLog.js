var gMainGrid = false;
var gFilterMenu = false;
var gFilterText = false;

function initProxyLog(){

  Ext.onReady(function(){
    renderPage();
  });
}

function renderPage()
{
	var reader = new Ext.data.JsonReader({
		root : 'actions',
		totalProperty : 'numActions',
		id : 'actionid',
		fields : [ "Action", "IssuerDN", "IssuerGroup", "TargetDN", "TargetGroup", "Timestamp" ]
    });

	var store = new Ext.data.Store({
				reader: reader,
				url : "getProxyActionList",
				autoLoad : true,
				sortInfo: { field: 'Timestamp', direction: 'DESC' },
            listeners : { beforeload : cbStoreBeforeLoad },
        		});
	gFilterText = new Ext.form.TextField( { id : 'filter' } );
	gMainGrid = new Ext.grid.GridPanel( {
		store : store,
		columns: [
            { header: "Timestamp (UTC)", width : 130, sortable: true, dataIndex: 'Timestamp'},
            { header: "Action", width: 100, sortable: true, dataIndex: 'Action'},
            { header: "IssuerDN", width: 350, sortable: true, dataIndex: 'IssuerDN'},
            { header: "IssuerGroup", width: 100, sortable: true, dataIndex: 'IssuerGroup'},
            { header: "TargetDN", width: 350, sortable: true, dataIndex: 'TargetDN'},
            { header: "TargetGroup", width: 100, sortable: true, dataIndex: 'TargetGroup'},
        ],
      region : 'center',
		bbar: new Ext.PagingToolbar({
					pageSize: 25,
					store: store,
					displayInfo: true,
					displayMsg: 'Displaying entries {0} - {1} of {2}',
					emptyMsg: "No entries to display",
					items:['-',
							 'Items displaying per page: ', createNumItemsSelector(),
							 '-',
							 'After:', new Ext.form.DateField( { id : 'afterDate', format : 'Y-m-d', listeners : { change : cbChangeDate } } ),
							 '-',
							 'Before:', new Ext.form.DateField( { id : 'beforeDate', format : 'Y-m-d', listeners : { change : cbChangeDate } } ),
							 '-',
							 'Filters:', gFilterText, new Ext.Button( { id :'clearFilters', text : 'Clear filters', listeners : { click: function(){gFilterText.setValue("");} } } ),
							],
	        }),
	   listeners : { sortchange : cbMainGridSortChange, cellclick : cbShowFilterMenu },
		} );

		gFilterMenu = new Ext.menu.Menu({
		   	id : 'FilterContextualMenu',
		   	items : [ { text : 'Filter by action',
		   					listeners : { click : function(){ cbFilterBy( 'Action' ) } }
		   				 },
		   				 { text : 'Filter by issuer DN',
		   					listeners : { click : function(){ cbFilterBy( 'IssuerDN' ) } }
		   				 },
		   				 { text : 'Filter by issuer group',
		   					listeners : { click : function(){ cbFilterBy( 'IssuerGroup' ) } }
		   				 },
		   				 { text : 'Filter by target DN',
		   					listeners : { click : function(){ cbFilterBy( 'TargetDN' ) } }
		   				 },
		   				 { text : 'Filter by target group',
		   					listeners : { click : function(){ cbFilterBy( 'TargetGroup' ) } }
		   				 },
		   			  ]
		   })

	renderInMainViewport( [gMainGrid] );
}

function cbStoreBeforeLoad( store, params )
{
	var sortState = store.getSortState()
	var bb = gMainGrid.getBottomToolbar();
	store.baseParams = { 'sortField' : sortState.field,
							   'sortDirection' : sortState.direction,
							   'limit' : bb.pageSize,
							 };
	if( store.dateQuery )
	{
		if( store.dateQuery.afterDate )
			store.baseParams.afterDate = store.dateQuery.afterDate.format( "Y-m-d H:i" );
		if( store.dateQuery.beforeDate )
			store.baseParams.beforeDate = store.dateQuery.beforeDate.format( "Y-m-d H:i" );
	}
	var filters = gFilterText.getValue();
	if( filters )
		store.baseParams.filters = filters;
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

function cbChangeDate( dateField, value )
{
	var store = gMainGrid.getStore()
	if( ! store.dateQuery )
		store.dateQuery = {}
	store.dateQuery[ dateField.id ] = value;
}

function cbShowFilterMenu( mainGrid, rowIndex )
{
	var record = mainGrid.getStore().getAt( rowIndex );
	gFilterMenu.targetCtxRecord = record;
	gFilterMenu.showAt( Ext.EventObject.xy );
}

function cbFilterBy( key )
{
	var value = gFilterMenu.targetCtxRecord.get( key );
	if( ! value )
		return
	var textValue = gFilterText.getValue();
	var filters = textValue.split( "|" );
	var newFilters = [];
	var added = false;
	for( var iF = 0; iF < filters.length; iF++ )
	{
		var cF = filters[iF].trim();
		var kvSep = cF.indexOf( "=" );
		if( kvSep < 0 )
			continue;
		var fKey = cF.substring( 0, kvSep ).trim();
		if( fKey != key )
		{
			newFilters.push( cF );
			continue;
		}
		var valuesList = cF.substring( kvSep+1 ).split( "," );
		for( var vI = 0; vI < valuesList.length; vI ++ )
		{
			var fVal = valuesList[ vI ].trim();
			if( fVal == value )
			{
				return;
			}
		}
		added = true;
		valuesList.push( value );
		newFilters.push( key + " = " + valuesList.join( ", " ) );
	}
	if( ! added )
		newFilters.push( key + " = " + value );
	gFilterText.setRawValue( newFilters.join( " | " ) );
}