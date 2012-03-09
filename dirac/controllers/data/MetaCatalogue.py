import logging, datetime, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.List import sortList
from DIRAC.Core.Utilities import Time
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials
#from DIRAC.Interfaces.API.Dirac import Dirac

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["JobID","DESC"]]

class MetacatalogueController(BaseController):
  __imgCache = DictCache()
################################################################################
  def display(self):
    pagestart = time()
    group = credentials.getSelectedGroup()
    if group == "visitor" and credentials.getUserDN == "":
      return render("/login.mako")
    c.select = self.__getSelectionData()
    if not c.select.has_key("extra"):
      groupProperty = credentials.getProperties(group)
      if ( "JobAdministrator" or "JobSharing" ) not in groupProperty: #len(groupProperty) == 1 and groupProperty[0] == "NormalUser":
        c.select["extra"] = {"owner":credentials.getUsername()}
    return render("data/MetaCatalogue.mako")
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    user = str(credentials.getUsername())
    result = RPC.getOwners()
    if result["OK"]:
      defaultGroup = gConfig.getValue("/Registry/DefaultGroup","")
      if defaultGroup == "":
        return {"success":"false","error":"Option /Registry/DefaultGroup is undefined, please set the default group in the CS"}
      group = str(credentials.getSelectedGroup())
      groupProperty = credentials.getProperties(group)
      if user not in result["Value"] and ( "JobAdministrator" or "JobSharing" ) not in groupProperty:
        c.result = {"success":"false","error":"You don't have any jobs in the DIRAC system"}
        return c.result
    else:
      c.result = {"success":"false","error":result["Message"]}
      return c.result
    req = self.__request()
    gLogger.always("getJobPageSummaryWeb(%s,%s,%s,%s)" % (req,globalSort,pageNumber,numberOfJobs))
    result = RPC.getJobPageSummaryWeb(req,globalSort,pageNumber,numberOfJobs)
    gLogger.always(" - REZ: " %result)
    if result["OK"]:
      result = result["Value"]
      gLogger.info("ReS",result)
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
                timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
                if result.has_key("Extras"):
                  st = self.__dict2string(req)
                  extra = result["Extras"]
                  c.result = {"success":"true","result":c.result,"total":total,"extra":extra,"request":st,"date":timestamp}
                else:
                  c.result = {"success":"true","result":c.result,"total":total,"date":timestamp}
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
  def __dict2string(self,req):
    result = ""
    try:
      for key,value in req.iteritems():
        result = result + str(key) + ": " + ", ".join(value) + "; "
    except Exception, x:
      gLogger.info("\033[0;31m Exception: \033[0m %s" % x)
    result = result.strip()
    result = result[:-1]
    return result
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
      if callback["extra"].has_key("prod"):
        callback["extra"]["prod"] = callback["extra"]["prod"].zfill(8)
        if callback["extra"]["prod"] == "00000000":
          callback["extra"]["prod"] = ""
      gLogger.info(" - ",callback["extra"])
    return callback
################################################################################
  def __request(self):
    gLogger.always("!!!  PARAMS: ",str(request.params))
    req = {}
    group = credentials.getSelectedGroup()
    user = str(credentials.getUsername())
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
      for i in req["JobID"]:
        testI = i.split('-')
        if len(testI) == 2:
          testI[0] = testI[0].strip(' ')
          testI[1] = testI[1].strip(' ')
          rangeID = range(testI[0],testI[1])
          gLogger.info("RANGE:",rangeID)
    else:
      groupProperty = credentials.getProperties(group)
      gLogger.always("### groupProperty: ",str(groupProperty))
      result = gConfig.getOption("/Website/ListSeparator")
      if result["OK"]:
        separator = result["Value"]
      else:
        separator = ":::"
      if request.params.has_key("prod") and len(request.params["prod"]) > 0:
        if str(request.params["prod"]) != "All":
          req["JobGroup"] = str(request.params["prod"]).split(separator)
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        if str(request.params["site"]) != "All":
          req["Site"] = [x.strip() for x in str(request.params["site"]).split(separator)]
      if request.params.has_key("status") and len(request.params["status"]) > 0:
        if str(request.params["status"]) != "All":
          req["Status"] = str(request.params["status"]).split(separator)
      if request.params.has_key("runNumber") and len(request.params["runNumber"]) > 0:
        if str(request.params["runNumber"]) != "All":
          req["runNumber"] = str(request.params["runNumber"]).split(separator)
      if request.params.has_key("minorstat") and len(request.params["minorstat"]) > 0:
        if str(request.params["minorstat"]) != "All":
          req["MinorStatus"] = str(request.params["minorstat"]).split(separator)
      if request.params.has_key("app") and len(request.params["app"]) > 0:
        if str(request.params["app"]) != "All":
          req["ApplicationStatus"] = str(request.params["app"]).split(separator)
      if request.params.has_key("types") and len(request.params["types"]) > 0:
        if str(request.params["types"]) != "All":
          req["JobType"] = str(request.params["types"]).split(separator)
      if not "JobAdministrator" in groupProperty and not "JobSharing" in groupProperty:
        if not request.params.has_key("globalStat"):
          req["Owner"] = str(user)
      else:
        if request.params.has_key("owner") and len(request.params["owner"]) > 0:
          if str(request.params["owner"]) != "All":
            req["Owner"] = str(request.params["owner"]).split(separator)
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
        globalSort = [["JobID","DESC"]]
    gLogger.always("REQUEST:",req)
    return req
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getSelector") and len(request.params["getSelector"]) > 0:
      return self.__getSelector( str(request.params["getSelector"]) )
    elif request.params.has_key("getMeta") and len(request.params["getMeta"]) > 0:
      return self.__getMetadata( str(request.params["getMeta"]) )
    else:
      c.result = {"success":"false","error":"The request parameters can not be recognized or they are not defined"}
      return c.result
################################################################################
  def __getMetadata(self,key=False):
    if not key:
      return {"success":"false","error":""}
    RPC = getRPCClient("DataManagement/FileCatalog")
    result = RPC.getMetadataSet(key,True)
    gLogger.always(" * * * ",result)
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    return {"success":"true","result":result}    
################################################################################
  def __getSelector(self,select="All"):
    RPC = getRPCClient("DataManagement/FileCatalog")
    result = RPC.getMetadataFields()
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    for key,value in result.items():
      result[key] = value.lower()
    gLogger.always(" * * * ",result)
    return {"success":"true","result":result}
