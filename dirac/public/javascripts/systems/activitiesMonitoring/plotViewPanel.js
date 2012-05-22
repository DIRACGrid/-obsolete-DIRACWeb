

function plotViewPanel( cfg )
{
	this.cfg = cfg;
	this.viewID = false;
	this.variableData = false;
	this.fromDate = false;
	this.toData = false;
	this.sizeRadioPanel = false;
	this.timeRadioPanel = false;;
	this.leftBar = false;
	this.plotsPanel = false;
	this.viewPlotPanel = false;
	this.__minWidth = 205;
	this.__minHeigth =  550;

	this.getProperty = function( propName, defaultValue )
	{
		if( propName in this.cfg )
			return this.cfg[ propName ];
		else
			return defaultValue;
	}


	this.__timeRadioChange = function( el, checked )
	{
		realThis = el.dParentObject;
		if( checked )
		{
			realThis.fromDate.enable();
			realThis.toDate.enable();
		}
		else
		{
			realThis.fromDate.disable();
			realThis.toDate.disable();
		}
	}

	this.__createRadioBoxPanel = function( elName, elLabel, elValues, elCB, elExtraWidgets )
	{
		var panelItems = [];
		for( var i = 0; i < elValues.length; i++ )
		{
			if( elCB )
			 listen = { change : elCB };
			else
			 listen = false;
			var radioBox = new Ext.form.Radio( {
		    	boxLabel: elValues[i][0],
		    	hiddenName : elName,
		    	hideLabel : true,
		    	name : elName,
		    	selectOnFocus : true,
		    	value : elValues[i][1],
		    	checked : elValues[i][2],
		    	listeners : listen,
		    	dParentObject : this,
		  } );
			panelItems.push( radioBox );
		}
		if( elExtraWidgets )
			for( var i = 0; i < elExtraWidgets.length; i++ )
			{
				panelItems.push( elExtraWidgets[i] );
			}

		var radioPanel = new Ext.form.FieldSet( {
			title : elLabel,
			name : elName + "-autopanel",
			collapsible : true,
			autoHeight : true,
			collapsed : false,
			hideBorders : true,
			items : panelItems,
		} );

		return radioPanel;
	}

	this.sizeRadioPanel = this.__createRadioBoxPanel( 'size', 'Size of plots', [ [ 'Small', 0, false ],
	                                                                        [ 'Medium', 1, true ],
	                                                                        [ 'Big', 2, false ],
	                                                                        [ 'Very big', 3, false ] ] );

	this.fromDate = new Ext.form.DateField( {
			allowBlank : false,
			fieldLabel : 'From',
			format : 'Y-m-d',
			disabled : true } );

	this.toDate = new Ext.form.DateField( {
			allowBlank : false,
			fieldLabel : 'To',
			format : 'Y-m-d',
			disabled : true } );

	this.timeRadioPanel = this.__createRadioBoxPanel( 'timespan',
	                                             'Timespan to plot',
	                                             [ [ 'Last hour', 3600, false ],
	                                               [ 'Last day', 86400, true ],
	                                               [ 'Last week', 604800, false ],
	                                               [ 'Last month', 2592000, false ],
	                                               [ 'Manual selection', -1, false ]
	                                             ]
	                                             //this.__timeRadioChange,
	                                             //[ this.fromDate, this.toDate ]  )
	                                             );
	this.timeRadioPanel.add( this.fromDate );
	this.timeRadioPanel.add( this.toDate );
	this.timeRadioPanel.getComponent(4).on( 'check', this.__timeRadioChange );

	this.createPanel = function()
	{
		this.leftBar = new Ext.FormPanel( {
			labelAlign : 'top',
			split : true,
			region : 'west',
			collapsible : false,
			width : 200,
			margins : '2 0 2 2',
			cmargins : '2 2 2 2',
			layoutConfig : {
				border : true,
				animate : true
				},
			bodyStyle : 'padding: 5px',
			title : 'Activity view options',
			url : 'plotView',
			method  : 'POST',
			dParentObject : this,
			items : [ this.timeRadioPanel,
						this.sizeRadioPanel,
						{ layout : 'form',
							border : false,
							buttons : [ { text: 'Submit',
											handler : this.__requestPlotView,
											dParentObject : this,
											},
											{ text: 'Reset',
											handler: this.resetLeftBar,
											}
										]
						}
            ]
		} );

		this.plotsPanel = new Ext.Panel( {
      autoScroll : true,
			html : '',
			region : 'center',
			heigth : 'auto',
			width : 'auto'
		} );

		anchor = this.getProperty( 'anchor', false );
		this.viewPlotPanel = new Ext.Panel( {
  		autoScroll : true,
		   renderTo : anchor,
			items : [ this.leftBar, this.plotsPanel ],
			layout : 'border',
			width : this.__minWidth,
			height : this.__minHeigth,
			style : 'margin-left:auto;margin-right:auto'
		});
	}

	this.getPanel = function(){ return this.viewPlotPanel; }

	this.__getTimeSpan = function()
	{
		var items = this.timeRadioPanel.items;
		for( var i = 0; i < items.length; i ++)
		{
			var subI = items.get(i);
			if( subI.checked )
			{
				if( subI.value > 0 )
					return { timespan : subI.value }
				if( ! this.fromDate.value )
				{
					alert( "Select a from date" );
					return false;
				}
				if( ! this.toDate.value )
				{
					alert( "Select a to date" );
					return false;
				}
				return { timespan : -1,
							fromDate : this.fromDate.value,
							toDate : this.toDate.value }
			}
		}
		alert( "Oops. No timespan sems selected" )
		return false
	}

	this.__getPlotSize = function()
	{
		var items = this.sizeRadioPanel.items;
		for( var i = 0; i < items.length; i ++)
		{
			var subI = items.get(i);
			if( subI.checked )
				return subI.value;
		}
		alert( "Oops. No plot size sems selected" )
		return false
	}

	this.draw = function()
	{
		this.__drawPlots();
	}

	this.__requestPlotView = function ( submitButton )
	{
		return submitButton.dParentObject.__drawPlots();
	}

	this.__serverGeneratedPlots = function( panel, ajaxEvent )
	{
		var plotsList = ajaxEvent.result.data;
		if( plotsList.length )
		{
			var panelEl = this.plotsPanel.getEl();
			var child = panelEl.first();
			while( child )
			{
				child.remove();
				var child = panelEl.first();
			}
			panelEl.clean( true );
			for(var i = 0; i < plotsList.length; i++ )
			{
				var imgEl = document.createElement( 'img' );
				imgEl.src = "getPlotImg?file="+plotsList[i];
				imgEl.id = plotsList[i];
				var extEl = new Ext.Element( imgEl );
				extEl.setStyle( "margin", "1px" );
				extEl.setStyle( "display", "block" );
				panelEl.appendChild( extEl );
			}
			var img = panelEl.first( 'img' );
			img.addListener( 'load', this.__resizeMainPanel, this, panelEl );
			//img.dNumPlots = plotsList.length;
			//img.onLoad = this.__resizeMainPanel();

		}
	}

	this.__resizeMainPanel = function( event, img, panelEl )
	{
		var imgList = panelEl.query( 'img' );
		var plotWidth = img.width + 9;
		var plotHeight = 25;
		for( var i = 0; i < imgList.length; i++ )
		{
			var img = imgList[i];
			if( img.height )
			{
				//plotHeight += img.clientHeight;
				plotHeight = img.y - imgList[0].y + img.clientHeight + 25;
			}
			else
			{
				img = Ext.Element( img );
				img.on( 'load', this.__resizeMainPanel, this, panelEl );
				return
			}
		}
		this.viewPlotPanel.setSize( plotWidth + this.__minWidth, plotHeight );
	}

	this.__drawPlots = function()
	{
		//Here comes da fun
		if( ! this.viewID )
		{
			alert( "Missing view ID" );
			return false;
		}
		timespan = this.__getTimeSpan();
		if( ! timespan )
			return false
		plotSize = this.__getPlotSize();
		if( ! plotSize )
			return false
		var request = { 'id' : this.viewID,
				'time' : timespan,
				'size' : plotSize,
				'varData' : this.variableData,
			  };

		this.leftBar.getForm().submit( {
			params : { plotRequest : Ext.util.JSON.encode( request ) } ,
			waitTitle : 'Generating plots...',
			waitMsg : 'Processing...',
			timeout : 60000,
			dParentObject : this,
			success : function( panel, ajaxEvent )
						{
							panel.dParentObject.__serverGeneratedPlots( panel, ajaxEvent );
						},
			failure : function( panel, ajaxEvent )
						{
							if( ajaxEvent.result )
								alert( 'Error: ' + ajaxEvent.result.errors );
							else
								alert( "Error: " + ajaxEvent.response.statusText );
						}
		} );
	}

	this.setViewID = function( viewID )
	{
		this.viewID = viewID;
	}

	this.setVariableData = function( data )
	{
		this.variableData = data;
	}

	//Init
	this.createPanel();
}
