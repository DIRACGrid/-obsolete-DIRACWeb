# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />
<%def name="head_tags()">
  <!-- add some head tags here -->
  ${ h.stylesheet_link( "/yui/fonts/fonts-min.css") }
  ${ h.stylesheet_link( "/yui/treeview/assets/skins/sam/treeview.css") }
  ${ h.stylesheet_link( "/yui/tabview/assets/skins/sam/tabview.css") }
  ${ h.stylesheet_link( "/yui/container/assets/skins/sam/container.css") }
  ${ h.stylesheet_link( "/yui/menu/assets/skins/sam/menu.css") }
  ${ h.stylesheet_link( "/yui/button/assets/skins/sam/button.css") }

  ${ h.javascript_link( "/yui/yahoo/yahoo-min.js") }
  ${ h.javascript_link( "/yui/event/event-min.js") }
  ${ h.javascript_link( "/yui/treeview/treeview-min.js") }

  ${ h.javascript_link( "/yui/yahoo-dom-event/yahoo-dom-event.js" ) }
  
  ${ h.javascript_link( "/yui/element/element-beta-min.js") }
  ${ h.javascript_link( "/yui/tabview/tabview-min.js") }
  ${ h.javascript_link( "/yui/dragdrop/dragdrop-min.js") }
  ${ h.javascript_link( "/yui/container/container-min.js") }
  ${ h.javascript_link( "/yui/menu/menu-min.js") }
  ${ h.javascript_link( "/yui/button/button-min.js") }
  ${ h.javascript_link( "/yui/utilities/utilities.js") }
  ${ h.javascript_link( "/yui/json/json-min.js") }
  ${ h.javascript_link( "/yui/connection/connection-min.js") }

  <style>
  	body { margin:0; padding:0; text-align: left; }
  	.yui-skin-sam .yui-dt-liner { white-space:nowrap; }

  	#WFDetailsTable td { padding: 5px 5px 5px 20px; white-space:nowrap; }
  	#UploadWFTable  td { padding: 5px 5px 5px 20px; white-space:nowrap; }
  	#CopyMoveWFTable  td { padding: 5px 5px 5px 20px; white-space:nowrap; }
  	#CopyMoveWFTree  td { padding: 0px 0px 0px 0px; white-space:nowrap; }
  	
  	.yui-button#WfView button,
  	.yui-button#WfEdit button,
  	.yui-button#WfCopy button,
  	.yui-button#WfMove button,
  	.yui-button#WfNew button,
  	.yui-button#WfUpload button,
  	.yui-button#WfDel button { width: 7em;  }
  	
  </style>

${ h.javascript_link( "/javascripts/production/WorkFlowTree.js") }
 
<script type="text/javascript">

<%
import dirac.lib.credentials as credentials
myDN = credentials.getUserDN()
myName = credentials.getUsername()
myGroup = credentials.getSelectedGroup()
%>

DN        = "${ myDN }"
USERNAME  = "${ myName }"
USERGROUP = "${ myGroup }"

function saveLocal(url,jsonstr) {
  	var form = document.getElementById("SaveLocal");
  	document.getElementById("JSONStr").value = jsonstr;
  	form.action = url;
  	form.submit();
}

