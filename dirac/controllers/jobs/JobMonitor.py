import logging
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gLogger

log = logging.getLogger(__name__)

RPC = getRPCClient("dips://volhcb03.cern.ch:9130/WorkloadManagement/JobMonitoring")
#RPC = getRPCClient("WorkloadManagement/JobMonitoring")
MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
PILOTRPC = getRPCClient("WorkloadManagement/WMSAdministrator")
numberOfJobs = 25
pageNumber = 0
globalSort = "jobID"

class JobmonitorController(BaseController):
################################################################################
  def __getJobSummary(self,jobs):
    valueList = []
    for i in jobs:
      s = jobs[i]
      valueList.append([s["JobID"],s["Status"],s["MinorStatus"],s["ApplicationStatus"],s["Site"],s["JobName"],s["LastUpdateTime"],s["Owner"],s["SubmissionTime"]])
    return valueList
################################################################################
  def __parseRequest(self):
    req = {}
    save_time = 0
    save_prod = 0
    save_site = 0
    save_status = 0
    save_applic = 0
    save_owners = 0
    if request.params.has_key("jobid") and len(request.params["jobid"]) > 0:
      pageNumber = 0
      req["JobID"] = str(request.params["jobid"])
    else:
      global numberOfJobs
      global pageNumber
      global globalSort
      if request.params.has_key("counter") and len(request.params["counter"]) > 0:
        numberOfJobs = int(request.params["counter"])
      else:
        numberOfJobs = 25
      if request.params.has_key("prod") and len(request.params["prod"]) > 0:
        req["JobGroup"] = str(request.params["prod"])
        save_prod = str(request.params["prod"])
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        req["Site"] = str(request.params["site"])
        save_site = str(request.params["site"])
      if request.params.has_key("status") and len(request.params["status"]) > 0:
        req["Status"] = str(request.params["status"])
        save_status = str(request.params["status"])
      if request.params.has_key("applic") and len(request.params["applic"]) > 0:
        req["ApplicationStatus"] = str(request.params["applic"])
        save_applic = str(request.params["applic"])
      if request.params.has_key("owner") and len(request.params["owner"]) > 0:
        req["Owner"] = str(request.params["owner"])
        save_owner = str(request.params["owner"])
      if request.params.has_key("job_up") and len(request.params["job_up"]) > 0:
        req["LastUpdate"] = str(request.params["job_up"])
        save_time = str(request.params["job_up"])
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
      else:
        globalSort = "jobID"
      if request.params.has_key("page") and len(request.params["page"]) > 0:
        pageNumber = int(request.params["page"]) - 1
        if pageNumber <= 0:
          pageNumber = 0
      else:
        pageNumber = 0
    return req
################################################################################
  def __drawFilters(self):
    result = RPC.getSites()
    if result["OK"]:
      c.getsite = []
      if len(result["Value"])>0:
        for i in result["Value"]:
          c.getsite.append(i)
      else:
        c.getsite.append("No elements to display")
    else:
      c.getsite = "Error during RPC call"
    result = RPC.getStates()
    if result["OK"]:
      c.getstat = []
      if len(result["Value"])>0:
        for i in result["Value"]:
          c.getstat.append(i)
      else:
        c.getstat.append("No elements to display")
    else:
      c.getstat = "Error during RPC call"
    result = RPC.getApplicationStates()
    if result["OK"]:
      c.getappl = []
      if len(result["Value"])>0:
        for i in result["Value"]:
          c.getappl.append(i)
      else:
        c.getappl.append("No elements to display")
    else:
      c.getappl = "Error during RPC call"
    result = RPC.getOwners()
    if result["OK"]:
      c.getowner = []
      if len(result["Value"])>0:
        for i in result["Value"]:
          c.getowner.append(i)
      else:
        c.getowner.append("No elements to display")
    else:
      c.getowner = "Error during RPC call"
    return 88
################################################################################
  def display(self):
    pagestart = time()
    result = self.__parseRequest()
    self.__drawFilters()
    result = RPC.getJobPageSummary(result,globalSort,pageNumber,numberOfJobs)
    if result["OK"]:
      result = result["Value"]
      if result.has_key("SummaryDict") and len(result["SummaryDict"]) > 0:
        jobSummary = result["SummaryDict"]
        c.listResult = self.__getJobSummary(jobSummary)
        c.listResult.append([result["SummaryStatus"]])
        c.listResult.append([result["TotalJobs"]])
        c.listResult.append([1])
        gLogger.info("\033[0;31mINDEX PAGE PROCESSING:\033[0m %s" % ( time() - pagestart ) )
        return render("/jobs/JobMonitor.mako")
      else:
        return "There is no summary for the job(s)"
    else:
      return result["Message"]
