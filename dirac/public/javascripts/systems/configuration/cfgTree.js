
var sectionNodesMap = {};
var optionNodesMap = {};
var selectedTextNode;
var sectionContextMenu;
var optionContextMenu;

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
                                                          { text: "Add subsection", onclick: { fn: dummy } },
                                                          { text: "Add option", onclick: { fn: dummy } },
                                                          { text: "Rename section", onclick: { fn: dummy } },
                                                          { text: "Delete section", onclick: { fn: dummy } },
                                                         ]
                                                        }
                                                       );
  sectionContextMenu.triggerContextMenuEvent.subscribe( findContextMenuNode, sectionNodesMap );
  sectionContextMenu.render( treeName );
  optionContextMenu = new YAHOO.widget.ContextMenu( "optionContextMenuId", 
                                                       { 
                                                        trigger : [],
                                                        itemdata : [
                                                         { text: "Edit value", onclick: { fn: dummy } },
                                                         { text: "Rename option", onclick: { fn: dummy } },
                                                         { text: "Delete option", onclick: { fn: dummy } }
                                                        ]
                                                       }
                                                     );
                                                        
  optionContextMenu.triggerContextMenuEvent.subscribe( findContextMenuNode, optionNodesMap );
  optionContextMenu.render( treeName );
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

function createTreeNode( parentNode, csObject )
{
  var nodeLabel;
  var csPath = parentNode.data.id[0] + "/" + csObject[0];  
  if( csObject.length == 2)
  {
    //Section
    nodeLabel = "<span id='sdd-" + csPath + "'>" + csObject[0] + "</span>";
  }
  else
  {
    //option
    nodeLabel = "<span id='odd-" + csPath + "'>" + csObject[0] + " = " + csObject[1] + "</span>"; 
  }
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

/*Modify option value*/
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
  sendQuery( "setOptionValue", { 'path' : node.data.id[0], 'value' : optionValue }, setOptionOK, [ e, node, optionValue ] );
}

/* Commit option value change */
function setOptionOK ( respObj )
{
  var returnObject = eval("(" + respObj.responseText + ")");
  var node = respObj.argument[1];
  if ( returnObject[ 'OK' ] )
  {
    node.data.id[1][1] = respObj.argument[2];
  }
  else
  {
    alert( "Failed to set value : " + returnObject[ 'Message' ] );
  }
  blurOption( respObj.argument[0], node );
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
    success : successCallback,
    failure : failedRemoteQuery,
    timeout : 5000,
    argument : callbackArgs
  }
  var transaction = YAHOO.util.Connect.asyncRequest( 'POST' , action , callbackObj, postArgs );
}
/* AJAX FAILED REMOTE QUERY */
function failedRemoteQuery( respObj )
{
  alert( "Failed " + respObj.argument[ 'action' ] );
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
      //var parentDragNode = this.config[ 'node' ].parent;
      var newNode = createTreeNode( parentNode, this.config[ 'node' ].data.id[1] );
      //csTree.removeNode( this.config[ 'node' ] );
      csTree.removeNode( newNode );
      newNode.insertAfter( dropNode );
      parentDropNode.refresh();
      //parentDragNode.refresh();
      setDDForBranch( parentDropNode );
      //setDDForBranch( parentDragNode );
    },
    
    insertNodeInside: function( dropNode )
    {
      YAHOO.log( "Moving " + this.id + " inside " + dropNode.data.id[0] )
      var parentDragNode = this.config[ 'node' ].parent;
      var newNode = createTreeNode( dropNode, this.config[ 'node' ].data.id[1] );
      csTree.removeNode( this.config[ 'node' ] );
      dropNode.refresh();
      parentDragNode.refresh();
      setDDForBranch( dropNode );
      setDDForBranch( parentDragNode );
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
