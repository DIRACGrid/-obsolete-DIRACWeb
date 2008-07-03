var gTreeRootNode = false;
var gTreePanel = false;
var gOptionMenu = false;
var gSectionMenu = false;
var gValuePanel = false;

function createCSTree( rootNodeName )
{
	var treeLoader = new Ext.tree.TreeLoader({
		dataUrl:'expandSection',
		listeners : {
			beforeload : function cbPrepareNodePath( tL, node )
				{
					tL.baseParams.nodePath = getNodePath( node );
				}
		},
	});

	gTreePanel = new Ext.tree.TreePanel({
//        el:'tree-div',
		region : 'center',
		useArrows:true,
		autoScroll:true,
		animate:true,
		enableDD:true,
		containerScroll: true,
		loader: treeLoader
	});

	// set the root node
	gTreeRootNode = new Ext.tree.AsyncTreeNode({
		text: rootNodeName,
		draggable:false,
		id:'csTree:',
		listeners : {
			beforeappend : cbCheckNodeInsertion,
			},
    });

   gOptionMenu = new Ext.menu.Menu({
   	id : 'OptionContextualMenu',
   	items : [ { text : 'Change option value',
   					listeners : { click : cbMenuSetOptionValue }
   				 },
   				 new Ext.menu.Separator,
   				 { text : 'Change comment',
   					listeners : { click : cbMenuSetCommentValue }
   				 },
   				 new Ext.menu.Separator,
   				 { text : 'Copy option',
   				   listeners : { click : cbMenuCopyNode }
   				 },
   				 { text : 'Rename option',
   				   listeners : { click : cbMenuRenameNode }
   				 },
   				 { text : 'Delete option',
   				   listeners : { click : cbMenuDeleteNode }
   				 }
   			  ]
   })

   gSectionMenu = new Ext.menu.Menu({
   	id : 'SectionContextualMenu',
   	items : [ { text : 'Create a subsection',
   					listeners : { click : cbMenuCreateSubsection }
   				 },
   				 { text : 'Create an option',
   					listeners : { click : cbMenuCreateOption }
   				 },
   				 new Ext.menu.Separator,
   				 { text : 'Change comment',
   					listeners : { click : cbMenuSetCommentValue }
   				 },
   				 new Ext.menu.Separator,
   				 { text : 'Copy section',
   				   listeners : { click : cbMenuCopyNode }
   				 },
   				 { text : 'Rename section',
   				   listeners : { click : cbMenuRenameNode }
   				 },
   				 { text : 'Delete section',
   				   listeners : { click : cbMenuDeleteNode }
   				 }
   			  ]
   })

	gValuePanel = new Ext.FormPanel ({
    	id:'value-panel',
    	region : 'east',
    	collapsible: true,
    	title : "Value for option",
    	width:300,
    	minWidth: 150,
    	border: false,
    	baseCls:'x-plain',
    	autoScroll : true,
    	collapsed : true,
    	//hidden : true,
		onSubmit : Ext.emptyFn,
		submit : function(){},
		items : [
					 { xtype : 'textarea',
					 	id : 'valueArea',
					 	hideLabel : true,
					 	grow : true,
					 	width : 290,
					 }
					],
		buttons : [ { text: 'Submit',
                    handler : cbFormExecuteAction,
                  },
                  { text: 'Reset',
                    handler: function(e) {
                    		gValuePanel.getComponent( 'valueArea' ).setValue( gValuePanel.csValue );
                    	},
                  },
                  { text : 'Cancel',
                    handler : function( e ) {
                    		gValuePanel.disable();
                    		gValuePanel.collapse( false );
                  	},
                  }
					 ]


	});

	gTreePanel.setRootNode(gTreeRootNode);
	gTreeRootNode.expand();
	gTreePanel.on( "render", function( e ){
		gTreePanel.body.on( "contextmenu", function(e){e.preventDefault(); return false;} );
		} );
	gTreePanel.on( "contextmenu", cbShowContextMenu );
	gValuePanel.on( "render", function( e ){
			gValuePanel.disable();
		} );


	return [ gTreePanel, gValuePanel ];
}

