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
from DIRAC.WorkloadManagementSystem.Client.JobMonitoringClient import JobMonitoringClient
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
    return render("jobs/ProductionMonitor.mako")
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      c.result = {"success":"false","error":"You are not authorised"}
      return c.result
    RPC = getRPCClient("Transformation/TransformationManager")
    result = self.__request()
    callstart = time()
    result = RPC.getTransformationSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    if result["OK"]:
      result = result["Value"]
      gLogger.info("\033[0;31m PRODUCTION CALL: \033[0m %s" % result["ParameterNames"])
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
                gLogger.info(result["Extras"])
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
    elif request.params.has_key("requestID") and len(request.params["requestID"]) > 0:
      testString = str(request.params["requestID"])
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
                req["TransformationFamily"] = testString[0]
              else:
                req["TransformationFamily"] = testString
            else:
              req["TransformationFamily"] = testString
          else:
            req["TransformationFamily"] = testString
        else:
          req["TransformationFamily"] = testString
      else:
        req["TransformationFamily"] = testString
    else:
      result = gConfig.getOption("/Website/ListSeparator")
      if result["OK"]:
        separator = result["Value"]
      else:
        separator = ":::"
      if request.params.has_key("agentType") and len(request.params["agentType"]) > 0:
        if str(request.params["agentType"]) != "All":
          req["AgentType"] = str(request.params["agentType"]).split(separator)
      if request.params.has_key("prodStatus") and len(request.params["prodStatus"]) > 0:
        if str(request.params["prodStatus"]) != "All":
          req["Status"] = str(request.params["prodStatus"]).split(separator)
      if request.params.has_key("plugin") and len(request.params["plugin"]) > 0:
        if str(request.params["plugin"]) != "All":
          req["Plugin"] = str(request.params["plugin"]).split(separator)
      if request.params.has_key("productionType") and len(request.params["productionType"]) > 0:
        if str(request.params["productionType"]) != "All":
          req["Type"] = str(request.params["productionType"]).split(separator)
      if request.params.has_key("transformationGroup") and len(request.params["transformationGroup"]) > 0:
        if str(request.params["transformationGroup"]) != "All":
          req["TransformationGroup"] = str(request.params["transformationGroup"]).split(separator)
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
    RPC = getRPCClient("Transformation/TransformationManager")
#    result = RPC.getTransformationSummaryWeb()
#    if result["OK"]:
#      prod = []
#      prods = result["Value"]
#      if len(prods)>0:
#        for keys,i in prods.items():
#          id = str(int(keys)).zfill(8)
#          prod.append([str(id)])
#      else:
#        prod = "Nothing to display"
#    else:
#      prod = "Error during RPC call"
#    callback["prod"] = prod
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
#    status = [["New"],["Active"],["ValidatingInput"],["ValidatingOuptut"],["WaitingIntegrity"],["ValidatedOutputs"],["RemovingFiles"],["RemovedFiles"],["Completed"],["Archived"],["Cleaning"],["Stopped"]]
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
    elif request.params.has_key("flush") and len(request.params["flush"]) > 0:
      id = str(request.params["flush"])
      return self.__actProduction(id,"flush")
    elif request.params.has_key("clean") and len(request.params["clean"]) > 0:
      id = str(request.params["clean"])
      return self.__actProduction(id,"clean")
    elif request.params.has_key("complete") and len(request.params["complete"]) > 0:
      id = str(request.params["complete"])
      return self.__actProduction(id,"complete")
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
    elif request.params.has_key("fileProcessed"):
      id = str(request.params["fileProcessed"])
      return self.__fileRetry(id,"proc")
    elif request.params.has_key("fileNotProcessed"):
      id = str(request.params["fileNotProcessed"])
      return self.__fileRetry(id,"not")
    elif request.params.has_key("fileAllProcessed"):
      id = str(request.params["fileAllProcessed"])
      return self.__fileRetry(id,"all")
