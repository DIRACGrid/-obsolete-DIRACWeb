import logging, string
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gConfig
import DIRAC.Core.Utilities.Time as Time
log = logging.getLogger(__name__)

result = gConfig.getSections("/Users")
if result["OK"]:
  users = result["Value"]
  dndb = {}
  for j in users:
    dndb[gConfig.getValue("/Users/%s/DN" % j)] = j
else:
  dndb = {}

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
    RPC = getRPCClient("ProductionManagement/ProductionManager")
#    result = self.__request()
    result = RPC.getProductionSummary()
    gLogger.info("- REQUEST:",result)
    gLogger.info("CALL RESULT:",result["Value"])
    if result["OK"]:
      result = result["Value"]
      c.result = []
      if len(result) > 0:
        for keys,i in result.items():
          id = str(int(keys)).zfill(8)
          DN = i["AuthorDN"]
          if len(DN) > 0:
            if dndb.has_key(DN):
              i["AuthorDN"] = dndb[DN]
            else:
              i["AuthorDN"] = "Owner Unknown" # Zdes' nado probovat' esche raz
          else:
            i["AuthorDN"] = "Owner Unknown"
          jobStat = i["JobStats"]
          created = jobStat["Created"]
          submited = jobStat["Submitted"]
          wait = jobStat["Waiting"]
          running = jobStat["Running"]
          done = jobStat["Done"]
          failed = jobStat["Failed"]
          stalled = jobStat["Stalled"]
          c.result.append({"id":id,"name":i["TransformationName"],"status":i["Status"],"dn":i["AuthorDN"],"created":created,"submited":submited,"wait":wait,"running":running,"done":done,"failed":failed,"agenttype":i["AgentType"],"description":i["Description"],"creationdate":i["CreationDate"],"stalled":stalled})
        total = len(c.result)
        c.result = {"success":"true","result":c.result,"total":total}
      else:
        c.result = {"success":"false","error":"There are no data to display"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31mPRODUCTION SUBMIT REQUEST:\033[0m %s" % (time() - pagestart))
    return c.result
################################################################################
#  def display(self):
#    if result["OK"]:
#      prods = result["Value"]
#      print "PRODS:",prods
#      if len(prods) < 1:
#        return "There is no production available"
#      else:
#        valueList = []
#        for keys,i in prods.items():
#          id = str(int(keys)).zfill(8)
#          DN = i["AuthorDN"]
#          if len(DN) > 0:
#            if dndb.has_key(DN):
#              i["AuthorDN"] = dndb[DN]
#            else:
#              i["AuthorDN"] = "Owner Unknown" # Zdes' nado probovat' esche raz
#          else:
#            i["AuthorDN"] = "Owner Unknown"
#          jobStat = i["JobStats"]
#          created = jobStat["Created"]
#          submited = jobStat["Submitted"]
#          wait = jobStat["Waiting"]
#          running = jobStat["Running"]
#          done = jobStat["Done"]
#          failed = jobStat["Failed"]
#          stalled = jobStat["Stalled"]
#          valueList.append([id,i["TransformationName"],i["Status"],i["AuthorDN"],created,submited,wait,running,done,failed,i["AgentType"],i["Description"],i["CreationDate"],stalled])
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
        for i in result:
          DN = i["AuthorDN"]
          if len(DN) > 0:
            if dndb.has_key(DN):
              i["AuthorDN"] = dndb[DN]
            else:
              i["AuthorDN"] = "Owner Unknown" # Zdes' nado probovat' esche raz
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
