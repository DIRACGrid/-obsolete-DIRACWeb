import logging, datetime, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gLogger
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["JobID","DESC"]]

class JobmonitorController(BaseController):
  __imgCache = DictCache()
################################################################################
  def display(self):
    pagestart = time()
    c.select = self.__getSelectionData()
    gLogger.info("SELECTION RESULTS:",c.select)
    gLogger.info("\033[0;31mJOB INDEX REQUEST:\033[0m %s" % (time() - pagestart))
    return render("jobs/JobMonitor.mako")
################################################################################
  def __getJobSummary(self,jobs,head):
    valueList = []
    gLogger.info("SERVER RESPONSE:",jobs)
    for i in jobs:
      valueList.append({"id":str(i[2]),"status":str(i[6]),"minorStatus":str(i[10]),"applicationStatus":str(i[11]),"site":str(i[26]),"jobname":str(i[22]),"lastUpdate":str(i[25]),"owner":str(i[31]),"submissionTime":str(i[12]),"signTime":str(i[3])})
    return valueList
################################################################################
  def __getPlot(self,id):
    rc = ReportsClient()
    transferClient = getTransferClient('Accounting/ReportGenerator')
    c.result = self.__imgCache.get(id)
    if not c.result:
      tmpFile = tempfile.TemporaryFile()
      result = transferClient.receiveFile(tmpFile,id)
      if result["OK"]:
