
var sectionNodesMap = {};
var optionNodesMap = {};
var selectedTextNode;
var sectionContextMenu;
var optionContextMenu;
var commentDialog;
var commentsMap = {};
var optionValueDialog;

var csRootNode;
var csTree;

function dummy (){ alert( "DUMMY FUNCTION CALLED for node" + selectedTextNode.labelElId ); };

function initTreeMagic( treeName, rootNode )
{
  csRootNode = rootNode;
  csTree = rootNode.tree;
  sectionNodesMap[ rootNode.labelElId ] = rootNode;
  var triggersList = [];
  for(key in sectionNodesMap) triggersList.push( key );
  sectionContextMenu = new YAHOO.widget.ContextMenu( "sectionContextMenuId", 
                                                        {
                                                         trigger : triggersList,
                                                         itemdata : [
                                                          { text: "Add subsection", onclick: { fn: contextAddSubsection } },
                                                          { text: "Add option", onclick: { fn: contextAddOption } },
                                                          { text: "Edit comment", onclick: { fn: contextEditComment } },
                                                          { text: "Copy section", onclick: { fn: copyNode } },
                                                          { text: "Rename section", onclick: { fn: contextRenameNode } },
                                                          { text: "Delete section", onclick: { fn: contextDeleteNode } }
                                                         ]
                                                        }
                                                       );
  sectionContextMenu.triggerContextMenuEvent.subscribe( findContextMenuNode, sectionNodesMap );
  sectionContextMenu.render( treeName );
  optionContextMenu = new YAHOO.widget.ContextMenu( "optionContextMenuId", 
                                                       { 
                                                        trigger : [],
                                                        itemdata : [
                                                         { text: "Edit value", onclick: { fn: contextEditOption } },
                                                         { text: "Edit comment", onclick: { fn: contextEditComment } },
                                                         { text: "Copy option", onclick: { fn: copyNode } },
                                                         { text: "Rename option", onclick: { fn: contextRenameNode } },
                                                         { text: "Delete option", onclick: { fn: contextDeleteNode } }
                                                        ]
                                                       }
                                                     );
                                                        
  optionContextMenu.triggerContextMenuEvent.subscribe( findContextMenuNode, optionNodesMap );
  optionContextMenu.render( treeName );
  
  commentDialog = new YAHOO.widget.Dialog( "commentDialog", 
			{ width : "600px",
			  fixedcenter : true,
			  visible : false, 
			  constraintoviewport : true,
			  buttons : [ 
			   { text:"Submit", handler:dialogCommentSubmit, isDefault:true },
		     { text:"Cancel", handler:function(){ this.cancel();} } 
		    ]
			 } );
  commentDialog.render();
  
  optionValueDialog = new YAHOO.widget.Dialog( "valueDialog", 
			{ width : "600px",
			  fixedcenter : true,
			  visible : false, 
			  constraintoviewport : true,
			  buttons : [ 
			   { text:"Submit", handler:dialogOptionValueSubmit, isDefault:true },
		     { text:"Cancel", handler:function(){ this.cancel();} } 
		    ]
			 } );
  optionValueDialog.render();
}


//"contextmenu" event handler for the element(s) that triggered the display of the context menu
function findContextMenuNode( p_oEvent, func, nodesMap ) {
  function GetTextNodeFromEventTarget(p_oTarget) {
    if (p_oTarget.tagName.toUpperCase() == "A" && p_oTarget.className == "ygtvlabel") {
      return nodesMap[ p_oTarget.id ];
    }
    else {
      if (p_oTarget.parentNode && p_oTarget.parentNode.nodeType == 1) {
        return GetTextNodeFromEventTarget(p_oTarget.parentNode);
      }
    }
  }
  var oTextNode = GetTextNodeFromEventTarget( this.contextEventTarget );
  if (oTextNode) {
    selectedTextNode = oTextNode;
  }
  else {
    this.cancel();
  }
}

function updateContextMenuTriggers()
{
  var triggersList = [];;
  for(key in sectionNodesMap) 
   triggersList.push( key );
  sectionContextMenu.cfg.setProperty( 'trigger', triggersList );
  triggersList = [];
  for(key in optionNodesMap) 
    triggersList.push( key );
  optionContextMenu.cfg.setProperty( 'trigger', triggersList );
}

