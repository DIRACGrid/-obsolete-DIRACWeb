var gLeftSidebarPanel = false //Sidebar panel

function initAccounting(){

  Ext.onReady(function(){
    renderPage();
  });
}

function renderPage(){
  var leftBar = createLeftSelectPanel( "TEST", "ajaxCall", parseLeftPanelSelections, useMeRest );
  var mainContent = new Ext.Panel( { html : '', region : 'center' } );
  renderInMainViewport([ leftBar, mainContent ]);
}

/* == LEFT PANEL MAGIC == */

function createLeftSelectPanel( panelTitle, submitURL, cbParseSelection , cbSuccessCallback, cbValidatingCallback )
{
  gLeftSidebarPanel = new Ext.FormPanel( {
    labelAlign : 'top',
    split : true,
    region : 'west',
    collapsible : true,
    width : 200,
    minWidth : 200,
    margins : '2 0 2 2',
    cmargins : '2 2 2 2',
    layoutConfig : { border : true,
                     animate : true
                   },
    bodyStyle : 'padding: 5px',
    title : panelTitle,
    buttonAlign : 'center',
    waitMsgTarget : true,
    autoScroll : true,
    url : submitURL,
    userCBParseSelection : cbParseSelection,
    userCBSuccessAJAXCallback : cbSuccessCallback,
    userCBValidatingCallback : cbValidatingCallback,
    method : 'POST',
    items : [ { layout : 'form',
                border : false,
                buttons : [ { text: 'Submit',
                              handler : cbLeftPanelAJAXSubmitHandler,
                            },
                            { text: 'Reset',
                              handler: cbLeftPanelResetHandler,
                            }
                          ]
              }
            ]
  } )
  return gLeftSidebarPanel;
}

function cbLeftPanelResetHandler( submitButton, clickEvent )
{
	gLeftSidebarPanel.form.reset();
}

function cbLeftPanelAJAXSubmitHandler( submitButton, clickEvent )
{
	var validated = true;
	var parsedParams = gLeftSidebarPanel.userCBParseSelection();

	if( gLeftSidebarPanel.userCBValidatingCallback )
		validated = gLeftSidebarPanel.userCBValidatingCallback( parsedParams );

	if( ! validated )
		return;

	gLeftSidebarPanel.form.submit( {
	    params : parsedParams,
		waitTitle : 'Updating...',
		waitMsg : 'Loading...',
		timeout : 60000,
		success : function( panel, ajaxEvent )
			{
				console.log( ajaxEvent );
				gLeftSidebarPanel.userCBSuccessAJAXCallback( panel, ajaxEvent );
			},
		failure : function( panel, ajaxEvent )
			{
				alert( 'Error: ' + ajaxEvent.result.errors );
			}
		} );
}

function appendToLeftPanel( extElement )
{
	return gLeftSidebarPanel.insert( gLeftSidebarPanel.items.length - 1, extElement );
}

function appendTimeSelectorToLeftPanel()
{
	var timePanel = createRadioBoxPanel( "timeSelector", "Time span", [ [ '86400', 'Last Day', true ],
	                                                                    [ '604800', 'Last Week' ],
	                                                                    [ '2592000', 'Last Month' ],
	                                                                    [ '-1', 'Manual Select' ] ] );
    timePanel.expand();
    var startSel = createDateField( "startTime", "Initial time" );
    startSel.disable();
    timePanel.add( startSel );
    var endSel = createDateField( "endTime", "End time" );
    endSel.disable();
    timePanel.add( endSel );
//	timePanel.getComponent(0).setValue( true );
	timePanel.getComponent(3).on( 'check', cbManualTimeSelected );
	timePanel.getComponent(3).manualTimeSelectors = [ startSel, endSel ];
	appendToLeftPanel( timePanel );
}

function cbManualTimeSelected( el, checked )
{
	for( var i = 0; i < el.manualTimeSelectors.length; i++ )
	{
		tiSel = el.manualTimeSelectors[ i ];
		if( checked )
			tiSel.enable();
		else
			tiSel.disable();
	}
}

/* == END OF LEFT PANEL MAGIC == */

/* == SELECTION TO JSON == */

function parseLeftPanelSelections( rootElement )
{
	var numChildren = 0;
	if( ! rootElement )
	{
		rootElement = gLeftSidebarPanel;
		numChildren = gLeftSidebarPanel.items.length - 1;
	}
	else
		numChildren = rootElement.items.length;

	var contents = {};
	for( var iEl = 0; iEl < numChildren; iEl ++ )
	{
		var currentEl = rootElement.getComponent( iEl );
		if( currentEl.items )
		{
			var subContents = parseLeftPanelSelections( currentEl );
			for( name in subContents )
			{
				contents[ name ] = subContents[ name ];
			}
		}
		else if( currentEl.checked )
			contents[ "_" + currentEl.name ] = currentEl.value;
		else if( currentEl.isDirty() )
		{
			contents[ "_" + currentEl.name ] = currentEl.getValue();
		}

	}
	return contents;
}

