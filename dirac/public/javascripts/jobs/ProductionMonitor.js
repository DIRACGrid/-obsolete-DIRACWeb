var x = 0;
var y = 0;
var counter = 25;
var total = "";
var jobLegend = "";
function parseRequest(r){
  var req = r.responseText;
  var type = r.argument;
  wait.hide();
  if(type != "jdl"){
    req = req.replace("]]","");
    req = req.replace("[[","");
    var jobs = req.split("], [");
    var newJobs = new Array();
    if((req == "[]") || (jobs.length == 0)){
      xz.hide();
      alert("Can't parse server response: " + req);
      return;
    }
  }else{
    if (req == "false") {
      xz.hide();
      alert("\tNo JDL found");
      return;
    }
  }
  if(type == "main"){
    total = jobs.pop();
    jobLegend = jobs.pop();
    for(var i = 0; i < jobs.length; i++){
      var t = jobs[i].split("', '");
      t[0] = t[0].replace("'","");
      t[8] = t[8].replace("'","");
      newJobs[i] = {JobId:t[0], Status:t[1], MinorStatus:t[2], ApplicationStatus:t[3], Site:t[4], JobName:t[5], LastUpdate:t[6], SubmitionTime:t[8], Owner:t[7]};
    }
  }else if(type == "log"){
    for(var i = 0; i < jobs.length; i++){
      var t = jobs[i].split("', '");
      t[0] = t[0].replace("'","");
      t[3] = t[3].replace("'","");
      newJobs[i] = {DateTime:t[3], Status:t[1], MinorStatus:t[2], Source:t[0]};
    }
    var temp_defs = [
      {key:"Source", sortable:true, resizeable:true},
      {key:"Status", sortable:true, resizeable:true},
      {key:"MinorStatus", sortable:true, resizeable:true},
      {key:"DateTime", sortable:true, resizeable:true}
    ];
    var temp_datas = new YAHOO.util.DataSource(newJobs);
    temp_datas.responseSchema = {fields: ["Source","Status","MinorStatus","DateTime"]};
  }else if(type == "info"){
    for(var i = 0; i < jobs.length; i++){
      var t = jobs[i].split("', '");
      t[0] = t[0].replace("'","");
      t[1] = t[1].replace("'","");
      newJobs[i] = {Name:t[0], Value:t[1]};
    }
    var temp_defs = [
      {key:"Name", lable:"Parameter Name", sortable:true, resizeable:true},
      {key:"Value", sortable:true, resizeable:true}
    ];
    var temp_datas = new YAHOO.util.DataSource(newJobs);
    temp_datas.responseSchema = {fields: ["Name","Value"]};
  }else if(type == "jdl"){
    xz.setBody("<div id=\"xz_body\"><pre class=\"jdl\">" + req + "</pre></div>");
  }else{
    return;
  }
  if((type == "log") || (type == "info")){
    temp_datas.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
    var temp_table = new YAHOO.widget.DataTable("xz_body",temp_defs,temp_datas);
  }else if(type == "main"){
    return newJobs
  }
// Set the window size dynamicly
  var width = 'CSS1Compat' && !window.opera?document.documentElement.clientWidth:document.body.clientWidth;
  var width_element = document.getElementById('xz_body').clientWidth;
  if(width_element > width - 20){
    width = width - 20;
  }else{
    width = width_element + 20;
  }
  var height = 'CSS1Compat' && !window.opera?document.documentElement.clientHeight:document.body.clientHeight;
  var height_element = document.getElementById('xz_body').clientHeight;
  if(height_element > height - 20){
    height = height - 20;
  }else{
    height = height_element + 50;
  }
  xz.cfg.setProperty("width",width + "px");
  xz.cfg.setProperty("height",height + "px");
  document.getElementById("xz_body").style.overflow = "auto";
}
function setupPanel(id,e){
  xz.cfg.setProperty("width","600px");
  xz.cfg.setProperty("height","400px");
  xz.setHeader("Production Name: " + id);
  xz.setBody("<div id=\"xz_body\"></div>");
  xz.render(document.body);
  xz.show();
  xz.cfg.setProperty("xy", [x,y]);
}
function getInfo(id,selector){
  if((id == null) || (id == "")) return;
  if((selector == null) || (selector == "")){
    selector = "Comment";
  }
  var url = "/jobs/WF/action?getInfo=" + id + "&mode=" + selector;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest("GET",url,{success:parseRequest,failure:connectBad,argument:"jdl"},"");
  setupPanel(id);
}
function getBasicInfo(id){
  if ((id == null) || (id == "")) return;
  var url = "/jobs/JobMonitor/action?getBasicInfo=" + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('GET',url,{success:parseRequest,failure:connectBad,argument:"info"},"");
  setupPanel(id);
}
function getParams(id){
  if ((id == null) || (id == "")) return;
  var url = "/jobs/JobMonitor/action?getParams=" + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('GET',url,{success:parseRequest,failure:connectBad,argument:"info"},"");
  setupPanel(id);
}
function getLoggingInfo(id){
 if ((id == null) || (id == "")) return;
  var url = "/jobs/JobMonitor/action?LoggingInfo=" + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('GET',url,{success:parseRequest,failure:connectBad,argument:"log"},"");
  setupPanel(id);
}
function showPage(totaljobs){
  var url = parseFilter();
  var pages = Math.ceil(totaljobs/counter);
  var pages_content = ""
  for (var i = 0; i < pages; i++) {
    var j = i + 1;
    pages_content = pages_content + "<a class=\"yui-dt-page\" href=\"javascript:submit(" + j + ");\">" + j + "</a>";
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
function submit(xxx){
  if ((xxx == null) || (xxx == "")){
    var page = 0;
  }else{
    var page = parseInt(xxx);
    if (isNaN(page) == true){
      page = 0;
    }
  }
  var url = parseFilter();
  url = url + "&page=" + page;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('POST',url,{success:updateTable,failure:connectBad},"");
}
function updateTable(r) {
  wait.hide();
  var response = r.responseText;
  if ((response == "There are no jobs to fit your criteria")||(response == "There is no summary for the job(s)")) {
    alert(response);
    return
  }
  response = response.replace("]]","");
  response = response.replace("[[","");
  var jobArray = response.split("], [");
  total = jobArray.pop();
  jobLegend = jobArray.pop();
  var newJobs = new Array();
  if (jobArray.length == 0){
    alert("Can't parse server response: " + response);
    return
  }
  var t = "";
  for (var i = 0; i < jobArray.length; i++) {
    t = jobArray[i].split(", ");
    t[0] = t[0].replace(/'/g,"");
    t[1] = t[1].replace(/'/g,"");
    t[2] = t[2].replace(/'/g,"");
    t[3] = t[3].replace(/'/g,"");
    t[7] = t[7].replace(/'/g,"");
    prod[i] = {ProdId:t[0], ProdName:t[1], Status:t[2], DN:t[3], JobsTotal:t[4], JobsSubmitted:t[5], JobLast:t[6], Parent:t[7], Description:t[8]};
  }
  YAHOO.example.Data = {"startIndex":0,"sort":null,"dir":"asc",jobs:newJobs};
  YAHOO.example.Basic.myDataTable.initializeTable(YAHOO.example.Data.jobs);
  total = parseInt(total);
  showPage(total);
}
function deleteProduction(){
  var inputs = document.getElementsByTagName('input');
  var job = new Array();
  var j = 0;
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].checked == true){
      job[j] = inputs[i].id;
      j = j + 1;
    }
  }
  if (job.length < 1){
    alert("No productions were selected");
    return
  }
  if (job.length == 1){
    var c = confirm ("Are you sure you want to delete production " + job[0] + "?");
  }else{
    var c = confirm ("Are you sure you want to delete these productions?");
  }
  if (c == false){
    return
  }
  var url = "/jobs/WF/action?delProd=" + job;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('POST', url, {success:updateDel,failure:connectBad},"");
}
function updateDel(r){
  var response = r.responseText;
  if (response != 0){
    wait.hide();
    alert(response);
    return
  }
//  submit();
}
function selectAll(selection){
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
function fMenu(id,x,y,stat){
  job_menu.clearContent();
  job_menu.addItems([
    {text:"Show Comment",url:"javascript:getInfo('" + id + "','Comment')"},
    {text:"Show Full DN",url:"javascript:getInfo('" + id + "','DN')"},
    {text:"Show Template",url:"javascript:getInfo('" + id + "','DN')"},
    {text:"Edit Production",url:"javascript:editProd('" + id + "')"}
  ]);
  if(stat == "Start"){
    job_menu.addItems([
      {text:"Stop Production",url:"javascript:stopProd('" + id + "')"}
    ]);
  }else{
    job_menu.addItems([
      {text:"Start Production",url:"javascript:startProd('" + id + "')"}
    ]);
  }
  job_menu.setItemGroupTitle("Production ID: " + id, 0); 
  job_menu.render(document.body);
  job_menu.cfg.setProperty("xy", [x,y]);
  job_menu.show();
}
job_menu = new YAHOO.widget.Menu("xxx_menu", { xy: [0,0], showdelay: "250", position: "dynamic" });
//YAHOO.util.Event.addListener("submit_filter", "click", submit);
YAHOO.util.Event.addListener("delProd1", "click", deleteProduction);
YAHOO.util.Event.addListener("delProd2", "click", deleteProduction);
YAHOO.util.Event.addListener(window, "load", function() {
  YAHOO.example.Basic = new function() {
    this.chk = function(elCell, oData){
      var id = oData._oData.ProdName;
      id = id.replace(/ /g,"");;
      elCell.innerHTML = "<input id=\"" + id + "\" class=\"yui-dt-checkbox\" type=\"checkbox\"/>"
    }
    var myColumnDefs = [
      {label:"", formatter:this.chk},
      {label:"ID", key:"ProdId", formatter:YAHOO.widget.DataTable.formatNumber, sortable:true, resizeable:true},
      {label:"Name", key:"ProdName", sortable:true, resizeable:true},
      {label:"Status", key:"Status", sortable:true, resizeable:true},
      {label:"Owner", key:"DN", sortable:true, resizeable:true},
      {label:"Total Jobs", key:"JobsTotal", sortable:true, resizeable:true},
      {label:"Submitted", key:"JobsSubmitted", sortable:true, resizeable:true},
      {label:"Last Submitted Job", key:"JobLast", sortable:true, resizeable:true},
      {label:"Parent", key:"Parent", sortable:true, resizeable:true},
      {label:"Short Description", key:"Description", sortable:true, resizeable:true}
    ];
    this.myDataSource = new YAHOO.util.DataSource(YAHOO.example.Data.productions);
    this.myDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
    this.myDataSource.responseSchema = {
      fields: ["ProdId","ProdName","Status","DN","JobsTotal","JobsSubmitted","JobLast","Parent","Description"]
    };
    this.myDataTable = new YAHOO.widget.DataTable("job_status_div", myColumnDefs, this.myDataSource);
    this.myDataTable.subscribe("rowMouseoverEvent", this.myDataTable.onEventHighlightRow); 
    this.myDataTable.subscribe("rowMouseoutEvent", this.myDataTable.onEventUnhighlightRow);
    this.myDataTable.subscribe("rowClickEvent", function(e){
      x = e.event.pageX;
      y = e.event.pageY;
      var t = e.target;
      var rec = this.getRecord(t);
      var id = rec.getData("ProdId");
      var stat = rec.getData("Status");
      if(e.event.target.yuiColumnId != "0"){
        fMenu(id,x,y,stat);
      }
    });
  };
});
xz = new YAHOO.widget.Panel("xz",{visible:false,draggable:true,close:true,constraintoviewport:true});
wait = new YAHOO.widget.Panel("w",{visible:false,draggable:false,close:false,fixedcenter:true,modal:true});
wait.setBody("<img src='/images/loading/loading-3.gif' width='66' height='66'>");
function connectBad(){
  wait.hide();
  alert("Unable to connect server");
  return
}