/* Generate tree nodes */

function generateLabelForCSObject( csPath, csObject )
{
  if( csObject.length == 2)
  {
    //Section
    nodeLabel = "<span id='sdd-" + csPath + "' class='sectionNode'>" + csObject[0] + "</span>";
  }
  else
  {
    //option
    nodeLabel = "<span id='odd-" + csPath + "' class='optionNode'>" + csObject[0] + " = " + csObject[1] + "</span>"; 
  }
  return nodeLabel
}

function getProcessedComment( csObject )
{
  var comment;
  if( csObject.length == 2 )
  {  
    comment = csObject[1];
  }
  else
    comment = csObject[2];
  if( comment.length > 0 )
  {
    var commentLength = comment.length;
    while( comment.length > 0 && comment[ commentLength - 1 ] == "\n" )
      comment = comment.slice( 0, commentLength - 1 );
    var commentLines = comment.split( "\n" );
    var numLines = commentLines.length;
    var lastCommiter = "";
    if( commentLines[ numLines - 1 ].indexOf( "@@-" ) == 0 )
    {
      lastCommiter = commentLines[ numLines - 1 ];
      lastCommiter = lastCommiter.slice( 3, lastCommiter.length );
      commentLines = commentLines.slice( 0, numLines - 1 );
    }
    return[ commentLines, lastCommiter ];
  }
  else
    return [ [], "" ]
}

function generateCommentTooltip( csPath, csObject )
{
  var spanId = "dd-" + csPath;
  if( csObject.length == 2 )
  {
    spanId = "s" + spanId;
  }
  else
  {
    spanId = "o" + spanId;
  }
  var commentData = getProcessedComment( csObject );
  if( commentData[0].length || commentData[1].length )
  {
    commentHTML = "<div style='text-align:left'>" + commentData[0].join( "<br/>" ) + "</div>";
    if( commentData[1].length > 0 )
      commentHTML += "<br/><span style='font-weight:bold;font-size:smaller;'>"+commentData[1]+"</span>";
   
    if( spanId in commentsMap )
    {
      commentsMap[ spanId ].cfg.setProperty( "text", commentHTML );
    }
    else 
      commentsMap[ spanId ] = new YAHOO.widget.Tooltip( "tooltip" + csPath, { context: spanId, text: commentHTML } );
  }
   
}

function createTreeNode( parentNode, csObject )
{
  var nodeLabel;
  var csPath = parentNode.data.id[0] + "/" + csObject[0];  
  var nodeLabel = generateLabelForCSObject( csPath, csObject );
  var nodeDef = {
    label : nodeLabel,
    id : [
      csPath,
      csObject
    ]
  };
  var treeNode = new YAHOO.widget.TextNode( nodeDef, parentNode, false );
  if( csObject.length == 2 )
    treeNode.setDynamicLoad( loadNodeData, 1 );
  if( csObject.length == 2 )
  {
    sectionNodesMap[ treeNode.labelElId ] = treeNode;
  }
  else
  {
    optionNodesMap[ treeNode.labelElId ] = treeNode;
  }
  generateCommentTooltip( csPath, csObject );
  setDDForNode( treeNode );
  return treeNode;
}

/* Generate drag and drop structures for node */

function setDDForNode( treeNode )
{
  var nodeType;
  var csPath = treeNode.data.id[0];
  if( treeNode.data.id[1].length == 2 )
    nodeType = "section";
  else
    nodeType = "option";
  var ddConfig = { csType : nodeType, node : treeNode };
  //Generate DD
  var dragProxy = new DDCfgEntry( nodeType.charAt( 0 ) + "dd-" + csPath, nodeType, ddConfig );
  var dropTarget = new YAHOO.util.DDTarget( nodeType.charAt( 0 ) + "dd-" + csPath, nodeType, ddConfig );
  if( nodeType == "option" )
    dragProxy.addToGroup( "section" );
}

function setDDForBranch( treeNode )
{
  YAHOO.log( "Setting dd for " + treeNode.getLabelEl().innerHTML )
  if( treeNode.getElId() != csRootNode.getElId() )
    setDDForNode( treeNode );
  for( var i = 0; i< treeNode.children.length; i++ )
  {
    setDDForBranch( treeNode.children[ i ] );
  }
}

