# -*- coding: utf-8 -*-
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>WorkFlowEditor</title>
  ${ h.stylesheet_link( "/yui/fonts/fonts-min.css") }
  ${ h.stylesheet_link( "/yui/treeview/assets/skins/sam/treeview.css") }
  ${ h.stylesheet_link( "/yui/tabview/assets/skins/sam/tabview.css") }
  ${ h.stylesheet_link( "/yui/datatable/assets/skins/sam/datatable.css") }
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
  ${ h.javascript_link( "/yui/datasource/datasource-beta-min.js") }
  ${ h.javascript_link( "/yui/datatable/datatable-beta-min.js") }
  ${ h.javascript_link( "/yui/container/container-min.js") }
  ${ h.javascript_link( "/yui/menu/menu-min.js") }
  ${ h.javascript_link( "/yui/button/button-min.js") }
  ${ h.javascript_link( "/yui/utilities/utilities.js") }
  ${ h.javascript_link( "/yui/json/json-min.js") }
  ${ h.javascript_link( "/yui/connection/connection-min.js") }

<style type="text/css">
body { margin:0; padding:0; }

h1 { text-align:center; }
	
.yui-skin-sam .yui-dt-liner { white-space:nowrap; }

#ParametersTable table { width: 100%; }

#ParEditTable td { padding: 5px 5px 5px 20px; }
#ParCfgTable td { padding: 5px 5px 5px 20px; }
#ParStepTable td { padding: 5px 5px 5px 20px; }
#ParModuleTable td { padding: 5px 5px 5px 20px; }
#ModImportTable td { padding: 5px 5px 5px 20px; }
#ModImportTree  td { padding: 0px 0px 0px 0px; }

.yui-button#StUp button,
.yui-button#StRem button,
.yui-button#StDown button,
.yui-button#ModUp button,
.yui-button#StDel button,
.yui-button#ModDown button,
.yui-button#ModDel button,
.yui-button#ModImp button { width: 7em;  }
</style>

${ h.javascript_link( "/javascripts/production/CEO.js") }
${ h.javascript_link( "/javascripts/production/WorkFlowTree.js") }
${ h.javascript_link( "/javascripts/production/WorkFlowEditor.js") }

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

WFE.mode = "${ c.mode }"
wf = ${ c.wf }
YAHOO.util.Event.onDOMReady(WFE.Init,WFE,true);

</script>	
</head>
<body class="yui-skin-sam">
<h1 id="H1">WorkFlow Editor v1p4</h1>
<div id="WfeMenu" class="yuimenubar yuimenubarnav"><div class="bd"><ul class="first-of-type">
	<li class="yuimenubaritem first-of-type"><a class="yuimenubaritemlabel">File</a>
		<div id="WfFile" class="yuimenu"><div class="bd"><ul>
	    	<li class="yuimenuitem" id="WfeSaveDB"><a class="yuimenuitemlabel">Save in DIRAC DB</a></li>
	      <li class="yuimenuitem" id="WfeSaveLocal"><a class="yuimenuitemlabel">Save in local file</a></li>
		</ul><ul>
	      <li class="yuimenuitem" id="WfeExit"><a class="yuimenuitemlabel">Exit</a></li>
	  </ul></div></div>
	</li>
