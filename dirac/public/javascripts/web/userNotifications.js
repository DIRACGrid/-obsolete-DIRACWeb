
var gNotificationsWindow = false;
var gGridPanel = false;
var gRefreshNotificationsFunction = false;

function initNotificationsChecker()
{
	gRefreshNotificationsFunction = function(){
		Ext.Ajax.request({
				method : 'POST',
				success : cbStatsReceived,
				failure : cbMSGError,
				url : getURL( 'getUserStats' ),
			});
	};
	var msgHeartbeat = {
			run : gRefreshNotificationsFunction,
    		interval:300000 // 5min
		};
	Ext.TaskMgr.start( msgHeartbeat );
}

function getURL( action )
{
	var messageURL = document.location.protocol + '//' + document.location.host + gURLRoot;
	if( gPageDescription )
	{
		if( gPageDescription.selectedSetup )
			messageURL += "/" + gPageDescription.selectedSetup;
		if( gPageDescription.userData && gPageDescription.userData.group )
			messageURL += "/" + gPageDescription.userData.group;
	}
	return messageURL + '/web/notifications/' + action;
}

function cbMSGError( ajaxResult, ajaxRequest )
{
	//Error? server did not connect?
}


function cbStatsReceived( ajaxResult, ajaxRequest )
{
	if( ajaxResult.status != 200 )
		return;
	var result = Ext.util.JSON.decode( ajaxResult.responseText );
	if( ! result.OK )
		return;
	var stats = result.Value;
	var notifButton = Ext.ComponentMgr.get( 'mainNotificationStats' );
	if( ! stats.totalNots )
	{
		notifButton.setText( "" );
		notifButton.hide();
		notifButton.purgeListeners();
		return;
	}
	if( ! stats.newNots )
	{
		var unread = 0;
		
	}
	else
	{	
		var lastReadId = getCookie( "lastReadNotId" );
		if( ! lastReadId )
			lastReadId = -1;
		var unread = 0;
		for( var i = 0; i< stats.newNots.length; i++  )
		{
			if( stats.newNots[i] > lastReadId )
				unread += 1;
		}
	}
	if( unread )
		var text = "<font color='red'>" + unread + " unread notifications</font>";
	else
		var text = "" + stats.totalNots + " notifications";
		
	notifButton.setText( text );
	notifButton.show();
	if( ! notifButton.hasListener( 'click' ) )
		notifButton.on( 'click', cbDisplayNotifications );
}

function cbDisplayNotifications()
{
	var gridPanel = createNotificationsGrid();
	var topToolBar = new Ext.Toolbar({
		region : 'north',
		items : [ {
		      	  	cls:"x-btn-text-icon",
				    handler:function(){cbSelectNotifications(true)},
				    icon:gURLRoot+'/images/iface/checked.gif',
				    text:'Select All',
				    tooltip:'Click to select all rows',
		          },{
		        	cls:"x-btn-text-icon",
		        	handler:function(){cbSelectNotifications(false)},
		        	icon:gURLRoot+'/images/iface/unchecked.gif',
		        	text:'Select None',
		        	tooltip:'Click to uncheck selected row(s)',
		          },
		          '->',
		          /*
		          new Ext.Toolbar.Button({ 
		        	  text : 'Mark as unread', 
		        	  listeners : { click : function(){cbSetUnreadNotifications(gridPanel)} },
		          }),
		          */
		          '-',
		          new Ext.Toolbar.Button({ 
		        	  text : 'Delete', 
		        	  listeners : { click : function(){cbDeleteNotifications(gridPanel)} },
		          }),
		]
	});
	gNotificationsWindow = new Ext.Window({
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
	    layout : 'border',
	    plain : true,
	    shim : false,
	    title : "Notifications",
	    items : [ topToolBar, gridPanel ]
	  })
	gNotificationsWindow.show();
}

function cbSelectNotifications( check )
{
	var inputs = document.getElementsByTagName('input');
	for (var i = 0; i < inputs.length; i++) 
	{
		if (inputs[i].type && inputs[i].type == 'checkbox')
		{
			if( inputs[i].name.indexOf( 'notifMSGId') == 0)
			{
				if (check)
					inputs[i].checked = true;
				else
					inputs[i].checked = false;
			}
		}
	}
}

function _getSelectedNotifications()
{
	var notIds = [];
	var inputs = document.getElementsByTagName('input');
	for (var i = 0; i < inputs.length; i++) 
	{
		if (inputs[i].type && inputs[i].type == 'checkbox')
		{
			if( inputs[i].name.indexOf( 'notifMSGId') == 0 && inputs[i].checked)
			{
				notIds.push( inputs[i].value );
			}
		}
	}
	return notIds;
}

function cbRefreshNotifications( ajaxResult, ajaxRequest )
{
	if( ajaxResult.status != 200 )
		return;
	var result = Ext.util.JSON.decode( ajaxResult.responseText );
	if( ! result.OK )
		return;
	ajaxRequest.gridPanelToRefresh.store.load();
	gRefreshNotificationsFunction();
}

