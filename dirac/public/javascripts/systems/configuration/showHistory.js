var gMainGrid = false;

function initShowHistory( versionData ){

  Ext.onReady(function(){
    renderPage( versionData );
  });
}

function resetChanges()
{
	if( window.confirm( "You will lose all your changes, are you sure? " ) )
		document.location="resetConfigurationToRemote"
}

function renderPage( versionData )
{
	var panels = [];
	var actionPanel = createActionPanel( "Actions", [ '<a href="#" onclick="javascript:showDiff()">Show differences between selected</a>',
                                                     '<a href="#" onclick="javascript:checkRollback()">Rollback to "TO" version</a>' ] );
	panels.push( actionPanel );
	var leftBar = createLeftPanel( panels );

	var reader = new Ext.data.JsonReader({
		root : 'versions',
		totalProperty : 'numVersions',
		id : 'versionId',
		fields : [ "version", "commiter" ]
    });

	var store = new Ext.data.Store({
				reader: reader,
				data : versionData,
				sortInfo: { field: 'version', direction: 'DESC' },
        		});

	gMainGrid = new Ext.grid.GridPanel( {
		store : store,
		columns: [
            { header: "From", width : 50, sortable: false, dataIndex: 'version', renderer : renderFromSelect },
            { header: "To / RB", width: 50, sortable: false, dataIndex: 'version', renderer : renderToSelect},
            { header: "Version", width: 200, sortable: false, dataIndex: 'version'},
            { header: "Commiter", width: 100, sortable: false, dataIndex: 'commiter'},
        ],
      region : 'center',
	   listeners : {},
		} );

	renderInMainViewport( [ leftBar, gMainGrid ] );
	initRadios();
}

function renderFromSelect( value, metadata, record, rowIndex, colIndex, store )
{
	return '<input type="radio" onclick="javascript:checkEnabledDiff()" name="fromVersion" value="' + record.get( 'version' ) + '"/>';
}

function renderToSelect( value, metadata, record, rowIndex, colIndex, store )
{
	return '<input type="radio" onclick="javascript:checkEnabledDiff()" name="toVersion" value="' + record.get( 'version' ) + '"/>';
}

function initRadios()
{
	toObj = document.getElementsByName( "toVersion" );
	for( var i = 0; i< toObj.length; i++ )
	{
		if( i == 0 )
			toObj[ i ].checked = true;
		else
			toObj[ i ].checked = false;
	}
 	fromObj =document.getElementsByName( "fromVersion" );
	for( var i = 0; i< fromObj.length; i++ )
	{
		if( i == 1 )
			fromObj[ i ].checked = true;
		else
			fromObj[ i ].checked = false;
	}
/*
 	rollObj = document.versions.rollbackVersion;
	for( var i = 0; i< rollObj.length; i++ )
	{
		rollObj[ i ].checked = false;
	}
*/
	checkEnabledDiff();
}

function checkEnabledDiff( toObj, fromObj )
{
	if( ! toObj )
		toObj = document.getElementsByName( "toVersion" );
	if( ! fromObj )
		fromObj =document.getElementsByName( "fromVersion" );
 	var selectedFrom = getSelectedIndex( fromObj );
 	var selectedTo = getSelectedIndex( toObj );
	for( var i = 0; i< fromObj.length; i++ )
	{
		if( i <= selectedTo )
			fromObj[ i ].style.visibility = "hidden";
		else
			fromObj[ i ].style.visibility = "visible";
	}
	for( var i = 0; i< toObj.length; i++ )
	{
		if( i >= selectedFrom )
			toObj[ i ].style.visibility = "hidden";
		else
			toObj[ i ].style.visibility = "visible";
	}
}
function getSelectedIndex( radioObj )
{
	var radioLength = radioObj.length;
	if( radioLength == null )
		if( radioObj.checked )
			return 0;
	for( var i = 0; i< radioLength; i++ )
	{
		if( radioObj[i].checked )
			return i;
	}
	return 0;
}
function showDiff()
{
	fromObj = document.getElementsByName( "fromVersion" );
 	fromTime = getRadioValue( fromObj );
	toObj = document.getElementsByName( "toVersion" );
 	toTime = getRadioValue( toObj );
 	if( fromTime == toTime )
 	{
 		alert( "Both versions are the same!" );
 		return false;
 	}
 	windowOpts = "['new_window', 'height=300,width=600,scrollbars=yes,resizable=yes']";
 	window.open( "showDiff?fromVersion="+fromTime+"&toVersion="+toTime, "Version differences", windowOpts );
}
function getRadioValue( radioObj )
{
	var radioLength = radioObj.length;
	if( radioLength == null )
		if( radioObj.checked )
			return radioObj.value;
		else
			return "";
	for( var i = 0; i< radioLength; i++ )
	{
		if( radioObj[i].checked )
			return radioObj[ i ].value;
	}
	return "";
}
function checkRollback()
{
 	rollbackTime = getRadioValue( document.getElementsByName( "toVersion" ) );
 	if( rollbackTime == "" )
 	{
 		alert( "Select some version to rollback!" );
 		return false;
 	}

 	if( window.confirm( "Are you sure you want to rollback to version " + rollbackTime + "?" ) )
	{
		document.location = "rollbackToVersion?to=" + rollbackTime
	}
}