function getNodePath( node )
{
	var path = ""
	var pNode = node;
	while( pNode )
	{
		if( pNode.attributes.csName )
			path = "/" + pNode.attributes.csName + path;
		else
			break;
		pNode = pNode.parentNode;
	}
	if( ! path )
		return "/";
	return path;
}

//Modify nodes according to what they are
function cbCheckNodeInsertion( tree, parent, node )
{
	var nodeAttrs = node.attributes;
	node.on( "beforemove", ajaxNodeMoved );
	if( node.isLeaf() )
	{
		configureLeafNode( node );
	}
	else
	{
		node.on( "beforeappend", cbCheckNodeInsertion );
	}

}

//Set the display html for leaf nodes
function configureLeafNode( node )
{
	node.setText( node.attributes.csName + " = " + node.attributes.csValue );
	node.on( "beforeclick", inPlaceOptionValueChange );
}

//Show the menus
function cbShowContextMenu( node, contextEvent )
{
//	contextEvent.preventDefault();
	contextEvent.stopEvent();
	if( node.isLeaf() )
	{
		gOptionMenu.targetCtxNode = node;
		gOptionMenu.show( node.ui.getAnchor() );
	}
	else
	{
		gSectionMenu.targetCtxNode = node;
		gSectionMenu.show( node.ui.getAnchor() );
	}
//	return false;
}

/*
 Functions for quick modifying the values in a node
*/
function cbNodeEditKeyPressed( keyEvent, editHTML, node )
{
	if( keyEvent.getKey() == keyEvent.ENTER )
	{
		ajaxSetOptionValue( node, editHTML.value );
	}
}

function cbNodeEditBlur( blurEvent, editHTML, node )
{
	configureLeafNode( node );
}

function inPlaceOptionValueChange( node, clickEvent )
{
	node.un( "beforeclick", inPlaceOptionValueChange );
	var editId = "opedit:" + node.id;
	node.setText( node.attributes.csName + " = <input id='"+editId+"' type='text' value='" + node.attributes.csValue +"'/>" );
	var editObj = Ext.get( editId );
	editId.treeNode = node;
	Ext.EventManager.on( editObj, "keypress", cbNodeEditKeyPressed, editObj, node );
	Ext.EventManager.on( editObj, "blur", cbNodeEditBlur, editObj, node );
	editObj.focus();
	return true;
}
/*
End quick modification
*/

function ajaxSetOptionValue( node, value )
{
	configureLeafNode( node );
	Ext.Ajax.request({
   	url: 'setOptionValue',
   	method : 'POST',
   	success: serverSetOptionValue,
   	failure: ajaxFailure,
   	params: { path : getNodePath( node ), value : value },
   	node : node
	});
}

function serverSetOptionValue( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to modify value: " + retVal.Message );
		return;
	}
	var node = reqArguments.node;
	node.attributes.csValue = reqArguments.params.value;
	configureLeafNode( node );
}

/*
Set comment
*/

function ajaxSetComment( node, value )
{
	Ext.Ajax.request({
   	url: 'setComment',
   	method : 'POST',
   	success: serverSetComment,
   	failure: ajaxFailure,
   	params: { path : getNodePath( node ), value : value },
   	node : node
	});
}

function serverSetComment( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to modify comment: " + retVal.Message );
		return;
	}
	reqArguments.node.attributes.csComment = retVal.Value;
}

//Drag and drop
function ajaxNodeMoved( tree, node, oldParent, newParent, beforeOfIndex )
{
	Ext.Ajax.request({
   	url: 'moveNode',
   	method : 'POST',
   	success: serverMoveNode,
   	failure: ajaxFailure,
   	params: { nodePath : getNodePath( node ),
   				 parentPath : getNodePath( newParent ),
   				 beforeOfIndex : beforeOfIndex },
   	moveParams : { tree : tree,
   						node : node,
   						oldParent : oldParent,
   						newParent : newParent,
   						beforeOfIndex : beforeOfIndex,
   						oldIndex : oldParent.indexOf( node ) }
	});
}

