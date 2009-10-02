import logging
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.sessionManager import *

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["SubmitTime","DESC"]]

class FtsmonitorController(BaseController):
################################################################################
  def display(self):
    c.select = self.__getSelectionData()
    gLogger.info("SELECTION RESULTS:",c.select)
    return render("data/FTSMonitor.mako")
################################################################################
  @jsonify
  def submit(self):
    RPC = getRPCClient("DataManagement/TransferDBMonitoring")
    result = self.__request()
    result = {}
    result = RPC.getReqPageSummary(result,globalSort,pageNumber,numberOfJobs)
    gLogger.info("\033[0;31m R E S U L T \033[0m",result)
    if result["OK"]:
      result = result["Value"]
      if result.has_key("TotalRecords") and  result["TotalRecords"] > 0:
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
              if result.has_key("Extras"):
                extra = result["Extras"]
                c.result = {"success":"true","result":c.result,"total":total,"extra":extra}
              else:
                c.result = {"success":"true","result":c.result,"total":total}
            else:
              c.result = {"success":"false","result":"","error":"There are no data to display"}
          else:
            c.result = {"success":"false","result":"","error":"ParameterNames field is undefined"}
        else:
          c.result = {"success":"false","result":"","error":"Data structure is corrupted"}
      else:
        c.result = {"success":"false","result":"","error":"There were no data matching your selection"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  def __getSelectionData(self):
    callback = {}
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
    RPC = getRPCClient("DataManagement/TransferDBMonitoring")
    result = RPC.getSites()
    if result["OK"]:
      result = result["Value"]
      dest = []
      if result.has_key("DestinationSites") and len(result["DestinationSites"]) > 0:
        dest.append([str("All")])
        for i in result["DestinationSites"]:
          dest.append([str(i)])
      else:
        dest.append("Nothing to display")
      callback["destination"] = dest
      source = []
      if result.has_key("SourceSites") and len(result["SourceSites"]) > 0:
        source.append([str("All")])
        for i in result["SourceSites"]:
          source.append([str(i)])
      else:
        source.append("No elements to display")
    else:
      source = str(result["Message"])
      dest = str(result["Message"])
    callback["destination"] = dest
    callback["source"] = source
    return callback
################################################################################
  def __request(self):
    req = {}
    global pageNumber
    global numberOfJobs
    global globalSort
    if request.params.has_key("limit") and len(request.params["limit"]) > 0:
      numberOfJobs = int(request.params["limit"])
      if request.params.has_key("start") and len(request.params["start"]) > 0:
        pageNumber = int(request.params["start"])
      else:
        pageNumber = 0
    else:
      numberOfJobs = 25
      pageNumber = 0
    if request.params.has_key("id") and len(request.params["id"]) > 0:
      testString = str(request.params["id"])
      testString = testString.strip(';, ')
      testString = testString.split(', ')
      if len(testString) == 1:
        testString = testString[0].split('; ')
        if len(testString) == 1:
          testString = testString[0].split(' ')
          if len(testString) == 1:
            testString = testString[0].split(',')
            if len(testString) == 1:
              testString = testString[0].split(';')
              if len(testString) == 1:
                req["FTSID"] = testString[0]
              else:
                req["FTSID"] = testString
            else:
              req["FTSID"] = testString
          else:
            req["FTSID"] = testString
        else:
          req["FTSID"] = testString
      else:
        req["FTSID"] = testString
      for i in req["FTSID"]:
        testI = i.split('-')
        if len(testI) == 2:
          testI[0] = testI[0].strip(' ')
          testI[1] = testI[1].strip(' ')
          rangeID = range(testI[0],testI[1])
          gLogger.info("RANGE:",rangeID)
    else:
      if request.params.has_key("destination") and len(request.params["destination"]) > 0:
        if str(request.params["destination"]) != "All":
          req["DestinationSites"] = str(request.params["destination"]).split('::: ')
      if request.params.has_key("source") and len(request.params["source"]) > 0:
        if str(request.params["source"]) != "All":
          req["SourceSites"] = str(request.params["source"]).split('::: ')
      if request.params.has_key("startDate") and len(request.params["startDate"]) > 0:
        if str(request.params["startDate"]) != "YYYY-mm-dd":
          if request.params.has_key("startTime") and len(request.params["startTime"]) > 0:
            req["FromDate"] = str(request.params["startDate"] + " " + request.params["startTime"])
          else:
            req["FromDate"] = str(request.params["startDate"])
      if request.params.has_key("endDate") and len(request.params["endDate"]) > 0:
        if str(request.params["endDate"]) != "YYYY-mm-dd":
          if request.params.has_key("endTime") and len(request.params["endTime"]) > 0:
            req["ToDate"] = str(request.params["endDate"] + " " + request.params["endTime"])
          else:
            req["ToDate"] = str(request.params["endDate"])
      if request.params.has_key("date") and len(request.params["date"]) > 0:
        if str(request.params["date"]) != "YYYY-mm-dd":
          req["LastUpdate"] = str(request.params["date"])
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
        key,value = globalSort.split(" ")
        globalSort = [[str(key),str(value)]]
      else:
        globalSort = [["SubmitTime","DESC"]]
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  @jsonify
  def action(self):
    if request.params.has_key("getFTSInfo") and len(request.params["getFTSInfo"]) > 0:
      id = int(request.params["getFTSInfo"])
      return self.__getFTSInfo(id)
    else:
      c.result = {"success":"false","error":"DIRAC Job ID(s) is not defined"}
      return c.error
#################################################################################
  def __getFTSInfo(self,id):
    RPC = getRPCClient("DataManagement/TransferDBMonitoring")
    result = RPC.getFTSInfo(id)
    if result["OK"]:
      c.result = result["Value"]
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("FTSInfo:",id)
    return c.result
