var gMainGrid = false;
var dataSelect = ''; // Required to store the data for filters fields. Object.
var tableMngr = ''; // Required to handle configuration data for table. Object.

function initManageProxies(initSelections){
  dataSelect = initSelections;
  Ext.onReady(function(){
    Ext.override(Ext.PagingToolbar, {
      onRender :  Ext.PagingToolbar.prototype.onRender.createSequence(function(ct, position){
        this.loading.removeClass('x-btn-icon');
        this.loading.setText('Refresh');
        this.loading.addClass('x-btn-text-icon');
      })
    });
    renderPage();
  });
}

function initSidebar(){
/*
  createMenu(dataIndex or dataName,Text label, alternative data) same for createDropdownMenu
*/
  var userSelect = createMenu('username','User');
  var groupSelect = createMenu('usergroup','Group');
  var expiredBefore = createDropdownMenu('expiredBefore','Expired Before'); // Initializing JobStatus Menu
  var expiredAfter = createDropdownMenu('expiredAfter','Expired After'); // Initializing JobStatus Menu
  var pers = [['True'],['False']];
  var persistentSelect = createDropdownMenu('persistent','Persistent',pers); // Initializing Minor Status Menu
  var select = selectPanel(); // Initializing container for selection objects
  // Insert object to container BEFORE buttons:
  select.insert(0,userSelect);
  select.insert(1,groupSelect);
  select.insert(2,expiredBefore);
  select.insert(3,expiredAfter);
  select.insert(4,persistentSelect);
  var bar = sideBar();
  bar.insert(0,select);
  bar.setTitle('ProxyManagement');
  return bar
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
  var columns = [
            { id : 'check', header : '', width : 30, dataIndex: 'proxyid', renderer : renderSelect },
            { header: "User", width: 100, sortable: false, dataIndex: 'username'},
            { header: "DN", width: 350, sortable: true, dataIndex: 'UserDN'},
            { header: "Group", width: 100, sortable: true, dataIndex: 'UserGroup'},
            { header: "Expiration date (UTC)", width: 150, sortable: true, dataIndex: 'ExpirationTime', renderer : renderExpirationDate },
            { header: "Persistent", width: 100, sortable: true, dataIndex: 'PersistentFlag' },
        ];
        
  var view = new Ext.grid.GroupingView({
            groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})',
            emptyText: 'No data',
            startCollapsed : false,
        });
        
  var tbar = [
   				{ 
   				  handler:function(){ toggleAll(true) }, 
   				  text:'Select all', 
   				  width:150, 
   				  tooltip:'Click to select all rows', 
   				  cls:"x-btn-text-icon", 
   				  icon:gURLRoot+'/images/iface/checked.gif'
   				},{
   				  handler:function(){ toggleAll(false) }, 
   				  text:'Select none', 
   				  width:150, 
   				  tooltip:'Click to select all rows', 
   				  cls:"x-btn-text-icon", 
   				  icon:gURLRoot+'/images/iface/unchecked.gif'
   				},'->',{
   				  handler:function(){ cbDeleteSelected() },
   				  text:'Delete', 
   				  width:150, 
   				  tooltip:'Click to delete all selected proxies', 
   				  cls:"x-btn-text-icon", 
   				  icon:gURLRoot+'/images/iface/delete.gif'
   				}
   			];
  tableMngr = {'store':store,'columns':columns,'tbar':tbar,'view':view};
  gMainGrid = table( tableMngr );
  gMainGrid.addListener('sortchange',cbMainGridSortChange );  
	var selectors = initSidebar();
	renderInMainViewport( [selectors, gMainGrid] );
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
	dataSelect.globalSort = sortState.field + ' ' + sortState.direction;
}

function cbMainGridSortChange( mainGrid, params )
{
	var store = mainGrid.getStore();
	store.setDefaultSort( params.field, params.direction );
	dataSelect.globalSort = params.field + ' ' + params.direction;
	store.reload();
}

function cbDeleteSelected()
{
	var selIds = getSelectedCheckboxes();
	var msg = 'proxy';
	if(selIds && selIds.length > 1){
	  msg = 'proxies';
	}
	if( window.confirm( "Are you sure you want to delete selected " + msg + "?" ) )
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

function renderExpirationDate( value, metadata, record, rowIndex, colIndex, store )
{
	var expStr = record.data.ExpirationTime.trim();
	var dayTime = expStr.split( " " );
	var dayList = dayTime[0].split( "-" ); //YYYY-MM-DD
	var timeList = dayTime[1].split( ":" ); //HH:MM:SS
	var expEpoch = new Date( dayList[0], parseInt( dayList[1] ) - 1, dayList[2], timeList[0], timeList[1], timeList[2] ).getTime()/1000;
	var nowDate = new Date();
	var offsetStr = nowDate.getGMTOffset();
	var secOff = parseInt( offsetStr.substr( 1, 2 ) ) * 3600 + parseInt( offsetStr.substr( 3, 2 ) ) * 60;
	if( offsetStr.charAt(0) == "+" )
		var nowEpoch = nowDate.getTime()/1000 + secOff;
	else
		var nowEpoch = nowDate.getTime()/1000 - secOff;
	var secsLeft = expEpoch - nowEpoch;

	var timeLimit = 86400 * 30;
	if( secsLeft < 0 )
		secsLeft = 0;
	else if( secsLeft > timeLimit )
		secsLeft = timeLimit;

        if( secsLeft < 3600 )
		var green = 0;
	else
		var green = 200;
	var red = parseInt( 255 * ( timeLimit - secsLeft ) / timeLimit );
//	var red = parseInt( 200 * ( secsLeft ) / timeLimit );
	return '<span style="color: rgb('+red+','+green+',0);">' + expStr + '</span>';
}
