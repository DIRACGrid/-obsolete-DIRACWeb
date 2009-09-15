
var gSummaryPalette = false;
var gPilotPalette = false;
var gDataPalette = false;

function initPalettes()
{
	gSummaryPalette = { 
			Failed : 'EE0000', 
			Stalled : 'AAAAAA', 
			Waiting : 'FFC600', 
			Done : '00DD00', 
			Running : '7FBEFF' 
			};
	
	gPilotPalette = { 
			Scheduled : 'FFC600',  
			Running : '7FBEFF', 
			Done : '00DD00', 
			Aborted : 'EE0000' 
			};
	
	gDataPalette = { 
			RAW       : '0000ff',
			RDST      : '7fff7f',
			'M-DST'   : '007f00',
			DST       : '00ff00',
			FAILOVER  : 'ffff00',
			USER      : 'EEEEEE',
			LOG       : 'ff7f00',
			DISK      : 'ff0000',
			TAPE      : '7f0000',
			MC        : '7f007f' 
			};
}

function showSiteControlWindow( siteName )
{
	var siteData = gSiteData[ siteName ];
	var siteInfoTab = createInfoTab( siteName, siteData );
	var statusPlotsTab = createSiteStatusPlots( siteName, siteData );
	var siteMaskLogTab = createSiteMaskLogTab( siteName );
	var siteMaskActionTab = createSiteMaskActionTab( siteName, siteMaskLogTab );
	
	var tabPanel = new Ext.TabPanel({
			activeTab:0,			
			enableTabScroll:true,
		    items:[ siteInfoTab, statusPlotsTab, siteMaskLogTab, siteMaskActionTab ],
		    region:'center'
		});
	var extendedInfoWindow = new Ext.Window({
	    iconCls : 'icon-grid',
	    closable : true,
	    autoScroll : true,
	    width : 600,
	    height : 350,
	    border : true,
	    collapsible : true,
	    constrain : true,
	    constrainHeader : true,
	    maximizable : true,
	    layout : 'fit',
	    plain : true,
	    shim : false,
	    title : siteName,
	    items : [ tabPanel ]
	  })
	extendedInfoWindow.show();
}

function jump( type, id, submited )
{
	if(submited == 0){
		alert('Nothing to display');
		return
	}
	var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/jobs/JobMonitor/display';
	var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
	post_req = post_req + '<input type="hidden" name="' + type + '" value="' + id + '">';
	post_req = post_req + '</form>';
	document.body.innerHTML = document.body.innerHTML + post_req;
	var form = document.getElementById('redirform');
	form.submit();
}

function getSiteDescriptionHTML( siteName, siteData, extended )
{
	var desc  = '<h1 style="border-bottom:1px solid;width:100%">'+siteName+'</h1>';
    desc += '<div id="bodyContent">';
    desc += '<table>';
    desc += '<tr><td>Status:</td><td>'+siteData.siteMaskStatus+'</td></tr>';
    long = parseFloat( siteData.longlat[0] ).toFixed(3);
    lat  = parseFloat( siteData.longlat[1] ).toFixed(3);
    desc += '<tr><td>Location:</td><td> '+long+'º E, '+lat+'º N</td></tr>';
    desc += '<tr><td>Category:</td><td> Tier '+siteData.tier+'</td></tr>';
    if( extended )
    {
	    if ( siteData.jobSummary )
	    {
	    	sd = "<table>";
	    	for( attr in siteData.jobSummary )
	    	{
	    		if( ! siteData.jobSummary[attr] )
	    			continue
	    		sd += "<tr><td>"+attr+"</td><td>"+siteData.jobSummary[attr]+"</td></tr>";
	    	}
	    	sd += "</table>"
	    	desc += '<tr style="vertical-align:top"><td>Job Summary:</td><td>'+sd+'</td></tr>';
	    }
	    if ( siteData.pilotSummary )
	    {
	    	sd = "<table>";
	    	for( attr in siteData.pilotSummary )
	    	{
	    		if( ! siteData.pilotSummary[attr] )
	    			continue
	    		sd += "<tr><td>"+attr+"</td><td>"+siteData.jobSummary[attr]+"</td></tr>";
	    	}
	    	sd += "</table>"
	    	desc += '<tr style="vertical-align:top"><td>Pilot Summary:</td><td>'+sd+'</td></tr>';
	    }
	    if ( siteData.storageSummary )
	    {
	    	if( siteData.storageSummary.Files )
	    	{
		    	sd = "<table>";
		    	for( attr in siteData.storageSummary.Files )
		    	{
		    		if( ! siteData.storageSummary.Files[attr] )
		    			continue
		    		sd += "<tr><td>"+attr+"</td><td>"+siteData.storageSummary.Files[attr]+"</td></tr>";
		    	}
		    	sd += "</table>"
		    	desc += '<tr style="vertical-align:top"><td>Files stored:</td><td>'+sd+'</td></tr>';
	    	}
	    	if( siteData.storageSummary.Size )
	    	{
		    	sd = "<table>";
		    	for( attr in siteData.storageSummary.Size )
		    	{
		    		if( ! siteData.storageSummary.Size[attr] )
		    			continue
		    		sd += "<tr><td>"+attr+"</td><td>"+parseInt(siteData.storageSummary.Size[attr]/(1024*1024*1024))+"</td></tr>";
		    	}
		    	sd += "</table>"
		    	desc += '<tr style="vertical-align:top"><td>Storage usage (GiB):</td><td>'+sd+'</td></tr>';
	    	}
	    }
    }
    desc += '</table>';
    
    return desc;
}

