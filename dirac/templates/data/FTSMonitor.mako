# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
<!-- Dependencies for data table -->
<script type="text/javascript" src="/yui/element/element-beta-min.js"></script>
<script type="text/javascript" src="/yui/datasource/datasource-beta-min.js"></script>
<script type="text/javascript" src="/yui/dragdrop/dragdrop-min.js"></script>
<script type="text/javascript" src="/yui/datatable/datatable-beta-min.js"></script>
<script type="text/javascript" src="/yui/container/container-min.js"></script>
<script type="text/javascript" src="/yui/connection/connection-min.js"></script>
<script type="text/javascript" src="/yui/calendar/calendar-min.js"></script>
<script type="text/javascript" src="/yui/button/button-min.js"></script>
<script type="text/javascript" src="/javascripts/data/FTSMonitor.js"></script>
<link type="text/css" rel="stylesheet" href="/yui/datatable/assets/skins/sam/datatable.css">
<link type="text/css" rel="stylesheet" href="/yui/container/assets/container.css">
<link type="text/css" rel="stylesheet" href="/yui/calendar/assets/skins/sam/calendar.css">
<!--<link type="text/css" rel="stylesheet" href="/yui/container/assets/skins/sam/container.css">-->
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
</style>
</%def>

<div class="job_widget">
<!--
  <table style="width:100%;"><tr>
    <td style="text-align:left;">
      Select:
      <a href="javascript:selectAll('all');">All</a>
      <a href="javascript:selectAll('none');">None</a>
      Action:
      <a href="">Start</a>
      <a href="">Stop</a>
      <a id="delProd1" href="">Delete</a>
    </td>
  </tr></table>
-->
  <div id="job_status_div"></div>
<!--
  <table style="width:100%;"><tr>
    <td style="text-align:left;">
      Select:
      <a href="javascript:selectAll('all');">All</a>
      <a href="javascript:selectAll('none');">None</a>
      Action:
      <a href="">Start</a>
      <a href="">Stop</a>
      <a id="delProd2" href="">Delete</a>
    </td>
  </tr></table>
-->
</div>

<script type="text/javascript">
  response = "${c.listResult}";
  response = response.replace("]]","");
  response = response.replace("[[","");
  var jobArray = response.split("], [");
  var prod = new Array();
  var t = "";
  for (var i = 0; i < jobArray.length; i++) {
    t = jobArray[i].split(", ");
    t[1] = t[1].replace(/'/g,"");
    t[2] = t[2].replace(/'/g,"");
    t[3] = t[3].replace(/'/g,"");
    t[4] = t[4].replace(/'/g,"");
    t[6] = t[6].replace(/'/g,"");
    t[6] = status(t[6]);
    t[0] = t[0]*1;
    t[7] = t[7]*1;
    t[8] = t[8]*1;
//    prod[i] = {FTSReqID:t[0], FTSGUID:t[1], FTSServer:t[2], SubmitTime:t[3], LastMonitor:t[4], PercentageComplete:t[5], Status:t[6], NumberOfFiles:t[7], TotalSize:t[8]};
    prod[i] = {FTSReqID:t[0], Status:t[6], SubmitTime:t[3], LastMonitor:t[4], PercentageComplete:t[5], NumberOfFiles:t[7], TotalSize:t[8]};
  }
  YAHOO.example.Data = {"startIndex":0,"sort":null,"dir":"asc",productions:prod}
</script>
