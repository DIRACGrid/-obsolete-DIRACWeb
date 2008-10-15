gLeftPanel = false;
gTreePanel = false;
gImagesPanel = false;
gFieldNameComboBox = false;
gFieldValueSelect = false;
gVariableFieldCheckBox = false;
gContextMenu = false;
var gFieldsDict = { "Site": "sources.site",
					 "Component type" : "sources.componentType",
					 "Component location" : "sources.componentLocation",
					 "Component name" : "sources.componentName",
					 "Activity" : "activities.description",
					 "Activity category" : "activities.category",
				   };
var gFieldsList = [];
var gUsedFields = {};
for(key in gFieldsDict)
{
	gFieldsList.push( key );
	gUsedFields[ key ] = false;
}

var gSelectedFields = {};

function initViewCreator(){
  Ext.onReady(function(){
    renderPage();
  });
}

/* HELPERS */
function createTextField( elName, elLabel, elDefaultValue, elValue )
{
	var textField = new Ext.form.TextField( {
		anchor : '90%',
		allowBlank : true,
 		emptyText : elDefaultValue,
		fieldLabel : elLabel,
		mode : 'local',
		name : elName,
		value : elValue,
		selectOnFocus : true
  } );
  return textField;
}

function createCheckBoxPanel( elName, elLabel, elValues )
{
	var panelItems = []
	for( var i = 0; i < elValues.length; i++ )
	{
		panelItems.push( createCheckBox( elName + "." + elValues[i][1], elValues[i], elValues[i] ) );
	}

	var radioPanel = new Ext.form.FieldSet( {
		anchor : '90%',
		title : elLabel,
		name : elName,
		collapsible : true,
		autoHeight : true,
		collapsed : false,
		triggerAction : 'all',
		items : panelItems,
	} );

	return radioPanel;
}

function createCheckBox( elName, elLabel, elValue )
{
	var checkBox = new Ext.form.Checkbox( {
    	anchor : '90%',
    	boxLabel: elLabel,
    	hiddenName : elName,
    	hideLabel : true,
    	name : elName,
    	selectOnFocus : true,
    	triggerAction : 'all',
    	value : elValue
  } );

  return checkBox;
}

function createComboBox( elName, elLabel, elEmpyTextValue, dataStore )
{
	var comboBox = new Ext.form.ComboBox( {
    	anchor : '90%',
    	allowBlank : true,
    	emptyText : elEmpyTextValue,
    	editable : false,
    	fieldLabel: elLabel,
    	hiddenName : elName,
    	mode : 'local',
    	name : elName,
    	selectOnFocus : true,
    	forceSelection : true,
    	store : dataStore,
    	triggerAction : 'all',
    	typeAhead : true
  } );

  return comboBox;
}

function createMultiselect( elName, elLabel, elValues )
{
	var mSelectValues =  [];
	var numItems = elValues.length;
	for( var i=0; i < elValues.length ; i++ )
	{
		var val = elValues[ i ];
		mSelectValues.push( [ val, val ] );
	}

	var multiSelect = new Ext.ux.Multiselect( {
		anchor : '90%',
		allowBlank : true,
 		emptyText : "",
//		hideLabel : true,
		fieldLabel : elLabel,
		mode : 'local',
		name : elName,
		selectOnFocus : true,
		legend : "",
		autoWidth : true,
		data : mSelectValues,
		dataFields : [ 'id', 'desc' ],
		valueField : 'id',
		displayField : 'desc',
		width : '95%',
		height : 350,
  } );
  return multiSelect;
}
/* END HELPERS */

