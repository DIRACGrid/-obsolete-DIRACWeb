import logging, string
#import math
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gConfig
log = logging.getLogger(__name__)

##RPC = getRPCClient("ProductionManagement/ProductionRepository")
RPC = getRPCClient("dips://volhcb03.cern.ch:9131/ProductionManagement/ProductionManager")
##RPC = getRPCClient("ProductionManagement/ProductionManager")

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
  def index(self):
    print "INIT"
    result = RPC.getListProductions()
    print result
    if result["OK"]:
      prods = result["Value"]
      print prods
      if len(prods) < 1:
        return "There is no production available"
      else:
        valueList = []
        for i in prods:
          i["TransformationID"] = int(i["TransformationID"])
          i["TransformationID"] = str(i["TransformationID"]).zfill(8)
          i["JobsTotal"] = 0#int(i["JobsTotal"])
          i["JobsSubmitted"] = 0#int(i["JobsSubmitted"])
          i["LastSubmittedJob"] = 0#int(i["LastSubmittedJob"])
          DN = i["AuthorDN"]
          if len(DN) > 0:
            if dndb.has_key(DN):
              i["AuthorDN"] = dndb[DN]
            else:
              i["AuthorDN"] = "Owner Unknown" # Zdes' nado probovat' esche raz
          else:
            i["AuthorDN"] = "Owner Unknown"
          valueList.append([i["TransformationID"],i["TransformationName"],i["Status"],i["AuthorDN"],i["JobsTotal"],i["JobsSubmitted"],i["LastSubmittedJob"],i["AgentType"],i["Description"]])
        c.listResult = valueList
        return render("/jobs/ProductionMonitor.mako")
    else:
      print "+++ E:",result["Message"]
      return "Failed during RPC call. %s" % result["Message"]
################################################################################
  def action(self):
    pagestart = time()
    if request.params.has_key("getInfo") and len(request.params["getInfo"]) > 0:
      id = str(request.params["getInfo"])
      mode = str(request.params["mode"])
      return self.__getInfo(id,mode)
    elif request.params.has_key("delProd") and len(request.params["delProd"]) > 0:
      id = str(request.params["delProd"])
      return self.__deleteProduction(id)
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
      c.error = "Failed to get DIRAC job ID"
      print "+++ E:",c.error
      return c.error
################################################################################
  def __getInfo(self,id,mode):
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
  def __deleteProduction(self,id):
    result = RPC.deleteProductionID(id)
    print result
    if result["OK"]:
      return 0
    else:
      return result["Message"]
