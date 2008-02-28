import logging
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *

log = logging.getLogger(__name__)

class FtsmonitorController(BaseController):
################################################################################
  def __getJobSummary(self,jobs):
    valueList = []
    for i in jobs:
      s = jobs[i]
      valueList.append([s["FTSReqID"],s["Status"],s["SubmitTime"],s["LastMonitor"],s["PercentageComplete"],s["NumberOfFiles"],s["TotalSize"],s["SourceSite"],s["DestinationSite"]])
    return valueList
################################################################################
  def __parseRequest(self):
    req = {}
    save_time = 0
    save_source = 0
    save_destination = 0
    if request.params.has_key("jobid") and len(request.params["jobid"]) > 0:
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
#url = url + "&sour_site=" + sour_site + "&dest_site=" + dest_site;
      if request.params.has_key("sour_site") and len(request.params["sour_site"]) > 0:
        req["SourceSites"] = str(request.params["sour_site"])
        save_source = str(request.params["sour_site"])
      if request.params.has_key("dest_site") and len(request.params["dest_site"]) > 0:
        req["DestinationSites"] = str(request.params["dest_site"])
        save_destination = str(request.params["dest_site"])
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
    print "REQ:",req
    return req
################################################################################
  def __drawFilters(self):
#    RPC = getRPCClient("DataManagement/TransferDBMonitoring")
    RPC = getRPCClient("dips://volhcb03.cern.ch:9191/DataManagement/TransferDBMonitoring")
    result = RPC.getSites()
    c.destination = []
    c.source = []
    if result["OK"]:
      result = result["Value"]
      if result.has_key("DestinationSites") and len(result["DestinationSites"]) > 0:
        for i in result["DestinationSites"]:
          c.destination.append(i)
      else:
        c.destination.append("No elements to display")
      if result.has_key("SourceSites") and len(result["SourceSites"]) > 0:
        for i in result["SourceSites"]:
          c.source.append(i)
      else:
        c.source.append("No elements to display")
    else:
      c.source.append("Error during RPC call")
      c.destination.append("Error during RPC call")
    return
################################################################################
  def index(self):
    RPC = getRPCClient("dips://volhcb03.cern.ch:9191/DataManagement/TransferDBMonitoring")
    pagestart = time()
    result = self.__parseRequest()
    self.__drawFilters()
#    result = ""
#    result = RPC.getReqPageSummary(result,globalSort,pageNumber,numberOfJobs)
#    result = RPC.getFTSJobs()
    result = RPC.getReqPageSummary({},"SubmitTime",0,25)
    if result["OK"]:
      result = result["Value"]
      if result.has_key("SummaryDict") and len(result["SummaryDict"]) > 0:
        ftsSummary = result["SummaryDict"]
        c.listResult = self.__getJobSummary(ftsSummary)
        c.listResult.append([result["TotalFTSReq"]])
        c.listResult.append([1])
        gLogger.info("\033[0;31mINDEX PAGE PROCESSING:\033[0m %s" % ( time() - pagestart ) )
        return render("/data/FTSMonitor.mako")
      else:
        return "There is no information about request"
    else:
      return result["Message"]
################################################################################
  @jsonify
  def submit(self):
    RPC = getRPCClient("dips://volhcb03.cern.ch:9191/DataManagement/TransferDBMonitoring")
    pagestart = time()
    result = self.__parseRequest()
    self.__drawFilters()
    print "FTS:",result,globalSort,pageNumber,numberOfJobs
    result = RPC.getReqPageSummary(result,globalSort,pageNumber,numberOfJobs)
    print "::RESULT::",result
    if result["OK"]:
      result = result["Value"]
      if result.has_key("SummaryDict") and len(result["SummaryDict"]) > 0:
        ftsSummary = result["SummaryDict"]
        print "-",ftsSummary
        listResult = self.__getJobSummary(ftsSummary)
        listResult.append([result["TotalFTSReq"]])
        listResult.append([pageNumber + 1])
        print "\033[0;31mSUBMIT PAGE PROCESSING:\033[0m",time() - pagestart
        return listResult
      else:
        return "There is no summary for the job(s)"
    else:
      return result["Message"]
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getFTSInfo") and len(request.params["getFTSInfo"]) > 0:
      id = int(request.params["getFTSInfo"])
      return self.__getFTSInfo(id)
    elif request.params.has_key("getStandardOutput") and len(request.params["getStandardOutput"]) > 0:
      id = int(request.params["getStandardOutput"])
      return self.__getStandardOutput(id)
    elif request.params.has_key("pilotStdErr") and len(request.params["pilotStdErr"]) > 0:
      id = request.params["pilotStdErr"]
      return self.__pilotGetOutput("err",int(id))
    else:
      c.error = "Failed to get parameters"
      print "+++ E:",c.error
      return c.error
################################################################################
  def __getFTSInfo(self,id):
    RPC = getRPCClient("dips://volhcb03.cern.ch:9191/DataManagement/TransferDBMonitoring")
    print "FTS:",id
    result = RPC.getFTSInfo(id)
    if result["OK"]:
      fts = result["Value"]
      if not len(fts) > 0 :
        return "false"
      else:
        ftsResult = []
        for i in fts:
          tmp = []
          tmp.append(i[0])
          tmp.append(i[1])
          tmp.append(int(i[2]))
          tmp.append(i[3])
          tmp.append(int(i[4]))
          tmp.append(int(i[5]))
          ftsResult.append(tmp)
        print ftsResult
        return ftsResult
    else:
      c.error = result["Message"]
      print "+++ E:",c.error
      return c.error