</ul></div></div>
<table width="100%">
	<tr>
		<td width="30%" valign="top"><div id="WfComponents" class="yui-navset">
    		<ul class="yui-nav">
        		<li class="selected"><a href="#tab1"><em>Workflow</em></a></li>
        		<li><a href="#tab2"><em>Steps</em></a></li>
        		<li><a href="#tab3"><em>Modules</em></a></li>
    		</ul>          
    		<div class="yui-content">
        		<div id="tab1"><table border=0>
    				<tr><td rowspan="3" width="100%" style="width:100%" valign="top"><div id="WfTree"></div></td>
				 		<td style="vertical-align:top;"><input type="button" style="width:100%" disabled="true" id="StUp" name="StUp" title="Move step up" value="Up"></td>
					</tr>
				 	<tr><td style="vertical-align:middle"><input type="button" disabled="true" id="StRem" title="Remove step from workflow"     value="Remove"/></td></tr>
				 	<tr><td style="vertical-align:bottom"><input type="button" style="width:100%"  disabled="true" id="StDown" title="Move step down" value="Down"/></td></tr>
				</table></div>
        		<div id="tab2"><table border=0>
    				<tr><td rowspan="3" width="100%" style="width:100%" valign="top"><div id="StepsTree"></div></td>
				 		<td style="vertical-align:top;"><input type="button" style="width:100%" disabled="true" id="ModUp"  title="Move module up"  value="Up"/></td>
					</tr>
				 	<tr><td style="vertical-align:middle"><input type="button" disabled="true" id="StDel" title="Delete step definition"     value="Remove"/></td></tr>
				 	<tr><td style="vertical-align:bottom"><input type="button" style="width:100%"  disabled="true" id="ModDown" title="Move module down" value="Down"/></td></tr>
				</table></div>
        		<div id="tab3"><table border=0>
        			<tr><td rowspan="2" width="100%" valign="top"><div id="ModulesTree"></div></td>
						<td style="vertical-align:top;"><input type="button" disabled="true" id="ModDel" title="Delete module definition" value="Remove"/></td></tr>
				 	  <tr><td style="vertical-align:bottom"><input type="button" disabled="true" id="ModImp" title="Import module definition" value="Import"/></td></tr>
        		</table></div>
    		</div>
		</div></td>
		<td width="70%" valign="top"><div id="WfProperties" class="yui-navset">
    		<ul class="yui-nav">
        		<li class="selected"><a href="#ptab1"><em>Info</em></a></li>
        		<li><a href="#ptab2"><em>Module body</em></a></li>
    		</ul>          
    		<div class="yui-content">
        		<div id="ptab1">
					<table width="100%" border="0">
						<tr id="InfoHelpRow">
							<td colspan="2" style="text-align: center;">
								Select element in the tree to see details</td>
						</tr>
						<tr id="InfoNameRow" style="display: none;">
							<td style="text-align: right;">Name</td>
							<td style="padding-right: 10px; width: 100%">
								<input name="InfoName" maxlength="256" id="InfoName" onkeypress="WFE.info.onChange()" readonly="true" style="width: 100%;" 
									onchange="WFE.info.onChange()" ></td>
						</tr>
						<tr id="InfoTypeRow" style="display: none;">
							<td style="text-align: right;">Type</td>
							<td style="padding-right: 10px; width: 100%">
								<input name="InfoType" id="InfoType"  onkeypress="WFE.info.onChange()" readonly="true" style="width: 100%;"  
								   onchange="WFE.info.onChange()"></td>
						</tr>
						<tr id="InfoDescrShortRow" style="display: none;">
							<td style="text-align: right;">Short&nbsp;description</td>
							<td style="padding-right: 10px; width: 100%">
								<input name="InfoDescrShort" id="InfoDescrShort" readonly="true" type="text" style="width: 100%;"
										 onchange="WFE.info.onChange()" value="<Select element in the tree on left side>" 
										 onkeypress="WFE.info.onChange()" ></td>
						</tr>
						<tr id="InfoDescriptionRow" style="display: none;">
							<td style="text-align: right;">Description</td>
							<td style="padding-right: 10px; width: 100%">
								<textarea name="InfoDescription" id="InfoDescription" readonly="true" style="width: 100%;" onchange="WFE.info.onChange()" 
										 onkeypress="WFE.info.onChange()"></textarea></td>
						</tr>
						
						<tr id="InfoOriginRow" style="display: none;">
							<td style="text-align: right;">Origin</td>
							<td style="padding-right: 10px; width: 100%">
								<input name="InfoOrigin" id="InfoOrigin" type="text"  readonly="true" style="width: 100%;" onchange="WFE.info.onChange()" 
										 onkeypress="WFE.info.onChange()"></td>
						</tr>
						<tr id="InfoVersionRow" style="display: none;">
							<td style="text-align: right;">Version</td>
							<td style="padding-right: 10px; width: 100%">
								<input name="InfoVersion" id="InfoVersion" type="text"  readonly="true" style="width: 100%;" onchange="WFE.info.onChange()" 
										 onkeypress="WFE.info.onChange()"></td>
						</tr>
						<tr id="InfoRequiredRow" style="display: none;">
							<td style="text-align: right;">Required</td>
							<td style="padding-right: 10px; width: 100%">
								<input name="InfoRequired" id="InfoRequired" type="text"  readonly="true" style="width: 100%;"  onchange="WFE.info.onChange()" 
										 onkeypress="WFE.info.onChange()"></td>
						</tr>
						<tr id="InfoCtrl1"><td></td><td>
							<input type="button" disabled="true" id="InfoCommit1"  title="Apply changes" value="Apply"/>
							<input type="button" disabled="true" id="InfoCancel1"  title="Cancel"        value="Cancel"/>
						</td></tr>
					</table>
				</div>
        		<div id="ptab2">
					<table width="100%" border="0">
						<tr id="InfoBodyHelpRow">
							<td style="text-align: center;">Only modules have body</td>
						</tr>
						<tr id="InfoBodyRow" style="display: none;">
							<td style="padding-right: 10px; width: 100%">
								<textarea rows="5" wrap=off name="InfoBody" id="InfoBody"  readonly="true" style="width: 100%;" onchange="WFE.info.onChange()" 
											 onkeypress="WFE.info.onChange()"></textarea></td>
						</tr>
						<tr id="InfoCtrl2"><td>
							<input type="button" disabled="true" id="InfoCommit2"  title="Apply changes" value="Apply"/>
							<input type="button" disabled="true" id="InfoCancel2"  title="Cancel"        value="Cancel"/>
						</td></tr>
					</table>
				</div>
    		</div>
		</div></td>
	</tr>