function createInfoTab( siteName, siteData )
{
	return new Ext.Panel({
		autoScroll : true,
		margins : '2 0 2 2',
		cmargins : '2 2 2 2',
		html : getSiteDescriptionHTML( siteName, siteData, true ),
		title : 'Site Information',
	});
}

function getLegendForPalette( paletteName )
{
	var palette = false;
	switch( paletteName )
	{
		case 'jobSummary':
			palette = gSummaryPalette;
			break;
		case 'pilotSummary':
			palette = gPilotPalette;
			break;
		case 'filesDataSummary':
		case 'usageDataSummary':
			palette = gDataPalette;
			break;
	}
	if( ! palette )
		return "";	
	var legend = "";
	for( var ent in palette )
	{
		legend += "&nbsp;&nbsp;&nbsp;"+ent+": <span style='border:1px solid;padding:3px;background-color:#"+palette[ent]+"'></span>";
	}
	return legend
}

function createSiteStatusPlots( siteName, siteData )
{
	var plotSpace = new Ext.Panel( { 
			region : 'center', 
		});
	var plotButtons = [];
	var jobSummaryButton = new Ext.Toolbar.Button({
			text : "Job Summary",
			allowDepress : true,
			enableToggle : true,
			pressed : true,
			toggleGroup : siteName + 'plotButtons',
			toggleHandler : function(){
					var extraArgs = { 
										size : [ plotSpace.getInnerWidth(), plotSpace.getInnerHeight() ],
										bigTitle : true
									};
					var plotURL = generatePiePlot( "jobSummary", siteName, siteData, extraArgs );
					if( plotURL.indexOf( 'http://' ) == 0 )
						plotURL = "<img src='"+plotURL+"'/>"
					plotSpace.body.dom.innerHTML = plotURL;
					plotSpace.userPlotButton = jobSummaryButton;
				},
     });
	plotButtons.push( jobSummaryButton );
	if( siteData.pilotSummary )
	{
		var pilotSummaryButton = new Ext.Toolbar.Button({
			text : "Pilot Summary",
			allowDepress : true,
			enableToggle : true,
			toggleGroup : siteName + 'plotButtons',
			toggleHandler : function(){
					var extraArgs = { 
										size : [ plotSpace.getInnerWidth(), plotSpace.getInnerHeight() ],
										bigTitle : true
									};
					var plotURL = generatePiePlot( "pilotSummary", siteName, siteData, extraArgs );
					if( plotURL.indexOf( 'http://' ) == 0 )
						plotURL = "<img src='"+plotURL+"'/>"
					plotSpace.body.dom.innerHTML = plotURL;
					plotSpace.userPlotButton = pilotSummaryButton;
				},
		});
		plotButtons.push( pilotSummaryButton );
	}
	if( siteData.storageSummary )
	{
		var storageFilesButton = new Ext.Toolbar.Button({
			text : "Files stored",
			allowDepress : true,
			enableToggle : true,
			toggleGroup : siteName + 'plotButtons',
			toggleHandler : function(){
					var extraArgs = { 
							size : [ plotSpace.getInnerWidth(), plotSpace.getInnerHeight() ],
							bigTitle : true
						};
					var plotURL = generateBarPlot( "filesDataSummary", siteName, siteData, extraArgs );
					if( plotURL.indexOf( 'http://' ) == 0 )
						plotURL = "<img src='"+plotURL+"'/>"
					plotSpace.body.dom.innerHTML = plotURL;
					plotSpace.userPlotButton = storageFilesButton;
				},
		});
		plotButtons.push( storageFilesButton );
		var storageUsageButton = new Ext.Toolbar.Button({
			text : "Sorage usage",
			allowDepress : true,
			enableToggle : true,
			toggleGroup : siteName + 'plotButtons',
			toggleHandler : function(){
					var extraArgs = { 
							size : [ plotSpace.getInnerWidth(), plotSpace.getInnerHeight() ],
							bigTitle : true
						};
					var plotURL = generateBarPlot( "usageDataSummary", siteName, siteData, extraArgs );
					if( plotURL.indexOf( 'http://' ) == 0 )
						plotURL = "<img src='"+plotURL+"'/>"
					plotSpace.body.dom.innerHTML = plotURL;
					plotSpace.userPlotButton = storageUsageButton;
				},
		});
		plotButtons.push( storageUsageButton );
	}
	var statusToolbar = new Ext.Toolbar({ 
			region : 'north', 
			items : plotButtons
  		});
	var siteStatusTab = new Ext.Panel({
			autoScroll : true,
		    margins : '2 0 2 2',
		    cmargins : '2 2 2 2',
		    items : [ statusToolbar, plotSpace ],
		    title : 'Status plots',
		    layout : 'border'
	});
	dispPlot = function() { 
		if( plotSpace.userPlotButton ) 
			plotSpace.userPlotButton.toggleHandler();
		else
		{
			plotButtons[0].toggleHandler();
		}
	}
	plotSpace.on( 'bodyResize', dispPlot );
	plotSpace.on( 'show', dispPlot );
	plotSpace.on( 'activate', dispPlot );
	return siteStatusTab;
}

