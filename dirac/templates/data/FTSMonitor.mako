# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
<!-- Dependencies for data table -->
${ h.javascript_link( "/yui/element/element-beta-min.js" ) }
${ h.javascript_link( "/yui/datasource/datasource-beta-min.js" ) }
${ h.javascript_link( "/yui/dragdrop/dragdrop-min.js" ) }
${ h.javascript_link( "/yui/datatable/datatable-beta-min.js" ) }
${ h.javascript_link( "/yui/container/container-min.js" ) }
${ h.javascript_link( "/yui/connection/connection-min.js" ) }
${ h.javascript_link( "/yui/calendar/calendar-min.js" ) }
${ h.javascript_link( "/yui/button/button-min.js" ) }
${ h.javascript_link( "/javascripts/data/FTSMonitor.js" ) }
${ h.javascript_link( "json2.js" ) }
${ h.stylesheet_link( "/yui/datatable/assets/skins/sam/datatable.css" ) }
${ h.stylesheet_link( "/yui/container/assets/container.css" ) }
${ h.stylesheet_link( "/yui/calendar/assets/skins/sam/calendar.css" ) }

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
.link{
  color: #003D76;
  cursor: pointer;
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
<!--
c.destination
c.source
-->
<div id="filter" class="job_widget">
<div class="left">
<table border="0" cellspacing="5px" cellpadding="5px"><tr>
  <td style="text-align:right;">Source&nbsp;Site:</td>
  <td style="text-align:left;">
    <select id="source" size="1" style="width: 150px">
    %if c.save_source == 0:
      <option selected value="">All</option>
    %else:
      <option value="">All</option>
    %endif
    %for i in c.source:
      %if i == c.save_source:
        <option selected>${i}</option>
      %else:
        <option>${i}</option>
      %endif
    %endfor
    </select>
  </td>
  <td style="text-align:right;">FTS&nbsp;Request&nbsp;ID:</td>
  <td><input width="150px" type="text" id="jobid" name="jobid" onkeydown="jobch('s');" onblur="jobch('u');" size="10"/></td>
  <td rowspan="2"><input id="submit_filter" name="submit_filter" type="submit" value="Submit"/></td>
</tr><tr>
  <td style="text-align:right;">Destination&nbsp;Site:</td>
  <td style="text-align:left;">
    <select id="destination" size="1" style="width: 150px">
    %if c.save_destination == 0:
      <option selected value="">All</option>
    %else:
      <option value="">All</option>
    %endif
    %for i in c.destination:
      %if i == c.save_destination:
        <option selected>${i}</option>
      %else:
        <option>${i}</option>
      %endif
    %endfor
    </select>
  </td>
  <td style="text-align:right;">Requests&nbsp;updated&nbsp;after:</td>
  <td style="text-align:left;"><input width="100px" type="text" id="jobupdate" name="jobupdate" size="10"/></td>
</tr></table>
</div><div class="right">
Sort by:
<select id="global_sort" size="1" class="yui-dt-dropdown">
  <option value="SubmitTime:ASC">SubmissionTime Ascending</option>
  <option value="SubmitTime:DESC">SubmissionTime Descending</option>
</select>
</div>
<div class="clear"></div>
</div>
<div class="job_widget">
  <div class="left">
    Select:
    <span class="link" id="top_selectA">All</span>
    <span class="link" id="top_selectN">None</span>
    Action:
    <span class="link" id="top_JDel">Delete</span>
  </div>
  <div class="right">
    <span id="top_page"></span>
      <select id="top_pages_number" size="1" class="yui-dt-dropdown" onchange="changePage('top_pages_number');">
        <option selected>25</option>
        <option>50</option>
        <option>100</option>
        <option>150</option>
      </select>
      <span id="top_jobs_counter"></span>
  </div>
  <div class="clear"></div>
  <div id="job_status_div"></div>
  <div class="left">
    Select:
    <span class="link" id="bottom_selectA">All</span>
    <span class="link" id="bottom_selectN">None</span>
    Action:
    <span class="link" id="bottom_JDel">Delete</span>
  </div>
  <div class="right">
    <span id="bottom_page"></span>
      <select id="bottom_pages_number" size="1" class="yui-dt-dropdown" onchange="changePage('bottom_pages_number');">
        <option selected>25</option>
        <option>50</option>
        <option>100</option>
        <option>150</option>
      </select>
      <span id="bottom_jobs_counter"></span>
  </div>
  <div class="clear"></div>
</div>
<script type="text/javascript">
  initWebRoot( '${h.url_for( '/images' )}' );
  response = "${c.listResult}";
  response = response.replace("]]","");
  response = response.replace("[[","");
  response = response.replace(/'/g,"");
  var jobArray = response.split("], [");
  page = jobArray.pop();
  total = jobArray.pop();
  var prod = new Array();
  var t = "";
  for (var i = 0; i < jobArray.length; i++) {
    t = jobArray[i].split(", ");
    t[1] = status(t[1]);
    t[0] = t[0]*1;
    t[5] = t[5]*1;
    t[6] = t[6]*1;
    prod[i] = {FTSReqID:t[0],Status:t[1],SubmitTime:t[2],LastMonitor:t[3],PercentageComplete:t[4],NumberOfFiles:t[5],TotalSize:t[6],SourceSite:t[7],DestinationSite:t[8]};
  }
  YAHOO.example.Data = {"startIndex":0,"sort":null,"dir":"asc",productions:prod}
  total = parseInt(total);
  showPage(total);
</script>
