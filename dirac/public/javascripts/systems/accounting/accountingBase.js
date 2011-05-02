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
    width : 300,
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
                buttons : [ { text: 'Plot',
                              handler : cbLeftPanelAJAXSubmitHandler,
                              createNewTab : false,
                            },
                            { text: 'Plot in new tab',
                              handler : cbLeftPanelAJAXSubmitHandler,
                              createNewTab : true,
                            },
                            { text: 'Reset',
                              handler: cbLeftPanelResetHandler,                              
                            },
                            { cls : "x-btn-icon",
                              icon : gURLRoot+'/images/iface/refresh.gif',
                              minWidth : '20',
                              width : '100%',
                              handler : cbRefreshSelectorValues,
                            }
                          ]
              }
            ]
  } )
  return gLeftSidebarPanel;
}

/*
 * Start of refresh values
 */

function cbRefreshSelectorValues( submitButton, clickEvent )
{
	Ext.Ajax.request({
		url : 'getKeyValuesForType',
		params : { 'typeName' : gTypeName },
		success : cbOKRefreshSelectorValues,
		failure : function() { alert( "Error while refreshing selectors"); }
	});
}

function cbOKRefreshSelectorValues( ajaxResponse, ajaxRequest )
{
	var result = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! result.OK )
	{
		alert( "Could not refresh selector values: " + result.Message );
		return
	}
	var selectorData = result.Value;
	setLeftSelectorsValues( selectorData );
	gLeftSidebarPanel.form.reset();
}

function setLeftSelectorsValues( selectorValues, rootElement )
{
	var numChildren = 0;
	if( ! rootElement )
	{
		rootElement = gLeftSidebarPanel;
		numChildren = gLeftSidebarPanel.items.length - 1;
	}
	else
		numChildren = rootElement.items.length;

	for( var iEl = 0; iEl < numChildren; iEl ++ )
	{
		var currentEl = rootElement.getComponent( iEl );
		if( currentEl.items )
		{
			setLeftSelectorsValues( selectorValues, currentEl );
		}
		else 
		{
			if( currentEl.name in selectorValues )
			{
				var value = selectorValues[ currentEl.name ];
				var data = [];
				for( var j = 0; j < value.length; j++)
				{	
					data.push( [ value[j], value[j] ] );
				}
				currentEl.store.removeAll();
				currentEl.store.loadData( data );
			}
		}
	}
}

function cbLeftPanelResetHandler( submitButton, clickEvent )
{
	gLeftSidebarPanel.form.reset();
}

/*
 * End of refresh values
 */

function cbLeftPanelAJAXSubmitHandler( submitButton, clickEvent )
{

	var parsedParams = gLeftSidebarPanel.userCBParseSelection();

	if( gLeftSidebarPanel.userCBValidatingCallback )
		if( ! gLeftSidebarPanel.userCBValidatingCallback( parsedParams ) )
			return;

	executeAJAXRequest( parsedParams, submitButton );
}