function generatePiePlot( plotType, siteName, siteData, extraArgs )
{
	switch( plotType )
	{
		case 'jobSummary':
			var palette = gSummaryPalette;
			var requiredField = "jobSummary";
			var title = "Job summary";
			break;
		case 'pilotSummary':
			var palette = gPilotPalette;
			var requiredField = "pilotSummary";
			var title = "Pilot summary";
			break;
		default:
			return "Oops, invalid!"
	}
	if( ! siteData[ requiredField ] )
		return "Cannot display plot. There is no data";
	var dataField = siteData[ requiredField ];
	var total = 0;
	for( var status in dataField )
		total += dataField[ status ];
	if( ! total )
		return "There are no jobs for this site at the moment";
	var normData = {};
	for( var status in dataField )
		normData[ status ] = parseInt( parseFloat( dataField[ status ] ) * 100 / total )
	var iconOps = [];
	if( extraArgs )
	{
		if( extraArgs.bigTitle )
			iconOps.push( "chtt=" + title + " for " + siteName );
		else if( extraArgs.title )
			iconOps.push( "chtt=" + siteName );
	}
	iconOps.push( "cht=p");
	iconOps.push( "chf=bg,s,00000000");
	var data = [];
	var colors = [];
	var legend = [];
	for( var status in palette )
	{
		var d = normData[ status ];
		if( ! d )
			continue;
		data.push( normData[ status ] );
		colors.push( palette[ status ] );
		legend.push( status + " (" + dataField[ status ] + ")" );
	}
	if( extraArgs && extraArgs.size )
	{
		var size = extraArgs.size;
		iconOps.push( "chts=000000,20");
		var area = size[0]*size[1];
		if( area > 300000 )
		{
			var r = size[0] / size[1];
			size[1] = parseInt( Math.sqrt( 300000/r ) );
			size[0] = parseInt( 300000/size[1] );
			
		}
		iconOps.push( "chs="+size[0]+"x"+size[1]);
		iconOps.push( "chl=" + legend.join("|") );
	}
	else
	{
		iconOps.push( "chts=FFFFFF,9");
		var size = 40;
		if( extraArgs && extraArgs.scaleSize )
			size = parseInt( size * extraArgs.scaleSize ); 
		iconOps.push( "chs="+size+"x"+size );
	}

	iconOps.push( "chd=t:" + data.join( "," ) );
	iconOps.push( "chco=" + colors.join( "," ) );
	return "http://chart.apis.google.com/chart?" + iconOps.join( "&" )
}


