import logging, datetime, tempfile
from datetime import timedelta
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gLogger
from DIRAC.Core.Utilities.List import sortList
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["runID","DESC"]]

class RundbmonitorController(BaseController):
################################################################################
  def display(self):
    RPC = getRPCClient("dips://volhcb09.cern.ch:9300/DataManagement/RunDBInterface")
    result = RPC.ping()
    gLogger.info(" - P I N G - ",result)
    c.select = self.__getSelectionData()
    return render("data/RunDBMonitor.mako")
################################################################################
  def __getSelectionData(self):
    callback = {}
    now = datetime.datetime.today()
    mon = timedelta(days=30)
    sd = now - mon
    tmp = {}
    tmp["startTime"] = sd.isoformat()
    callback["extra"] = tmp
#    callback["extra"] = tmp
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
    RPC = getRPCClient("dips://volhcb09.cern.ch:9300/DataManagement/RunDBInterface")
    result = RPC.getRunSelections()
    if result["OK"]:
      if len(result["Value"])>0:
        result = result["Value"]
        for key,value in result.items():
          value = ["All"] + value
          key = key.lower()
          callback[key] = value
    gLogger.info(" - callback - ",callback)
    return callback
################################################################################
  @jsonify
  def submit(self):
    gLogger.info(" -- SUBMIT --")
    pagestart = time()
    RPC = getRPCClient("dips://volhcb09.cern.ch:9300/DataManagement/RunDBInterface")
    result = self.__request()
    gLogger.info(" - result - ",result)
    result = RPC.getRunsSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    gLogger.info(" - result - ",result)
    gLogger.info(" - result - ",globalSort)
    gLogger.info(" - result - ",pageNumber)
    gLogger.info(" - result - ",numberOfJobs)
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
                if result.has_key("Extras"):
                  extra = result["Extras"]
                  c.result = {"success":"true","result":c.result,"total":total,"extra":extra}
                else:
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
  def __request(self):
    now = datetime.datetime.today()
    req = {}
    global pageNumber
    if request.params.has_key("id") and len(request.params["id"]) > 0:
      pageNumber = 0
      req["runID"] = str(request.params["id"])
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
      if request.params.has_key("state") and len(request.params["state"]) > 0:
        if str(request.params["state"]) != "All":
          req["state"] = str(request.params["state"]).split('::: ')

      if request.params.has_key("startlumi") and len(request.params["startlumi"]) > 0:
        if str(request.params["startlumi"]) != "All":
          req["startLumi"] = str(request.params["startlumi"]).split('::: ')

      if request.params.has_key("runtype") and len(request.params["runtype"]) > 0:
        if str(request.params["runtype"]) != "All":
          req["runType"] = str(request.params["runtype"]).split('::: ')

      if request.params.has_key("partitionname") and len(request.params["partitionname"]) > 0:
        if str(request.params["partitionname"]) != "All":
          req["partitionName"] = str(request.params["partitionname"]).split('::: ')

      if request.params.has_key("beamenergy") and len(request.params["beamenergy"]) > 0:
        if str(request.params["beamenergy"]) != "All":
          req["beamEnergy"] = str(request.params["beamenergy"]).split('::: ')

      if request.params.has_key("endlumi") and len(request.params["endlumi"]) > 0:
        if str(request.params["endlumi"]) != "All":
          req["endLumi"] = str(request.params["endlumi"]).split('::: ')

      if request.params.has_key("destination") and len(request.params["destination"]) > 0:
        if str(request.params["destination"]) != "All":
          req["destination"] = str(request.params["destination"]).split('::: ')

      if request.params.has_key("fillid") and len(request.params["fillid"]) > 0:
        if str(request.params["fillid"]) != "All":
          req["fillID"] = str(request.params["fillid"]).split('::: ')

      mon = timedelta(days=30)
      if request.params.has_key("startDate") and len(request.params["startDate"]) > 0:
        if str(request.params["startDate"]) != "YYYY-mm-dd":
          req["startTime"] = str(request.params["startDate"])
        else:
          sd = now - mon
          req["startTime"] = sd.isoformat()
      else:
        sd = now - mon
        req["startTime"] = sd.isoformat()

      if request.params.has_key("endDate") and len(request.params["endDate"]) > 0:
        if str(request.params["endDate"]) != "YYYY-mm-dd":
          req["endTime"] = str(request.params["endDate"])

#      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
#        globalSort = str(request.params["sort"])
#        key,value = globalSort.split(" ")
#        globalSort = [[str(key),str(value)]]
#      else:
#        globalSort = [["runID","DESC"]]
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  @jsonify
  def action(self):
    if request.params.has_key("showRunFiles") and len(request.params["showRunFiles"]) > 0:
      id = str(request.params["showRunFiles"])
      return self.__showRunFiles(id)
    elif request.params.has_key("getRunParams") and len(request.params["getRunParams"]) > 0:
      id = str(request.params["getRunParams"])
      return self.__getRunParams(id)
    else:
      c.result = {"success":"false","error":"No actions are defined"}
      return c.error
################################################################################
  def __showRunFiles(self,id):
    id = id.split(",")
    RPC = getRPCClient("dips://volhcb09.cern.ch:9300/DataManagement/RunDBInterface")
#    result = getRunParams()
    c.result = {"success":"true","result":"Not implemented yet"}
    return c.result
################################################################################
  def __getRunParams(self,id):
    try:
      id = int(id)
    except:
      c.result = {"success":"false","error":"Wrong data type, numerical expected"}
      return c.result
    RPC = getRPCClient("dips://volhcb09.cern.ch:9300/DataManagement/RunDBInterface")
    result = RPC.getRunParams(id)
    if result["OK"]:
      attr = result["Value"]
      c.result = []
      for i in attr.items():
#        if i[0] != "StandardOutput":
        c.result.append([i[0],i[1]])
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("Params:",id)
    return c.result
#
#
#    c.result = {"success":"true","result":"Not implemented yet"}
#    return c.result