function cbSetUnreadNotifications( gridPanel )
{
	var notIds = _getSelectedNotifications();
	Ext.Ajax.request({
		method : 'POST',
		success : cbRefreshNotifications,
		failure : cbMSGError,
		params : { notifsIds : Ext.util.JSON.encode( notIds ) },
		url : getURL( 'markNotificationsUnread' ),
		gridPanelToRefresh : gridPanel
	});
}

function cbDeleteNotifications( gridPanel )
{
	var notIds = _getSelectedNotifications();
	Ext.Ajax.request({
		method : 'POST',
		success : cbRefreshNotifications,
		failure : cbMSGError,
		params : { notifsIds : Ext.util.JSON.encode( notIds ) },
		url : getURL( 'deleteNotifications' ),
		gridPanelToRefresh : gridPanel
	});
}

function gridFormatDate(date) 
{
    if (!date) 
    {
        return '';
    }
    var now = new Date();
    var d = now.clearTime(true);
    var notime = date.clearTime(true).getTime();
    if (notime == d.getTime()) 
    {
        return 'Today ' + date.dateFormat('g:i a');
    }
    d = d.add('d', -6);
    if (d.getTime() <= notime) 
    {
        return date.dateFormat('D g:i a');
    }
    return date.dateFormat('n/j g:i a');
}

function gridFormatMessage( msg )
{
	return msg.replace( /\n/g, "<br/>" );
}

function gridFormatRead( read )
{
	if( ! read )
		var url = gURLRoot + "/images/monitoring/waiting.gif";
	else
		var url = gURLRoot + "/images/monitoring/unknown.gif";
	return "<img src='"+url+"'/>";
}

function gridFormatId( id )
{
	return "<input type='checkbox' name='notifMSGId-"+id+"' value='"+id+"'/>";
}

function createNotificationsGrid()
{
	
	var notGrid = new Ext.grid.GridPanel({
		store : new Ext.data.JsonStore({
			url : getURL( 'retrieveNotifications' ),
			root : 'notifications',
			fields: ['id', 'seen', 'message', {name:'timestamp', type:'date'}],
			id : 'notificationsStore',
		}),
		columns : [ { id : 'id', header : 'ID', dataIndex : 'id', sortable : true, width : 10, renderer : gridFormatId },
		            { header : 'Read', dataIndex : 'seen', sortable : true, width : 10, renderer : gridFormatRead },
		            { header : 'Date', dataIndex : 'timestamp', sortable : true, renderer : gridFormatDate, width : 30 },
		            { header : 'Message', dataIndex : 'message', sortable : false, renderer : gridFormatMessage }
		          ],
		viewConfig : {
			forceFit : true,
		},
		sm: new Ext.grid.RowSelectionModel({
            singleSelect:true
        }),
        region: 'center',
        id: 'notificationsWindow',
        loadMask: { msg: 'Loading Notifications...'  }
		
	});
	notGrid.store.on( 'load', cbNotificationsReceived );
	notGrid.store.keepUnread = true;
	notGrid.store.load();
	return notGrid;
}


function cbNotificationsReceived( store, records, options )
{
	var newNotifs = [];
	var maxId = 0;
	for( var i = 0; i < records.length; i++ )
	{
		if( ! records[i].data.seen )
		{
			var id = records[i].data.id
			if( id > maxId )
				maxId = id;
			newNotifs.push( id );
		}
	}
	if( newNotifs.length > 0 && ! store.keepUnread )
	{
		Ext.Ajax.request({
			method : 'POST',
			success : cbMessagesMarkedRead,
			failure : cbMSGError,
			params : { notifsIds : Ext.util.JSON.encode( newNotifs ) },
			url : getURL( 'markNotificationsRead' ),
		});
		var expiration = new Date();
		var nH = ( expiration.getHours() + 1 ) % 24;
		if( nH )
			expiration.setHours( nH )
		else:
			expiration.setDate( expiration.getDate() + 1 );
		setCookie( 'lastReadNotId', maxId, expiration );
	}
	gRefreshNotificationsFunction();
}

function cbMessagesMarkedRead( ajaxResult, ajaxRequest )
{
	if( ajaxResult.status != 200 )
		return;
	var result = Ext.util.JSON.decode( ajaxResult.responseText );
	if( ! result.OK )
		window.alert( result.Message );
}


function setCookie( cookieName, value, expirationDate, path, domain, secure )
{
  var cookie_string = cookieName + "=" + escape ( value );

  if ( expirationDate )
  {
    cookie_string += "; expires=" + expirationDate.toGMTString();
  }

  if ( path )
        cookie_string += "; path=" + escape ( path );

  if ( domain )
        cookie_string += "; domain=" + escape ( domain );
  
  if ( secure )
        cookie_string += "; secure";
 
  document.cookie = cookie_string;
}


function getCookie( cookieName )
{
  var matchResults = document.cookie.match ( '(^|;) ?' + cookieName + '=([^;]*)(;|$)' );
  if ( matchResults )
    return ( unescape ( matchResults[2] ) );
  else
    return null;
}