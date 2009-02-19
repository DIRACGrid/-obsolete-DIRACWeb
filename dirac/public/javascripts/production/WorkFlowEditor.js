function saveLocal(url,jsonstr) {
  	var form = document.getElementById("SaveLocal");
  	document.getElementById("JSONStr").value = jsonstr;
  	form.action = url;
  	form.submit();
}

/*
 * All onXXX handlers have "this" set to wfe (except dialogs.Cancel and several other...)
 */
var WFE = new function(){
	// Utilities
	this.util = new function() {
		/* Not the best solution may be... ? */
		this.noInTreeParent = function(node){ //unused
			var parent = node.parent;
			for (var i=0;i<parent.children.length;++i) 
				if (parent.children[i] == node) 
					return i;
			return -1
		}

		this.setInputRW = function(e, editable){
			if (editable) {
				e.readOnly = false;
				e.style.color = "black";
				e.style.border = "";
			} else {
				e.readOnly = true;
				e.style.color = "blue";
				e.style.border = "none";			
			}
		}
		this.addOption = function (sel,text,value){
			var e = document.createElement("option");
			e.text = text;
			e.value = value;
			sel.add(e,null);
		}

		this.selectFill = function (sel, value, vlist, idlist) {
			sel.length = 0;
			var i_select = -1;
			for(var i=0;i<vlist.length;++i){
				var id=idlist?idlist[i]:vlist[i];
				if(value == id)
					i_select = i;
				this.addOption(sel,vlist[i],id);
			}
			if(i_select < 0 && value != undefined){
				i_select = vlist.length;
				this.addOption(sel,value,value);
			} else if(i_select < 0)
				i_select = 0;
			sel.selectedIndex = i_select;
		}
	}

	this.toString = function () { return "WorkFlow Editor";	}
	
	// Editor mode
	this.mode = "expert";
	
	this.setMode = function(mode){
		this.mode = mode;
		this.info.applyMode(mode);
		this.param.applyMode(mode);
		this.topmenu.applyMode(mode);
		this.navigation.applyMode(mode);
	}
	
	// Navigation
	this.navigation = new function(){
		this.expertCtl = [ "StUp","StRem","StDown","ModUp","StDel","ModDown","ModDel","ModImp" ];

		this.onStUp = function( ev, wfe, checkValid ) {
			var it = this.navigation.getSelected();
			if(checkValid)
				return !it.isKlass && !it.isTopLevel() && it!=it.parent.obj[0];
			if(!it.parent.moveUp(it))
				return;
			var node = this.navigation.selectedNode;
			var prev = node.previousSibling
			prev.tree.popNode(node);
			node.insertBefore(prev);
			node.tree.draw();
			this.navigation.onTreeClick.call(WFE,node);
		}
		this.onStRem = function( ev, wfe, checkValid ) {
			var it = this.navigation.getSelected();
			if(checkValid)
				return (!it.isExe() && !it.isTopLevel()) || it.isExe();
			if(CEO.remove(it)){
				this.info.changed = false;
				var tree = this.navigation.selectedNode.tree; 
				tree.removeNode(this.navigation.selectedNode,true);
				tree.draw();
				this.navigation.selectedNode = null;
				this.navigation.onTreeClick.call(WFE);
			}			
		}
		this.onStDown = function( ev, wfe, checkValid ) {
			var it = this.navigation.getSelected();
			if(checkValid)
				return !it.isKlass && !it.isTopLevel() && it!=it.parent.obj[it.parent.obj.length-1];			
			if(!it.parent.moveDown(it))
				return;
			var node = this.navigation.selectedNode;
			var next = node.nextSibling
			node.tree.popNode(next);
			next.insertBefore(node);
			node.tree.draw();
			this.navigation.onTreeClick.call(WFE,node);
		}
		this.onModUp = this.onStUp;
		this.onStDel = this.onStRem;
		this.onModDown = this.onStDown;
		this.onModDel = this.onStRem;
		
		this.onModImp = function ( ev, wfe, checkValid ) {
			if(checkValid)
				return true;
			this.dialogs.ModImportShow();
		}
		
		this.selectedNode = null;
		this.lastNewNode  = null;

		this.getSelected = function (){
			if(!this.selectedNode)
				return null;
			return this.selectedNode.data.item;
		}

		this.TreeNames = ["WfTree","StepsTree","ModulesTree" ];

		this.addNode = function ( newnode ) {
			this.lastNewNode.tree.popNode(newnode);
			newnode.insertBefore(this.lastNewNode);
			this.lastNewNode.tree.draw();
			this.applyMode(WFE.mode);
			this.onTreeClick.call(WFE,newnode);
		}
		
		this.newItem = function (node) {
			this.lastNewNode = node;
			if (!node.parent.data) {
				var kdict = {Type:CEO.getFreeKlassType('NewStep'), Required:"", Version:"0.0" };
				if(node.tree == this.ModulesTree){
					kdict.Type = CEO.getFreeKlassType('NewModule');
					kdict.Body = "";
				}
				CEO.addKlass(kdict);
				this.addNode(new YAHOO.widget.TextNode({label: kdict.Type, href: "#", item: CEO.klass[kdict.Type] }, node.parent, true) );
			} else {
				var itname = node.parent.data.item.isTopLevel()?"Step":"Module"
				var tlist = CEO.getWFTreeList(itname+"sTree");
				if(!tlist.length){
					CEO.warn("You don't have "+itname+" definition(s).");
					return;
				}
				document.getElementById("NewObjName").value="New"+itname;
				var type_e = document.getElementById("NewObjType");
				var nlist = [];
				for(var i=0;i<tlist.length;++i)
					nlist.push(tlist[i].Label());
				WFE.util.selectFill(type_e,nlist[0],nlist);
				WFE.dialogs.NewObj.show();
			}
		}
		
		this.ctlNodes = { WfTree: ['', 'Append step'],StepsTree: ['New step', 'Append module'],ModulesTree: ['New module']};
		this.onTreeClick = function (node,force) {
			this.info.checkChanges();
			if(node && node.data.item == undefined ){
				this.navigation.newItem ( node );
				return;
			}
			this.navigation.hilight(node);
			this.info.update(force);
			this.param.update(force);
		}
		
		// AZ: is there better way for this?
		this.unHilight = function ( fromHilight){
			if (this.selectedNode) {
				WFE.info.checkChanges();
				this.selectedNode.getLabelEl().style.backgroundColor = "";
				this.selectedNode.getLabelEl().style.color = "";
				if (fromHilight) 
					return;
			}
			this.selectedNode = null;
			for(var i=0;i<this.expertCtl.length;++i)
				YAHOO.widget.Button.getButton(this.expertCtl[i]).set("disabled",(this.expertCtl[i]=='ModImp')?false:true);
		}

		this.hilight = function (node){
			this.unHilight(node);
			this.selectedNode = node?node:null;
			if(!node)
				return;
			node.getLabelEl().style.backgroundColor="blue";
			node.getLabelEl().style.color="white";
			for (var i = 0; i < this.expertCtl.length; ++i)
				YAHOO.widget.Button.getButton(this.expertCtl[i]).set("disabled", 
											!(this["on" + this.expertCtl[i]].call(WFE, null, null, true)));
		}
		
		this.selectWF = function (){
			var node = this.WfTree.getRoot().children[0];
			this.onTreeClick.call(WFE,node);
		}
		
		this.onWfComponentsChange = function(){
			this.navigation.onTreeClick.call(WFE);
		}
		
		this.removeCtlNodes = function (tree,root){
			var result = false;
			for(var i=0;i<root.children.length;++i){
				if (root.children[i].data.item == undefined) {
					tree.removeNode(root.children[i]);
					result = true;
				} else 
					result = this.removeCtlNodes(tree,root.children[i]) || result;
			}
			return result;
		}

		this.appendCtlNodes = function (tree,root,ctlnames) {
			if(!ctlnames)
				return false;
			var result = false;
			if (!root.children.length || root.children[root.children.length - 1].data.item != undefined) {
				if(ctlnames[0]){
					new YAHOO.widget.TextNode({label: "&lt;"+ctlnames[0]+"&gt;", href: "#"}, root, false);
					result = true;
				} 
			}
			if(ctlnames.length < 2)
				return result;
			for(var i=0;i<root.children.length;++i)
				if(root.children[i].data.item != undefined)
					result = this.appendCtlNodes(tree,root.children[i],ctlnames.slice(1)) || result;
			return result;
		}
		
		this.applyMode = function(mode){
			for (var i = 0; i < this.expertCtl.length; ++i) 
				document.getElementById(this.expertCtl[i]).style.display = (mode == "expert") ? "" : "none";
			for (var i = 0; i < this.TreeNames.length; ++i) {
				var tname = this.TreeNames[i];
				var tree = this[tname];
				if (WFE.mode != 'expert') {
					if (this.removeCtlNodes(tree, tree.getRoot())) 
						tree.draw();
				}
				else {
					if (this.appendCtlNodes(tree, tree.getRoot(), this.ctlNodes[tname])) 
						tree.draw();
				}
			}
			if(this.selectedNode)
				this.onTreeClick.call(WFE,this.selectedNode);
		}
		
		this.Init = function(){
			var tv = new YAHOO.widget.TabView('WfComponents');
			tv.subscribe("activeTabChange", this.onWfComponentsChange, WFE, true);
			tv.set("disabled", true);
			for(var i=0;i<this.TreeNames.length;++i){
				var name = this.TreeNames[i];
				this[name] = new YAHOO.widget.TreeView(name);
				var tlist = CEO.getWFTreeList(name);
				var expand = tlist.length == 1;
				for(var j=0;j<tlist.length;++j) {
					var item = tlist[j];
					var node_obj = { label:item.Label(), href:"#", item:item };
					var node = new YAHOO.widget.TextNode(node_obj,this[name].getRoot(),expand);
					var slist = CEO.getWFTreeList(name,item);
					for (var k = 0; k < slist.length; ++k) {
						var sitem = slist[k];
						var snode_obj = { label: sitem.Label(), href: "#", item: sitem };
						var snode = new YAHOO.widget.TextNode(snode_obj, node, false);
					}
				}
				this[name].subscribe("labelClick",this.onTreeClick,WFE,true);
				this[name].draw();
			}
			for (var i = 0; i < this.expertCtl.length; ++i) {
				var b = new YAHOO.widget.Button(this.expertCtl[i]);
				b.on('click',this["on"+this.expertCtl[i]],WFE,true);
			}
		}
	}
	
	// Information area
	this.info = new function() {
		this.infoIds = [ "Name", "Type", "DescrShort", "Description", "Origin", "Version", "Required", "Body" ];
		this.expertCtl = [ "InfoCommit1", "InfoCancel1", "InfoCommit2", "InfoCancel2" ];
		
		this.onInfoCommit1 = function () {
			if(!this.info.applyChanges())
				return;
			this.info.changed = false;
			this.info.enableCtl(false);
			this.navigation.hilight(this.navigation.selectedNode);
			this.info.update(true);
			this.param.update(true);
		}
		this.onInfoCommit2 = this.onInfoCommit1;
		this.onInfoCancel1 = function () {
			this.info.changed = false;
			this.info.enableCtl(false);
			this.info.update(true);
		}
		this.onInfoCancel2 = this.onInfoCancel1;

		this.enableCtl = function (enable) {
			for(var i=0;i<this.expertCtl.length;++i)
				YAHOO.widget.Button.getButton(this.expertCtl[i]).set("disabled",!enable);
		}

		this.changed = false;

		this.onChange = function () {
			if(this.changed)
				return;
			this.changed = true;
			this.enableCtl(true); 
		}

		this.applyChanges = function () {
			var it = this.getIt();
			var cdict = {};
			for (var i = 0; i < this.infoIds.length; i++) {
				var id = this.infoIds[i];
				if(!it || it[id] == undefined)
					continue;
				if((it.isKlass || id!='Type') && (!it.isTopLevel() || id!='Name')){
					var value = YAHOO.lang.trim(document.getElementById("Info" + id).value);
					if(it[id] != value)
						cdict[id] = value; 
				}
			}
			if (cdict) {
				var result;
				var old_label = it.Label();
				if (it.isTopLevel()) 
					result =  CEO.topLevel.update(cdict) && CEO.topLevel.getKlass().update(cdict);
				else
					result = it.update(cdict);
				if(old_label != it.Label()){
					WFE.navigation.selectedNode.label = it.Label();
					WFE.navigation.selectedNode.tree.draw();
				}
				return result;
			}
			return true;
		}

		this.checkChanges = function () {
			if(!this.changed)
				return;
			if(window.confirm("Some attributes are modified.\nSave changes?"))
				this.applyChanges();
			this.changed = false;
			this.enableCtl(false);
		}
		
		this.lastMode = "invalid";
		this.lastObj  = "invalid"
		
		this.getIt = function(){
			var it = WFE.navigation.getSelected();
			if(it && it.isTopLevel()) { // we have to combine class with object ... 
				it = it.getKlass().clone();
				it.isKlass = false;
				it.Name = CEO.topLevel.Name;
			}
			return it;			
		}
		
		this.update = function(force){
			if(!force && WFE.mode == this.last_mode && WFE.navigation.getSelected == this.lastObj)
				return;
			var can_edit = WFE.mode == "expert";
			var it = this.getIt();
			document.getElementById("InfoHelpRow").style.display = it ? "none" : "";
			document.getElementById("InfoBodyHelpRow").style.display = (it && it.isKlass && it.isExe()) ? "none" : "";
			document.getElementById("InfoCtrl2").style.display = (it && it.isKlass && it.isExe()) ? "" : "none";
			for (var i = 0; i < this.infoIds.length; i++) {
				var id = this.infoIds[i];
				document.getElementById("Info" + id + "Row").style.display = (!it || it[id] == undefined)?"none":"";
				if(!it || it[id] == undefined)
					continue;
				var e = document.getElementById("Info" + id);
				document.getElementById("Info" + id + "Row").style.display = "";
				e.value = it[id];
				WFE.util.setInputRW(e,can_edit && ((it.isKlass || id!='Type') && (!it.isTopLevel() || id!='Name')));
			}
		}

		this.applyMode = function(mode){
			this.checkChanges();
			for (var i = 0; i < this.expertCtl.length; ++i) 
				document.getElementById(this.expertCtl[i]).style.display = (mode == "expert") ? "" : "none";
		}
		
		this.Init = function() {
			new YAHOO.widget.TabView('WfProperties');			
			for (var i = 0; i < this.expertCtl.length; ++i) {
				var b = new YAHOO.widget.Button(this.expertCtl[i]);
				b.on('click',this["on"+this.expertCtl[i]],WFE,true);
			}
		}
	}
	
	// Parameters area
	this.param = new function(){
		this.expertCtl = [ "ParDel", "ParConf", "ParAdd" ];
		this.userCtl = [ "ParEdit" ];;
		this.allCtl = this.expertCtl.concat(this.userCtl);

		this.getSelectedName = function () {
			var srow = this.table.getSelectedRows();
			if(!srow.length)
				return null;
			var record = this.table.getRecordSet().getRecord(srow[0]);
			var data = record._oData;
			if(!data)
				return null;
			return data.Name;
		}


		this.onParDel = function(){
			var it = this.navigation.getSelected();
			var parname = this.param.getSelectedName();
			if (!it || !parname) 
				return;
			if(it.isTopLevel() && !it.isKlass)
				it = it.getKlass();
			if (it.removeParameter(parname)) 
				this.param.update(true);
		}

		this.lastLType = null;
		this.lastName  = null;

		this.onParCfgNameChange = function(){
			var it = this.navigation.getSelected();
			var curparname = document.getElementById("ParCfgName").value;
			var parvalue = document.getElementById("ParCfgLP").value;
			if(it.defParLinkName(this.param.lastLType,this.param.lastName) == parvalue)
				document.getElementById("ParCfgLP").value = it.defParLinkName(this.param.lastLtype,curparname);
			this.param.lastName = curparname;
		}
		
		this.onParCfgLMChange = function () {
			var it = this.navigation.getSelected();
			var parname = this.param.getSelectedName();
			if( it && it.isTopLevel() && !it.isKlass)
				it =it.getKlass();
			var par = null;
			if (parname) 
				par = it.parameters[parname];
			var nename = document.getElementById("ParCfgLM").value;
			var i=0;
			for(;i<it.parent.obj;++i)
				if(it.parent.obj[i].Name == nename)
					break;
			var ne = it.parent.obj[i];
			var neparname = par?(par.LinkedParameter?par.LinkedParameter:par.Name):undefined;
			if(neparname!=undefined && ne.parameters[neparname] == undefined)
				neparname = undefined;
			WFE.util.selectFill(document.getElementById("ParCfgLPD"),neparname,ne.parNames());
		}

		this.onParCfgLTChange = function () {
			var it = this.navigation.getSelected();
			var parname = this.param.getSelectedName();
			if( it && it.isTopLevel() && !it.isKlass)
				it =it.getKlass();
			var ltype_e = document.getElementById("ParCfgLT");
			if(!it.WFLTypes().length) {
				document.getElementById("ParCfgLMRow").style.display = "none";
				document.getElementById("ParCfgLPRow").style.display = "none";
				document.getElementById("ParCfgLPDRow").style.display = "none";
				return;
			}
			var ltype = ltype_e.value;
			var parvalue = document.getElementById("ParCfgLP").value;
			var curparname = document.getElementById("ParCfgName").value;
			if(it.defParLinkName(this.param.lastLType,curparname) == parvalue)
				document.getElementById("ParCfgLP").value = it.defParLinkName(ltype,curparname);
			if(ltype == "Ne") {
				document.getElementById("ParCfgLMRow").style.display = "";
				document.getElementById("ParCfgLPRow").style.display = "none";
				document.getElementById("ParCfgLPDRow").style.display = "";
				this.param.onParCfgLMChange.call(WFE);				
			} else {
				document.getElementById("ParCfgLMRow").style.display = "none";
				document.getElementById("ParCfgLPRow").style.display = ltype?"":"none";
				document.getElementById("ParCfgLPDRow").style.display = "none";				
			}
			this.param.lastLType = ltype;
		}

		this.setupParCfgLink = function ( ) {			
			var it = WFE.navigation.getSelected();
			var parname = this.getSelectedName();
			if( it && it.isTopLevel() && !it.isKlass)
				it =it.getKlass();
			var par = null;
			if (parname) 
				par = it.parameters[parname];
				
			var ltype_e = document.getElementById("ParCfgLT");
			var lmodule_e = document.getElementById("ParCfgLM");

			var lmodule=it.getPrevNeighboursNames();
			this.lastLType=it.LType(par);
			var lmodule_value = this.lastLType=="Ne"?par.LinkedModule:undefined;
			var ltype=it.WFLTypes();
			if(lmodule.length)
				WFE.util.selectFill(lmodule_e,lmodule_value,lmodule);
			document.getElementById("ParCfgLTRow").style.display = ltype.length?"":"none";
			if(ltype.length)
				WFE.util.selectFill(ltype_e,this.lastLType,ltype,it.LTypes());
			this.onParCfgLTChange.call(WFE);
		}

		this.parTypes = [ "string", "JDL", "JDLReqt" ];

		this.onParConf = function () {
			var it = this.navigation.getSelected();
			if( it && it.isTopLevel() && !it.isKlass)
				it =it.getKlass();
			var parname = this.param.getSelectedName();
			var par = null;
			var used_html = '';
			if (!parname) 
				par = new CEO.Par({ Type: "string", In: "True", Out: "False" })
			else {
				par = it.parameters[parname];
				used_html = it.parOriginsHTML(parname);
			}
			var name_e = document.getElementById("ParCfgName");
			name_e.value = par.Name;
			this.param.lastName = par.Name;
			WFE.util.setInputRW(name_e,it.isKlass || it.isTopLevel());
			document.getElementById("ParCfgUsed").innerHTML=used_html;
			document.getElementById("ParCfgUsedRow").style.display = (!used_html)?"none":"";
			var type_e = document.getElementById("ParCfgType");
			WFE.util.selectFill(type_e,par.Type,this.param.parTypes);
			
			type_e.readOnly = it.isKlass || it.isTopLevel();
			document.getElementById("ParCfgDescr").value = par.Description;
			var value_e = document.getElementById("ParCfgValue");
			value_e.value = par.Value;

			document.getElementById("ParCfgValueRow").style.display = it.isKlass?"":"none";
			document.getElementById("ParCfgInstanceTipRow").style.display = !it.isKlass && !it.isTopLevel()?"":"none";
			document.getElementById("ParCfgDefTipRow").style.display = it.isKlass?"":"none";
			document.getElementById("ParCfgIn").checked = par.In;
			document.getElementById("ParCfgOut").checked = par.Out;
			document.getElementById("ParCfgOut").disabled = (it.isKlass && it.isExe())?false:true;
			document.getElementById("ParCfgIn").disabled = !(!parname || it.isWFParOrigin(parname));
			document.getElementById("ParCfgLP").value   = par.LinkedParameter?par.LinkedParameter:par.Name;
			this.param.setupParCfgLink();
			this.dialogs.ParCfg.show();
		}
		this.onParAdd = function () {
			WFE.param.table.unselectAllRows();
			WFE.param.onParConf.call(WFE);
		}
		
		this.onParEdit = function () {
			var it = this.navigation.getSelected();
			var parname = this.param.getSelectedName();
			if( it && it.isTopLevel() && !it.isKlass)
				it =it.getKlass();
			if (!it || !parname || it.parameters[parname] == undefined || it.parameters[parname].LinkedModule) 
				return;
			var par = it.parameters[parname];
			var used_html=it.parOriginsHTML(parname);

			document.getElementById("ParEditUsed").innerHTML=used_html;
			document.getElementById("ParEditUsedRow").style.display = ((this.mode=="user") || !used_html)?"none":"";

			document.getElementById("ParEditName").value = par.Name;
			value = document.getElementById("ParEditValue");
			value.value = par.Value;
	
			value.focus();
			this.dialogs.ParEdit.show(); 
		}

		this.applyMode = function(mode){
			for (var i = 0; i < this.expertCtl.length; ++i) 
				document.getElementById(this.expertCtl[i]).style.display = (mode == "expert") ? "" : "none";
			for (var i = 0; i < this.userCtl.length; ++i) 
				document.getElementById(this.userCtl[i]).style.display = (mode) ? "" : "none";
			this.update();
		}

		this.LongParameterValue = '';

		this.onMouseover = function(oArgs) {
			if (!YAHOO.util.Dom.isAncestor(oArgs.target, YAHOO.util.Event.getRelatedTarget(oArgs.event))) {
				var row = this.getTrEl(oArgs.target); 
				if( row ) {
					var oRecord = this.getRecord(row);
					WFE.param.LongParameterValue = oRecord.getData('FullValue');
				}
			}
		}

		this.roCheckbox = function(el, oRecord, oColumn, oData){ //unused
			var bChecked = oData;
			bChecked = (bChecked) ? "checked" : "";
			el.innerHTML = "<input type=\"checkbox\" disabled=\"true\" " + bChecked + ">";
		}

		this.onParameterSelect  = function () {
			var data = this.getRecordSet().getRecord(this.getSelectedRows()[0])._oData;
			if(!data)
				return;
			var pno = data.row;
			var it = WFE.navigation.getSelected();
			var par = it.parList()[pno];
			YAHOO.widget.Button.getButton("ParEdit").set("disabled",(par.LinkedParameter?true:false) || (par.In=="False"));
			YAHOO.widget.Button.getButton("ParDel").set("disabled",it.isWFParOrigin(par)?false:true);
			YAHOO.widget.Button.getButton("ParConf").set("disabled",false);
		}

		this.parToRecord = function (it,p) {
			var r = { Name:p.Name, Value:p.Value, Description:p.Description }
			if(r.Value.length>50) {
				r.FullValue = r.Value;
				r.Value = r.Value.substring(0,50) + "...&lt;truncated&gt;"
			}
			if (p.LinkedModule) {
				var linked_to = it.WFLType(p);
				if(it.LType(p) == 'Ne')
					linked_to="to "+p.LinkedModule;
	  		r.Value = "<font style=\"color:blue;\">" + "&lt;Linked " + linked_to + "." + p.LinkedParameter + "&gt;" + "</font>";
	  	}
			return r;
		}

		this.lastMode = "invalid";
		this.lastObj  = "invalid"

		this.update = function (force){
			if(!force && WFE.mode == this.last_mode && WFE.navigation.getSelected == this.lastObj)
				return;
			for (var i = 0; i < this.allCtl.length; ++i)
				YAHOO.widget.Button.getButton(this.allCtl[i]).set("disabled", true);
			var it=WFE.navigation.getSelected();
			if( it && it.isTopLevel() && !it.isKlass)
				it =it.getKlass();
			var par = it?it.parList():[];
			var length = this.table.getRecordSet().getLength();
			var show_linked = document.getElementById("ShowLinked").checked;
			var show_input = document.getElementById("ShowInput").checked;
			
			if (length > 0) 
				this.table.deleteRows(0, length);
			var newR = [];
			for (var i = 0; i < par.length; ++i) {
				if ((show_input && !par[i].In) || (!show_input && !par[i].Out)) 
					continue;
				if (par[i].LinkedModule || par[i].LinkedParameter) 
					if (!show_linked) 
						continue;
				var record = this.parToRecord(it,par[i]);
				record.row = i;
				newR.push(record);
			}
			if(newR)
				this.table.addRows(newR);
			YAHOO.widget.Button.getButton("ParAdd").set("disabled", !it || (!it.isKlass && !it.isTopLevel()));
		}


		this.Init = function() {
			new YAHOO.widget.TabView('WfParameters');			
			var cdefs = [
    			{key:"Name", sortable:true, resizeable:true},
				{key:"Value", sortable:true, resizeable:true},
				{key:"Description", sortable:true, resizeable:true}
    		];
			var src = new YAHOO.util.DataSource([]);
    		src.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
    		src.responseSchema = { fields: ["Name","Value","Description"] };
			this.table = new YAHOO.widget.DataTable("ParametersTable", cdefs, src, { selectionMode:"single" } );
			this.table.subscribe("rowClickEvent", this.table.onEventSelectRow );
			this.table.subscribe("cellMouseoverEvent", this.onMouseover );
    		this.table.subscribe("cellMouseoutEvent", function(oArgs) { WFE.param.LongParameterValue=''; });
			this.table.subscribe("rowSelectEvent", this.onParameterSelect);

			// show long values in Tooltip
			var ptt = new YAHOO.widget.Tooltip("ptt", { context:"ParametersTable", text:"property" });
			ptt.contextMouseOverEvent.subscribe( function(oArgs) {	return WFE.param.LongParameterValue?true:false; } );
			ptt.contextTriggerEvent.subscribe(	function(oArgs) { this.cfg.setProperty("text",WFE.param.LongParameterValue) } );

			for (var i = 0; i < this.allCtl.length; ++i) {
				var b = new YAHOO.widget.Button(this.allCtl[i]);
				b.on('click',this["on"+this.allCtl[i]],WFE,true);
			}
		}
	}
	
	// Dialogs
	this.dialogs = new function(){
	
		this.Cancel = function(){
			this.hide();
		}
		
		this.onParEditApply = function(){
			this.hide();
			var it = WFE.navigation.getSelected();
			var parname = WFE.param.getSelectedName();
			if( it && it.isTopLevel() && !it.isKlass)
				it =it.getKlass();
			var par = it.parameters[parname];
			if (!it || !parname || !par) 
				return;
			par.Value = YAHOO.lang.trim(document.getElementById("ParEditValue").value);
			WFE.param.update(true);
		}
		this.onParCfgApply = function(){
			var it = WFE.navigation.getSelected();
			if(!it.isKlass && it.isTopLevel())
				it = it.getKlass();
			var parname = WFE.param.getSelectedName();
			var par = it.parameters[parname];
			var pdict = {
				Name: YAHOO.lang.trim(document.getElementById("ParCfgName").value),
				Type: document.getElementById("ParCfgType").value,
				LinkedModule: "self",
				LinkedParameter: YAHOO.lang.trim(document.getElementById("ParCfgLP").value),
				In: document.getElementById("ParCfgIn").checked,
				Out: document.getElementById("ParCfgOut").checked,
				Description: YAHOO.lang.trim(document.getElementById("ParCfgDescr").value),
				Value: YAHOO.lang.trim(document.getElementById("ParCfgValue").value)
			};
			if (!pdict.Name) {
				CEO.warn("Parameter name can't be empty.");
				return;
			}
			var ltype = it.WFLTypes().length?document.getElementById("ParCfgLT").value:"";
			if (!ltype) {
				pdict.LinkedModule = "";
				pdict.LinkedParameter = "";
			} else	if (ltype == 'Ne') {
				pdict.LinkedModule = document.getElementById("ParCfgLM").value;
				pdict.LinkedParameter = document.getElementById("ParCfgLPD").value;
				if (!pdict.In) {
					CEO.warn("Only input parameters can be linked to neighbours.")
					return;
				}
			} else if (it.isKlass)
				pdict.LinkedModule = ltype;
			if (ltype && !pdict.LinkedParameter) {
				CEO.warn("In case you want use links,\nyou have to specify target parameter.");
				return;
			}
			if (!pdict.In && !pdict.Out) {
				CEO.warn("Both Input and Output flags are unset");
				return;
			}
			if (!parname) {
				if(!it.addPar(pdict))
					return;
			} else 
				if(!it.updatePar(par,pdict,ltype)) 
					return;
			WFE.param.update(true);
			this.hide();			
		}
		this.onNewObjApply = function(){
			var klass = WFE.navigation.lastNewNode.parent.data.item;
			if(!klass.isKlass)
				klass=klass.getKlass();
			var it = klass.addObj(  YAHOO.lang.trim(document.getElementById("NewObjName").value),
									document.getElementById("NewObjType").value,"");
			if(!it)
				return;
			WFE.navigation.addNode(new YAHOO.widget.TextNode({label: it.Name, href: "#", item: it}, WFE.navigation.lastNewNode, false) );
			this.hide();
		}
		this.onParEditKeyPress = function(e){
			if( e.keyCode == 13 ) // enter
				WFE.dialogs.onParEditApply.call(WFE.dialogs.ParEdit);
		}
		
		this.onModImportApply = function() {
			var wfname = WFE.dialogs.ModImport.tree.selectedNode;
			if(!wfname){
				window.alert("Please select workflow to import from")
				return;
			}
			wfname = wfname.data.item.WFName;
			var modname = document.getElementById('ModImportMod').value;
			if(!modname){
				window.alert("Please select workflow to import")
				return;
			}
			if(CEO.klass[modname] != undefined){
				window.alert("Definition of "+modname+" already exist")
				return;				
			}
			var mlist = WFE.dialogs.ModImport.wfs[wfname].module_definitions;
			var def = {}
			for(var i=0;i<mlist.length;++i)
				if(mlist[i].Type == modname){
					def = mlist[i];
					break;
				}
			if(!def)
				return;
			if (CEO.addKlass(def, def.parameters)){
				var rootnode=WFE.navigation.ModulesTree.getRoot()
				WFE.navigation.lastNewNode = rootnode.children[rootnode.children.length-1];
				var node = new YAHOO.widget.TextNode({ label: def.Type, href: "#", item: CEO.klass[def.Type]},
													rootnode, true);
	  	  WFE.navigation.addNode( node );
			}
			WFE.dialogs.ModImport.hide();
		}
		
		this.onWFListSuccess = function( answer) {
			try {
	    	 var result = YAHOO.lang.JSON.parse(answer.responseText); 
	  	} catch (x) {
	  		WFE.dialogs.onWFListFailure();
	  		return;
	  	}
	  	if(!result.OK){
	  		WFE.dialogs.onWFListFailure(answer,result.Message);
	  	}
	  	WFE.dialogs.ModImport.list = result.Value;
			WFE.dialogs.ModImport.tree.reGenerate(WFE.dialogs.ModImport.list);	
		}
		
		this.onWFListFailure = function( answer, error) {
			window.alert(error?error:"Workflows list request has failed.\nProblems with the server...");
		}
		
		this.ModImportShow = function(){
			document.getElementById('ModImportMod').length = 0;
			document.getElementById('ModImportMod').selectedIndex = -1;
			if(!this.ModImport.list.length)
				YAHOO.util.Connect.asyncRequest('GET', '../getWFList',	{	success : this.onWFListSuccess,	failure : this.onWFListFailure	} );
			else
				this.ModImport.tree.reGenerate(this.ModImport.list);	
			this.ModImport.show();
		}

		this.onGetWFSuccess = function( answer) {
			try {
	    	 var result = YAHOO.lang.JSON.parse(answer.responseText); 
	  	} catch (x) {
	  		WFE.dialogs.onGetWFFailure();
	  		return;
	  	}
	  	if(!result.OK){
	  		WFE.dialogs.onGetWFFailure(answer,result.Message);
	  	}
			eval("_wf = "+result.Value)
	  	WFE.dialogs.ModImport.wfs[_wf.Name] = _wf;
			WFE.dialogs.ModImportListFill(_wf.Name);
		}
		
		this.onGetWFFailure = function( answer, error) {
			window.alert(error?error:"Workflow request has failed.\nProblems with the server...");
		}
		
		this.ModImportListFill = function (name) {
			var _wf = WFE.dialogs.ModImport.wfs[name];
			var sel = document.getElementById('ModImportMod');
			sel.length = 0;
			for (var i = 0; i < _wf.module_definitions.length; ++i) {
	  	  var id = _wf.module_definitions[i].Type;
	  	  var e = document.createElement("option");
	  	  e.text = id;
	  	  e.value = id;
	  	  sel.add(e, null);
	    }
			if(_wf.module_definitions.length)
				sel.selectedIndex = 0;
			else
				sel.selectedIndex = -1;
		}
		
		this.onModImportTreeClick = function(node){
			if(!node.data.item)
				return;
			WFE.dialogs.ModImport.tree.hilight(node)
			document.getElementById('ModImportMod').length = 0;
			var name = node.data.item.WFName;
			if(WFE.dialogs.ModImport.wfs[name] == undefined)
				YAHOO.util.Connect.asyncRequest('GET', '../getWF/'+name,	{	success : WFE.dialogs.onGetWFSuccess,	failure : WFE.dialogs.onGetWFFailure	} );
			else
				WFE.dialogs.ModImportListFill(name);	
		}
		
		this.Init = function(){
			var Names = ["ParEdit", "ParCfg", "NewObj", "ModImport"];
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
			this.ModImport.tree = new WFTree ('ModImportTree');
			this.ModImport.list = [];
			this.ModImport.wfs  = {};
			this.ModImport.tree.tree.subscribe("labelClick",this.onModImportTreeClick,WFE,true);
		}
		
		// internal handlers
		YAHOO.util.Event.addListener("ParEditValue", "keypress", this.onParEditKeyPress, this.ParEdit, true);
	}
	
	this.Init = function () {
		try {			
			CEO.fromWF(wf);
			this.dialogs.Init();
			this.topmenu.Init();
			this.navigation.Init();
			this.info.Init();
			this.param.Init();
			this.setMode(this.mode);
			this.navigation.selectWF();
		} catch (e){
			window.alert(e + ' at line ' + e.lineNumber)
		}
	} 
}

