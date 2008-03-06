# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
<!-- Dependencies for data table -->
${ h.javascript_include_tag( "/yui/element/element-beta-min.js" ) }
${ h.javascript_include_tag( "/yui/datasource/datasource-beta-min.js" ) }
${ h.javascript_include_tag( "/yui/dragdrop/dragdrop-min.js" ) }
${ h.javascript_include_tag( "/yui/datatable/datatable-beta-min.js" ) }
${ h.javascript_include_tag( "/yui/container/container-min.js" ) }
${ h.javascript_include_tag( "/yui/connection/connection-min.js" ) }
${ h.javascript_include_tag( "/yui/calendar/calendar-min.js" ) }
${ h.javascript_include_tag( "/yui/button/button-min.js" ) }
${ h.javascript_include_tag( "/javascripts/jobs/JobMonitor.js" ) }
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

<div id="filter" class="job_widget">
<div class="left">
<table border="0" cellspacing="5px" cellpadding="5px"><tr>
  <td style="text-align:right;">Site:</td>
  <td style="text-align:left;">
    <select id="site" size="1" style="width: 150px">
    %if c.save_site == 0:
      <option selected value="">All</option>
    %else:
      <option value="">All</option>
    %endif
    %for i in c.getsite:
      %if i == c.save_site:
        <option selected>${i}</option>
      %else:
        <option>${i}</option>
      %endif
    %endfor
    </select>
  </td>
  <td style="text-align:right;">App&nbsp;Status:</td>
  <td style="text-align:left;">
    <select id="applic" size="1" style="width: 150px">
    %if c.save_applic == 0:
      <option selected value="">All</option>
    %else:
      <option value="">All</option>
    %endif
    %for i in c.getappl:
      %if i == c.save_applic:
        <option selected>${i}</option>
      %else:
        <option>${i}</option>
      %endif
    %endfor
    </select>
  </td>
  <td style="text-align:right;">Job&nbsp;ID:</td>
  <td><input width="150px" type="text" id="jobid" name="jobid" onkeydown="jobch('s');" onblur="jobch('u');" size="10"/></td>
  <td></td><td></td>
  <td rowspan="2"><input id="submit_filter" name="submit_filter" type="submit" value="Submit"/></td>
</tr><tr>
  <td style="text-align:right;">Job&nbsp;Status:</td>
  <td style="text-align:left;">
    <select id="status" size="1" style="width: 150px">
    %if c.save_status == 0:
      <option selected value="">All</option>
    %else:
      <option value="">All</option>
    %endif
    %for i in c.getstat:
      %if i == c.save_status:
        <option selected>${i}</option>
      %else:
        <option>${i}</option>
      %endif
    %endfor
    </select>
  </td>
  <td style="text-align:right;">Owner:</td>
  <td style="text-align:left;">
    <select id="owner" size="1" style="width: 150px">
    %if c.save_owner == 0:
      <option selected value="">All</option>
    %else:
      <option value="">All</option>
    %endif
    %for i in c.getowner:
      %if i == c.save_owner:
        <option selected>${i}</option>
      %else:
        <option>${i}</option>
      %endif
    %endfor
    </select>
  </td>
  <td style="text-align:right;">Updated&nbsp;after:</td>
  <td style="text-align:left;"><input width="100px" type="text" id="jobupdate" name="jobupdate" size="10"/></td>
  <td style="text-align:right;">Jobs&nbsp;group:</td>
  <td style="text-align:left;">
    <select id="prodname" size="1" style="width: 150px">
    %if c.save_prod == 0:
      <option selected value="">All</option>
    %else:
      <option value="">All</option>
    %endif
    %for i in c.getprod:
      %if i == c.save_prod:
        <option selected>${i}</option>
      %else:
        <option>${i}</option>
      %endif
    %endfor
    </select>
  </td>
</tr></table>
</div><div class="right">
Sort by:
<select id="global_sort" size="1" class="yui-dt-dropdown">
  <option value="JobID:ASC">JobID Ascending</option>
  <option value="JobID:DESC" selected>JobID Descending</option>
  <option value="SubmissionTime:ASC">SubmissionTimeTime Ascending</option>
  <option value="SubmissionTime:DESC">SubmissionTimeTime Descending</option>
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
    <span class="link" id="top_JRes">Reset</span>
    <span class="link" id="top_JKil">Kill</span>
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
    <span class="link" id="bottom_JRes">Reset</span>
    <span class="link" id="bottom_JKil">Kill</span>
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
  var jobArray = response.split("], [");
  page = jobArray.pop();
  total = jobArray.pop();
  jobLegend = jobArray.pop();
  var newJobs = new Array();
  var t = "";
  for (var i = 0; i < jobArray.length; i++) {
    t = jobArray[i].split("', '");
    t[0] = t[0].replace("'","");
    t[8] = t[8].replace("'","");
    t[9] = t[9].replace("'","");
    t[10] = status(t[1]);
    newJobs[i] = {JobId:t[0],StIcon:t[10],Status:t[1],MinorStatus:t[2],ApplicationStatus:t[3],Site:t[4],JobName:t[5],LastUpdate:t[6],Sign:t[9],SubmissionTime:t[8],Owner:t[7]};
  }
  YAHOO.example.Data = {"startIndex":0,"sort":null,"dir":"asc",jobs:newJobs}
  total = parseInt(total);
  showPage(total);
</script>