function generateBarPlot( plotType, siteName, siteData, extraArgs )
{

	switch( plotType )
	{
		case 'filesDataSummary':
			var palette = gDataPalette;
			var requiredField = "storageSummary";
			var subField = 'Files';
			var title = "Files stored";
			var scale = 1;
			break;
		case 'usageDataSummary':
			var palette = gDataPalette;
			var requiredField = "storageSummary";
			var subField = 'Size';
			var title = "Storage (GiB) usage";
			var scale = 1024*1024*1024;
			break;
		default:
			return "Oops, invalid!"
	}
	if( ! siteData[ requiredField ] )
		return "Cannot display plot. There is no data";
	if( subField && ! siteData[ requiredField ][ subField ] )
		return "Cannot display plot. There is no data";
	
	var dataField = siteData[ requiredField ][ subField ];
	var maxValue = 0;
	for( var status in dataField )
	{
		if( maxValue < dataField[ status ] )
			maxValue = dataField[ status ];
	}
	maxValue /= scale;
	if( ! maxValue )
		return "There are no jobs for this site at the moment";
	var normData = {};
	for( var status in dataField )
		normData[ status ] = parseInt( parseFloat( dataField[ status ] ) * 100 / ( maxValue * scale ) );
	var iconOps = [];
	if( extraArgs )
	{
		if( extraArgs.bigTitle )
			iconOps.push( "chtt=" + title + " for " + siteName );
		else if( extraArgs.title )
			iconOps.push( "chtt=" + siteName );
	}
	iconOps.push( "cht=bvs");
	iconOps.push( "chf=bg,s,00000000");
	var data = [];
	var colors = [];
	var legend = [];
	for( var status in palette )
	{
		var d = normData[ status ];
		if( !d || d < 8 )
			continue;
		data.push( normData[ status] );
		colors.push( palette[ status ] );
		legend.push( status );
	}
	if( extraArgs && extraArgs.size )
	{
		var size = extraArgs.size;
		var area = size[0]*size[1];
		if( area > 300000 )
		{
			var r = size[0] / size[1];
			size[1] = parseInt( Math.sqrt( 300000/r ) );
			size[0] = parseInt( 300000/size[1] );
		}
		iconOps.push( "chts=000000,20");
		iconOps.push( "chxt=y,x");
		iconOps.push( "chxr=0,0," + maxValue );
		iconOps.push( "chxs=1,1F1F1F,8,0")
		iconOps.push( "chs="+size[0]+"x"+size[1]);
		iconOps.push( "chl=" + legend.join("|") );
	}
	else
	{
		iconOps.push( "chts=FFFFFF,9");
		iconOps.push( "chs=80x60");
	}
	iconOps.push( "chbh=a" );
	iconOps.push( "chd=t:" + data.join(",") );
	iconOps.push( "chco=" + colors.join( "|" ) );
	return "http://chart.apis.google.com/chart?" + iconOps.join( "&" )
}