function renderPage()
{
	var varHelp = "javascript:window.open('variablesHelp', 'new_window' ,'height=300,width=600,scrollbars=yes,resizable=yes');"
	gOptionsPanel = new Ext.form.FormPanel({
		region : 'east',
		collapsible : false,
		width : 250,
		bodyStyle : 'padding: 5px',
		items: [ createCheckBoxPanel( 'plotgroups', 'Group plots by', gFieldsList ),
					createTextField( 'plotname', 'Activities label <a href="#" onclick="'+varHelp+'">?</a>', 'Enter activity label', '$DESCRIPTION' ),
					new Ext.form.Checkbox( { id: 'stackplots', fieldLabel : 'Stack activities' } ),
					createTextField( 'viewname', 'View name', 'Enter view name' ),
				 ],
		tbar : [ '->',
					{ id :'testview',
						text : 'Test view',
						handler : cbTestView
					} ],

	});

	gTreePanel = new Ext.tree.TreePanel({
		region : 'center',
		useArrows : true,
		animate : true,
		width : 350,
		root : new Ext.tree.TreeNode({ text : 'View definition', id : 'rootNode' }),
		listeners : { contextmenu : cbShowContextMenu },
	});

	gFieldNameComboBox = createComboBox( 'fieldName', 'Restrict by', 'Select field', gFieldsList );
	gFieldNameComboBox.on( 'select', cbSelectedFieldType );

	gFieldValueSelect = createMultiselect( 'fieldValue', 'Having values', [] );
	gVariableFieldCheckBox = new Ext.form.Checkbox( {
		fieldLabel : 'Variable field',
		listeners : { check : function( checkbox, checked ) {
			if( checked )
				gFieldValueSelect.disable();
			else
				gFieldValueSelect.enable();
			}
		}
	});

	selectorPanel = new Ext.form.FormPanel({
		region : 'west',
		defaults : { border : false },
		width : 500,
		bodyStyle: 'padding:15px',
		tbar: ['->', {
				id: 'addfield',
				text: 'Add to view definition &raquo;&raquo;',
				handler : cbAddFieldToViewDefinition
			}],
		items: [ gFieldNameComboBox,
		    		gFieldValueSelect,
		    		gVariableFieldCheckBox ],
	}),

	constructionPanel = new Ext.Panel({
		region : 'center',
		layout : 'border',
		defaults : { split : true },
		items : [ selectorPanel, gTreePanel,  gOptionsPanel ],
	});

   gContextMenu = new Ext.menu.Menu({
   	id : 'ContextMenu',
   	items : [ { text : 'Delete field',
   					listeners : { click : cbDeleteRestriction }
   				 }
   			  ]
   })

	renderInMainViewport( [constructionPanel] );
	resetSelector();
}

function cbSelectedFieldType()
{
	var value = gFieldNameComboBox.getValue();
	if( ! value || ! value in gFieldsList)
	{
		alert( "Select a valid field!");
		return
	}
	queryRestictions = {}
	for( key in gSelectedFields )
	{
		if( gSelectedFields[ key ].length > 0 )
			queryRestictions[ key ] = gSelectedFields[ key ];
	}
	Ext.Ajax.request({
		url: 'queryFieldValue',
		success : serverSelectedFieldType,
		failure : function( request ){ alert( "Error: " + request.statusText ); },
		params : { 'selectedFields' : Ext.util.JSON.encode( queryRestictions ),
						'queryField' : gFieldsDict[ value ] }
	});
}

function serverSelectedFieldType( ajaxRequest )
{
	var result = Ext.util.JSON.decode( ajaxRequest.responseText );
	if( ! result.OK )
	{
		alert( "Error: " + result.Message );
		return
	}
	var values=[];
	for( var i = 0; i< result.Value.length; i++ )
	{
		values.push( [ result.Value[i], result.Value[i] ] );
	}
	gFieldValueSelect.store.loadData( values );
	gFieldValueSelect.setValue( [] );
}

function resetSelector()
{
	var remainingFields = [];
	for( key in gFieldsDict )
	{
		if( ! gUsedFields[ key ] )
			remainingFields.push( key );
	}
	gFieldNameComboBox.store.loadData( remainingFields );
	gFieldNameComboBox.setValue();
	gFieldValueSelect.store.loadData( [] );
	gFieldValueSelect.setValue( [] );
	gVariableFieldCheckBox.setValue( false );
}

function cbAddFieldToViewDefinition()
{
	var webField = gFieldNameComboBox.getValue();
	if( ! webField || !webField in gFieldsList ||  gUsedFields[ webField ] )
	{
		alert( "Select a valid field!");
		return;
	}
	var variable = gVariableFieldCheckBox.getValue();
	if( variable )
		var value = []
	else
	{
		var rawValue = gFieldValueSelect.getValue();
		if( rawValue.length == 0 )
		{
			alert( "Please select some values" );
			return;
		}
		var value = rawValue.split( "," );
	}
	var dbField = gFieldsDict[ webField ];
	var restrictionDict = {
		webField : webField,
		dbField : dbField,
		variable : variable,
		value : value
		}
	var fieldNode = new Ext.tree.TreeNode({
		expanded : true,
		text : webField,
		leaf : false,
		restDict : restrictionDict
	});
	if( variable )
		fieldNode.appendChild( new Ext.tree.TreeNode({ text : 'variable value', leaf : true }) );
	else
		for( var i = 0; i< value.length; i++ )
		{
			fieldNode.appendChild( new Ext.tree.TreeNode( { text : value[i], leaf : true } ) );
		}
	gTreePanel.getRootNode().appendChild( fieldNode );
	gTreePanel.getRootNode().expand();
	gUsedFields[ webField ] = true;
	gSelectedFields[ dbField ] = value;
	resetSelector();
}

