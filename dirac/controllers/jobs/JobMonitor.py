import logging
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gLogger

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = "JobID:DESC"

class JobmonitorController(BaseController):
################################################################################
  def display(self):
    pagestart = time()
    c.select = self.__getSelectionData()
    gLogger.info("SELECTION RESULTS:",c.select)
    gLogger.info("\033[0;31mJOB INDEX REQUEST:\033[0m %s" % (time() - pagestart))
    return render("jobs/JobMonitor.mako")
################################################################################
  def __getJobSummary(self,jobs):
    valueList = []
    for i in jobs:
      s = jobs[i]
      valueList.append({"id":str(s["JobID"]),"status":str(s["Status"]),"minorStatus":str(s["MinorStatus"]),"applicationStatus":str(s["ApplicationStatus"]),"site":str(s["Site"]),"jobname":str(s["JobName"]),"lastUpdate":str(s["LastUpdateTime"]),"owner":str(s["Owner"]),"submissionTime":str(s["SubmissionTime"]),"signTime":str(s["LastSignOfLife"])})
    return valueList
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = self.__request()
    gLogger.info("- REQUEST:",result)
    gLogger.info("PageNumber:",pageNumber)
    gLogger.info("NOJ:",numberOfJobs)
    result = RPC.getJobPageSummary(result,globalSort,pageNumber,numberOfJobs)
#    gLogger.info("SERVER RESPONSE:",result)
    if result["OK"]:
      result = result["Value"]
      if result.has_key("SummaryDict") and len(result["SummaryDict"]) > 0:
        jobSummary = result["SummaryDict"]
        c.result = self.__getJobSummary(jobSummary)
#        c.result = []
#        for i in jobSummary:
#          c.result.append(jobSummary[i])
        
        c.result = {"success":"true","result":c.result,"total":str(result["TotalJobs"])}
      else:
        c.result = {"success":"false","error":"There are no data to display"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31mJOB SUBMIT REQUEST:\033[0m %s" % (time() - pagestart))
#    gLogger.info("JOB SUBMIT RESULT:",c.result)
    return c.result
################################################################################
  def __getSelectionData(self):
    callback = {}
    if request.params.has_key("productionID") and len(request.params["productionID"]) > 0:
      callback["productionID"] = str(request.params["productionID"])
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    result = RPC.getProductionSummary()
    if result["OK"]:
      prod = []
      prods = result["Value"]
      if len(prods)>0:
        for keys,i in prods.items():
          id = str(int(keys)).zfill(8)
          prod.append([str(id)])
      else:
        prod = "Nothing to display"
    else:
      prod = "Error during RPC call"
    callback["prod"] = prod
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getSites()
    if result["OK"]:
      site = []
      if len(result["Value"])>0:
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
        for i in result["Value"]:
          stat.append([str(i)])
      else:
        stat = "Nothing to display"
    else:
      stat = "Error during RPC call"
    callback["stat"] = stat
    result = RPC.getApplicationStates()
    if result["OK"]:
      app = []
      if len(result["Value"])>0:
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
          startRecord = int(request.params["start"])
          pageNumber = startRecord/numberOfJobs
          if pageNumber <= 0:
            pageNumber = 0
        else:
          pageNumber = 0
      else:
        numberOfJobs = 25
      if request.params.has_key("prod") and len(request.params["prod"]) > 0:
        req["JobGroup"] = str(request.params["prod"])
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        req["Site"] = str(request.params["site"])
      if request.params.has_key("stat") and len(request.params["stat"]) > 0:
        req["Status"] = str(request.params["stat"])
      if request.params.has_key("app") and len(request.params["app"]) > 0:
        req["ApplicationStatus"] = str(request.params["app"])
      if request.params.has_key("owner") and len(request.params["owner"]) > 0:
        req["Owner"] = str(request.params["owner"])
      if request.params.has_key("date") and len(request.params["date"]) > 0:
        req["LastUpdate"] = str(request.params["date"])
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
      else:
        globalSort = "JobID:DESC"
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