function createSiteMaskLogTab( siteName )
{
	/* site mask log */
	var siteMaskLogTable = new Ext.grid.GridPanel ({
		store: new Ext.data.SimpleStore ({
				baseParams:{siteName:siteName},
				fields: ['Status',{name:'Date',type:'date',dateFormat:'Y-n-j h:i:s'},'Owner','Text'],
				sortInfo:{field:'Date',direction:'DESC'},
				url:'getSiteMaskLog'
		}),
		columns: [
		          {header:'',width:10,sortable:false,dataIndex:'Status',renderer:rendererSiteMaskStatus,hideable:false},
		          {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
		          {header:'Date [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'Date'},
		          {header:'Author',sortable:true,dataIndex:'Owner',align:'left'},
		          {header:'Comment',sortable:false,dataIndex:'Text',align:'left'}
		],
		autoHeight : false,
		autoWidth : true,
		id : 'siteMaskLogTable',
		labelAlign : 'left',
		loadMask : true,
		margins : '2 2 2 2',
		title : '',
		viewConfig : { forceFit : true }
	});

	var siteMaskLogTab = new Ext.Panel({
			autoScroll : true,
		    margins : '2 0 2 2',
		    cmargins : '2 2 2 2',
		    items : [ siteMaskLogTable ],
		    title : 'Site Mask Log',
		    layout : 'fit'
		});
	siteMaskLogTab.on('activate',function(){
			siteMaskLogTable.store.load();
		});
	
	return siteMaskLogTab;
}

function createSiteMaskActionTab( siteName, siteMaskLogTab )
{
	function siteMaskModificationAction( action )
	{
		if( ! action )
		{
			alert( 'Error: action value is missing or empty' );
			return
		}
		var comment = siteMaskActionTab.getForm().getValues().comment; 
		if( ! comment )
		{
			alert('Error: Comments field is empty');
			return
		}
		tabPanel.body.mask( 'Sending data...' );
		siteMaskActionTab.form.submit({
				params : 'action=' + action + '&siteName=' + siteName,
				success:function( form, action ) {
					tabPanel.body.unmask();
					tabPanel.setActiveTab( siteMaskLogTab );
				},
				failure:function( form, action ) {
					tabPanel.body.unmask();
					alert('Error: ' + action.response.statusText);
				}
		});
	}
	var siteMaskActionComment = new Ext.form.TextArea({
			xtype:'textarea',
			id:'comment',
			fieldLabel:'Comments',
			height:'200',
			anchor:'100%'  
		})
	var siteMaskBanButton = new Ext.Button({
			cls:"x-btn-text-icon",
			handler:function(){
				siteMaskModificationAction( 'ban' );
			},
			icon:gURLRoot+'/images/iface/ban.gif',
			minWidth:'70',
			tooltip:'Click to ban the site',
			text:'Ban Site'
		});
	var siteMaskAllowButton = new Ext.Button({
			cls:"x-btn-text-icon",
			handler:function(){
				siteMaskModificationAction( 'unban' );
			},
			icon:gURLRoot+'/images/iface/unban.gif',
			minWidth:'70',
			tooltip:'Click to unban the site',
			text:'Allow Site'
		});
	var showSiteJobs = new Ext.Button({
			cls:"x-btn-text-icon",
		    handler:function(){
		      jump( 'site' , siteName );
		    },
		    icon:gURLRoot+'/images/iface/jump.gif',
		    minWidth:'70',
		    tooltip:'Click for transfer to the JobMonitoring page',
		    text:'Show Jobs'
		});
	var siteMaskActionTab = new Ext.form.FormPanel({
			bodyStyle : 'padding:15px',
			buttons : [ siteMaskBanButton, siteMaskAllowButton, showSiteJobs ],
			items : [ siteMaskActionComment ],
			labelAlign : 'top',
			method : 'POST',
			title : 'Site Mask Control',
			url : 'applySiteMaskAction'
	});
	siteMaskActionTab.on( 'resize', function() {
		var h = siteMaskActionTab.getInnerHeight() - 50;
		siteMaskActionComment.setHeight(h);
	});	
	
	return siteMaskActionTab;
}

function rendererSiteMaskStatus(value)
{
	switch( value )
	{
		case 'Active' :
			return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
			break;
		case 'Banned' :
			return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
			break;
		default:
			return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
			break;
	}
}