function executeAJAXRequest( parsedParams, submitButton )
{
	gLeftSidebarPanel.form.submit( {
	   params : parsedParams,
	   sDEParams : DEncode.encode( parsedParams ),
		waitTitle : 'Updating...',
		waitMsg : 'Loading...',
		timeout : 60000,
		success : function( panel, ajaxEvent )
			{
				gLeftSidebarPanel.userCBSuccessAJAXCallback( panel, ajaxEvent, submitButton );
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
	var quarterRadio = createRadioBox( "timeSelector", 'By Quarter', '-2', false );
	quarterRadio.on( 'check', cbQuarterSelected );
	timePanel.add( quarterRadio );
	var quarterSelector = createMultiselect( "quartersSelector", "", [ '', '', '', '', ''] );
	quarterRadio.quarterSelector = quarterSelector;
	quarterSelector.hide();
	timePanel.add( quarterSelector );
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
		{
			tiSel.reset();
			tiSel.disable();
		}
	}
}

function cbQuarterSelected( el, checked )
{
	el.quarterSelector.reset();
	if( ! checked )
	{
		el.quarterSelector.hide();
		return
	}
	el.quarterSelector.show();
	var store = el.quarterSelector.store;
	store.removeAll();
	
	var now = new Date();
	var currentQ;
	switch( now.getUTCMonth() )
	{
		case 0:
		case 1:
		case 2:
			currentQ = 1;
			break;
		case 3:
		case 4:
		case 5:
			currentQ = 2;
			break;
		case 6:
		case 7:
		case 8:
			currentQ = 3;
			break;
		case 9:
		case 10:
		case 11:
			currentQ = 4;
			break;
	}
	var currentYear = now.getUTCFullYear();
	var records = new Array();
	do
	{
		var recLabel = ""+currentYear+" Q" + currentQ;
		var startD;
		var endD;
		switch( currentQ )
		{
			case 1:
				startD = new Date( currentYear, 0, 1, 0, 0, 0, 0);
				endD = new Date( currentYear, 2, 31, 0, 0, 0, 0);
				break;
			case 2:
				startD = new Date( currentYear, 3, 1, 0, 0, 0, 0);
				endD = new Date( currentYear, 5, 30, 0, 0, 0, 0);
				break;
			case 3:
				startD = new Date( currentYear, 6, 1, 0, 0, 0, 0);
				endD = new Date( currentYear, 8, 31, 0, 0, 0, 0);
				break;
			case 4:
				startD = new Date( currentYear, 9, 1, 0, 0, 0, 0);
				endD = new Date( currentYear, 11, 31, 0, 0, 0, 0);
				break;
		}
		records.push( new Ext.data.Record( { 
			id : recLabel,
			desc : recLabel,
			data : [ startD, endD ]
			} ) );
		currentQ = currentQ - 1;
		if( currentQ == 0 )
		{
			currentQ = 4;
			currentYear = currentYear - 1;
		}
	} 
	while( records.length < 8 )
	store.add( records );
}

/* == END OF LEFT PANEL MAGIC == */

/* == SELECTION TO JSON == */

function dateToString( dateObj )
{
	var dateStr = dateObj.getFullYear()+"-";
 	var month = ( dateObj.getMonth() + 1 ) + "";
 	if( month.length == 1 )
 		dateStr += "0";
 	dateStr += month + "-";
	var day = dateObj.getDate() + "";
 	if( day.length == 1 )
 		dateStr += "0";
 	dateStr += day;
 	return dateStr;
}

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
		else if( currentEl.inputType == "hidden" )
			contents[ "_" + currentEl.name ] = currentEl.value;
		else if( currentEl.checked )
			// + "" hack to ensure value is converted to string
			contents[ "_" + currentEl.name ] = currentEl.value + "";
		else if( currentEl.getName && currentEl.getName() == "quartersSelector" )
		{
			var selectedIds = currentEl.getValue();
			if( ! selectedIds )
				continue;
			selectedIds = selectedIds.split( "," );
			var startDate = false;
			var endDate = false;
			var store = currentEl.store;
			for( var i = 0; i < selectedIds.length ; i++ )
			{
				var recData = false;
				for( var j = 0; j < store.getCount(); j++ )
				{
					var record = store.getAt( j );
					if( record.data.id == selectedIds[i] )
					{
						recData = record.data.data;
						break;
					}
				}
				if( ! recData )
					continue
				if( i == 0 )
				{
					startDate = recData[0];
					endDate = recData[1];
				}
				else
				{
					if( startDate.getTime() > recData[0].getTime() )
						startDate = recData[0];
					if( endDate.getTime() < recData[1].getTime() )
						endDate = recData[1];
				}
				if( startDate )
					contents[ '_startTime' ] = dateToString( startDate );
				if( endDate )
					contents[ '_endTime' ] = dateToString( endDate );
			}
		}
		else if( currentEl.isDirty() )
		{
			var value = currentEl.getValue();
			//Pad properly
			if( value.getFullYear )
			{
			 	value = dateToString( value );
			}
			contents[ "_" + currentEl.name ] = value;
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

function createHidden( elName, elValue )
{
	var hidden = new Ext.form.Hidden( {
		name : elName
		} );
	hidden.setValue( elValue );
	return hidden;
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

function createPanel( elName, elItems )
{
	var radioPanel = new Ext.form.FieldSet( {
		anchor : '90%',
		title : elName,
		name : elName,
		collapsible : true,
		autoHeight : true,
		collapsed : true,
		triggerAction : 'all',
		items : elItems,
	} );

	return radioPanel;
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
	if( selectHeigth < 100 )
		selectHeigth = 100;

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
		width : '95%',
		height : selectHeigth,
  } );

	var collepsiblePanel = new Ext.form.FieldSet( {
		anchor : '95%',
		title : elLabel,
		name : elName + "-autopanel",
		collapsible : true,
		autoHeight : true,
		collapsed : true,
		triggerAction : 'all',
		width : '95%',
		items : [ multiSelect ],
	} );

	return collepsiblePanel;
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

	var selectHeigth = numItems * 23;
	if( selectHeigth > 200 )
		selectHeigth = 200;
	if( selectHeigth < 50 )
		selectHeigth = 50;
	
	var labelHidden = true;
	if( elLabel )
		labelHidden = false;

	var multiSelect = new Ext.ux.Multiselect( {
		anchor : '90%',
		allowBlank : true,
 		emptyText : "",
		hideLabel : labelHidden,
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
		height : selectHeigth,
  } );
  return multiSelect;
}

/* == END OF WIDGETS == */

function useMeRest( panel, ajaxEvent )
{
	console.log( ajaxEvent );
}