/* Load tree data dynamically */

function loadNodeData( rootNode, fnLoadComplete )
{
  YAHOO.log( "Expanding " + rootNode.data.id[0] );
  var nodeLabel = encodeURI( rootNode.data.id[0] );
  var sURL = "expandSection?section=" + nodeLabel
  var callback = {
   success: function( oResponse ) {
    var retDict = eval("(" + oResponse.responseText + ")");
    var rootNode = oResponse.argument.node;
    if( retDict[ 'OK' ] )
    {
      for( entry in retDict[ 'Value' ] )
      {
        createTreeNode( rootNode, retDict[ 'Value' ][ entry ] )
      }
    }
    updateContextMenuTriggers();
    oResponse.argument.fnLoadComplete();
    },
    
    failure: function(oResponse) {
      YAHOO.log("Failed to process XHR transaction.", "info", "example");
      oResponse.argument.fnLoadComplete();
    },
    argument: {
      "node": rootNode,
      "fnLoadComplete": fnLoadComplete
    },
    timeout: 7000
  };
  
  
  YAHOO.util.Connect.asyncRequest('GET', sURL, callback); 
}

/*Add subsection*/
function contextAddSubsection()
{
  var subSectionName = window.prompt("Enter a name for the new section: ", "");
  if( subSectionName == null ) return;
  sendQuery( "createSection", { 
          'path' : selectedTextNode.data.id[0], 
          'sectionName' : subSectionName 
          }, 
          serverCreateSection, [ selectedTextNode, subSectionName ] );
}

function serverCreateSection( respObj )
{
  var retDict = eval("(" + respObj.responseText + ")");
  if( retDict[ 'OK' ] )
  {
    var parentNode = respObj.argument[0];
    if( parentNode.isDynamic() && ! parentNode.dynamicLoadComplete )
    {
      parentNode.expand()
    }
    else
    {
      var sectionNode = createTreeNode( parentNode, retDict[ 'Value' ] );
      parentNode.refresh(); 
      setDDForBranch( parentNode );
      parentNode.collapse();
      parentNode.expand();
      sectionNode.expand();
      updateContextMenuTriggers();
    }
  }
  else
    alert( "There was a problem creating subsection : " + retDict[ 'Message' ] )
}

/*Add option*/
function contextAddOption()
{
  var optionName = window.prompt("Enter a name for the new option: ", "");
  if( optionName == null ) return;
  var optionValue = window.prompt( "What's the value of option " + optionName + "? ", "" );
  if( optionValue == null ) return;
  sendQuery( "createOption", { 
          'path' : selectedTextNode.data.id[0], 
          'optionName' : optionName,
          'optionValue' : optionValue 
          }, 
          serverCreateOption, [ selectedTextNode ] );
}

function serverCreateOption( respObj )
{
  var retDict = eval("(" + respObj.responseText + ")");
  if( retDict[ 'OK' ] )
  {
    var parentNode = respObj.argument[0];
    if( parentNode.isDynamic() && ! parentNode.dynamicLoadComplete )
    {
      parentNode.expand()
    }
    else
    {
      var optionNode = createTreeNode( parentNode, retDict[ 'Value' ] );
      parentNode.refresh();
      setDDForBranch( parentNode );
      updateContextMenuTriggers();
    }
  }
  else
    alert( "There was a problem creating option : " + retDict[ 'Message' ] )
}

/*Rename node*/
function contextRenameNode()
{
  var newName = window.prompt("Enter a new name for " + selectedTextNode.data.id[1][0] + ": ", "");
  if( newName == null ) return;
  sendQuery( "renameKey", { 
          'path' : selectedTextNode.data.id[0], 
          'newName' : newName
          }, 
          serverRenameNode, [ selectedTextNode, newName ] );  
}

function setParentPathRecursive( csParentPath, node )
{
  node.data.id[0] = csParentPath + "/" + node.data.id[1][0];
  node.getLabelEl().innerHTML = generateLabelForCSObject( node.data.id[0], node.data.id[1] );
  generateCommentTooltip( node.data.id[0], node.data.id[1] );
  for( var i=0; i < node.children.length; i++ )
    setParentPathRecursive( node.data.id[0], node.children[i] );
}