</table>
<div id="WfParameters" class="yui-navset">
    <ul class="yui-nav">
     	<li class="selected"><a href="#pttab"><em>Parameters</em></a></li>
	</ul>          
	<div class="yui-content">
	<table style="width:100%;" width="100%" border="0"><tr>
		<td style="text-align:left; white-space: nowrap"> Show
			<input type="checkbox" name="ShowLinked" id="ShowLinked" title="Show linked parameters" onchange="WFE.param.update()"> linked
			<input type="radio" name="ShowInput" id="ShowInput" title="Show input parameters" checked="checked" onchange="WFE.param.update()" > input
			<input type="radio" name="ShowInput" id="ShowOutput" title="Show output parameters" onchange="WFE.param.update()"> output
		</td><td style="text-align:right; width:100%" id="ParCtrl">
			<input type="button" disabled="true" id="ParEdit" title="Edit current parameter" value="Edit"/>
			<input type="button" disabled="true" id="ParDel"  title="Remove current parameter" value="Remove"/>
			<input type="button" disabled="true" id="ParConf" title="Configure current parameter" value="Config"/>
			<input type="button" disabled="true" id="ParAdd"  title="Append new parameter" value="New"/>
		</td>
	</tr></table>
	<div id="ParametersTable"></div>
	</div>
</div>

<div id="ParEditDlg">
<div class="hd">Please enter parameter value</div>
<div class="bd">
	<table border="0" id="ParEditTable">
		<tr>
			<td style="text-align: right;">Name:</td>
			<td> <input name="ParEditName" id="ParEditName" type="text"  readonly="true" style="color:blue; border-style:none;" size="64"></td>
		</tr>
		<tr id="ParEditUsedRow">
			<td style="text-align: right;">Used in:</td>
			<td id="ParEditUsed"></td>
		</tr>
		<tr>
			<td style="text-align: right;">Value:</td>
			<td> <input name="ParEditValue" id="ParEditValue" type="text" maxlength="1024" size="64"></td>
		</tr>
	</table>
	<hr>
</div>
</div>

