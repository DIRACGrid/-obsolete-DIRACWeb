# -*- coding: utf-8 -*-

<%def name="head_tags()">
${ h.stylesheet_link_tag( "/yui/treeview/assets/skins/sam/treeview.css" ) }
${ h.stylesheet_link_tag( "/yui/logger/assets/skins/sam/logger.css" ) }
${ h.stylesheet_link_tag( "/yui/container/assets/skins/sam/container.css" ) }
${ h.javascript_include_tag( "/yui/treeview/treeview-min.js" ) }
${ h.javascript_include_tag( "/yui/connection/connection-min.js" ) }
${ h.javascript_include_tag( "/yui/dragdrop/dragdrop-min.js" ) }
${ h.javascript_include_tag( "/yui/container/container-min.js" ) }
${ h.javascript_include_tag( "/yui/logger/logger-min.js" ) }
${ h.javascript_include_tag( "systems/configuration/cfgTree.js" ) }
<script>
 var csTree;
 /*Generate the tree */
 function treeInit() {
  yuiLogger = new YAHOO.widget.LogReader();
  YAHOO.widget.Logger.enableBrowserConsole();
  yuiLogger.thresholdMax = 100;
  yuiLogger.hide();
  csTree = new YAHOO.widget.TreeView( "treeContainer" );
  nodeDef = { label : "<span class='sectionNode'>${c.csName}</span>", id : [ "/", [ "/", "" ] ] };
  var startNode = new YAHOO.widget.TextNode( nodeDef, csTree.getRoot(), false);
  startNode.setDynamicLoad( loadNodeData, 1 );
  csTree.subscribe( "labelClick", editOption );
  csTree.draw();

  initTreeMagic( "treeContainer", startNode );

  startNode.expand();
 }
 /* Show time! */
 YAHOO.util.Event.onContentReady( 'treeContainer', treeInit );
</script>
<style>
span.sectionNode {
  font-weight : bold;
}
div#treeContainer {
	padding : 20px;
}
.howto {
	text-align : left;
	margin : 1em 0px;
	list-style-type: square;
	font-size : small;
}
.howto em {
	font-weight : bold;
}
</style>
</%def>

<%def name="treeAnchor()">
   <div id='treeContainer'>
   </div>
   <p class='howto'>
   To reorder sections and options just drag and drop. You can drop inside sections and below sections and options.
   All modification options are in contextual menus.
   </p>
   <p class='howto'>There are two ways for modifying an option:</p>
   <ul class='howto'>
    <li><em>Contextual menu -> Edit value:</em> Will open a new window where each line is an entry</li>
    <li><em>Click on value:</em> Fast edit of option value.</li>
   </ul>
   <p class='howto'><em>Please Note:</em> Opera users will need to do the following to open the contextual menus:</p>
   <ul class='howto'>
    <li><em>Opera for Windows:</em> Hold down the control key and click with the left mouse button.</li>
    <li><em>Opera for OS X:</em> Hold down the command key (&#8984;) and click with the left mouse button.</li>
   </ul>
   <div id='commentDialog'>
    <div class="hd">Insert comment</div>
    <div class="bd">
     <form>
      <textarea name='textValue' style='width:90%;height:90%;' rows='5'>comment</textarea>
     </form>
    </div>
   </div>
   <div id='valueDialog'>
    <div class="hd">Insert value for option</div>
    <div class="bd">
     <form>
      <textarea name='textValue' style='width:90%;height:90%;' rows='20'>value</textarea>
     </form>
     Each line will be separated by commas in the final value
    </div>
   </div>

</%def>
