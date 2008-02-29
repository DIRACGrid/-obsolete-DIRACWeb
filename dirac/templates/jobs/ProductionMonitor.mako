# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/yui/element/element-beta-min.js" ) }
${ h.javascript_include_tag( "/yui/datasource/datasource-beta-min.js" ) }
${ h.javascript_include_tag( "/yui/dragdrop/dragdrop-min.js" ) }
${ h.javascript_include_tag( "/yui/datatable/datatable-beta-min.js" ) }
${ h.javascript_include_tag( "/yui/container/container-min.js" ) }
${ h.javascript_include_tag( "/yui/connection/connection-min.js" ) }
${ h.javascript_include_tag( "/yui/calendar/calendar-min.js" ) }
${ h.javascript_include_tag( "/yui/button/button-min.js" ) }
${ h.javascript_include_tag( "/javascripts/jobs/ProductionMonitor.js" ) }
${ h.javascript_include_tag( "json2.js" ) }
${ h.stylesheet_link_tag( "/yui/datatable/assets/skins/sam/datatable.css" ) }
${ h.stylesheet_link_tag( "/yui/container/assets/container.css" ) }
${ h.stylesheet_link_tag( "/yui/calendar/assets/skins/sam/calendar.css" ) }

<style type="text/css">
.env {
  z-index: 2000;
  visibility: hidden;
  background-color: #ffffff;
  border: 1px solid #000066;
}
.job_table {
  z-index: 1000;
}
.jdl {
  text-align: left;
}
#xz.yui-panel .bd {
  padding-right: 10px;
  padding-left: 10px;
}
#xz.yui-panel .hd {
  height: 20px;
  overflow: hidden;
}
.job_widget{
  clear:left;
  background-color: #EDF5FF;
  border: 1px solid #B2D2FF;
  padding: 10px;
  margin-bottom: 10px;
}
.yui-dt-table{
  width: 100% !important;
  margin-top: 10px !important;
  margin-bottom: 10px !important;
}
.left{
  float:left;
  width:50%;
  text-align: left;
}
.right{
  float:left;
  width:49.9%;
  text-align: right;
}
.clear{
  clear:both;
}
.link{
  color: #003D76;
  cursor: pointer;
}
</style>
</%def>

<div class="job_widget">
  <div class="left">
    <span class="link" id="top_JRef">Refresh&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    Select:
    <span class="link" id="top_selectA">All</span>
    <span class="link" id="top_selectN">None</span>
    Action:
    <span class="link" id="top_JSta">Start</span>
    <span class="link" id="top_JSto">Stop</span>
    <span class="link" id="top_JDel">Delete</span>
  </div>
  <div class="clear"></div>
  <div id="job_status_div"></div>
  <div class="left">
    <span class="link" id="bottom_JRef">Refresh&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    Select:
    <span class="link" id="bottom_selectA">All</span>
    <span class="link" id="bottom_selectN">None</span>
    Action:
    <span class="link" id="bottom_JSta">Start</span>
    <span class="link" id="bottom_JSto">Stop</span>
    <span class="link" id="bottom_JDel">Delete</span>
  </div>
  <div class="clear"></div>
</div>
<script type="text/javascript">
  initWebRoot( '${h.url_for( '/images' )}' );
  response = "${c.listResult}";
  response = response.replace("]]","");
  response = response.replace("[[","");
  var jobArray = response.split("], [");
  var prod = new Array();
  var t = "";
  for (var i = 0; i < jobArray.length; i++) {
    t = jobArray[i].split(", ");
    t[0] = t[0].replace(/'/g,"");
    t[1] = t[1].replace(/'/g,"");
    t[2] = t[2].replace(/'/g,"");
    t[3] = t[3].replace(/'/g,"");
    t[7] = t[7].replace(/'/g,"");
    t[10] = t[9].replace(/'/g,"");
    t[11] = t[11].replace(/'/g,"");
    t[12] = t[12].replace(/'/g,"");
    prod[i] = {ProdId:t[0],ProdName:t[1],Status:t[2],DN:t[3],Created:t[4],Submited:t[5],Wait:t[6],Running:t[7],Done:t[8],Failed:t[9],Parent:t[10],Description:t[11],CreationDate:t[12],Stalled:t[13]};
  }
  YAHOO.example.Data = {"startIndex":0,"sort":null,"dir":"asc",productions:prod}
</script>
