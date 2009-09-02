# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.jsTag( "/javascripts/systems/activitiesMonitoring/manageViews.js" ) }
<style>
#action-panel .x-panel {
	margin-bottom:3px;
	margin-right:0;
}
#action-panel .x-panel-body {
	border:0 none;
}
#action-panel .x-panel-body li {
	margin:3px;
}
#action-panel .x-panel-body li img {
	width:16px;
	height:16px;
	vertical-align:middle;
	margin-right:2px;
	margin-bottom:2px;
}
#action-panel .x-panel-body li a {
	text-decoration:none;
	color:#3764A0;
}
#action-panel .x-plain-body {
	background-color:#cad9ec;
    padding:3px 5px 0 5px;
}
#action-panel .x-panel-body li a:hover {
	text-decoration:underline;
	color:#15428b;
}
</style>
</%def>

<%def name="body()">
<script type="text/javascript">
  initManageViews();
</script>
</%def>
