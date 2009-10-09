import logging, datetime, tempfile
from datetime                                        import timedelta
from time                                            import time, gmtime, strftime

from dirac.lib.base                                  import *
from dirac.lib.diset                                 import getRPCClient, getTransferClient
from dirac.lib.credentials                           import authorizeAction
from DIRAC                                           import gLogger
from DIRAC.Core.Utilities.List                       import sortList
from DIRAC.AccountingSystem.Client.ReportsClient     import ReportsClient
from DIRAC.Core.Utilities.DictCache                  import DictCache

log = logging.getLogger(__name__)

numberOfFiles = 25
pageNumber = 0
globalSort = [["SubmitTime","DESC"]]

log = logging.getLogger(__name__)

class RawintegritymonitorController(BaseController):

  def display(self):
    RPC = getRPCClient("DataManagement/RAWIntegrity")
    result = RPC.ping()
    gLogger.info(" - P I N G - ",result)
    c.select = self.__getSelectionData()
    return render("data/RAWIntegrityMonitor.mako")

  def __getSelectionData(self):
    callback = {}
    now = datetime.datetime.today()
    mon = timedelta(days=30)
    sd = now - mon
    tmp = {}
    ttt = str(sd.isoformat())
    gLogger.info(" - T I M E - ",ttt)
    tmp["startDate"] = sd.isoformat()
    tmp["startTime"] = sd.isoformat()
    callback["extra"] = tmp
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
    #####################################################################
    # This is the part that optains the selections from the integrity db.
    RPC = getRPCClient("dips://lhcb-dms-dirac.cern.ch:9190/DataManagement/RAWIntegrity")
    result = RPC.getFileSelections()
    if result["OK"]:
      if len(result["Value"])>0:
        result = result["Value"]
        for key,value in result.items():
          value = ["All"] + value
          key = key.lower()
          callback[key] = value
    gLogger.info(" - callback - ",callback)
    return callback

  def __request(self):
    now = datetime.datetime.today()
    req = {}
    global pageNumber
    if request.params.has_key("lfn") and len(request.params["lfn"]) > 0: 
      pageNumber = 0
      req["lfn"] = str(request.params["lfn"])
    else:
      global numberOfFiles
      global globalSort
      if request.params.has_key("limit") and len(request.params["limit"]) > 0:
        if request.params.has_key("start") and len(request.params["start"]) > 0:
          numberOfFiles = int(request.params["limit"])
          pageNumber = int(request.params["start"])
        else:
          pageNumber = 0
      else:
        numberOfFiles = 25
      #######################################################################
      # For the selection boxes only
      if request.params.has_key("status") and len(request.params["status"]) > 0:
        if str(request.params["status"]) != "All":
          req["Status"] = str(request.params["status"]).split('::: ')
      if request.params.has_key("storageelement") and len(request.params["storageelement"]) > 0:
        if str(request.params["storageelement"]) != "All":
          req["StorageElement"] = str(request.params["storageelement"]).split('::: ')
      #######################################################################
      # For the start time selection
      mon = timedelta(days=30)
      if request.params.has_key("startDate") and len(request.params["startDate"]) > 0:
        if str(request.params["startDate"]) != "YYYY-mm-dd":
          req["FromDate"] = str(request.params["startDate"])
        else:
          sd = now - mon
          req["FromDate"] = sd.isoformat()
      else:
        sd = now - mon
        req["FromDate"] = sd.isoformat()
      #######################################################################
      # For the end time selection
      if request.params.has_key("endDate") and len(request.params["endDate"]) > 0:
        if str(request.params["endDate"]) != "YYYY-mm-dd":
          req["ToDate"] = str(request.params["endDate"])
      #######################################################################
      # The global sort of the data
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
        key,value = globalSort.split(" ")
        globalSort = [[str(key),str(value)]]
      else:
        globalSort = [["SubmitTime","DESC"]]
    gLogger.info("REQUEST:",req)
    return req

  #####################################################################
  #  
  # Handles proposed actions
  #  
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("globalStat") and len(request.params["globalStat"]) > 0:
      return self.__globalStat()
    elif request.params.has_key("getLoggingInfo") and len(request.params["getLoggingInfo"]) > 0:
      lfn = str(request.params["getLoggingInfo"])
      if request.params.has_key("limit") and len(request.params["limit"]) > 0:
        pageLimit = str(request.params["limit"])
      else:
        pageLimit = 100
      if request.params.has_key("start") and len(request.params["start"]) > 0:
        pageStart = str(request.params["start"])
      else:
        pageStart = 0
      return self.__loggingInfo(lfn,pageLimit,pageStart)
    else:
      c.result = {"success":"false","error":"Proposed action not available"}   
      return c.result

  def __loggingInfo(self,lfn,pageLimit,pageStart):
    try:
      lfn = str(lfn)
      start = int(pageStart)
      limit = int(pageLimit)
    except Exception, x:
      #c.result = {"success":"false","error":"Wrong data type, numerical expected"}
      c.result = {"success":"false","error":str(x)}
      return c.result
    RPC = getRPCClient("DataManagement/DataLogging")
    result = RPC.getFileLoggingInfo(lfn)
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    if not result:
      return {"success":"false","result":"","error":"No logging information found for LFN"}
    c.result = []
    for i in result:
      c.result.append({"Status":i[0],"MinorStatus":i[1],"StatusTime":i[2],"Source":i[3]})
    return {"success":"true","result":c.result}

  def __globalStat(self):
    RPC = getRPCClient("DataManagement/RAWIntegrity")
    result = RPC.getGlobalStatistics()
    gLogger.info(" - result - :",result)
    if result["OK"]:
      result = result["Value"]
      back = []
      for key in sortList(result.keys()):
        back.append((key,result[key]))
      return back

  #####################################################################
  #  
  # Handles displaying results
  #  
  @jsonify
  def submit(self):
    gLogger.info(" -- SUBMIT --")
    pagestart = time()
    RPC = getRPCClient("dips://lhcb-dms-dirac.cern.ch:9190/DataManagement/RAWIntegrity")
    result = self.__request()
    result = RPC.getFilesSummaryWeb(result,globalSort,pageNumber,numberOfFiles)
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