#        data = result["Value"]
#        tmpFile = tempfile.TemporaryFile()
#        tmpFile.write(data)
        tmpFile.seek(0)
        c.result = tmpFile.read()
        response.headers['Content-type'] = 'image/png'
        response.headers['Content-Disposition'] = 'attachment; filename="%s"' % id
        response.headers['Content-Length'] = len(c.result)
        response.headers['Content-Transfer-Encoding'] = 'Binary'
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("10")
    return c.result
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = self.__request()
    gLogger.info("- REQUEST:",result)
    gLogger.info("PageNumber:",pageNumber)
    gLogger.info("NOJ:",numberOfJobs)
    result = RPC.getJobPageSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    if result["OK"]:
      result = result["Value"]
      if result.has_key("TotalRecords"):
        if  result["TotalRecords"] > 0:
          if result.has_key("ParameterNames") and result.has_key("Records"):
            if len(result["ParameterNames"]) > 0:
              if len(result["Records"]) > 0:
                c.result = []
                jobs = result["Records"]
                head = result["ParameterNames"]
                headLength = len(head)
                for i in jobs:
                  tmp = {}
                  for j in range(0,headLength):
                    tmp[head[j]] = i[j]
                  c.result.append(tmp)
                total = result["TotalRecords"]
                c.result = {"success":"true","result":c.result,"total":total}
              else:
                c.result = {"success":"false","result":"","error":"There are no data to display"}
            else:
              c.result = {"success":"false","result":"","error":"ParameterNames field is missing"}
          else:
            c.result = {"success":"false","result":"","error":"Data structure is corrupted"}
        else:
          c.result = {"success":"false","result":"","error":"There were no data matching your selection"}
      else:
        c.result = {"success":"false","result":"","error":"Data structure is corrupted"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31mJOB SUBMIT REQUEST:\033[0m %s" % (time() - pagestart))
    return c.result
################################################################################
  def __getSelectionData(self):
    callback = {}
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
        gLogger.info(" value ",request.params[i])
      callback["extra"] = tmp
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getProductionIds()
#    gLogger.info("- ProdIDs: ",result)
#    RPC = getRPCClient("ProductionManagement/ProductionManager")
#    result = RPC.getProductionSummary()
    if result["OK"]:
      prod = []
      prods = result["Value"]
      if len(prods)>0:
        prod.append([str("All")])
        tmp = []
        for keys in prods:
          try:
            id = str(int(keys)).zfill(8)
          except:
            id = str(keys)
          tmp.append(str(id))
        tmp.sort(reverse=True)
        for i in tmp:
          prod.append([str(i)])
      else:
        prod = "Nothing to display"
    else:
      prod = result["Message"]
    callback["prod"] = prod
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getSites()
    if result["OK"]:
      site = []
      if len(result["Value"])>0:
        site.append([str("All")])
        for i in result["Value"]:
          site.append([str(i)])
      else:
        site = "Nothing to display"
    else:
      site = "Error during RPC call"
    callback["site"] = site
    result = RPC.getStates()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          stat.append([str(i)])
      else:
        stat = "Nothing to display"
    else:
      stat = "Error during RPC call"
    callback["stat"] = stat
    gLogger.info("Before: ",prod)
    result = RPC.getMinorStates()
    gLogger.info("After: ",result)
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          stat.append([str(i)])
      else:
        stat = "Nothing to display"
    else:
      stat = "Error during RPC call"
    callback["minorstat"] = stat
    result = RPC.getApplicationStates()
    if result["OK"]:
      app = []
      if len(result["Value"])>0:
        app.append([str("All")])
        for i in result["Value"]:
          app.append([str(i)])
      else:
        app = "Nothing to display"
    else:
      app = "Error during RPC call"
    callback["app"] = app
    result = RPC.getOwners()
    if result["OK"]:
      owner = []
      if len(result["Value"])>0:
        owner.append([str("All")])
        for i in result["Value"]:
          owner.append([str(i)])
      else:
        owner = "Nothing to display"
    else:
      owner = "Error during RPC call"
    callback["owner"] = owner
    return callback
################################################################################
  def __request(self):
    req = {}
    global pageNumber
    if request.params.has_key("id") and len(request.params["id"]) > 0:
      pageNumber = 0
      req["JobID"] = str(request.params["id"])
    else:
      global numberOfJobs
      global globalSort
      if request.params.has_key("limit") and len(request.params["limit"]) > 0:
        if request.params.has_key("start") and len(request.params["start"]) > 0:
          numberOfJobs = int(request.params["limit"])
          pageNumber = int(request.params["start"])
        else:
          pageNumber = 0
      else:
        numberOfJobs = 25
      if request.params.has_key("prod") and len(request.params["prod"]) > 0:
        if str(request.params["prod"]) != "All":
          req["JobGroup"] = str(request.params["prod"]).split('::: ')
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        if str(request.params["site"]) != "All":
          req["Site"] = str(request.params["site"]).split('::: ')
      if request.params.has_key("stat") and len(request.params["stat"]) > 0:
        if str(request.params["stat"]) != "All":
          req["Status"] = str(request.params["stat"]).split('::: ')
      if request.params.has_key("minorstat") and len(request.params["minorstat"]) > 0:
        if str(request.params["minorstat"]) != "All":
          req["MinorStatus"] = str(request.params["minorstat"]).split('::: ')
      if request.params.has_key("app") and len(request.params["app"]) > 0:
        if str(request.params["app"]) != "All":
          req["ApplicationStatus"] = str(request.params["app"]).split('::: ')
      if request.params.has_key("owner") and len(request.params["owner"]) > 0:
        if str(request.params["owner"]) != "All":
          req["Owner"] = str(request.params["owner"]).split('::: ')
      if request.params.has_key("date") and len(request.params["date"]) > 0:
        if str(request.params["date"]) != "YYYY-mm-dd":
          req["LastUpdate"] = str(request.params["date"])
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
        key,value = globalSort.split(" ")
        globalSort = [[str(key),str(value)]]
      else:
        globalSort = [["JobID","DESC"]]
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getJDL") and len(request.params["getJDL"]) > 0:
      id = int(request.params["getJDL"])
      return self.__getJdl(id)
    elif request.params.has_key("getStandardOutput") and len(request.params["getStandardOutput"]) > 0:
      id = int(request.params["getStandardOutput"])
      return self.__getStandardOutput(id)
    elif request.params.has_key("getBasicInfo") and len(request.params["getBasicInfo"]) > 0:
      id = int(request.params["getBasicInfo"])
      return self.__getBasicInfo(id)
    elif request.params.has_key("LoggingInfo") and len(request.params["LoggingInfo"]) > 0:
      id = int(request.params["LoggingInfo"])
      return self.__getLoggingInfo(id)
    elif request.params.has_key("getParams") and len(request.params["getParams"]) > 0:
      id = int(request.params["getParams"])
      return self.__getParams(id)
    elif request.params.has_key("delete") and len(request.params["delete"]) > 0:
      id = request.params["delete"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__delJobs(id)
    elif request.params.has_key("kill") and len(request.params["kill"]) > 0:
      id = request.params["kill"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__killJobs(id)
    elif request.params.has_key("reset") and len(request.params["reset"]) > 0:
      id = request.params["reset"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__resetJobs(id)
    elif request.params.has_key("pilotStdOut") and len(request.params["pilotStdOut"]) > 0:
      id = request.params["pilotStdOut"]
      return self.__pilotGetOutput("out",int(id))
    elif request.params.has_key("pilotStdErr") and len(request.params["pilotStdErr"]) > 0:
      id = request.params["pilotStdErr"]
      return self.__pilotGetOutput("err",int(id))
    elif request.params.has_key("LogURL") and len(request.params["LogURL"]) > 0:
      id = request.params["LogURL"]
      return self.__pilotGetURL(int(id))
    elif request.params.has_key("getStagerReport") and len(request.params["getStagerReport"]) > 0:
      id = request.params["getStagerReport"]
      return self.__getStagerReport(int(id))
    elif request.params.has_key("getSandBox") and len(request.params["getSandBox"]) > 0:
      id = request.params["getSandBox"]
      return self.__getSandBox(int(id))
    elif request.params.has_key("refreshSelection") and len(request.params["refreshSelection"]) > 0:
      return self.__getSelectionData()
    elif request.params.has_key("getPlotSrc") and len(request.params["getPlotSrc"]) > 0:
      id = request.params["getPlotSrc"]
      if request.params.has_key("type") and len(request.params["type"]) > 0:
        type = request.params["type"]
      else:
        type = "jobsBySite"
      if request.params.has_key("time") and len(request.params["time"]) > 0:
        timeToSet = request.params["time"]
      else:
        timeToSet = "week"
      if request.params.has_key("img") and len(request.params["img"]) > 0:
        img = request.params["img"]
      else:
        img = "False"
      return self.__getPlotSrc(type,id,timeToSet,img)
    elif request.params.has_key("getPending") and len(request.params["getPending"]) > 0:
      return self.__getParams(request.params["getPending"])
    else:
      c.result = {"success":"false","error":"DIRAC Job ID(s) is not defined"}
      return c.result
################################################################################
  def __getJdl(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobJDL(id)
    if result["OK"]:
      c.result = result["Value"]
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("JDL:",id)
    return c.result
################################################################################
  def __getBasicInfo(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobSummary(id)
    if result["OK"]:
      itemList = result["Value"]
      c.result = []
      for key,value in itemList.items():
        c.result.append([key,value])
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("BasicInfo:",id)
    return c.result
################################################################################
  def __getLoggingInfo(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobLoggingInfo(id)
    if result["OK"]:
      c.result = result["Value"]
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("LoggingInfo:",id)
    return c.result
################################################################################
  def __getParams(self,id):
    try:
      id = int(id)
    except:
      c.result = {"success":"false","error":"Wrong data type, numerical expected"}
      return c.result
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      c.result = []
      for i in attr.items():
        if i[0] != "StandardOutput":
          c.result.append([i[0],i[1]])
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("Params:",id)
    return c.result
################################################################################
  def __getStandardOutput(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      if attr.has_key("StandardOutput"):
        c.result = attr["StandardOutput"]
        c.result = {"success":"true","result":c.result}
      else:
        c.result = "Not accessible yet"
        c.result = {"success":"false","error":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("StandardOutput:",id)
    return c.result
################################################################################
  def __delJobs(self,id):
    MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
    result = MANAGERRPC.deleteJob(id)
    if result["OK"]:
      c.result = ""
      c.result = {"success":"true","result":c.result}
    else:
      if result.has_key("InvalidJobIDs"):
        c.result = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
        c.result = {"success":"false","error":c.result}
      elif result.has_key("NonauthorizedJobIDs"):
        c.result = "You are nonauthorized to delete jobs with JobID: %s" % result["NonauthorizedJobIDs"]
        c.result = {"success":"false","error":c.result}
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("DELETE:",id)
    return c.result
################################################################################
  def __killJobs(self,id):
    MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
    result = MANAGERRPC.killJob(id)
    if result["OK"]:
      c.result = ""
      c.result = {"success":"true","result":c.result}
    else:
      if result.has_key("InvalidJobIDs"):
        c.result = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
        c.result = {"success":"false","error":c.result}
      elif result.has_key("NonauthorizedJobIDs"):
        c.result = "You are nonauthorized to delete jobs with JobID: %s" % result["NonauthorizedJobIDs"]
        c.result = {"success":"false","error":c.result}
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("KILL:",id)
    return c.result
################################################################################
  def __resetJobs(self,id):
    MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
    result = MANAGERRPC.resetJob(id)
    if result["OK"]:
      c.result = ""
      c.result = {"success":"true","result":c.result}
    else:
      if result.has_key("InvalidJobIDs"):
        c.result = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
        c.result = {"success":"false","error":c.result}
      elif result.has_key("NonauthorizedJobIDs"):
        c.result = "You are nonauthorized to delete jobs with JobID: %s" % result["NonauthorizedJobIDs"]
        c.result = {"success":"false","error":c.result}
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("RESET:",id)
    return c.result
################################################################################
  def __pilotGetOutput(self,mode,id):
    print "PilotOutput:",id
    PILOTRPC = getRPCClient("WorkloadManagement/WMSAdministrator")
    result = PILOTRPC.getJobPilotOutput(id)
    if result["OK"]:
      output = result["Value"]
      if mode == "out" and output.has_key("StdOut"):
        c.result =  output["StdOut"]
        c.result = {"success":"true","result":c.result}
      elif mode == "err" and output.has_key("StdErr"):
        c.result =  output["StdErr"]
        c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("pilotGetOutput:",id)
    return c.result
################################################################################
  def __pilotGetURL(self,id):
    print "LogFile:",id
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      if attr.has_key("Log URL"):
        url = attr["Log URL"]
        url = url.split('"')
        c.result =  url[1]
        c.result = {"success":"true","result":c.result}
      else:
        c.result = "No URL found"
        c.result = {"success":"false","error":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("pilotGetURL:",id)
    return c.result
################################################################################
  def __getStagerReport(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      c.result = []
      if attr.has_key("StagerReport"):
        c.result =  attr["StagerReport"]
        c.result = {"success":"true","result":c.result}
      else:
        c.result = {"success":"false","error":"StagerReport not available"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("getStagerReport:",id)
    return c.result
################################################################################
  def __getSandBox(self,id):
    return "Not ready yet"
################################################################################
  def __getPlotSrc(self,type,args,timeToSet,img):
    rc = ReportsClient()
    type = str(type)
    args = str(args)
    name = type + args
    if args == "All":
      args = {}
    else:
      args = args.split(",")
      args = {"Site":args}
    gLogger.info("Arguments:",args)
    time = str(timeToSet)
    now = datetime.datetime.utcnow()
    if  timeToSet == 'day':
      timeSpan = now - datetime.timedelta( seconds = 86400 ) 
    elif timeToSet == 'week':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 7 )
    elif timeToSet == 'month':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 30 )
    elif timeToSet == 'year':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 360 )
    else:
      timeSpan = now - datetime.timedelta( seconds = 86400 * 7 )
    if len(name) < 1:
      c.result = {"success":"false","error":"Recived empty value"}
    else:
      result = self.__imgCache.get(name)
      if not result:
        result = rc.listPlots("Job")
        if result["OK"]:
          plots = result["Value"]
          if type == 'jobsBySite':
            if img == 'True':
              result = rc.generatePlot("Job",plots[8],timeSpan,now,args,"Site")
            else:
              result = rc.generatePlot("Job",plots[8],timeSpan,now,args,"Site",{'thumbnail':True,'widh':800,'height':600,'thb_width':190,'thb_height':125})
          elif type == 'jobCPUbySite':
            if img == 'True':
              result = rc.generatePlot("Job",plots[0],timeSpan,now,args,"Site")
            else:
              result = rc.generatePlot("Job",plots[0],timeSpan,now,args,"Site",{'thumbnail':True,'widh':800,'height':600,'thb_width':196,'thb_height':125})
          elif type == 'CPUUsedBySite':
            if img == 'True':
              result = rc.generatePlot("Job",plots[2],timeSpan,now,args,"Site")
            else:
              result = rc.generatePlot("Job",plots[2],timeSpan,now,args,"Site",{'thumbnail':True,'widh':800,'height':600,'thb_width':196,'thb_height':125})
          else:
            if img == 'True':
              result = rc.generatePlot("Job",plots[8],timeSpan,now,args,"Site")
            else:
              result = rc.generatePlot("Job",plots[8],timeSpan,now,{},"Site",{'thumbnail':True,'widh':800,'height':600,'thb_width':196,'thb_height':125})
          if result["OK"]:
            if img == 'True':
              result = result["Value"]
            else:
              result = result["thumbnail"]
            c.result = {"success":"true","result":result}
            self.__imgCache.add(name, 600, result)
          else:
            c.result = {"success":"false","error":result["Message"]}
        else:
          c.result = {"success":"false","error":result["Message"]}
      else:
        c.result = {"success":"true","result":result}
    gLogger.info("getPlotSrc:",c.result)
    return c.result