function serverMoveNode( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to move node: " + retVal.Message );
		var nP = reqArguments.moveParams.newParent;
		var node =  reqArguments.moveParams.node;
		var oP = reqArguments.moveParams.oldParent;
		var oldPos = reqArguments.moveParams.oldIndex;
		nP.removeChild( node );
		oP.insertBefore( node, oP.item( oldPos ) );
		nP.reload();
		oP.reload();
	}
}

function cbFormExecuteAction( menuItem, clickEvent )
{
	var node = gValuePanel.csNode;
	var value = gValuePanel.getComponent( 'valueArea' ).getValue();
	switch( gValuePanel.csAction )
	{
		case 'setValue':
			ajaxSetOptionValue( node, stringToList( value, "\n" ).join( "," ) );
			break;
		case 'setComment':
			ajaxSetComment( node, value );
			break;
	}
	gValuePanel.disable();
	gValuePanel.collapse( false );
}


//Context menu options

function cbMenuSetOptionValue( menuItem, clickEvent )
{
	var node = menuItem.parentMenu.targetCtxNode;
	gValuePanel.csNode = node;
	gValuePanel.csValue = stringToList( node.attributes.csValue ).join( "\n" );
	gValuePanel.csPath = getNodePath( node );
	gValuePanel.setTitle( "Value for " + gValuePanel.csPath );
	gValuePanel.getComponent( 'valueArea' ).setValue( gValuePanel.csValue );
	gValuePanel.csAction = "setValue";
	gValuePanel.enable();
	gValuePanel.expand( false );
}

function cbMenuSetCommentValue( menuItem, clickEvent )
{
	var node = menuItem.parentMenu.targetCtxNode;
	gValuePanel.csNode = node;
	gValuePanel.csValue = commentToList( node.attributes.csComment ).join( "\n" );
	gValuePanel.csPath = getNodePath( node );
	gValuePanel.setTitle( "Comment for" + gValuePanel.csPath );
	gValuePanel.getComponent( 'valueArea' ).setValue( gValuePanel.csValue );
	gValuePanel.csAction = "setComment";
	gValuePanel.enable();
	gValuePanel.expand( false );
}

function cbMenuCopyNode( menuItem, clickEvent )
{
	var node = menuItem.parentMenu.targetCtxNode;
	var newName = window.prompt( "What's the name for the copy?", node.attributes.csName + " copy" );
	if( newName == null ) return;
	Ext.Ajax.request({
   	url: 'copyKey',
   	method : 'POST',
   	success: serverCopyNode,
   	failure: ajaxFailure,
   	params: { path : getNodePath( node ), newName : newName },
   	node : node
	});
}

function serverCopyNode( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to copy node: " + retVal.Message );
		return;
	}
	var newName = reqArguments.params.newName;
	var node = reqArguments.node;
	var newCfg = { text : node.text,
						csName : newName,
						csComment : node.attributes.csComment,
					};
	if( node.isLeaf )
	{
		newCfg.leaf = true;
		newCfg.csValue = node.attributes.csValue;
	}
	else
		newCfg.loader = node.loader;
	node.parentNode.appendChild( new Ext.tree.AsyncTreeNode( newCfg ) );
}

function cbMenuRenameNode( menuItem, clickEvent )
{
	var node = menuItem.parentMenu.targetCtxNode;
	var newName = window.prompt( "What's the new name for "+ node.attributes.csName + " ?" );
	if( newName == null ) return;
	Ext.Ajax.request({
   	url: 'renameKey',
   	method : 'POST',
   	success: serverRenameNode,
   	failure: ajaxFailure,
   	params: { path : getNodePath( node ), newName : newName },
   	node : node
	});
}

function serverRenameNode( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to rename node: " + retVal.Message );
		return;
	}
	var newName = reqArguments.params.newName;
	var node = reqArguments.node;
	node.attributes.csName = newName;
	if( node.isLeaf )
	{
		configureLeafNode( node );
	}
	else
		node.setText( newName );
}