#    elif request.params.has_key("fileRetry"):
#      id = str(request.params["fileRetry"])
#      return self.__fileRetry(id)
    elif request.params.has_key("dataQuery"):
      id = str(request.params["dataQuery"])
      return self.__dataQuery(id)
    elif request.params.has_key("additionalParams"):
      id = str(request.params["additionalParams"])
      return self.__additionalParams(id)
    elif request.params.has_key("refreshSelection") and len(request.params["refreshSelection"]) > 0:
      return self.__getSelectionData()
    elif request.params.has_key("getT1") and len(request.params["getT1"]) > 0:
      return self. __getT1()
    elif request.params.has_key("getRunStatus") and len(request.params["getRunStatus"]) > 0:
      return self. __getRunStatuses()
    elif request.params.has_key("reschedule_counter") and len(request.params["reschedule_counter"]) > 0:
      id = str(request.params["reschedule_counter"])
      return self. __getRescheduleCounters(id)
    elif request.params.has_key("setSite") and len(request.params["setSite"]) > 0:
      if not request.params.has_key("runID"):
        return {"success":"false","error":"runID is undefined"}
      elif not request.params.has_key("prodID"):
        return {"success":"false","error":"prodID is undefined"}
      elif not request.params.has_key("site"):
        return {"success":"false","error":"site is undefined"}
      runid = request.params["runID"]
      prodid = request.params["prodID"]
      site = request.params["site"]
      return self.__setSite(runid,prodid,site)
    elif request.params.has_key("setRunStatus") and len(request.params["setRunStatus"]) > 0:
      if not request.params.has_key("runID"):
        return {"success":"false","error":"runID is undefined"}
      elif not request.params.has_key("prodID"):
        return {"success":"false","error":"prodID is undefined"}
      elif not request.params.has_key("status"):
        return {"success":"false","error":"status is undefined"}
      runid = request.params["runID"]
      prodid = request.params["prodID"]
      status = request.params["status"]
      return self.__setRunStatus(runid,prodid,status)
    else:
      c.result = {"success":"false","error":"Transformation ID(s) is not defined"}
      return c.error
################################################################################
  def __getRescheduleCounters(self,transID):
    jm = JobMonitoringClient()
    result = jm.getJobStats("RescheduleCounter",{"JobGroup":transID})
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    res = result["Value"]
    back = []
    for i in sortList(res.keys()):
      if i == 0:
        text = "Never been rescheduled"
      elif i == 1:
        text = "Rescheduled one time"
      else:
        text = "Rescheduled " + i + " times"
      back.append([text,res[i]])
    return {"success":"true","result":back}
################################################################################
  def __getRunStatuses(self):
    runStatuses = gConfig.getValue("/Website/TransformationMonitoring/ContextMenu/RunStatuses",[])
    return {"success":"true","result":runStatuses}