/* == END SELECTION TO JSON == */

/* == START OF WIDGETS == */

function createComboBox( elName, elLabel, elEmpyTextValue, dataStore )
{
	var comboBox = new Ext.form.ComboBox( {
    	anchor : '90%',
    	allowBlank : true,
    	emptyText : elEmpyTextValue,
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

function createCheckBoxPanel( elName, elLabel, elValues )
{
	var panelItems = []
	for( var i = 0; i < elValues.length; i++ )
	{
		panelItems.push( createCheckBox( elName + "." + elValues[i][1], elValues[i][1], elValues[i][0] ) );
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

function createRadioBoxPanel( elName, elLabel, elValues )
{
	var panelItems = [];
	for( var i = 0; i < elValues.length; i++ )
	{
		panelItems.push( createRadioBox( elName, elValues[i][1], elValues[i][0], elValues[i][2] ) );
	}

	var radioPanel = new Ext.form.FieldSet( {
		anchor : '90%',
		title : elLabel,
		name : elName + "-autopanel",
		collapsible : true,
		autoHeight : true,
		collapsed : false,
		triggerAction : 'all',
		items : panelItems,
	} );

	return radioPanel;
}

function createRadioBox( elName, elLabel, elValue, elChecked )
{
	var radioBox = new Ext.form.Radio( {
    	anchor : '90%',
    	boxLabel: elLabel,
    	hiddenName : elName,
    	hideLabel : true,
    	name : elName,
    	selectOnFocus : true,
    	triggerAction : 'all',
    	value : elValue,
    	checked : elChecked
  } );

  return radioBox;
}

function createDateField( elName, elLabel, elValue )
{
	var dateField = new Ext.form.DateField( {
		anchor : '90%',
		allowBlank : true,
		emptyText : 'YYYY-mm-dd',
		fieldLabel : elLabel,
		format : 'Y-m-d',
		name : elName,
		selectOnFocus : true,
		value : elValue,
		startDay : 1
  } );
  return dateField;
}

function createNumberField( elName, elLabel, elDefaultValue )
{
	var numberField = new Ext.form.NumberField( {
		anchor : '90%',
		allowBlank : true,
		allowDecimals : false,
		allowNegative : false,
 		emptyText : elDefaultValue,
		fieldLabel : elLabel,
		mode : 'local',
		name : elName,
		selectOnFocus : true
  } );
  return numberField;
}

function createTextField( elName, elLabel, elDefaultValue )
{
	var textField = new Ext.form.TextField( {
		anchor : '90%',
		allowBlank : true,
 		emptyText : elDefaultValue,
		fieldLabel : elLabel,
		mode : 'local',
		name : elName,
		selectOnFocus : true
  } );
  return textField;
}

function createCollepsibleMultiselect( elName, elLabel, elValues )
{
	var mSelectValues =  [];
	var numItems = elValues.length;
	for( var i=0; i < elValues.length ; i++ )
	{
		var val = elValues[ i ];
		mSelectValues.push( [ val, val ] );
	}

	var selectHeigth = numItems * 23;
	if( selectHeigth > 200 )
		selectHeigth = 200;
	if( selectHeigth < 50 )
		selectHeigth = 50;

	var multiSelect = new Ext.ux.Multiselect( {
		anchor : '90%',
		allowBlank : true,
 		emptyText : "",
		hideLabel : true,
		mode : 'local',
		name : elName,
		selectOnFocus : true,
		legend : "",
		autoWidth : true,
		data : mSelectValues,
		dataFields : [ 'id', 'desc' ],
		valueField : 'id',
		displayField : 'desc',
		width : 145,
		height : selectHeigth,
  } );

	var collepsiblePanel = new Ext.form.FieldSet( {
		anchor : '90%',
		title : elLabel,
		name : elName + "-autopanel",
		collapsible : true,
		autoHeight : true,
		collapsed : true,
		triggerAction : 'all',
		items : [ multiSelect ],
	} );

	return collepsiblePanel;
}

function createMultiselect( elName, elLabel, elValues )
{
	var mSelectValues =  [];
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
		width : 160,
		height : 150,
  } );
  return multiSelect;
}

/* == END OF WIDGETS == */

function useMeRest( panel, ajaxEvent )
{
	console.log( ajaxEvent );
}