// Top menu	
WFE.topmenu = new function () {
	this.modeMap = { WfeRoMode:"", WfeUserMode:"user", WfeExpertMode:"expert" };
	this.onModeChange = function(aType, aArgs) {
		if(aArgs[1])
			this.setMode(this.topmenu.modeMap[aArgs[1].id])
	}
		
	this.applyMode = function (mode) {
		return;
		YAHOO.widget.MenuManager.getMenuItem("WfeRoMode").cfg.setProperty("checked", (mode) ? false : true);
		YAHOO.widget.MenuManager.getMenuItem("WfeUserMode").cfg.setProperty("checked", (mode == "user") ? true : false);
		YAHOO.widget.MenuManager.getMenuItem("WfeExpertMode").cfg.setProperty("checked", (mode == "expert") ? true : false);
	}
	
	this.onExit = function ( ){
		window.close();
	}

	this.onDBSuccess = function ( answer ) {
	  try {
			var result = YAHOO.lang.JSON.parse(answer.responseText);
		}	catch (x) {
			WFE.topmenu.onDBFailure();
			return;
		}
	 	if (!result.OK) {
	  	WFE.topmenu.onDBFailure(answer, result.Message);
	  	return;
	  }
		window.alert("Workflow "+wf.Name+" was succesfully saved.\n\n"+
								 "Don't forget to reload workflow list in the overview\nto see the changes!")
	}

	this.onDBFailure = function(answer, error){
		window.alert(error ? error : "Workflow save request has failed.\nProblems with the server...");
	}

	this.onSaveDB = function ( ){
		WFE.info.checkChanges();
		try {
			var wfjs = CEO.toWF();
			wfjs.Type = wf.Type; // which was really path...
			var wfjs = YAHOO.lang.JSON.stringify(wfjs).replace(/;/g,'\\u003B').replace(/%/g,'\\u0025');
			YAHOO.util.Connect.asyncRequest('POST', '../saveWFIntoDB', 
				{	success : WFE.topmenu.onDBSuccess,	failure : WFE.topmenu.onDBFailure	}, "JSONStr="+wfjs );

		} catch (e) {
			window.alert(e + ' at line ' + e.lineNumber)
		}
	}

	this.onSaveLocal = function(){
		WFE.info.checkChanges();
		try {
			var wfjs = CEO.toWF();
			wfjs.Type = wf.Type; // which was really path...
			var wfjs = YAHOO.lang.JSON.stringify(wfjs).replace(/;/g,'\\u003B');
			saveLocal('../saveWFLocal/'+wf.Name,wfjs); 
		} catch (e) {
			window.alert(e + ' at line ' + e.lineNumber)
		}
  }
	
	this.Init = function(){
		this.menu = new YAHOO.widget.MenuBar("WfeMenu", {
			autosubmenudisplay: true,
			hidedelay: 3000
		});
		// YAHOO.widget.MenuManager.getMenu("WfeMode").subscribe("click", this.onModeChange,WFE,true)
		YAHOO.widget.MenuManager.getMenuItem("WfeExit").subscribe("click", this.onExit,WFE,true)
		YAHOO.widget.MenuManager.getMenuItem("WfeSaveDB").subscribe("click", this.onSaveDB,WFE,true)
		YAHOO.widget.MenuManager.getMenuItem("WfeSaveLocal").subscribe("click", this.onSaveLocal,WFE,true)
		this.menu.render();
	}
}