function serverRenameNode( respObj )
{
  var retDict = eval("(" + respObj.responseText + ")");
  if( retDict[ 'OK' ] )
  {
    var renamingNode = respObj.argument[0];
    var newName = respObj.argument[1];
    var pathList = renamingNode.data.id[0].split( "/" );
    var parentPath = pathList.slice( 0, pathList.length - 1 ).join( "/" );
    renamingNode.data.id[1][0] = newName;
    setParentPathRecursive( parentPath, renamingNode );
    setDDForBranch( renamingNode );
  }
  else
    alert( "There was a problem renaming : " + retDict[ 'Message' ] )
}

/* Delete node */
function contextDeleteNode()
{
  answer = window.confirm( "Are you sure you want to delete " + selectedTextNode.data.id[1][0] + "?" );
  if( answer )
  {
    sendQuery( "deleteKey", { 
          'path' : selectedTextNode.data.id[0], 
          }, 
          serverKeyDelete, [ selectedTextNode ] );    
  }
}

function serverKeyDelete( respObj )
{
  var retDict = eval("(" + respObj.responseText + ")");
  if( retDict[ 'OK' ] )
  {
    var node = respObj.argument[0];
    parentNode = node.parent;
    csTree.removeNode( node );
    parentNode.refresh();
    setDDForBranch( parentNode );
    updateContextMenuTriggers();
  }
  else
    alert( "There was a problem renaming : " + retDict[ 'Message' ] )
}

/* Copy node */
function copyNode()
{
  var nodeName = window.prompt( "What's the name for the copy?", selectedTextNode.data.id[1][0] + " copy" );
  if( nodeName == null ) return;
  sendQuery( "copyKey", { 
          'path' : selectedTextNode.data.id[0], 
          'newName' : nodeName
          }, 
          serverCopyNode, [ selectedTextNode ] );  
}

function serverCopyNode( respObj )
{
  var retDict = eval("(" + respObj.responseText + ")");
  if( retDict[ 'OK' ] )
  {
    var parentNode = respObj.argument[0].parent;
    var node = createTreeNode( parentNode, retDict[ 'Value' ] );
    parentNode.refresh(); 
    setDDForBranch( parentNode );
  }
  else
    alert( "There was a problem renaming : " + retDict[ 'Message' ] )
}

/*Modify option value*/
function contextEditOption()
{  
  optionValueDialog.hide();
  optionValueDialog.setHeader( "Enter value for " + selectedTextNode.data.id[0].slice(1) )
  optionValueDialog.form.textValue.value = selectedTextNode.data.id[1][1].split( "," ).join( "\n" );
  optionValueDialog.cfg[ 'node' ] = selectedTextNode;
  optionValueDialog.show();
  
}

function dialogOptionValueSubmit()
{

  var valueList = optionValueDialog.getData().textValue.split( "\n" );
  optionValueDialog.cancel();
  var value = "";
  for( var i = 0; i< valueList.length; i++)
    if( valueList[ i ].length > 0 )
      value += valueList[ i ] + ",";
  value = value.slice( 0, value.length - 1 );
  
  sendQuery( "setOptionValue", 
      { 
        'path' : optionValueDialog.cfg[ 'node' ].data.id[0], 
        'value' : value 
      }, 
      serverSetOptionValue, 
      [ optionValueDialog.cfg[ 'node' ], value ]
    );
}

