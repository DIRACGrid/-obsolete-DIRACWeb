import logging
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
#from dirac.lib.sessionManager import *
from DIRAC import gLogger

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["RequestID","DESC"]]

class RequestmonitorController(BaseController):
################################################################################
  def display(self):
    return render("jobs/RequestMonitor.mako")
################################################################################
  @jsonify
  def submit(self):
    RPC = getRPCClient("RequestManagement/centralURL")
    result = self.__request()
    gLogger.info("Res:",result)
    gLogger.info("Sort:",globalSort)
    gLogger.info("Page:",pageNumber)
    gLogger.info("NOJ:",numberOfJobs)
    result = RPC.getRequestSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    gLogger.info(" - RESULT: ",result)
    if result["OK"]:
      result = result["Value"]
      gLogger.info("RESULT: ", result)
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
                if j == 2:
                  if i[j] == "None":
                    i[j] = "-"
                tmp[head[j]] = i[j]
              c.result.append(tmp)
            total = result["TotalRecords"]
            gLogger.info(" c.result ",c.result)
            c.result = {"success":"true","result":c.result,"total":total}
          else:
            c.result = {"success":"false","result":"","error":"There are no data to display"}
        else:
          c.result = {"success":"false","result":"","error":"ParameterNames field is missing"}
      else:
        c.result = {"success":"false","result":"","error":"Data structure is corrupted"}
    else:
      gLogger.info("RESULT ERROR: ", c.result)
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31mRESULT:\033[0m ")
    return c.result
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
                req["JobID"] = testString[0]
              else:
                req["JobID"] = testString
            else:
              req["JobID"] = testString
          else:
            req["JobID"] = testString
        else:
          req["JobID"] = testString
      else:
        req["JobID"] = testString
    elif request.params.has_key("reqId") and len(request.params["reqId"]) > 0:
      testString = str(request.params["reqId"])
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
                req["RequestID"] = testString[0]
              else:
                req["RequestID"] = testString
            else:
              req["RequestID"] = testString
          else:
            req["RequestID"] = testString
        else:
          req["RequestID"] = testString
      else:
        req["RequestID"] = testString
    else:
      if request.params.has_key("limit") and len(request.params["limit"]) > 0:
        numberOfJobs = int(request.params["limit"])
      else:
        numberOfJobs = 25
      if request.params.has_key("start") and len(request.params["start"]) > 0:
        pageNumber = int(request.params["start"])
      else:
        pageNumber = 0
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
        key,value = globalSort.split(" ")
        globalSort = [[str(key),str(value)]]
      else:
        globalSort = [["RequestID","DESC"]]
    gLogger.info("REQUEST:",req)
    return req