WMS = new function() {

	this.wflist = new function() {
		this.list = [];

		this.reload = function (force) {
			YAHOO.util.Connect.asyncRequest('GET', 'getWFList'+(force?"?force=1&":""), 
				{	success : WMS.wflist.onSuccess,	failure : WMS.wflist.onFailure	} );
		}		

		this.onSuccess = function ( answer ) {
	  	try {
	    	 var result = YAHOO.lang.JSON.parse(answer.responseText); 
	  	} catch (x) {
	  		WMS.wflist.onFailure();
	  		return;
	  	}
	  	if(!result.OK){
	  		WMS.wflist.onFailure(answer,result.Message);
	  		return;
	  	}
	  	WMS.wflist.list = result.Value;
			WMS.wflist.tree.reGenerate(WMS.wflist.list);	
			WMS.wfdetails.update();
		}

		this.onFailure = function (answer, error ) {
			window.alert(error?error:"Workflows list request has failed.\nProblems with the server...");
		}
		
		this.onTreeClick = function (node) {
			if(!node.data.item)
				return;
			WMS.wflist.tree.hilight(node);
			WMS.wfdetails.update();
		}
		
		this.allCtl = [ "WfView", "WfEdit", "WfCopy", "WfMove", "WfNew", "WfDel", "WfDownload", "WfUpload" ];
		
		this.onWfView = function () {
			if(!WMS.wflist.tree.selectedNode)
				return;
			var item=WMS.wflist.tree.selectedNode.data.item;
			var win = window.open("wfeView/"+item.WFName, "js");
		}
		this.onWfEdit = function () {
			if(!WMS.wflist.tree.selectedNode)
				return;
			var item=WMS.wflist.tree.selectedNode.data.item;
			var win = window.open("wfeEdit/"+item.WFName, "js");
		}

		this.onWfCopy = function () {
			if(!WMS.wflist.tree.selectedNode)
				return;
			var item=WMS.wflist.tree.selectedNode.data.item;
			document.getElementById('CopyMoveWFName').value = WMS.dialogs.CopyMoveWF.tree.pathForWF(item);
			WMS.dialogs.CopyMoveWF.tree.reGenerate(WMS.wflist.list);
			WMS.dialogs.CopyMoveWF.mode = 'copy';	
			WMS.dialogs.CopyMoveWF.show();
		}

		this.onWfMove = function () {
			if(!WMS.wflist.tree.selectedNode)
				return;
			var item=WMS.wflist.tree.selectedNode.data.item;
			document.getElementById('CopyMoveWFName').value = WMS.dialogs.CopyMoveWF.tree.pathForWF(item);
			WMS.dialogs.CopyMoveWF.tree.reGenerate(WMS.wflist.list);	
			WMS.dialogs.CopyMoveWF.mode = 'move';	
			WMS.dialogs.CopyMoveWF.show();
		}
		
		this.onWfNew = function () {
			document.getElementById("NewWFName").value="";
			WMS.dialogs.NewWF.show();
		}

		this.onWfDel = function () {
			if(!WMS.wflist.tree.selectedNode)
				return;
			var item=WMS.wflist.tree.selectedNode.data.item;
			WMS.dialogs.onDelWF(item.WFName);
		}
		
		this.onWfDownload = function () {
			if(!WMS.wflist.tree.selectedNode)
				return;
			var item=WMS.wflist.tree.selectedNode.data.item;
			saveLocal("saveWFLocal/"+item.WFName, "");
		}

		this.onWfUpload = function () {
			document.getElementById("UploadWFName").value="";
			WMS.dialogs.UploadWF.show();
		}
		
		
		this.Init = function() {
			var tv = new YAHOO.widget.TabView('WflTab');
			this.tree = new WFTree('WflTree');
			this.tree.tree.subscribe("labelClick",this.onTreeClick,WMS,true);
			this.reload();
			
			for (var i = 0; i < this.allCtl.length; ++i) {
				var b = new YAHOO.widget.Button(this.allCtl[i]);
				b.on('click',this["on"+this.allCtl[i]],WMS,true);
			}
			//YAHOO.widget.Button.getButton("WfCopy").set("disabled",true);
			//YAHOO.widget.Button.getButton("WfMove").set("disabled",true);
		}
	}
	
	this.wfdetails = new function() {
	
		this.fields = [ "AuthorGroup", "Author", "PublishingTime", "LongDescription",
										"WFName", "AuthorDN", "WFParent", "Description" ];
	
		this.Init = function() {
			var tv = new YAHOO.widget.TabView('WfdTab');
		}

		this.update = function () {
			var wf = {};
			if( WMS.wflist.tree.selectedNode)
				wf=WMS.wflist.tree.selectedNode.data.item;
			for(var i=0;i<this.fields.length;++i)
				document.getElementById(this.fields[i]).value = wf[this.fields[i]]?wf[this.fields[i]]:"";
		}
		
	}

	// Dialogs
	this.dialogs = new function(){
	
		this.Cancel = function(){
			this.hide();
		}

		this.parseResponce = function (answer ) {
	  	try {
	    	 var result = YAHOO.lang.JSON.parse(answer.responseText.replace('<pre>','').replace('</pre>','')); 
	  	} catch (x) {
	  		return { OK:false, Message:"" };
	  	}
	  	return result;
		}

		this.onNewSuccess = function ( answer ) {
	  	result = WMS.dialogs.parseResponce(answer);
	  	if(!result.OK){
	  		WMS.dialogs.onNewFailure(answer,result.Message);
	  		return;
	  	}
	  	WMS.dialogs.NewWF.hide();
	  	WMS.wflist.reload(true);
		}
		
		this.onNewFailure = function (answer, error ) {
			window.alert(error?error:"Workflow creation has failes.\nSome problems with the server...");
		}

		this.onDelSuccess = function ( answer ) {
	  	result = WMS.dialogs.parseResponce(answer);
	  	if(!result.OK){
	  		WMS.dialogs.onDelFailure(answer,result.Message);
	  		return;
	  	}
	  	WMS.wflist.reload(true);
		}
		
		this.onDelFailure = function (answer, error ) {
			window.alert(error?error:"Workflow deletion has failes.\nSome problems with the server...");
		}
		
		this.onNewWFApply = function(){
			YAHOO.util.Connect.asyncRequest('GET', 'newWF?name='+document.getElementById("NewWFName").value+'&type=&', 
				{	success : WMS.dialogs.onNewSuccess,	failure : WMS.dialogs.onNewFailure	} );
		}

		this.onDelWF = function( name ){
			if ( !window.confirm("Are you sure?"))
				return;
			YAHOO.util.Connect.asyncRequest('GET', 'delWF?name='+name+'&', 
				{	success : WMS.dialogs.onDelSuccess,	failure : WMS.dialogs.onDelFailure	} );
		}

		this.onUploadWFUpload = function (answer ) {
	  	result = WMS.dialogs.parseResponce(answer);
	  	if(!result.OK){
				window.alert(result.Message?result.Message:"Workflow upload has failes.\nSome problems with the server...");
	  		return;
	  	}
	  	WMS.dialogs.UploadWF.hide();
	  	WMS.wflist.reload(true);
		}

		this.onUploadWFApply = function() {
			YAHOO.util.Connect.setForm('UploadWFForm', true, true);
			YAHOO.util.Connect.asyncRequest('POST', "uploadWF", {	upload : WMS.dialogs.onUploadWFUpload	} );			
		}

		this.onCopyMoveWFTreeClick = function (node) {
			WMS.dialogs.CopyMoveWF.tree.hilight(node);
			var cname = document.getElementById('CopyMoveWFName').value.split('/');
			cname = cname[cname.length-1];
			if(!cname)
				cname = WMS.wflist.tree.selectedNode.data.item.WFName;
			if(node.label!=cname)
				cname = node.label + '/' + cname;
			node = node.parent;
			while(node != WMS.dialogs.CopyMoveWF.tree.tree.getRoot()) {
				cname = node.label + '/' + cname;
				node = node.parent;
			}
			document.getElementById('CopyMoveWFName').value = cname;
		}

		this.onCopyMoveWFSuccess = function ( answer ) {
	  	result = WMS.dialogs.parseResponce(answer);
	  	if(!result.OK){
	  		WMS.dialogs.onCopyMoveWFFailure(answer,result.Message);
	  		return;
	  	}
	  	WMS.wflist.reload(true);
	  	WMS.dialogs.CopyMoveWF.hide();
		}
		
		this.onCopyMoveWFFailure = function (answer, error ) {
			window.alert(error?error:"Workflow moving has failes.\nSome problems with the server...");
		}

		this.onCopyMoveWFApply = function(){
			var cname = document.getElementById('CopyMoveWFName').value.split('/');
			if(!cname.length || !cname[cname.length-1]){
				window.alert("You have to provide at least not empty name.");
				return;
			}
			var path='';
			for(var i=0;i<cname.length-1;++i)
				if(cname[i]){
					if(path)
						path = path+'/'+cname[i];
					else
						path = cname[i];
				}
			cname = cname[cname.length-1];
			var req = { Name: WMS.wflist.tree.selectedNode.data.item.WFName,
								  NewName: cname,
								  Path: path };
			reqjs = YAHOO.lang.JSON.stringify(req).replace(/;/g,'\\u003B');
			
			if(WMS.dialogs.CopyMoveWF.mode == 'move')
				YAHOO.util.Connect.asyncRequest('POST', 'moveWF', 
					{	success : WMS.dialogs.onCopyMoveWFSuccess,	failure : WMS.dialogs.onCopyMoveWFFailure	}, 
					"JSONStr="+reqjs );
			else
				YAHOO.util.Connect.asyncRequest('POST', 'copyWF', 
					{	success : WMS.dialogs.onCopyMoveWFSuccess,	failure : WMS.dialogs.onCopyMoveWFFailure	}, 
					"JSONStr="+reqjs );			
		}

		this.Init = function(){
			var Names = ["NewWF","UploadWF", "CopyMoveWF"];
			for (var i=0;i<Names.length;++i) {
				var name = Names[i];
				this[name] = new YAHOO.widget.Dialog(name + 'Dlg', {
					fixedcenter: true,
					visible: false,
					draggable: true,
					modal: true,
					constraintoviewport: true,
					buttons: [{
						text: "Apply",
						handler: this["on" + name + "Apply"],
						isDefault: true
					}, {
						text: "Cancel",
						handler: this.Cancel
					}]
				});
				this[name].render();
			}
			
			this.CopyMoveWF.tree = new WFTree('CopyMoveWFTree');
			this.CopyMoveWF.tree.tree.subscribe("labelClick",this.onCopyMoveWFTreeClick,WMS,true);
			this.CopyMoveWF.mode = 'copy';
		}
	}
	
	this.Init = function() {
		this.wflist.Init();
		this.wfdetails.Init();
		this.dialogs.Init();
	}
};

  YAHOO.util.Event.onDOMReady(WMS.Init,WMS,true);
  