function editOption( node )
{
  if( node.data.id[1].length < 3 ) return;
  var optionData = node.data.id[1]
  var newHTML = optionData[0] + " = <input id='"+node.data.id[0]+"'type='edit' size='80' value='" + optionData[1] + "' onFocus='this.select();'/>";
  node.getLabelEl().innerHTML = newHTML;
  document.getElementById( node.data.id[0] ).focus();
  YAHOO.util.Event.addListener( node.data.id[0], 'blur', blurOption, node );
  YAHOO.util.Event.addListener( node.data.id[0], 'keypress', commitOption, node );
}
/* Display option as normal */
function blurOption( e, node )
{
  var optionData = node.data.id[1];
  var ddId = "odd-" + node.data.id[0];
  node.getLabelEl().innerHTML = "<span id='"+ddId+"'>" + optionData[0] + " = " + optionData[1] + "</span>";
}
/* New option value entered */
function commitOption( e, node )
{
  if ( e.keyCode != 13 ) return;
  var optionValue = document.getElementById( node.data.id[0] ).value;
  var optionData = node.data.id[1];
  var newHTML = "<img src='../../../yui/treeview/assets/skins/sam/treeview-loading.gif', alt = 'Processing..'/>" + optionData[0] + " = " + optionValue;
  node.getLabelEl().innerHTML = newHTML;
  sendQuery( "setOptionValue", { 'path' : node.data.id[0], 'value' : optionValue }, serverSetOptionValue, [ node, optionValue ] );
}

/* Commit option value change */
function serverSetOptionValue ( respObj )
{
  var returnObject = eval("(" + respObj.responseText + ")");
  var node = respObj.argument[0];
  if ( returnObject[ 'OK' ] )
  {
    node.data.id[1][1] = respObj.argument[1];
  }
  else
  {
    alert( "Failed to set value : " + returnObject[ 'Message' ] );
  }
  blurOption( "dummy", node );
}


/*Modify comment*/

function contextEditComment()
{
  commentDialog.hide();
  commentDialog.setHeader( "Enter comment for " + selectedTextNode.data.id[0].slice(1) )
  commentDialog.form.textValue.value = getProcessedComment( selectedTextNode.data.id[1] )[0].join("\n");
  commentDialog.cfg[ 'node' ] = selectedTextNode;
  commentDialog.show();
}

function dialogCommentSubmit()
{
  var commentValue = commentDialog.getData().textValue;
  commentDialog.cancel();
  sendQuery( "setComment", { 
          'path' : commentDialog.cfg[ 'node' ].data.id[0], 
          'value' : commentValue
          }, 
          serverSetComment, [ commentDialog.cfg[ 'node' ] ] );  
}

function serverSetComment( respObj )
{
  var retDict = eval("(" + respObj.responseText + ")");
  if( retDict[ 'OK' ] )
  {
    var commentText = retDict[ 'Value' ];
    var node = respObj.argument[0];
    if( node.data.id[1].length == 2 )
      node.data.id[1][1] = commentText;
    else
      node.data.id[1][2] = commentText;
    var node = respObj.argument[0];
    generateCommentTooltip( node.data.id[0], node.data.id[1] );
  }
  else
    alert( "There was a problem setting comment : " + retDict[ 'Message' ] )
}

/* AJAX REMOTE QUERY */
function sendQuery( action, params, successCallback, callbackArgs )
{
  postArgs = "";
  for(key in params)
  {
    postArgs += escape( key ) + "=" + escape( params[ key ] ) + "&";
  }
  postArgs = postArgs.substring( 0, postArgs.length - 1 );
  var callbackObj =
  {
    success : successRemoteQuery,
    failure : failedRemoteQuery,
    timeout : 5000,
    argument : [ successCallback, callbackArgs ]
  }
  showLoading();
  var transaction = YAHOO.util.Connect.asyncRequest( 'POST' , action , callbackObj, postArgs );
}

/* AJAX FAILED REMOTE QUERY */
function failedRemoteQuery( respObj )
{
  hideLoading();
  alert( "Failed " + respObj.argument[ 'action' ] );
}

/* AJAX SUCEEDED REMOTE QUERY */
function successRemoteQuery( respObj )
{
  hideLoading();
  var userCallback = respObj.argument[0];
  respObj.argument = respObj.argument[1];
  userCallback( respObj );
}

function showLoading()
{
  YAHOO.util.Dom.setStyle( 'loading', "visibility", "visible" );
}


function hideLoading()
{
  YAHOO.util.Dom.setStyle( 'loading', "visibility", "hidden" );
}

/* DDCfgEntry object */