################################################################################
  @jsonify
  def submit(self):
    gLogger.info("SUBMIT BEGIN")
    pagestart = time()
    result = self.__parseRequest()
    gLogger.info("parseRequest:",result)
    self.__drawFilters()
    result = RPC.getJobPageSummary(result,globalSort,pageNumber,numberOfJobs)
    gLogger.info("getJobPageSummary:",result)
    if result["OK"]:
      result = result["Value"]
      gLogger.info("result['Value']:",result)
      if result.has_key("SummaryDict") and len(result["SummaryDict"]) > 0:
        jobSummary = result["SummaryDict"]
        listResult = self.__getJobSummary(jobSummary)
        gLogger.info("listResult:",listResult)
        listResult.append([result["SummaryStatus"]])
        listResult.append([result["TotalJobs"]])
        listResult.append([pageNumber + 1])
        print "\033[0;31mSUBMIT PAGE PROCESSING:\033[0m",time() - pagestart
        gLogger.info("Complited listResult:",listResult)
        return listResult
      else:
        return "There is no summary for the job(s)"
    else:
      return result["Message"]
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
    elif request.params.has_key("deleteJobs") and len(request.params["deleteJobs"]) > 0:
      id = request.params["deleteJobs"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__delJobs(id)
    elif request.params.has_key("killJobs") and len(request.params["killJobs"]) > 0:
      id = request.params["killJobs"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__killJobs(id)
    elif request.params.has_key("resetJobs") and len(request.params["resetJobs"]) > 0:
      id = request.params["resetJobs"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__resetJobs(id)
    elif request.params.has_key("pilotStdOut") and len(request.params["pilotStdOut"]) > 0:
      id = request.params["pilotStdOut"]
      return self.__pilotGetOutput("out",int(id))
    elif request.params.has_key("pilotStdErr") and len(request.params["pilotStdErr"]) > 0:
      id = request.params["pilotStdErr"]
      return self.__pilotGetOutput("err",int(id))
    else:
      c.error = "Failed to get DIRAC job ID"
      print "+++ E:",c.error
      return c.error
################################################################################
  def __getJdl(self,id):
    print "JDL:",id
    result = RPC.getJobJDL(id)
    if result["OK"]:
      jobJDL = result["Value"]
      if not len(jobJDL) > 2 :
        return "false"
      else:
        return jobJDL
    else:
      c.error = result["Message"]
      print "+++ E:",c.error
      return c.error
################################################################################
  def __getBasicInfo(self,id):
    print "BasicInfo:",id
    result = RPC.getJobSummary(id)
    if result["OK"]:
      itemList = result["Value"]
      valueList = []
      for key,value in itemList.items():
        valueList.append([key,value])
      return valueList
    else:
      print "+++ E:",result["Message"]
      return 1
################################################################################
  def __getLoggingInfo(self,id):
    print "LoggingInfo:",id
    result = RPC.getJobLoggingInfo(id)
    if result["OK"]:
#      print str(result["Value"])
      info = str(result["Value"])
      info = info.replace("(","[")
      info = info.replace(")","]")
      return info
    else:
      error = result["Message"]
      print "+++ E:",error
      return error
################################################################################
  def __getParams(self,id):
    print "Parameters:",id
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      valueList = []
      for i in attr.items():
        if i[0] != "StandardOutput":
          valueList.append([i[0],i[1]])
      return valueList
    else:
      error = result["Message"]
      print "+++ E:",error
      return error
################################################################################
  def __delJobs(self,id):
    print "DELETE: ",id
    result = MANAGERRPC.deleteJob(id)
    if result["OK"]:
      return 0
    else:
      if result.has_key("InvalidJobIDs"):
        error = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
      elif result.has_key("NonauthorizedJobIDs"):
        error = "You are nonauthorized to delete jobs with JobID: %s" % result["NonauthorizedJobIDs"]
      else:
        error = "Unknown error on server side"
      print "+++ E:",result
      return error
################################################################################
  def __getStandardOutput(self,id):
    print "StandardOutput",id
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      if attr.has_key("StandardOutput"):
        return attr["StandardOutput"]
      else:
        return "Not accessible yet."
    else:
      error = result["Message"]
      print "+++ E:",error
      return error
################################################################################
  def __killJobs(self,id):
    print "KILL:",id
    result = MANAGERRPC.killJob(id)
    if result["OK"]:
      return 0
    else:
      if result.has_key("InvalidJobIDs"):
        error = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
      elif result.has_key("NonauthorizedJobIDs"):
        error = "You are nonauthorized to kill jobs with JobID: %s" % result["NonauthorizedJobIDs"]
      else:
        error = "Unknown error on server side"
      print "+++ E:",result
      return error
################################################################################
  def __resetJobs(self,id):
    print "RESET:",id
    result = MANAGERRPC.resetJob(id)
    if result["OK"]:
      return 0
    else:
      if result.has_key("InvalidJobIDs"):
        error = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
      elif result.has_key("NonauthorizedJobIDs"):
        error = "You are nonauthorized to reset jobs with JobID: %s" % result["NonauthorizedJobIDs"]
      else:
        error = "Unknown error on server side"
      print "+++ E:",result
      return error
################################################################################
  def __pilotGetOutput(self,mode,id):
    print "PilotOutput:",id
    result = PILOTRPC.getJobPilotOutput(id);
    if result["OK"]:
      output = result["Value"]
      if mode == "out" and output.has_key("StdOut"):
        return output["StdOut"]
      elif mode == "err" and output.has_key("StdErr"):
        return output["StdErr"]
    else:
      error = result["Message"]
      print "+++ E:",error
      return error