<div id="ParCfgDlg">
<div class="hd">Parameter configuration</div>
<div class="bd">
	<table border="0" id="ParCfgTable">
		<tr>
			<td style="text-align: right;">Name:</td>
			<td> <input name="ParCfgName" id="ParCfgName" type="text" size="64" onchange="WFE.param.onParCfgNameChange.call(WFE);"></td>
		</tr>
		<tr id="ParCfgUsedRow">
			<td style="text-align: right;">Used in:</td>
			<td id="ParCfgUsed"></td>
		</tr>
		<tr>
			<td style="text-align: right;">Type:</td>
			<td> <select name="ParCfgType" id="ParCfgType"></select> </td>
		</tr>
		<tr id="ParCfgLTRow">
			<td style="text-align: right;">Linked:</td>
			<td> <select name="ParCfgLT" id="ParCfgLT" onchange="WFE.param.onParCfgLTChange.call(WFE);"></select> </td>
		</tr>
		<tr id="ParCfgLMRow">
			<td style="text-align: right;">Linked module:</td>
			<td> <select name="ParCfgLM" id="ParCfgLM" onchange="WFE.param.onParCfgLMChange.call(WFE);"></select> </td>
		</tr>
		<tr id="ParCfgLPRow">
			<td style="text-align: right;">Linked parameter:</td>
			<td> <input name="ParCfgLP" id="ParCfgLP" type="text" maxlength="256" size="64"></td>
		</tr>
		<tr id="ParCfgLPDRow">
			<td style="text-align: right;">Linked parameter:</td>
			<td> <select name="ParCfgLPD" id="ParCfgLPD"></select> </td>
		</tr>
		<tr>
			<td style="text-align: right;">Direction:</td>
			<td>
				<input type="checkbox" name="ParCfgIn" id="ParCfgIn" title="Input parameter"> input
				<input type="checkbox" name="ParCfgOut" id="ParCfgOut" title="Output parameter (set or modified by module)"> output
			</td>
		</tr>
		<tr>
			<td style="text-align: right;">Description:</td>
			<td> <input name="ParCfgDescr" id="ParCfgDescr" type="text" maxlength="256" size="64"></td>
		</tr>
		<tr id="ParCfgValueRow">
			<td style="text-align: right;">Default value:</td>
			<td> <input name="ParCfgValue" id="ParCfgValue" type="text" maxlength="256" size="64"></td>
		</tr>
		<tr id="ParCfgInstanceTipRow">
			<td style="text-align: right;">Tip:</td>
			<td> Some configuration parameters<br>can be set in the module/step definition only.</td>
		</tr>
		<tr id="ParCfgDefTipRow">
			<td style="text-align: right;">Tip:</td>
			<td> Link and value settings modification<br>will not change already defined modules/step.</td>
		</tr>
	</table>
	<hr>
</div>
</div>

<div id="NewObjDlg">
<div class="hd">Please specify name and type</div>
<div class="bd">
	<table border="0" id="NewObjTable">
		<tr>
			<td style="text-align: right;">Name:</td>
			<td> <input name="NewObjName" id="NewObjName" type="text" size="64"></td>
		</tr>
		<tr>
			<td style="text-align: right;">Type:</td>
			<td> <select name="NewObjType" id="NewObjType"></select> </td>
		</tr>
	</table>
	<hr>
</div>
</div>

<div id="ModImportDlg">
<div class="hd">Please select module to import</div>
<div class="bd">
	<table border="0" id="ModImportTable">
		<tr>
			<td style="text-align: right;">Workflow:</td>
			<td> <div id="ModImportTree"></div></td>
		</tr>
		<tr>
			<td style="text-align: right;">Module:</td>
			<td> <select name="ModImportMod" id="ModImportMod" style=" width:20em;"></select> </td>
		</tr>
	</table>
	<hr>
</div>
</div>

<FORM id="SaveLocal" action="" method="POST" style="display:none;">
<input type="hidden" id="JSONStr" name="JSONStr">
</FORM>

</body>
</html>