(function() {

DDCfgEntry = function(id, sGroup, config) {
    DDCfgEntry.superclass.constructor.apply(this, arguments);
    this.initSection(id, sGroup, config);
};


YAHOO.extend(DDCfgEntry, YAHOO.util.DDProxy, {

    TYPE: "DDCfgEntry",

    initSection: function(id, sGroup, config) {
        if (!id) { 
            return; 
        }

        //var el = this.getDragEl()
        //YAHOO.util.Dom.setStyle(el, "borderColor", "transparent");
        //YAHOO.util.Dom.setStyle(el, "opacity", 0.76);

        // specify that this is not currently a drop target
        this.isTarget = false;

        this.originalStyles = {};

        this.type = DDCfgEntry.TYPE;
        this.slot = null;

        this.startPos = YAHOO.util.Dom.getXY( this.getEl() );
        //YAHOO.log(id + " startpos: " + this.startPos, "info", "example");
    },

    pushStyle: function( idHtml, propName, value ) 
    {
      if( this.originalStyles[ idHtml ] == null ) this.originalStyles[ idHtml ] = {};
      this.originalStyles[ idHtml ][ propName ] = YAHOO.util.Dom.getStyle( idHtml, propName );
      YAHOO.util.Dom.setStyle( idHtml, propName, value );
    },

    popStyle: function( idHtml, propName )
    {
      if( this.originalStyles[ idHtml ] == null ) return;
      if( this.originalStyles[ idHtml ][ propName ] == null ) return;

      YAHOO.util.Dom.setStyle( idHtml, propName, this.originalStyles[ idHtml ][ propName ] ); 
      delete this.originalStyles[ idHtml ][ propName ];
    },

    popAllStyles: function() {
      for( var idHtml in this.originalStyles )
      {
        this.popAllElementStyles( idHtml );
        delete this.originalStyles[ idHtml ];
      }
    },

    popAllElementStyles: function( idHtml )
    {
      for( var propName in this.originalStyles[ idHtml ] )
      {    
        YAHOO.util.Dom.setStyle( idHtml, propName, this.originalStyles[ idHtml ][ propName ] );
        delete this.originalStyles[ idHtml ][ propName ];
      }
    },

    startDrag: function(x, y) {
      var dragEl = this.getDragEl();
      var realEl = this.getEl();
      
      dragEl.innerHTML = realEl.innerHTML;
      dragEl.className = realEl.className;

      this.pushStyle( this.getEl().id, "opacity", "0.5" );
      this.pushStyle( this.getDragEl().id, "color", "#000" );
      this.pushStyle( this.getDragEl().id, "border", "0px" );
    },

    endDrag: function(e) {
      this.popAllStyles();
    },

    findNodeByDropId: function( id ) {
      var pathList = id.substring(6).split( "/" );
      var targetNode = csRootNode;
      for( var pathId = 0; pathId < pathList.length; pathId ++ )
      {
        var pathLevel = pathList[ pathId ];
        var siblingsList = targetNode.children;
        for( var siblingId = 0; siblingId < siblingsList.length; siblingId++ )
        { 
          var childNode = siblingsList[ siblingId ];
          if( pathLevel == childNode.data.id[1][0] )
          {
            targetNode = childNode;
          }
        }
      }
      return targetNode;
    },

    isAncestor: function( childNode, ancestorNode )
    {
      parentNode = childNode;
      while( parentNode.getElId() != csRootNode.getElId() )
      {
        if( parentNode.getElId() == ancestorNode.getElId() )
          return true;
        parentNode = parentNode.parent;
      }
      return false;
    },

    deleteThisNodeFromTree: function()
    {
      var parentDragNode = this.config[ 'node' ].parent;
      csTree.removeNode( this.config[ 'node' ] );
      parentDragNode.refresh();
      setDDForBranch( parentDragNode );
    },
    
    insertNodeAfter: function( dropNode )
    {
      YAHOO.log( "Moving " + this.id + " below " + dropNode.data.id[0] );
      var parentDropNode = dropNode.parent;
      var newNode = createTreeNode( parentNode, this.config[ 'node' ].data.id[1] );
      csTree.removeNode( newNode );
      newNode.insertAfter( dropNode );
      parentDropNode.refresh();
      setDDForBranch( parentDropNode );
    },
    
    insertNodeInside: function( dropNode )
    {
      YAHOO.log( "Moving " + this.id + " inside " + dropNode.data.id[0] )
      var newNode = createTreeNode( dropNode, this.config[ 'node' ].data.id[1] );
      dropNode.refresh();
      setDDForBranch( dropNode );
    },

    onDragDrop: function(e, id) {
      var dropNode = this.findNodeByDropId( id );
      //Check that drop is allowed
      if( this.isAncestor( dropNode, this.config[ 'node' ] ) )
      {
        this.popAllStyles();
        alert( "Can't drop node on itself or a child of itself" );
        return false;
      }
        //Drop below this node
      if( id.charAt( 0 ) == "s" && ! this.dragBelowTarget( id ) )
      {
        sendQuery( "moveKeyInside", { 
                      'entry' : this.config[ 'node' ].data.id[0], 
                      'destination' : dropNode.data.id[0],
                      }, 
                      this.serverMoveOK, [ this, 'inside', dropNode ] );
      }
      else
      {
        sendQuery( "moveKeyAfter", { 
                      'entry' : this.config[ 'node' ].data.id[0], 
                      'destination' : dropNode.data.id[0],
                      'mode' : 'after' 
                      }, 
                      this.serverMoveOK, [ this, 'after', dropNode ] );
      }
      this.popAllStyles();
    },

    serverMoveOK : function( respObj )
    {
      var retDict = eval("(" + respObj.responseText + ")");
      var dd = respObj.argument[0]
      var mode = respObj.argument[1];
      var dropNode = respObj.argument[2];
      dd.deleteThisNodeFromTree()
      if( mode == 'after' )
        dd.insertNodeAfter( dropNode );
      else
      {
        if( dropNode.isDynamic() && ! dropNode.dynamicLoadComplete )
        {
          //New section will come from server when expanding
          dropNode.expand()
        }
        else
          dd.insertNodeInside( dropNode );
      }
      updateContextMenuTriggers();
    },

    onDragEnter: function(e, id) {
      this.pushStyle( id, "color", "#030" );
      //this.pushStyle( id, "border-bottom", "2px dotted #003" );
      if( id.charAt( 0 ) == "s" && ! this.dragBelowTarget( id ) )
        this.pushStyle( id, "border-width", "1px" );
      else
        this.pushStyle( id, "border-width", "0px 0px 1px 0px" );
      this.pushStyle( id, "border-style", "dotted" );
      this.pushStyle( id, "border-color", "#004080" );
      this.pushStyle( this.getDragEl().id, "opacity", "0.2" );
    },

    getElementHeight: function( id )
    {
      var elem = YAHOO.util.Dom.get( id );
      if( elem.style.pixelHeight )
        return elem.style.pixelHeight; 
      if( elem.offsetHeight )
        return elem.offsetHeight;
      return YAHOO.util.Dom.getStyle( id, "height" )
    },

    dragBelowTarget: function( id ) 
    {
      var yDragPos = YAHOO.util.Dom.getY( this.getDragEl() );
      var yTargetPos = YAHOO.util.Dom.getY( id );
      var yOffset = yTargetPos - yDragPos;  
      //var yHeight = this.getElementHeight( id );
      //var pPos = ( yOffset * 100 / yHeight );
      //YAHOO.log("pPos " + yOffset);
      return yOffset < 0;
    },

    onDragOver: function(e, id) 
    {
      if( id.charAt( 0 ) == "s" && ! this.dragBelowTarget( id ) )
        YAHOO.util.Dom.setStyle( id, "border-width", "1px" );
      else
        YAHOO.util.Dom.setStyle( id, "border-width", "0px 0px 1px 0px" );
    },

    onDragOut: function(e, id) 
    {
      this.popAllElementStyles( id );
      this.popStyle( this.getDragEl().id, "opacity" );
    }

});

})(); 


function commitConfiguration()
{
  if( window.confirm( "Are you sure you want to commit the configuration?" ) )
  {
    sendQuery( "commitConfiguration", {}, serverCommitConfiguration, [] );  
  }
}

function serverCommitConfiguration( respObj )
{
  var retDict = eval("(" + respObj.responseText + ")");
  if( retDict[ 'OK' ] )
  {
    alert( "Configuration successfully commited" );
    window.location = "resetConfigurationToRemote";
  }
  else
    alert( "Commit failed: " + retDict[ 'Message' ] )
}