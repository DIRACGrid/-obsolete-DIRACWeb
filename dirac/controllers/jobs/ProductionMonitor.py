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
from DIRAC.Core.Utilities.List import sortList
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
    if not c.select.has_key("extra"):
      c.select["extra"] = {"prodStatus":"Active::: Stopped::: New"}
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
    gLogger.info("\033[0;31m result: \033[0m %s" % result)
    result = RPC.getTransformationSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
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
    lhcbGroup = credentials.getSelectedGroup()
    lhcbUser = str(credentials.getUsername())
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
    if request.params.has_key("productionID") and len(request.params["productionID"]) > 0:
      gLogger.info(" !!!!!!!!!!!!!!!!!!!!!11 productionID - ",request.params["productionID"])
      testString = str(request.params["productionID"])
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
                req["TransformationID"] = testString[0]
              else:
                req["TransformationID"] = testString
            else:
              req["TransformationID"] = testString
          else:
            req["TransformationID"] = testString
        else:
          req["TransformationID"] = testString
      else:
        req["TransformationID"] = testString
    else:
      if request.params.has_key("agentType") and len(request.params["agentType"]) > 0:
        if str(request.params["agentType"]) != "All":
          req["AgentType"] = str(request.params["agentType"]).split('::: ')
      if request.params.has_key("prodStatus") and len(request.params["prodStatus"]) > 0:
        if str(request.params["prodStatus"]) != "All":
          req["Status"] = str(request.params["prodStatus"]).split('::: ')
      if request.params.has_key("plugin") and len(request.params["plugin"]) > 0:
        if str(request.params["plugin"]) != "All":
          req["Plugin"] = str(request.params["plugin"]).split('::: ')
      if request.params.has_key("productionType") and len(request.params["productionType"]) > 0:
        if str(request.params["productionType"]) != "All":
          req["Type"] = str(request.params["productionType"]).split('::: ')
      if request.params.has_key("transformationGroup") and len(request.params["transformationGroup"]) > 0:
        if str(request.params["transformationGroup"]) != "All":
          req["TransformationGroup"] = str(request.params["transformationGroup"]).split('::: ')
      if request.params.has_key("date") and len(request.params["date"]) > 0:
        if str(request.params["date"]) != "YYYY-mm-dd":
          req["CreationDate"] = str(request.params["date"])
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
        key,value = globalSort.split(" ")
        globalSort = [[str(key),str(value)]]
      else:
        globalSort = [["TransformationID","DESC"]]
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  def __getSelectionData(self):
    callback = {}
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    result = RPC.getTransformationSummaryWeb()
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
#    result = RPC.getDistinctAttributeValues("Status",{})
#    if result["OK"]:
    status = [["New"],["Active"],["ValidatingInput"],["ValidatingOuptut"],["WaitingIntegrity"],["ValidatedOutputs"],["RemovingFiles"],["RemovedFiles"],["Completed"],["Archived"],["Cleaning"],["Stopped"]]
