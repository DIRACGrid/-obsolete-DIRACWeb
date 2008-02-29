import logging, string
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gConfig
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
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    result = RPC.getProductionSummary()
    if result["OK"]:
      prods = result["Value"]
      print "PRODS:",prods
      if len(prods) < 1:
        return "There is no production available"
      else:
        valueList = []
        for keys,i in prods.items():
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
          valueList.append([id,i["TransformationName"],i["Status"],i["AuthorDN"],created,submited,wait,running,done,failed,i["AgentType"],i["Description"],i["CreationDate"],stalled])
        c.listResult = valueList
        print "OVERALLRESULT",c.listResult
        return render("/jobs/ProductionMonitor.mako")
    else:
      print "+++ E:",result["Message"]
      return "Failed during RPC call. %s" % result["Message"]
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getInfo") and len(request.params["getInfo"]) > 0:
      id = str(request.params["getInfo"])
      mode = str(request.params["mode"])
      return self.__getInfo(id,mode)
    elif request.params.has_key("Refresh") and len(request.params["Refresh"]) > 0:
      id = str(request.params["Refresh"])
      if id == "true":
        return self.__getProd()
      else:
        c.error = "Invalid request %s" % id
        print "+++ E:",c.error
        return c.error
    elif request.params.has_key("startProd") and len(request.params["startProd"]) > 0:
      id = str(request.params["startProd"])
      return self.__actProduction(id,"start")
    elif request.params.has_key("stopProd") and len(request.params["stopProd"]) > 0:
      id = str(request.params["stopProd"])
      return self.__actProduction(id,"stop")
    elif request.params.has_key("delProd") and len(request.params["delProd"]) > 0:
      id = str(request.params["delProd"])
      return self.__actProduction(id,"del")
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
    else:
      c.error = "Failed to get ID"
      print "+++ E:",c.error
      return c.error
################################################################################
  def __getProd(self):
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    result = RPC.getProductionSummary()
    if result["OK"]:
      prods = result["Value"]
      print "PRODS:",prods
      if len(prods) < 1:
        return "There is no production available"
      else:
        valueList = []
        for keys,i in prods.items():
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
          valueList.append([id,i["TransformationName"],i["Status"],i["AuthorDN"],created,submited,wait,running,done,failed,i["AgentType"],i["Description"],i["CreationDate"],stalled])
        c.listResult = valueList
        print "OVERALLRESULT",c.listResult
        return c.listResult
    else:
      print "+++ E:",result["Message"]
      return "Failed during RPC call. %s" % result["Message"]
################################################################################
  def __getInfo(self,id,mode):
    RPC = getRPCClient("ProductionManagement/ProductionRepository")
    if mode == "Comment":
      print "Name or ID:",id
      result = RPC.getProductionFullDescription(id)
      print "getProductionFullDescription:",result
      if result["OK"]:
        output = result["Value"]
        return output
      else:
        return "Failed during RPC call. %s" % result["Message"]
    elif mode == "DN":
      result = RPC.getProductionInfo(id)
      if result["OK"]:
        info = result["Value"]
        return info["PublisherDN"]
      else:
        return "Failed during RPC call. %s" % result["Message"]
    else:
      print "+++ E:",result["Message"]
      return "Failed during RPC call. %s" % result["Message"]
################################################################################
  def __actProduction(self,prodid,cmd):
    id = int(prodid)
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    if cmd == "del":
      result = RPC.deleteProduction(id)
    elif cmd == "start":
      result = RPC.setTransformationStatus(id,"Active")
    elif cmd == "stop":
      result = RPC.setTransformationStatus(id,"Stopped")
    print result
    if result["OK"]:
      return 0
    else:
      return result["Message"]