</script>
  
</%def>

<table id="WmsTable" width="100%" border="0" > <tr>
	<td width="30%" style="padding: 5px 5px 5px 20px;" valign="top"><div id="WflTab" class="yui-navset">
    		<ul class="yui-nav">
        		<li class="selected"><a href="#tab1" onclick=WMS.wflist.reload(true) title="Reload list of workflows"><em>Workflows (reload)</em></a></li>
    		</ul>          
    		<div class="yui-content">
        		<div id="tab1"><table border=0>
    				<tr><td rowspan="8" width="100%" style="width:100%" valign="top"><div id="WflTree"></div></td>
				 		<td style="vertical-align:top;"><input type="button" style="width:100%;" id="WfView" name="WfView" title="View the workflow" value="View"></td>
						</tr>
				 		<tr><td><input type="button" id="WfEdit" title="Edit selected workflow"     value="Edit"/></td></tr>
				 		<tr><td><input type="button" id="WfCopy" title="Copy selected workflow"     value="Copy"/></td></tr>
				 		<tr><td><input type="button" id="WfMove" title="Move selected workflow to different folder"     value="Move"/></td></tr>
				 		<tr><td><input type="button" style="width:100%"  id="WfDownload" title="Download selected workflow" value="Download"/></td></tr>
				 		<tr><td><input type="button" id="WfUpload" title="Upload workflow from local file" value="Upload"/></td></tr>
				 		<tr><td style="padding-top: 10px;"><input type="button" id="WfNew" title="Make (empty) workflow"     value="New"/></td></tr>
				 		<tr><td><input type="button" style="width:100%"  id="WfDel" title="Delete selected workflow" value="Delete"/></td></tr>
				</table></div>
    		</div>
		</div>
	</td><td width="70%" style="padding: 5px 20px 5px 5px;" valign="top"><div id="WfdTab" class="yui-navset">
    		<ul class="yui-nav">
        		<li class="selected"><a href="#tab1"><em>Selected workflow</em></a></li>
    		</ul>          
    		<div class="yui-content">
        		<div id="tab1"><table width="100%" border="0" id="WFDetailsTable" >
							<tr id="WFNameRow">
								<td style="text-align: right; padding-right: 10px;" > Name </td>
								<td style="padding-right: 10px; width: 100%">
									<input name="WFName" id="WFName" readonly="true" style="width: 100%;"></td>
							</tr>
							<tr id="DescriptionRow">
								<td style="text-align: right; padding-right: 10px;" > Short description </td>
								<td style="padding-right: 10px; width: 100%">
									<input name="Description" id="Description" readonly="true" style="width: 100%;"></td>
							</tr>
							<tr id="AuthorRow">
								<td style="text-align: right; padding-right: 10px;" > Author </td>
								<td style="padding-right: 10px; width: 100%">
									<input name="Author" id="Author" readonly="true" style="width: 100%;"></td>
							</tr>
							<tr id="PublishingTimeRow">
								<td style="text-align: right; padding-right: 10px;" > Last modified </td>
								<td style="padding-right: 10px; width: 100%">
									<input name="PublishingTime" id="PublishingTime" readonly="true" style="width: 100%;"></td>
							</tr>
							<tr id="WFParentRow">
								<td style="text-align: right; padding-right: 10px;" > Path </td>
								<td style="padding-right: 10px; width: 100%">
									<input name="WFParent" id="WFParent" readonly="true" style="width: 100%;"></td>
							</tr>
							<tr id="LongDescriptionRow">
								<td style="text-align: right; padding-right: 10px;" > Description </td>
								<td style="padding-right: 10px; width: 100%">
									<textarea name="LongDescription" id="LongDescription" readonly="true" style="width: 100%;">
									</textarea></td>
							</tr>
							<tr id="AuthorGroupRow" style="display:none;">
								<td style="text-align: right; padding-right: 10px;" > Author group</td>
								<td style="padding-right: 10px; width: 100%">
									<input name="AuthorGroup" id="AuthorGroup" readonly="true" style="width: 100%;"></td>
							</tr>
							<tr id="AuthorDNRow" style="display:none;">
								<td style="text-align: right; padding-right: 10px;" > DN </td>
								<td style="padding-right: 10px; width: 100%">
									<input name="AuthorDN" id="AuthorDN" readonly="true" style="width: 100%;"></td>
							</tr>
						</table></div>
    		</div>
		</div>
	</td>
