#import logging, string
#from time import time, gmtime, strftime

#from dirac.lib.base import *
#from dirac.lib.diset import getRPCClient
#from DIRAC import S_OK, S_ERROR, gConfig
#from DIRAC.Core.Utilities import Time, List
#from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
#from dirac.lib.webBase import defaultRedirect

import logging, string
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from DIRAC import gConfig, gLogger
import DIRAC.Core.Utilities.Time as Time
import dirac.lib.credentials as credentials

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["TransformationID","DESC"]]

class ProductionmonitorController(BaseController):
################################################################################
  def display(self):
    pagestart = time()
    c.select = self.__getSelectionData()
    gLogger.info("\033[0;31mPRODUCTION INDEX REQUEST:\033[0m %s" % (time() - pagestart))
    return render("jobs/ProductionMonitor.mako")
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      c.result = {"success":"false","error":"You are not authorised"}
      return c.result
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    result = self.__request()
    result = RPC.getProductionSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    gLogger.info("\033[0;31m VAL: \033[0m globalSort: %s, pageNumber: %s, numberOfJobs: %s" % (globalSort,pageNumber,numberOfJobs))
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
    gLogger.info("\033[0;31m PRODUCTION SUBMIT REQUEST: \033[0m %s" % (time() - pagestart))
    return c.result
################################################################################
  def __request(self):
    req = {}
    global pageNumber
    if request.params.has_key("productionID") and len(request.params["productionID"]) > 0:
      pageNumber = 0
      req["TransformationID"] = str(request.params["productionID"])
    else:
      global numberOfJobs
      global globalSort
      if request.params.has_key("limit") and len(request.params["limit"]) > 0:
        if request.params.has_key("start") and len(request.params["start"]) > 0:
          numberOfJobs = int(request.params["limit"])
          startRecord = int(request.params["start"])
          pageNumber = startRecord
#/numberOfJobs
          if pageNumber <= 0:
            pageNumber = 0
        else:
          pageNumber = 0
      else:
        numberOfJobs = 25
      if request.params.has_key("agentType") and len(request.params["agentType"]) > 0:
        req["AgentType"] = str(request.params["agentType"])
      if request.params.has_key("prodStatus") and len(request.params["prodStatus"]) > 0:
        req["Status"] = str(request.params["prodStatus"])
      if request.params.has_key("plugin") and len(request.params["plugin"]) > 0:
        req["Plugin"] = str(request.params["plugin"])
      if request.params.has_key("productionType") and len(request.params["productionType"]) > 0:
        req["Type"] = str(request.params["productionType"])
      if request.params.has_key("transformationGroup") and len(request.params["transformationGroup"]) > 0:
        req["TransformationGroup"] = str(request.params["transformationGroup"])
      if request.params.has_key("date") and len(request.params["date"]) > 0:
        if str(request.params["date"]) != "YYYY-mm-dd":
          req["CreationDate"] = str(request.params["date"])
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
      else:
        globalSort = [["TransformationID","DESC"]]
    gLogger.info(" PRODUCTION REQUEST: ",req)
    return req
################################################################################
  def __getSelectionData(self):
    callback = {}
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
####
    result = RPC.getDistinctAttributeValues("Plugin",{})
    if result["OK"]:
      plugin = []
      if len(result["Value"])>0:
        plugin.append([str("All")])
        for i in result["Value"]:
          plugin.append([str(i)])
      else:
        plugin.append("Nothing to display")
    else:
      plugin = "Error during RPC call"
    callback["plugin"] = plugin
####
    result = RPC.getDistinctAttributeValues("Status",{})
    if result["OK"]:
      status = []
      if len(result["Value"])>0:
        status.append([str("All")])
        for i in result["Value"]:
          status.append([str(i)])
      else:
        status = "Nothing to display"
    else:
      status = "Error during RPC call"
    callback["prodStatus"] = status
####
    result = RPC.getDistinctAttributeValues("TransformationGroup",{})
    if result["OK"]:
      group = []
      if len(result["Value"])>0:
        group.append([str("All")])
        for i in result["Value"]:
          group.append([str(i)])
      else:
        group = "Nothing to display"
    else:
      group = "Error during RPC call"
    callback["transformationGroup"] = group
####
    result = RPC.getDistinctAttributeValues("AgentType",{})
    if result["OK"]:
      atype = []
      if len(result["Value"])>0:
        atype.append([str("All")])
        for i in result["Value"]:
          atype.append([str(i)])
      else:
        atype = "Nothing to display"
    else:
      atype = "Error during RPC call"
    callback["agentType"] = atype
####
    result = RPC.getDistinctAttributeValues("Type",{})
    if result["OK"]:
      type = []
      if len(result["Value"])>0:
        type.append([str("All")])
        for i in result["Value"]:
          type.append([str(i)])
      else:
        type = "Nothing to display"
    else:
      type = "Error during RPC call"
    callback["productionType"] = type
####
    return callback
################################################################################
  @jsonify
  def action(self):
    if request.params.has_key("start") and len(request.params["start"]) > 0:
      id = str(request.params["start"])
      return self.__actProduction(id,"start")
    elif request.params.has_key("stop") and len(request.params["stop"]) > 0:
      id = str(request.params["stop"])
      return self.__actProduction(id,"stop")
    elif request.params.has_key("deleted") and len(request.params["delete"]) > 0:
      id = str(request.params["delete"])
      return self.__actProduction(id,"delet")
    elif request.params.has_key("log") and len(request.params["log"]) > 0:
      id = str(request.params["log"])
      return self.__logProduction(id)
    else:
      c.result = {"success":"false","error":"DIRAC Job ID(s) is not defined"}
      return c.error
################################################################################
  def __logProduction(self,prodid):
    id = int(prodid)
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    result = RPC.getTransformationLogging(id)
    if result["OK"]:
      result = result["Value"]
      if len(result) > 0:
        c.result = []
        resultUser = gConfig.getSections("/Security/Users")
        if resultUser["OK"]:
          users = resultUser["Value"]
          dndb = {}
          for j in users:
            dndb[gConfig.getValue("/Security/Users/%s/DN" % j)] = j
        else:
          dndb = {}
        for i in result:
          DN = i["AuthorDN"]
          if dndb.has_key(DN):
            i["AuthorDN"] = dndb[DN]
          else:
            i["AuthorDN"] = "Owner Unknown"
          date = Time.toString(i["MessageDate"])
          c.result.append([i["Message"],i["AuthorDN"],date])
        c.result = {"success":"true","result":c.result}
      else:
        c.result = {"success":"false","error":"Nothing to display"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("PRODUCTION LOG:",id)
    return c.result
################################################################################
  def __actProduction(self,prodid,cmd):
    prodid = prodid.split(",")
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    c.result = []
    for i in prodid:
      try:
        id = int(i)
        if cmd == "delet":
          result = RPC.deleteTransformation(id)
        elif cmd == "start":
          result = RPC.setTransformationStatus(id,"Active")
        elif cmd == "stop":
          result = RPC.setTransformationStatus(id,"Stopped")
      except:
        result["Message"] = "Unable to convert given ID %s to production ID" % i
      if result["OK"]:
        result = "ProdID: %s %sed successful" % (i,cmd)
      else:
        result = "ProdID: %s failed due the reason: %s" % (i,result["Message"])
      c.result.append(result)
    c.result = {"success":"true","showResult":c.result}
    gLogger.info(cmd,prodid)
    return c.result