function cbShowContextMenu( node, contextEvent )
{
	contextEvent.stopEvent();
	if( node.getDepth() == 0 )
		return;
	if( node.isLeaf() )
		gContextMenu.targetCtxNode = node.parentNode;
	else
		gContextMenu.targetCtxNode = node;
	gContextMenu.show( node.ui.getAnchor() );
}

function cbDeleteRestriction( menu )
{
	var restDict = gContextMenu.targetCtxNode.attributes.restDict;
	gUsedFields[ restDict.webField ] = false;
	delete gSelectedFields[ restDict.dbField ];
	gTreePanel.getRootNode().removeChild( gContextMenu.targetCtxNode );
	resetSelector();
}

function generateViewRequest()
{
	fixedRestictions = {}
	variableRestrictions = []
	for( key in gSelectedFields )
	{
		if( gSelectedFields[ key ].length > 0 )
			queryRestictions[ key ] = gSelectedFields[ key ];
		else
			variableRestrictions.push( key );
	}
	if( fixedRestictions.length == 0 )
	{
		alert( "Select at least one non variable restriction" );
		return;
	}
	var groupItems = gOptionsPanel.find( 'name', 'plotgroups' )[0].items;
	var grouping = [];
	for( var i = 0; i < groupItems.getCount(); i++ )
	{
		if( groupItems.get(i).getValue() )
			grouping.push( gFieldsDict[ groupItems.get(i).value ] );
	}
	var actDesc = gOptionsPanel.find( 'name', 'plotname' )[0].getValue();
	if( ! actDesc )
	{
		alert( "Write the activities description" );
		return
	}
	if( gOptionsPanel.findById( 'stackplots' ).getValue() )
		var stack = true;
	else
		var stack = false;

	return Ext.util.JSON.encode( { 'groupBy' : grouping,
								 'definition' : queryRestictions,
								 'variable' : variableRestrictions,
								 'stacked' : stack,
								 'label' : actDesc
								} );
}

function cbTestView()
{
	var viewRequest = generateViewRequest();
	if( !viewRequest )
		return;
	var viewName = gOptionsPanel.find( 'name', 'viewname' )[0].getValue();
	if( ! viewName )
	{
		alert( "What's the view name?" )
		return;
	}
	Ext.Ajax.request({
		url: 'tryView',
		success : serverTestView,
		failure : function( request ){ alert( "Error: " + request.statusText ); },
		params : { 'plotRequest' : viewRequest,
					  'timeLength' : 'day',
					  'viewName' : viewName }
	});
}

function serverTestView( ajaxResponse, ajaxRequest )
{
	var originalParams = ajaxRequest.params;
	var result = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! result.OK )
	{
		alert( "Error: " + result.Message );
		return
	}

	var plotsList = result.Value.images;
	if( plotsList.length )
	{
		var html = ""
		for(var i = 0; i < plotsList.length; i++ )
		{
			html += "<img src='getPlotImg?file="+plotsList[i]+"' style='margin:1px;display:inline'/>";
		}
		var saveButton = new Ext.Button({ id :'saveview',
						text : 'Save view',
						handler : cbSaveView,
						});
		var w = new Ext.Window({
			closable : true,
			width : 600,
			height : 400,
			autoScroll : true,
			title : "Preview " + originalParams.viewName,
			html : html,
			plotRequest : originalParams.plotRequest,
			viewName : originalParams.viewName,
			tbar : [ saveButton ],
		});
		saveButton.uOwnerWindow = w;
		w.show();
	}
}

function cbSaveView( button )
{
	var plotRequest = button.uOwnerWindow.plotRequest;
	var viewName= button.uOwnerWindow.viewName;
	Ext.Ajax.request({
		url: 'saveView',
		success : serverSaveView,
		failure : function( request ){ alert( "Error: " + request.statusText ); },
		params : { 'plotRequest' : plotRequest,
					  'viewName' : viewName },
		scope : button.uOwnerWindow
	});
}

function serverSaveView( ajaxResponse )
{
	var result = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! result.OK )
	{
		alert( "Error: " + result.Message );
		return
	}
	alert( "View saved!" );
	this.close();
}