</tr></table>

<div id="NewWFDlg">
<div class="hd">Please enter new workflow name</div>
<div class="bd">
	<table border="0" id="NewWFTable">
		<tr>
			<td style="text-align: right;">Name:</td>
			<td> <input name="NewWFName" id="NewWFName" type="text" size="64"></td>
		</tr>
	</table>
	<hr>
</div>
</div>

<div id="UploadWFDlg">
<div class="hd">Please select workflow source</div>
<div class="bd">
	<form action="uploadWF" enctype="multipart/form-data" method="post" id="UploadWFForm">
	<table border="0" id="UploadWFTable">
		<tr>
			<td style="text-align: right;">Name (leave blank to keep original one):</td>
			<td> <input name="UploadWFName" id="UploadWFName" type="text" size="32"></td>
		</tr>
		<tr>
			<td style="text-align: right;">XML file name (python is not supported!):</td>
  		<td> <input type="file" name="UploadWFFile" /> </td>
		</tr>
	</table>
	</form>
	<hr>
</div>
</div>

<div id="CopyMoveWFDlg">
<div class="hd">Please select destination</div>
<div class="bd">
	<table border="0" id="CopyMoveWFTable">
		<tr>
			<td style="text-align: right;">Path:</td>
  		<td ><div id="CopyMoveWFTree"></div>
		</tr>
		<tr>
			<td style="text-align: right;">Path/Name:</td>
			<td> <input name="CopyMoveWFName" id="CopyMoveWFName" type="text" size="32"></td>
		</tr>
	</table>
	<hr>
</div>
</div>


<FORM id="SaveLocal" action="" method="POST" style="display:none;">
<input type="hidden" id="JSONStr" name="JSONStr">
</FORM>
