var x = 0;
var y = 0;
var counter = 25;
var total = "";
var page = 0;
var jobLegend = "";
var gURLRoot = "";

function initWebRoot( url )
{
	gURLRoot = url;
}

function showkal(){
  if(document.getElementById("kalendar") == null){
    var k = new YAHOO.widget.Panel("kalendar",{visible:true,draggable:false,close:true,constraintoviewport:true,context:["jobupdate","tl","bl"],zindex:3000});
    k.setBody("<div id='kal'></div>");
    k.setHeader("Pick the date:");
    k.render(document.body);
    k.subscribe("hide", function(){
        var z = document.getElementById("kalendar");
        z = z.parentNode;
        z.parentNode.removeChild(z);
      }
    );
    var cal = new YAHOO.widget.Calendar("cal1","kal");
    cal.render();
    cal.selectEvent.subscribe(handleSelect, cal, true);
  }else{
    var z = document.getElementById("kalendar");
    z = z.parentNode;
    z.parentNode.removeChild(z);
  }
}
function handleSelect(type,args,obj) {
  var dates = args[0];
  var date = dates[0];
  var year = date[0], month = date[1] + "", day = date[2] + "";
  var show = document.getElementById("jobupdate");
  if(month.length == 1){
    month = "0" + month;
  }
  if(day.length == 1){
    day = "0" + day;
  }
  show.value = year + "-" + month + "-" + day;
  var z = document.getElementById("kalendar");
  z = z.parentNode;
  z.parentNode.removeChild(z);
}
function status(value){
  if(value == "Done"){
    return "<img src='"+gURLRoot+"/monitoring/done.gif'>";
  }else if(value == "Failed"){
    return "<img src='"+gURLRoot+"/monitoring/failed.gif'>";
  }else if(value == "Waiting"){
    return "<img src='"+gURLRoot+"/monitoring/waiting.gif'>";
  }else if(value == "Deleted"){
    return "<img src='"+gURLRoot+"/monitoring/deleted.gif'>";
  }else if(value == "Matched"){
    return "<img src='"+gURLRoot+"/monitoring/matched.gif'>";
  }else if(value == "Running"){
    return "<img src='"+gURLRoot+"/monitoring/running.gif'>";
  }else{
    return "<img src='"+gURLRoot+"/monitoring/unknown.gif'>";
  }
}
function parseInput(response,mode){
  response = response.replace("]]","");
  response = response.replace("[[","");
  var responseArray = response.split("], [");
  if(responseArray.length == 0){
    xz.hide();
    alert("Can't parse server response: " + response);
    return
  }
  var returnArray = new Array();
  if(mode == "jobs"){
    page = responseArray.pop();
    total = responseArray.pop();
    jobLegend = responseArray.pop();
    for(var i = 0; i < responseArray.length; i++){
      var t = responseArray[i].split("', '");
      t[0] = t[0].replace("'","");
      t[8] = t[8].replace("'","");
      t[9] = status(t[1]);
      id = t[0] * 1;
      returnArray[i]={JobId:id,StIcon:t[9],Status:t[1],MinorStatus:t[2],ApplicationStatus:t[3],Site:t[4],JobName:t[5],LastUpdate:t[6],SubmissionTime:t[8],Owner:t[7]};
    }
  }else if(mode == "prod"){
    total = responseArray.pop();
    jobLegend = responseArray.pop();
    for(var i = 0; i < responseArray.length; i++){
      var t = responseArray[i].split(", ");
      t[0] = t[0].replace(/'/g,"");
      t[1] = t[1].replace(/'/g,"");
      t[2] = t[2].replace(/'/g,"");
      t[3] = t[3].replace(/'/g,"");
      t[7] = t[7].replace(/'/g,"");
      t[2] = status(t[2]);
      returnArray[i]={ProdId:t[0], ProdName:t[1], Status:t[2], DN:t[3], JobsTotal:t[4], JobsSubmitted:t[5], JobLast:t[6], Parent:t[7], Description:t[8]};
    }
  }else if(mode == "room"){
    for(var i = 0; i < responseArray.length; i++){
      var t = responseArray[i].split(", ");
      t[0] = t[0].replace(/'/g,"");
      t[4] = t[4].replace(/'/g,"");
      returnArray[i]={Site:"tier1", Stat:tier1[0], Total:tier1[1], Up:tier1[2], Dwn:tier1[3], nOK:tier1[4]};
    }
  }else if(mode == "info"){
    for(var i = 0; i < responseArray.length; i++){
      var t = responseArray[i].split(", ");
      t[0] = t[0].replace(/'/g,"");
      t[1] = t[1].replace(/'/g,"");
      returnArray[i]={Name:t[0], Value:t[1]};
    }
  }else if(mode="log"){
    for(var i = 0; i < responseArray.length; i++){
      var t = responseArray[i].split(", ");
      t[0] = t[0].replace(/'/g,"");
      t[1] = t[1].replace(/'/g,"");
      t[2] = t[2].replace(/'/g,"");
      t[3] = t[3].replace(/'/g,"");
      t[4] = t[4].replace(/'/g,"");
      if(t[2] == "Unknown"){
        t[2] = "";
      }
      returnArray[i]={DateTime:t[3], Status:t[0], MinorStatus:t[1], Source:t[4], ApplicationStatus:t[2]};
    }
  }
  return returnArray
}
function parseRequest(r){
  var req = r.responseText;
  wait.hide();
  if ((req == "There are no jobs to fit your criteria")||(req == "There is no summary for the job(s)")) {
    xz.hide();
    alert(req);
    return
  }
  var type = r.argument;
  if(type != "jdl"){
    if(type == "act"){
      if(req != 0){
        alert(req);
        return
      }else{
        alert("Operation finished successfully");
        return
      }
    }
    data = parseInput(req,type);
    if(type == "jobs"){
      YAHOO.example.Data = {"startIndex":0,"sort":null,"dir":"asc",jobs:data};
      YAHOO.example.Basic.myDataTable.initializeTable(YAHOO.example.Data.jobs);
      var sortedBy = YAHOO.example.Basic.myDataTable._configs.sortedBy.value.key;
      sortedBy = YAHOO.example.Basic.myDataTable.getColumn(sortedBy);
      YAHOO.example.Basic.myDataTable.sortColumn(sortedBy);
      YAHOO.example.Basic.myDataTable.sortColumn(sortedBy);
//      var sortKey = YAHOO.example.Basic.myDataTable._configs.sortedBy.value.key;
      total = parseInt(total);
//      if((total > counter) && (page > 1)){
        showPage(total);
//      }else{
//        showPage(0);
//      }
    }else if(type == "prod"){
      YAHOO.example.Data = {"startIndex":0,"sort":null,"dir":"asc",jobs:newJobs};
      YAHOO.example.Basic.myDataTable.initializeTable(YAHOO.example.Data.jobs);
      total = parseInt(total);
      showPage(total);
    }else if(type == "log"){
      var temp_defs = [
        {key:"Source", sortable:true, resizeable:true},
        {key:"Status", sortable:true, resizeable:true},
        {key:"MinorStatus", sortable:true, resizeable:true},
        {key:"ApplicationStatus", sortable:true, resizeable:true},
        {key:"DateTime", sortable:true, resizeable:true}
      ];
      var temp_datas = new YAHOO.util.DataSource(data);
      temp_datas.responseSchema = {fields: ["Source","Status","MinorStatus","ApplicationStatus","DateTime"]};
      temp_datas.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
      var temp_table = new YAHOO.widget.DataTable("xz_body",temp_defs,temp_datas);
    }else if(type == "info"){
      var temp_defs = [
        {key:"Name", lable:"Parameter Name", sortable:true, resizeable:true},
        {key:"Value", sortable:true, resizeable:true}
      ];
      var temp_datas = new YAHOO.util.DataSource(data);
      temp_datas.responseSchema = {fields: ["Name","Value"]};
      temp_datas.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
      var temp_table = new YAHOO.widget.DataTable("xz_body",temp_defs,temp_datas);
    }
  }else{
    if (req == "false") {
      xz.hide();
      alert("\tNo JDL found");
      return;
    }
    xz.setBody("<div id=\"xz_body\"><pre class=\"jdl\">" + req + "\n</pre></div>");
  }
  setPanel(type);
}
function setPanel(type){
  var width = 'CSS1Compat' && !window.opera?document.documentElement.clientWidth:document.body.clientWidth;
  if(document.getElementById("xz_body") != null){
    var width_element = document.getElementById('xz_body').clientWidth;
    if(width_element > width - 20){
      width = width - 20;
    }else{
      if(type == "jdl"){
        width = (2 * width) / 3;
      }else{
        width = width_element + 20;
      }
    }
    var height = 'CSS1Compat' && !window.opera?document.documentElement.clientHeight:document.body.clientHeight;
    var height_element = document.getElementById('xz_body').clientHeight;
    if(height_element > height - 20){
      height = height - 20;
    }else{
      height = height_element + 50;
    }
    document.getElementById('xz_body').style.height = (height - 35) + "px";
    xz.cfg.setProperty("width",width + "px");
    xz.cfg.setProperty("height",height + "px");
    document.getElementById("xz_body").style.overflow = "auto";
  }
}
function setupPanel(id,e){
  xz.cfg.setProperty("width","600px");
  xz.cfg.setProperty("height","400px");
  xz.setHeader("Job ID: " + id);
  xz.setBody("<div id=\"xz_body\"></div>");
  xz.render(document.body);
  xz.show();
  xz.cfg.setProperty("xy", [x-300,y-200]);
}
function clear(){
  var x = document.getElementById("kalendar");
  if(x != null){
    x = z.parentNode;
    x.parentNode.removeChild(z);
  }
  xz.hide();
}
function showPage(totaljobs){
  var url = parseFilter();
  var pages = Math.ceil(totaljobs/counter);
  var pages_content = ""
  page = page * 1;
  if(pages > 10){
    if(page > 3){
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + 1 + ");\">" + 1 + "</a>";
      pages_content = pages_content + "&nbsp;&nbsp;...&nbsp;&nbsp;<a class=\"yui-dt-page\" href=\"javascript:submit(" + (page - 1) + ");\">" + (page - 1) + "</a>";
    }else if(page == 3){
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + 1 + ");\">" + 1 + "</a>";
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + 2 + ");\">" + 2 + "</a>";
    }else if(page == 2){
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + 1 + ");\">" + 1 + "</a>";
    }
    pages_content = pages_content + "&nbsp;&nbsp;<b>" + page + "</b>&nbsp;&nbsp;";
    if(page < pages - 2){
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + (page + 1) + ");\">" + (page + 1) + "</a>&nbsp;&nbsp;...&nbsp;&nbsp;";
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + (pages) + ");\">" + (pages) + "</a>";
    }else if(page == pages - 2){
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + (pages - 1) + ");\">" + (pages - 1) + "</a>";
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + (pages) + ");\">" + (pages) + "</a>";
    }else if(page == pages - 1){
      pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + (pages) + ");\">" + (pages) + "</a>";
    }
  }else{
    for(var i = 0; i < pages; i++){
      var j = i + 1;
      if(j == page){
        pages_content = pages_content + "&nbsp;&nbsp;<b>" + j + "</b>&nbsp;&nbsp;";
      }else{
        pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + j + ");\">" + j + "</a>";
      }
    }
  }
  document.getElementById("bottom_jobs_counter").innerHTML = "jobs, out of: " + totaljobs;
  document.getElementById("top_jobs_counter").innerHTML = "jobs, out of: " + totaljobs;
  document.getElementById("bottom_page").innerHTML = pages_content;
  document.getElementById("top_page").innerHTML = pages_content;
}
function parseFilter(){
  var job_up = document.getElementById("jobupdate").value;
  var job_id = document.getElementById("jobid").value;
  var owner = document.getElementById("owner").value;
  var application = document.getElementById("applic").value;
  var status = document.getElementById("status").value;
  var site = document.getElementById("site").value;
  var g_sort = document.getElementById("global_sort").value;
  var url = "/jobs/JobMonitor/submit?counter=" + counter;
  if (job_id != ""){
    url = "/jobs/JobMonitor/submit?jobid=" + job_id;
  }else{
    url = url + "&job_up=" + job_up;
    url = url + "&owner=" + owner + "&applic=" + application;
    url = url + "&status=" + status + "&site=" + site;
    url = url + "&sort=" + g_sort;
  }
  return url
}
function changePage(sel){
  if((sel == null) || (sel == "")){
    return;
  }
  counter = document.getElementById(sel).value;
  if(sel=="top_pages_number"){
    document.getElementById("bottom_pages_number").value = counter;
  }else{
    document.getElementById("top_pages_number").value = counter;
  }
  submit();
}
function createURL(mode,id){
//  clear();
  if(mode == "submit"){
    if((id == null) || (id == "")){
      var page = 0;
    }else{
      var page = parseInt(id);
      if (isNaN(page) == true){
        page = 0;
      }
    }
    return page
  }
  var job = new Array();
  if((id == null) || (id == "")){
    var inputs = document.getElementsByTagName('input');
    var j = 0;
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].checked == true){
        job[j] = inputs[i].id;
        j = j + 1;
      }
    }
    if (job.length < 1){
      alert("No jobs were selected");
      return 0
    }
  }else{
    job[0] = id;
  }
  if (job.length == 1){
    var c = confirm ("Are you sure you want to " + mode + " job " + job[0] + "?");
  }else{
    var c = confirm ("Are you sure you want to " + mode + " these jobs?");
  }
  if (c == false){
    return 0;
  }
  var url = "/jobs/JobMonitor/action";
  if(mode=="delete"){
    job = "deleteJobs=" + job;
  }else if(mode=="kill"){
    job = "killJobs=" + job;
  }else if(mode=="reset"){
    job = "resetJobs=" + job;
  }
  return job
}
function selectAll(e,selection){
  var inputs = document.getElementsByTagName('input');
  if(selection=="all"){
    var ch = 0;
  }else if(selection=="none"){
    var ch = 1;
  }else{
    var ch = 0;
  }
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].type && inputs[i].type == "checkbox"){
      if (ch == 0){
        inputs[i].checked = true;
      }else{
        inputs[i].checked = false;
      }
    }
  }
}
function jobch(s){
  if(s == "s"){
    document.getElementById("jobupdate").disabled = true;
    document.getElementById("owner").disabled = true;
    document.getElementById("applic").disabled = true;
    document.getElementById("status").disabled = true;
    document.getElementById("site").disabled = true;
  }else if(s == "u"){
    document.getElementById("jobupdate").disabled = false;
    document.getElementById("owner").disabled = false;
    document.getElementById("applic").disabled = false;
    document.getElementById("status").disabled = false;
    document.getElementById("site").disabled = false;
  }
}
function submit(id){
  var url = parseFilter();
  page = createURL("submit",id)
  url = url + "&page=" + page;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('POST',url,{success:parseRequest,failure:connectBad,argument:"jobs"},"");
}
function actionJob(some_useless_rubbish_here,mode,job){
  var id = createURL(mode,job);
  if(id == 0){
    return
  }
  var url = '/jobs/JobMonitor/action?' + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('POST',url,{success:parseRequest,failure:connectBad,argument:"act"},"");
}
function getJdl(id){
  if((id == null) || (id == "")) return;
  var url = "/jobs/JobMonitor/action?getJDL=" + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest("GET",url,{success:parseRequest,failure:connectBad,argument:"jdl"},"");
  setupPanel(id);
}
function getStandardOutput(id){
  if((id == null) || (id == "")) return;
  var url = "/jobs/JobMonitor/action?getStandardOutput=" + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('GET',url,{success:parseRequest,failure:connectBad,argument:"jdl"},"");
  setupPanel(id);
}
function getBasicInfo(id){
  if((id == null) || (id == "")) return;
  var url = "/jobs/JobMonitor/action?getBasicInfo=" + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('GET',url,{success:parseRequest,failure:connectBad,argument:"info"},"");
  setupPanel(id);
}
function getParams(id){
  if((id == null) || (id == "")) return;
  var url = "/jobs/JobMonitor/action?getParams=" + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('GET',url,{success:parseRequest,failure:connectBad,argument:"info"},"");
  setupPanel(id);
}
function getLoggingInfo(id){
 if((id == null) || (id == "")) return;
  var url = "/jobs/JobMonitor/action?LoggingInfo=" + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('GET',url,{success:parseRequest,failure:connectBad,argument:"log"},"");
  setupPanel(id);
}
function pilot(some_useless_rubbish_here,mode,id){
  if((id == null) || (id == "")) return;
  if(mode == "out"){
    var url = "/jobs/JobMonitor/action?pilotStdOut=" + id;
  }else if(mode == "err"){
    var url = "/jobs/JobMonitor/action?pilotStdErr=" + id;
  }
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('GET',url,{success:parseRequest,failure:connectBad,argument:"jdl"},"");
  setupPanel(id);
}
function fuckinMenu(id,x,y){
  job_menu.clearContent();
  job_menu.addItems([
    {text:"JDL",url:"javascript:getJdl(" + id + ")"},
    {text:"Attributes",url:"javascript:getBasicInfo(" + id + ")"},
    {text:"Parameters",url:"javascript:getParams(" + id + ")"},
    {text:"Logging info",url:"javascript:getLoggingInfo(" + id + ")"},
    {text:"StandardOutput",url:"javascript:getStandardOutput(" + id + ")"},
    {text:"Actions", submenu:{id:"sub1",itemdata: [
      {text:"Reset",url:"javascript:actionJob('tmp','reset'," + id + ")"},
      {text:"Kill",url:"javascript:actionJob('tmp','kill'," + id + ")"},
      {text:"Delete",url:"javascript:actionJob('tmp','delete'," + id + ")"}
    ]}},
    {text:"Pilot", submenu:{id:"sub2",itemdata: [
      {text:"Get StdOut",url:"javascript:pilot('tmp','out'," + id + ")"},
      {text:"Get StdErr",url:"javascript:pilot('tmp','err'," + id + ")"}
    ]}}
  ]);
  job_menu.setItemGroupTitle("Job ID: " + id, 0);
  job_menu.render(document.body);
  job_menu.cfg.setProperty("xy", [x,y]);
  job_menu.show();
}
xz = new YAHOO.widget.Panel("xz",{visible:false,draggable:true,close:true,constraintoviewport:true});
wait = new YAHOO.widget.Panel("w",{visible:false,draggable:false,close:false,fixedcenter:true,modal:true});
wait.setBody("<img src='"+gURLRoot+"/loading/loading-3.gif' width='66' height='66'>");
job_menu = new YAHOO.widget.Menu("xxx_menu", {xy:[0,0],showdelay:"250",position:"dynamic",zindex:4000});
YAHOO.util.Event.addListener("submit_filter","click",submit);
YAHOO.util.Event.addListener("jobupdate","click",showkal);
YAHOO.util.Event.addListener("global_sort","change",submit);
YAHOO.util.Event.addListener("top_selectA","click",selectAll,"all");
YAHOO.util.Event.addListener("top_selectN","click",selectAll,"none");
YAHOO.util.Event.addListener("top_JRes","click",actionJob,"reset");
YAHOO.util.Event.addListener("top_JKil","click",actionJob,"kill");
YAHOO.util.Event.addListener("top_JDel","click",actionJob,"delete");
YAHOO.util.Event.addListener("bottom_selectA","click",selectAll,"all");
YAHOO.util.Event.addListener("bottom_selectN","click",selectAll,"none");
YAHOO.util.Event.addListener("bottom_JRes","click",actionJob,"reset");
YAHOO.util.Event.addListener("bottom_JKil","click",actionJob,"kill");
YAHOO.util.Event.addListener("bottom_JDel","click",actionJob,"delete");
YAHOO.util.Event.addListener(window, "load", function() {
  YAHOO.example.Basic = new function() {
    this.chk = function(elCell, oData){
      var id = oData._oData.JobId;
      elCell.innerHTML = "<input id=\"" + id + "\" class=\"yui-dt-checkbox\" type=\"checkbox\"/>"
    }
    var myColumnDefs = [
      {label:"", formatter:this.chk, resizeable:true},
      {key:"JobId", formatter:YAHOO.widget.DataTable.formatNumber, sortable:true, resizeable:true},
      {label:"", key:"StIcon", resizeable:true},
      {key:"Status", sortable:true, resizeable:true},
      {key:"MinorStatus", sortable:true, resizeable:true},
      {key:"ApplicationStatus", sortable:true, resizeable:true},
      {key:"Site", sortable:true, resizeable:true},
      {key:"JobName", sortable:true, resizeable:true},
      {key:"LastUpdate", sortable:true, resizeable:true},
      {key:"SubmissionTime", sortable:true, resizeable:true},
      {key:"Owner", sortable:true, resizeable:true}
    ];
    this.myDataSource = new YAHOO.util.DataSource(YAHOO.example.Data.jobs);
    this.myDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
    this.myDataSource.responseSchema = {
      fields: ["JobId","StIcon","Status","MinorStatus","ApplicationStatus","Site","JobName","LastUpdate","SubmissionTime","Owner"]
    };
    this.myDataTable = new YAHOO.widget.DataTable("job_status_div",myColumnDefs,this.myDataSource,{sortedBy:{key:"JobId",dir:"asc"}});
    var sortedBy = this.myDataTable._configs.sortedBy.value.key;
    sortedBy = this.myDataTable.getColumn(sortedBy);
    this.myDataTable.sortColumn(sortedBy);
    this.myDataTable.sortColumn(sortedBy);
    this.myDataTable.subscribe("rowMouseoverEvent", this.myDataTable.onEventHighlightRow);
    this.myDataTable.subscribe("rowMouseoutEvent", this.myDataTable.onEventUnhighlightRow);
    this.myDataTable.subscribe("rowClickEvent", function(e){
      x = e.event.pageX;
      y = e.event.pageY;
      var t = e.target;
      var rec = this.getRecord(t);
      var id = rec.getData("JobId");
      if(e.event.target.yuiColumnId != "0"){
        fuckinMenu(id,x,y);
      }
    });
  };
});
function connectBad(){
  wait.hide();
  alert("Unable to connect server or it could be an error on server side");
  return
}
