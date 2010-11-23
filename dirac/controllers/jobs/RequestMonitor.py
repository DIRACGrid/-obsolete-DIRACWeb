import logging
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
#from dirac.lib.sessionManager import *
import dirac.lib.credentials as credentials
from DIRAC.Core.Security import CS
from DIRAC import gLogger

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["RequestID","DESC"]]

class RequestmonitorController(BaseController):
################################################################################
  def display(self):
    group = credentials.getSelectedGroup()
    if group == "visitor" and credentials.getUserDN == "":
      return render("/login.mako")
    c.select = self.__getSelectionData()
#    if not c.select.has_key("extra"):
#      groupProperty = credentials.getProperties(group)
#      if ( "JobAdministrator" or "JobSharing" ) not in groupProperty: #len(groupProperty) == 1 and groupProperty[0] == "NormalUser":
#        c.select["extra"] = {"owner":credentials.getUsername()}
    return render("jobs/RequestMonitor.mako")
################################################################################
  @jsonify
  def submit(self):
    RPC = getRPCClient("RequestManagement/centralURL")
    result = self.__request()
    result = RPC.getRequestSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    if result["OK"]:
      result = result["Value"]
      gLogger.info("\033[0;31mRESULT:\033[0m %s" % result["ParameterNames"])
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
      c.result = {"success":"false","error":result["Message"]}
#    gLogger.info("\033[0;31mRESULT:\033[0m ")
    return c.result
################################################################################
  def __getSelectionData(self):
    callback = {}
    group = credentials.getSelectedGroup()
    user = str(credentials.getUsername())
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
    RPC = getRPCClient("RequestManagement/centralURL")
###
    if user == "Anonymous":
      callback["requestType"] = [["Insufficient rights"]]
    else:
      result = RPC.getDistinctValues("RequestType")
      if result["OK"]:
        type = []
        if len(result["Value"])>0:
          type.append([str("All")])
          for i in result["Value"]:
            type.append([str(i)])
        else:
          type = [["Nothing to display"]]
      else:
        type = [["Error during RPC call"]]
      callback["requestType"] = type
###
    if user == "Anonymous":
      callback["operation"] = [["Insufficient rights"]]
    else:
      result = RPC.getDistinctValues("Operation")
      if result["OK"]:
        operation = []
        if len(result["Value"])>0:
          operation.append([str("All")])
          for i in result["Value"]:
            i = i.replace(",",";")
            operation.append([i])
        else:
          operation = [["Nothing to display"]]
      else:
        operation = [["Error during RPC call"]]
      callback["operation"] = operation
###
    if user == "Anonymous":
      callback["owner"] = [["Insufficient rights"]]
    else:
      result = RPC.getDistinctValues("OwnerDN")
      if result["OK"]:
        owner = [["All"]]
        for i in result["Value"]:
          returnValue = CS.getUsernameForDN(i)
          if not returnValue["OK"]:
            if i == "":
              nick = "\"\""
            else:
              nick = i
          else:
            nick = returnValue["Value"]
          owner.append([nick])
      else:
        owner = [["Error during RPC call"]]
      callback["owner"] = owner
###
    if user == "Anonymous":
      callback["ownerGroup"] = [["Insufficient rights"]]
    else:
      result = RPC.getDistinctValues("OwnerGroup")
      if result["OK"]:
        ownerGroup = []
        if len(result["Value"])>0:
          ownerGroup.append([str("All")])
          for i in result["Value"]:
            i = i.replace(",",";")
            if i == "":
              i = "\"\""
            ownerGroup.append([i])
        else:
          ownerGroup = [["Nothing to display"]]
      else:
        ownerGroup = [["Error during RPC call"]]
      callback["ownerGroup"] = ownerGroup
###
    if user == "Anonymous":
      callback["status"] = [["Insufficient rights"]]
    else:
      result = RPC.getDistinctValues("Status")
      if result["OK"]:
        status = []
        if len(result["Value"])>0:
          status.append([str("All")])
          for i in result["Value"]:
            i = i.replace(",",";")
            status.append([i])
        else:
          status = [["Nothing to display"]]
      else:
        status = [["Error during RPC call"]]
      callback["status"] = status
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
      if request.params.has_key("requestType") and len(request.params["requestType"]) > 0:
        if str(request.params["requestType"]) != "All":
          req["RequestType"] = str(request.params["requestType"]).split('::: ')
      if request.params.has_key("operation") and len(request.params["operation"]) > 0:
        if str(request.params["operation"]) != "All":
          req["Operation"] = str(request.params["operation"]).split('::: ')
      if request.params.has_key("ownerGroup") and len(request.params["ownerGroup"]) > 0:
        if str(request.params["ownerGroup"]) != "All":
          req["OwnerGroup"] = []
          for i in str(request.params["ownerGroup"]).split('::: '):
            if i == "\"\"":
              req["OwnerGroup"].append("")
            else:
              req["OwnerGroup"].append(i)
#          req["OwnerGroup"] = str(request.params["ownerGroup"]).split('::: ')
      if request.params.has_key("status") and len(request.params["status"]) > 0:
        if str(request.params["status"]) != "All":
          req["Status"] = str(request.params["status"]).split('::: ')
      if request.params.has_key("owner") and len(request.params["owner"]) > 0:
        if str(request.params["owner"]) != "All":
          req["OwnerDN"] = []
          for i in str(request.params["owner"]).split('::: '):
            if i == "\"\"":
              req["OwnerDN"].append("")
            else:
              returnValue = CS.getDNForUsername(i)
              if returnValue["OK"]:
                req["OwnerDN"].append(returnValue["Value"][0]) # First DN from list
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
        globalSort = [["RequestID","DESC"]]
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("refreshSelection") and len(request.params["refreshSelection"]) > 0:
      return self.__getSelectionData()
    else:
      c.result = {"success":"false","error":"The request parameters can not be recognized or they are not defined"}
      return c.result