function cbMenuDeleteNode( menuItem, clickEvent )
{
	var node = menuItem.parentMenu.targetCtxNode;
	if( ! window.confirm( "Are you sure you want to delete " + getNodePath( node ) + "?" ) )
		return;
	Ext.Ajax.request({
   	url: 'deleteKey',
   	method : 'POST',
   	success: serverDeleteNode,
   	failure: ajaxFailure,
   	params: { path : getNodePath( node ) },
   	node : node
	});
}

function serverDeleteNode( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to delete node: " + retVal.Message );
		return;
	}
	var node = reqArguments.node;
	var pN = node.parentNode;
	pN.removeChild( node );
	pN.reload();
}

function cbMenuCreateSubsection( menuItem, clickEvent )
{
	var node = menuItem.parentMenu.targetCtxNode;
	var newName = window.prompt( "What's the name of the new section?" );
	if( newName == null ) return;
	Ext.Ajax.request({
   	url: 'createSection',
   	method : 'POST',
   	success: serverCreateSection,
   	failure: ajaxFailure,
   	params: { path : getNodePath( node ), name : newName },
   	node : node
	});
}

function serverCreateSection( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to create section: " + retVal.Message );
		return;
	}
	var newCfg = retVal.Value;
	newCfg.text = newCfg.csName;
	var node = reqArguments.node;
	if( ! node.isExpanded() )
	{
		node.expand();
	}
	else
		node.appendChild( new Ext.tree.AsyncTreeNode( newCfg ) );
}

function cbMenuCreateOption( menuItem, clickEvent )
{
	var node = menuItem.parentMenu.targetCtxNode;
	var newName = window.prompt( "What's the name of the new option?" );
	if( newName == null ) return;
	var value = window.prompt( "What's the value of the new option?" );
	if( value == null ) return;
	Ext.Ajax.request({
   	url: 'createOption',
   	method : 'POST',
   	success: serverCreateOption,
   	failure: ajaxFailure,
   	params: { path : getNodePath( node ), name : newName, value : value },
   	node : node
	});
}

function serverCreateOption( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to create option: " + retVal.Message );
		return;
	}
	var newCfg = retVal.Value;
	newCfg.text = newCfg.csName;
	var node = reqArguments.node;
	if( ! node.isExpanded() )
	{
		node.expand();
	}
	else
		node.appendChild( new Ext.tree.AsyncTreeNode( newCfg ) );
}

//AJAX Failure

function ajaxFailure( ajaxResponse, reqArguments )
{
	alert( "Error in AJAX request : " + ajaxResponse.responseText );
}

//splits value as comma separated list
function stringToList( stringValue, sep )
{
	if( ! sep )
  		sep = ",";
	var vList = stringValue.split( sep );
	var strippedList = [];
	for( var i = 0; i < vList.length; i++ )
	{
  		var trimmed = vList[i].trim();
  		if( trimmed.length > 0 )
  		{
  			strippedList.push( trimmed );
  		}
	}
	return strippedList;
}

function commentToList( stringValue )
{
	var vList = stringValue.trim().split( "\n" );
	var cList = [];
	for( var i = 0; i < vList.length; i++ )
	{
		var trimmed = vList[i].trim();
  		if( trimmed.length == 0 )
  			continue;
		if( i == vList.length - 1 && trimmed.indexOf( "@@-" ) == 0 )
			break;
  		cList.push( trimmed );
	}
	return cList;
}

/* COMMIT */
function cbCommitConfiguration( linkItem, clickEvent )
{
	if( ! window.confirm( "Are you sure you want to commit the modifications?" ) )
		return;
	Ext.Ajax.request({
   	url: 'commitConfiguration',
   	success: serverCommit,
   	failure: ajaxFailure,
	});
}

function serverCommit( ajaxResponse, reqArguments )
{
	var retVal = Ext.util.JSON.decode( ajaxResponse.responseText );
	if( ! retVal.OK )
	{
		alert( "Failed to commit: " + retVal.Message );
		return;
	}
	alert( "Configuration successfully commited" );
	document.location = document.location;
}