################################################################################
  def __setSite(self,runid,prodid,site):
    try:
      runID = int(runid)
      transID = int(prodid)
      site = str(site)
    except Exception,x:
      return {"success":"false","error":str(x)}
    RPC = getRPCClient("Transformation/TransformationManager")
    gLogger.info("\033[0;31m setTransformationRunsSite(%s, %s, %s) \033[0m" % (transID,runID,site))
    result = RPC.setTransformationRunsSite(transID,runID,site)
    if result["OK"]:
      c.result = {"success":"true","result":"true"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  def __setRunStatus(self,runid,prodid,status):
    try:
      runID = int(runid)
      transID = int(prodid)
      status = str(status)
    except Exception,x:
      return {"success":"false","error":str(x)}
    RPC = getRPCClient("Transformation/TransformationManager")
    gLogger.info("\033[0;31m setTransformationRunStatus(%s, %s, %s) \033[0m" % (transID,runID,status))
    result = RPC.setTransformationRunStatus(transID,runID,status)
    if result["OK"]:
      c.result = {"success":"true","result":"true"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  def __getT1(self):
    tier1 = gConfig.getValue("/Website/PreferredSites",[])
    if len(tier1) > 0:
      c.result = {"success":"true","result":tier1}
    else:
      c.result = {"success":"false","error":"Can't get sites from /Website/PreferredSites location in CS"}
    return c.result
################################################################################
  def __logProduction(self,prodid):
    id = int(prodid)
    RPC = getRPCClient("Transformation/TransformationManager")
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
    RPC = getRPCClient('Transformation/TransformationManager')
    res = RPC.getTransformationFilesCount(prodid,"Status")
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
    gLogger.info("extend %s" % id)
    RPC = getRPCClient('Transformation/TransformationManager')
    gLogger.info("extendTransformation(%s,%s)" % (id,tasks))
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
    RPC = getRPCClient('Transformation/TransformationManager')
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
    RPC = getRPCClient("Transformation/TransformationManager")
    agentType = 'Manual'
    if cmd == 'clean':
      status = 'Cleaning'
    elif cmd == 'start':
      status = 'Active'
      agentType = 'Automatic'
    elif cmd == 'flush':
      status = 'Flush'
      agentType = 'Automatic'
    elif cmd == 'stop':
      status = 'Stopped'
    elif cmd == 'complete':
      status = 'Completed'
    else:
      return {"success":"false","error": "Unknown action"}
    c.result = []
    for i in prodid:
      try:
        id = int(i)
#        gLogger.info("RPC.setTransformationParameter(%s,'Status',%s)" % (id,status))
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
    RPC = getRPCClient("Transformation/TransformationManager")
    result = RPC.getTransformationStatusCounters()
    if result["OK"]:
      result = result["Value"]
      back = []
      for i in sortList(result.keys()):
        back.append([i,result[i]])
      return back
################################################################################
  def __fileRetry(self,prodid,mode):
    id = int(prodid)
    RPC = getRPCClient('Transformation/TransformationManager')
    if mode == "proc":
      res = RPC.getTransformationFilesCount(prodid,"ErrorCount",{'Status':'Processed'})
    elif mode == "not":
      res = RPC.getTransformationFilesCount(prodid,"ErrorCount",{'Status':['Unused','Assigned','Failed']})
    elif mode == "all":
      res = RPC.getTransformationFilesCount(prodid,"ErrorCount")
    else:
      return {"success":"false","error":res["Message"]}
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
  def __additionalParams(self,prodid):
    id = int(prodid)
    RPC = getRPCClient('Transformation/TransformationManager')
    res = RPC.getAdditionalParameters(id)
    if not res['OK']:
      return {"success":"false","error":res["Message"]}
    result = res["Value"]
    back = []
    for i in sortList(result.keys()):
      back.append([i,result[i]])
    return {"success":"true","result":back}
################################################################################
  def __dataQuery(self,prodid):
    id = int(prodid)
    RPC = getRPCClient("Transformation/TransformationManager")
    res = RPC.getBookkeepingQueryForTransformation(id)
    gLogger.info("-= #######",res)
    if not res['OK']:
      return {"success":"false","error":res["Message"]}
    result = res["Value"]
    back = []
    for i in sortList(result.keys()):
      back.append([i,result[i]])
    return {"success":"true","result":back}
################################################################################
  @jsonify
  def showFileStatus(self):
    req = {}
    if request.params.has_key("limit") and len(request.params["limit"]) > 0:
      limit = int(request.params["limit"])
      if request.params.has_key("start") and len(request.params["start"]) > 0:
        start = int(request.params["start"])
      else:
        start = 0
    else:
      limit = 25
      start = 0
    if request.params.has_key("prodID"):
      id = int(request.params["prodID"])
    else:
      return {"success":"false","error":"Transformation ID(s) is not defined"}
    if request.params.has_key("getFileStatus"):
      status = str(request.params["getFileStatus"])
    else:
      return {"success":"false","error":"Files status is not defined"}
    RPC = getRPCClient("Transformation/TransformationManager")
    result = RPC.getTransformationFilesSummaryWeb({'TransformationID':id,'Status':status},[["FileID","ASC"]],start,limit)
    if not result['OK']:
      c.result = {"success":"false","error":result["Message"]}
    else:
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
    return c.result
################################################################################
  @jsonify
  def showRunStatus(self):
    req = {}
    if request.params.has_key("limit") and len(request.params["limit"]) > 0:
      limit = int(request.params["limit"])
      if request.params.has_key("start") and len(request.params["start"]) > 0:
        start = int(request.params["start"])
      else:
        start = 0
    else:
      limit = 25
      start = 0
    if request.params.has_key("getRunStatus"):
      id = int(request.params["getRunStatus"])
    else:
      return {"success":"false","error":"Run status is not defined"}
    RPC = getRPCClient("Transformation/TransformationManager")
    result = RPC.getTransformationRunsSummaryWeb({'TransformationID':id},[["RunNumber","DESC"]],start,limit)
    if not result['OK']:
      c.result = {"success":"false","error":result["Message"]}
    else:
      result = result["Value"]
      if result.has_key("TotalRecords") and  result["TotalRecords"] > 0:
        total = result["TotalRecords"]
        if result.has_key("Extras"):
          extra = result["Extras"]
        if result.has_key("ParameterNames") and result.has_key("Records"):
          head = result["ParameterNames"]
          if len(head) > 0:
            headLength = len(head)
            if len(result["Records"]) > 0:
              c.result = []
              jobs = result["Records"]
              for i in jobs:
                if len(i) != headLength:
                  gLogger.info("Faulty record: %s" % i)
                  c.result = {"success":"false","result":c.result,"total":total,"error":"One of the records in service response is corrupted"}
                  return c.result
                tmp = {}
                for j in range(0,headLength):
                  tmp[head[j]] = i[j]
                c.result.append(tmp)
              if extra:
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
    return c.result
