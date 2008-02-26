var x = 0;
var y = 0;
var counter = 25;
var total = "";
var jobLegend = "";
function initWebRoot(url){
  gURLRoot = url;
  wait = new YAHOO.widget.Panel("w",{visible:false,draggable:false,close:false,fixedcenter:true,modal:true});
  wait.setBody("<img src='"+gURLRoot+"/loading/loading-3.gif' width='66' height='66'>");
}
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
function actionJob(some_useless_rubbish_here,mode,job){
  var id = createURL(mode,job);
  if(id == 0){
    return
  }
  var url = 'action?' + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('POST',url,{success:parseRequest,failure:connectBad,argument:"act"},"");
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
  return "action?Refresh=true"
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
  response = response.replace(/"/g,"");
  response = response.replace(/'/g,"");
  var jobArray = response.split("], [");
  var prod = new Array();
  if (jobArray.length == 0){
    alert("Can't parse server response: " + response);
    return
  }
  var t = "";
  for (var i = 0; i < jobArray.length; i++) {
    t = jobArray[i].split(", ");
    prod[i] = {ProdId:t[0],ProdName:t[1],Status:t[2],DN:t[3],Created:t[4],Submited:t[5],Wait:t[6],Running:t[7],Done:t[8],Failed:t[9],Parent:t[10],Description:t[11],CreationDate:t[12]};
  }
  YAHOO.example.Data = {"startIndex":0,"sort":null,"dir":"asc",productions:prod}
  YAHOO.example.Basic.myDataTable.initializeTable(YAHOO.example.Data.productions);
}
function createURL(mode,id){
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
      alert("No productions were selected");
      return 0
    }
  }else{
    job[0] = id;
  }
  if (job.length == 1){
    var c = confirm ("Are you sure you want to " + mode + " production " + job[0] + "?");
  }else{
    var c = confirm ("Are you sure you want to " + mode + " these production?");
  }
  if (c == false){
    return 0;
  }
  var url = "action";
  if(mode=="delete"){
    job = "delProd=" + job;
  }else if(mode=="start"){
    job = "startProd=" + job;
  }else if(mode=="stop"){
    job = "stopProd=" + job;
  }
  return job
}
function actionJob(some_useless_rubbish_here,mode,job){
  var id = createURL(mode,job);
  if(id == 0){
    return
  }
  var url = 'action?' + id;
  wait.render(document.body);wait.show();
  var myAjax = YAHOO.util.Connect.asyncRequest('POST',url,{success:submit,failure:connectBad},"");
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
function showJobs(id){
  var url = 'https://lhcbtest.pic.es/DIRAC/jobs/JobMonitor/display?counter=25&job_up=&applic=&status=&site=&sort=JobID:ASC&page=0&prodname=' + id;
  location.href = url;
}
function fMenu(id,x,y,stat){
  job_menu.clearContent();
  job_menu.addItems([
    {text:"Show Jobs",url:"javascript:showJobs('" + id + "')"}
  ]);
  if((stat == "Start")||(stat == "Active")){
    job_menu.addItems([
      {text:"Stop Production",url:"javascript:actionJob('some_useless_rubbish_here','stop','" + id + "')"}
    ]);
  }else{
    job_menu.addItems([
      {text:"Start Production",url:"javascript:actionJob('some_useless_rubbish_here','start','" + id + "')"}
    ]);
  }
  job_menu.setItemGroupTitle("Production ID: " + id, 0);
  job_menu.render(document.body);
  job_menu.cfg.setProperty("xy", [x,y]);
  job_menu.show();
}
job_menu = new YAHOO.widget.Menu("xxx_menu", { xy: [0,0], showdelay: "250", position: "dynamic" });
YAHOO.util.Event.addListener("submit_filter","click",submit);
YAHOO.util.Event.addListener("top_JRef","click",submit);
YAHOO.util.Event.addListener("top_selectA","click",selectAll,"all");
YAHOO.util.Event.addListener("top_selectN","click",selectAll,"none");
YAHOO.util.Event.addListener("top_JSta","click",actionJob,"start");
YAHOO.util.Event.addListener("top_JSto","click",actionJob,"stop");
YAHOO.util.Event.addListener("top_JDel","click",actionJob,"delete");
YAHOO.util.Event.addListener("bottom_JRef","click",submit);
YAHOO.util.Event.addListener("bottom_selectA","click",selectAll,"all");
YAHOO.util.Event.addListener("bottom_selectN","click",selectAll,"none");
YAHOO.util.Event.addListener("bottom_JSta","click",actionJob,"start");
YAHOO.util.Event.addListener("bottom_JSto","click",actionJob,"stop");
YAHOO.util.Event.addListener("bottom_JDel","click",actionJob,"delete");
YAHOO.util.Event.addListener(window, "load", function() {
  YAHOO.example.Basic = new function() {
    this.chk = function(elCell, oData){
      var id = oData._oData.ProdId;
      id = id.replace(/ /g,"");
      elCell.innerHTML = "<input id=\"" + id + "\" class=\"yui-dt-checkbox\" type=\"checkbox\"/>"
    }
    var myColumnDefs = [
      {label:"", formatter:this.chk},
      {label:"ID", key:"ProdId", formatter:YAHOO.widget.DataTable.formatNumber, sortable:true, resizeable:true},
      {label:"Name", key:"ProdName", sortable:true, resizeable:true},
      {label:"Status", key:"Status", sortable:true, resizeable:true},
      {label:"Created Jobs", key:"Created", sortable:true, resizeable:true},
      {label:"Submitted Jobs", key:"Submited", sortable:true, resizeable:true},
      {label:"Waiting Jobs", key:"Wait", sortable:true, resizeable:true},
      {label:"Running Jobs", key:"Running", sortable:true, resizeable:true},
      {label:"Done Jobs", key:"Done", sortable:true, resizeable:true},
      {label:"Failed Jobs", key:"Failed", sortable:true, resizeable:true},
      {label:"Description", key:"Description", sortable:true, resizeable:true},
      {label:"CreationDate [UTC]", key:"CreationDate", formatter:YAHOO.widget.DataTable.formatDate, sortable:true, resizeable:true},
      {label:"Owner", key:"DN", sortable:true, resizeable:true}
    ];
    this.myDataSource = new YAHOO.util.DataSource(YAHOO.example.Data.productions);
    this.myDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
    this.myDataSource.responseSchema = {
      fields: ["ProdId","ProdName","Status","DN","Created","Submited","Wait","Running","Done","Failed","Parent","Description","CreationDate"]
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