#      if len(result["Value"])>0:
#        status.append([str("All")])
#        for i in result["Value"]:
#          status.append([str(i)])
#      else:
#        status = "Nothing to display"
#    else:
#      status = "Error during RPC call"
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
    elif request.params.has_key("flush") and len(request.params["flush"]) > 0:
      id = str(request.params["flush"])
      return self.__actProduction(id,"flush")
    elif request.params.has_key("clean") and len(request.params["clean"]) > 0:
      id = str(request.params["clean"])
      return self.__actProduction(id,"clean")
    elif (request.params.has_key("extend") and len(request.params["extend"]) > 0) and (request.params.has_key("tasks") and len(request.params["tasks"]) > 0):
      id = str(request.params["extend"])
      tasks = str(request.params["tasks"])
      return self.__extendTransformation(id,tasks)
    elif request.params.has_key("log") and len(request.params["log"]) > 0:
      id = str(request.params["log"])
      return self.__logProduction(id)
    elif request.params.has_key("elog") and len(request.params["elog"]) > 0:
      id = str(request.params["elog"])
      return self.__elogProduction(id)
    elif request.params.has_key("fileStat") and len(request.params["fileStat"]) > 0:
      id = str(request.params["fileStat"])
      return self.__transformationFileStatus(id)
    elif request.params.has_key("globalStat"):
      return self.__globalStat()
    else:
      c.result = {"success":"false","error":"Transformation ID(s) is not defined"}
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
            i["AuthorDN"] = DN#"Owner Unknown"
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
  def __transformationFileStatus(self,prodid):
    id = int(prodid)
    RPC = getRPCClient('ProductionManagement/ProductionManager')
    res = RPC.getTransformationStats(prodid)
    if not res['OK']:
      c.result = {"success":"false","error":res["Message"]}
    else:
      resList = []
      total = res['Value'].pop('Total')
      if total == 0:
        c.result = {"success":"false","error":"No files found"} 
      else:
        for status in sortList(res['Value'].keys()):
          count = res['Value'][status]
          percent = "%.1f" % ((count*100.0)/total)
          resList.append((status,str(count),percent))
        resList.append(('Total',total,'-'))
        c.result = {"success":"true","result":resList}
    gLogger.info("#######",res)
    return c.result

################################################################################
  def __extendTransformation(self,id,tasks):
    tasks = int(tasks)
    id = int(id)
    RPC = getRPCClient('ProductionManagement/ProductionManager')
    res = RPC.extendTransformation(id,tasks)
    if res["OK"]:
      resString = "%s extended by %s successfully" % (id,tasks)
    else:
      resString = "%s failed to extend: %s" % (id,result["Message"])
    c.result = {"success":"true","showResult":[resString],"result":resString}
    gLogger.info("#######",res)
    return c.result

################################################################################
  def __elogProduction(self,prodid):
    id = int(prodid)
    RPC = getRPCClient('ProductionManagement/ProductionManager')
    res = RPC.getTransformationParameters(id,['DetailedInfo'])
    if not res["OK"]:
      c.result = {"success":"false","error":res["Message"]}
    else:
      c.result = res['Value']
      if c.result:
        c.result = {"success":"true","result":res['Value']}
      else:
        c.result = {"success":"false","error":"Production does not have parameter 'DetailedInfo'"}
    gLogger.info("#######",res)
    return c.result

################################################################################
  def __actProduction(self,prodid,cmd):
    prodid = prodid.split(",")
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    agentType = 'Manual'
    if cmd == 'clean':
      status = 'Cleaning'
    elif cmd == 'start':
      status = 'Active'
      agentType = 'Automatic'
    elif cmd == 'stop':
      status = 'Stopped'
    elif cmd == 'flush':
      status = 'Flush'
    else:
      return {"success":"false","error": "Unknown action"}
    c.result = []
    for i in prodid:
      try:
        id = int(i)
        result = RPC.setTransformationParameter(id,'Status',status)
        if result["OK"]:
          resString = "ProdID: %s set to %s successfully" % (i,cmd)
          result = RPC.setTransformationParameter(id,'AgentType',agentType)
          if not result["OK"]:
            resString = "ProdID: %s failed to set to %s: %s" % (i,cmd,result["Message"])
        else:
          resString = "ProdID: %s failed due the reason: %s" % (i,result["Message"])
      except:
        resString = "Unable to convert given ID %s to transformation ID" % i
      c.result.append(resString)
    c.result = {"success":"true","showResult":c.result}
    gLogger.info(cmd,prodid)
    return c.result

################################################################################
  def __globalStat(self):
    RPC = getRPCClient("ProductionManagement/ProductionManager")
    result = RPC.getTransformationStatusCounters()
    if result["OK"]:
      result = result["Value"]
      back = []
      for i in sortList(result.keys()):
        back.append([i,result[i]])
      return back
