import logging, datetime, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.List import sortList
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials
from DIRAC.Interfaces.API.Dirac import Dirac

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["JobID","DESC"]]

class JobmonitorController(BaseController):
  __imgCache = DictCache()
################################################################################
  def display(self):
    pagestart = time()
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      return render("/login.mako")
    c.select = self.__getSelectionData()
    if not c.select.has_key("extra"):
      if lhcbGroup == "lhcb":
        c.select["extra"] = {"owner":credentials.getUsername()}
      elif lhcbGroup == "lhcb_user":
        c.select["extra"] = {"owner":credentials.getUsername()}
    gLogger.info("SELECTION RESULTS:",c.select)
    gLogger.info("\033[0;31mJOB INDEX REQUEST:\033[0m %s" % (time() - pagestart))
    return render("jobs/JobMonitor.mako")
################################################################################
  def __getJobSummary(self,jobs,head):
    valueList = []
    for i in jobs:
      valueList.append({"id":str(i[2]),"status":str(i[6]),"minorStatus":str(i[10]),"applicationStatus":str(i[11]),"site":str(i[26]),"jobname":str(i[22]),"lastUpdate":str(i[25]),"owner":str(i[31]),"submissionTime":str(i[12]),"signTime":str(i[3])})
    return valueList
################################################################################
  def getPlot(self):
    if request.params.has_key("data") and len(request.params["data"]) > 0:
      client = PlottingClient()
      result = client.getPlot(data,title='',graph_size='normal')
      if result["OK"]:
        plots = result["Value"]
        response.headers['Content-type'] = 'image/png'
        response.headers['Content-Disposition'] = 'attachment; filename="%s"' % 'test.png'
        response.headers['Content-Length'] = len(plots)
        response.headers['Content-Transfer-Encoding'] = 'Binary'
      else:
        return
    else:
      return
################################################################################
  def __getPlotSrc(self,data):
    client = getRPCClient("Framework/Plotting")
    result = client.getPlot(data,metadata,fname='test_service.png')
    if result["OK"]:
      plots = result["Value"]
      c.result = {"success":"true","result":plots}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("getPlotSrc:",c.result)
    return c.result
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    lhcbUser = str(credentials.getUsername())
    result = RPC.getOwners()
    if result["OK"]:
      defaultGroup = gConfig.getValue("/Registry/DefaultGroup")
      if defaultGroup:
        try:
          defaultGroup = str(defaultGroup)
        except:
          return {"success":"false","error":"Option /Registry/DefaultGroup is not a string, please set the default group as the string in the CS"} 
      else:
        return {"success":"false","error":"Option /Registry/DefaultGroup is undefined, please set the default group in the CS"}
      lhcbGroup = credentials.getSelectedGroup()
      if not lhcbGroup == "diracAdmin" and lhcbUser not in result["Value"]:
        c.result = {"success":"false","error":"You don't have any jobs in the DIRAC system"}
        return c.result
#      if lhcbGroup == defaultGroup:
    else:
      c.result = {"success":"false","error":result["Message"]}
      return c.result
    result = self.__request()
    result = RPC.getJobPageSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
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
  def __getSelectionData(self):
    callback = {}
    lhcbGroup = credentials.getSelectedGroup()
    lhcbUser = str(credentials.getUsername())
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
    if lhcbUser == "Anonymous":
      callback["prod"] = [["Insufficient rights"]]
    else:
      RPC = getRPCClient("WorkloadManagement/JobMonitoring")
      result = RPC.getProductionIds()
      if result["OK"]:
        prod = []
        prods = result["Value"]
        if len(prods)>0:
          prod.append([str("All")])
          tmp = []
          for keys in prods:
            try:
              id = str(int(keys)).zfill(8)
            except:
              id = str(keys)
            tmp.append(str(id))
          tmp.sort(reverse=True)
          for i in tmp:
            prod.append([str(i)])
        else:
          prod = [["Nothing to display"]]
      else:
        prod = [["Error during RPC call"]]
      callback["prod"] = prod
###
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getSites()
    if result["OK"]:
      tier1 = gConfig.getValue("/Website/PreferredSites")
      if tier1:
        try:
          tier1 = tier1.split(", ")
        except:
          tier1 = list()
      else:
        tier1 = list()
      site = []
      if len(result["Value"])>0:
        s = list(result["Value"])
        site.append([str("All")])
        for i in tier1:
          site.append([str(i)])
        for i in s:
          if i not in tier1:
            site.append([str(i)])    
      else:
        site = [["Nothing to display"]]
    else:
      site = [["Error during RPC call"]]
    callback["site"] = site
###
    result = RPC.getStates()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          stat.append([str(i)])
      else:
        stat = [["Nothing to display"]]
    else:
      stat = [["Error during RPC call"]]
    callback["status"] = stat
###
    result = RPC.getMinorStates()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          stat.append([i])
      else:
        stat = [["Nothing to display"]]
    else:
      stat = [["Error during RPC call"]]
    callback["minorstat"] = stat
###
    result = RPC.getApplicationStates()
    if result["OK"]:
      app = []
      if len(result["Value"])>0:
        app.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          app.append([i])
      else:
        app = [["Nothing to display"]]
    else:
      app = [["Error during RPC call"]]
    callback["app"] = app
###
    result = RPC.getRunNumbers()
    if result["OK"]:
      app = []
      if len(result["Value"])>0:
        app.append([str("All")])
        for i in result["Value"]:
          i = str(int(i))
          i = i.replace(",",";")
          app.append([i])
      else:
        app = [["Nothing to display"]]
    else:
      app = [["Error during RPC call"]]
    callback["runNumber"] = app
###
    if lhcbUser == "Anonymous":
      callback["owner"] = [["Insufficient rights"]]
    elif lhcbGroup == "lhcb":
      callback["owner"] = [["All"],[str(credentials.getUsername())]]
    elif lhcbGroup == "lhcb_user":
      callback["owner"] = [["All"],[str(credentials.getUsername())]]
    else:
      result = RPC.getOwners()
      if result["OK"]:
        owner = []
        if len(result["Value"])>0:
          owner.append([str("All")])
          for i in result["Value"]:
            owner.append([str(i)])
        else:
          owner = [["Nothing to display"]]
      else:
        owner = [["Error during RPC call"]]
      callback["owner"] = owner
    return callback
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
      if request.params.has_key("prod") and len(request.params["prod"]) > 0:
        if str(request.params["prod"]) != "All":
          req["JobGroup"] = str(request.params["prod"]).split('::: ')
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        if str(request.params["site"]) != "All":
          req["Site"] = str(request.params["site"]).split('::: ')
      if request.params.has_key("status") and len(request.params["status"]) > 0:
        if str(request.params["status"]) != "All":
          req["Status"] = str(request.params["status"]).split('::: ')
      if request.params.has_key("runNumber") and len(request.params["runNumber"]) > 0:
        if str(request.params["runNumber"]) != "All":
          req["runNumber"] = str(request.params["runNumber"]).split('::: ')
      if request.params.has_key("minorstat") and len(request.params["minorstat"]) > 0:
        if str(request.params["minorstat"]) != "All":
          req["MinorStatus"] = str(request.params["minorstat"]).split('::: ')
      if request.params.has_key("app") and len(request.params["app"]) > 0:
        if str(request.params["app"]) != "All":
          req["ApplicationStatus"] = str(request.params["app"]).split('::: ')
      if lhcbGroup == "lhcb" or lhcbGroup == "lhcb_user":
        req["Owner"] = str(lhcbUser)
      else:
        if request.params.has_key("owner") and len(request.params["owner"]) > 0:
          if str(request.params["owner"]) != "All":
            req["Owner"] = str(request.params["owner"]).split('::: ')
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
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getJDL") and len(request.params["getJDL"]) > 0:
      id = int(request.params["getJDL"])
      return self.__getJdl(id)
    elif request.params.has_key("getStandardOutput") and len(request.params["getStandardOutput"]) > 0:
      id = int(request.params["getStandardOutput"])
      return self.__getStandardOutput(id)
    elif request.params.has_key("getBasicInfo") and len(request.params["getBasicInfo"]) > 0:
      id = int(request.params["getBasicInfo"])
      return self.__getBasicInfo(id)
    elif request.params.has_key("LoggingInfo") and len(request.params["LoggingInfo"]) > 0:
      id = int(request.params["LoggingInfo"])
      return self.__getLoggingInfo(id)
    elif request.params.has_key("getParams") and len(request.params["getParams"]) > 0:
      id = int(request.params["getParams"])
      return self.__getParams(id)
    elif request.params.has_key("delete") and len(request.params["delete"]) > 0:
      id = request.params["delete"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__delJobs(id)
    elif request.params.has_key("kill") and len(request.params["kill"]) > 0:
      id = request.params["kill"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__killJobs(id)
    elif request.params.has_key("reschedule") and len(request.params["reschedule"]) > 0:
      id = request.params["reschedule"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__rescheduleJobs(id)
    elif request.params.has_key("reset") and len(request.params["reset"]) > 0:
      id = request.params["reset"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__resetJobs(id)
    elif request.params.has_key("pilotStdOut") and len(request.params["pilotStdOut"]) > 0:
      id = request.params["pilotStdOut"]
      return self.__pilotGetOutput("out",int(id))
    elif request.params.has_key("pilotStdErr") and len(request.params["pilotStdErr"]) > 0:
      id = request.params["pilotStdErr"]
      return self.__pilotGetOutput("err",int(id))
    elif request.params.has_key("LogURL") and len(request.params["LogURL"]) > 0:
      id = request.params["LogURL"]
      return self.__pilotGetURL(int(id))
    elif request.params.has_key("getStagerReport") and len(request.params["getStagerReport"]) > 0:
      id = request.params["getStagerReport"]
      return self.__getStagerReport(int(id))
    elif request.params.has_key("getSandBox") and len(request.params["getSandBox"]) > 0:
      id = request.params["getSandBox"]
      return self.__getSandBox(int(id))
    elif request.params.has_key("refreshSelection") and len(request.params["refreshSelection"]) > 0:
      return self.__getSelectionData()
    elif request.params.has_key("globalStat"):
      return self.__globalStat()
    elif request.params.has_key("getPlotSrc") and len(request.params["getPlotSrc"]) > 0:
      id = request.params["getPlotSrc"]
      if request.params.has_key("type") and len(request.params["type"]) > 0:
        type = request.params["type"]
      else:
        type = "jobsBySite"
      if request.params.has_key("time") and len(request.params["time"]) > 0:
        timeToSet = request.params["time"]
      else:
        timeToSet = "week"
      if request.params.has_key("img") and len(request.params["img"]) > 0:
        img = request.params["img"]
      else:
        img = "False"
      return self.__getPlotSrc(type,id,timeToSet,img)
    elif request.params.has_key("getPending") and len(request.params["getPending"]) > 0:
      return self.__getParams(request.params["getPending"])
    elif request.params.has_key("getProxyStatus") and len(request.params["getProxyStatus"]) > 0:
      if request.params["getProxyStatus"].isdigit():
        return self.__getProxyStatus(int(request.params["getProxyStatus"]))
      else:
        return {"success":"false","error":"getProxyStatus not a number"}
    else:
      c.result = {"success":"false","error":"DIRAC Job ID(s) is not defined"}
      return c.result
################################################################################
  def __getProxyStatus( self, validSeconds = 0 ):
    from DIRAC.FrameworkSystem.Client.ProxyManagerClient import ProxyManagerClient
    proxyManager = ProxyManagerClient()
    userGroup = str(credentials.getSelectedGroup())
    if userGroup == "visitor":
      return {"success":"false","error":"User not registered"}
    userDN = str(credentials.getUserDN())
    gLogger.info("\033[0;31m userHasProxy(%s, %s, %s) \033[0m" % (userDN,userGroup,validSeconds))
    result = proxyManager.userHasProxy(userDN,userGroup,validSeconds)
    if result["OK"]:
      c.result = {"success":"true","result":"true"}
    else:
      c.result = {"success":"false","error":"false"}
    gLogger.info("\033[0;31m PROXY: \033[0m",result)
    return c.result
################################################################################
  def __getJdl(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobJDL(id)
    if result["OK"]:
      c.result = result["Value"]
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("JDL:",id)
    return c.result
################################################################################
  def __getBasicInfo(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobSummary(id)
    if result["OK"]:
      itemList = result["Value"]
      c.result = []
      for key,value in itemList.items():
        c.result.append([key,value])
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("BasicInfo:",id)
    return c.result
################################################################################
  def __getLoggingInfo(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobLoggingInfo(id)
    if result["OK"]:
      c.result = result["Value"]
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("LoggingInfo:",id)
    return c.result
################################################################################
  def __getParams(self,id):
    try:
      id = int(id)
    except Exception,x:
      c.result = {"success":"false","error":"%s" % str(x)}
      return c.result
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      c.result = []
      for i in attr.items():
        if i[0] != "StandardOutput":
          c.result.append([i[0],i[1]])
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("Params:",id)
    return c.result
################################################################################
  def __getStandardOutput(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      if attr.has_key("StandardOutput"):
        c.result = attr["StandardOutput"]
        c.result = {"success":"true","result":c.result}
      else:
        c.result = "Not accessible yet"
        c.result = {"success":"false","error":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("StandardOutput:",id)
    return c.result
################################################################################
  def __delJobs(self,id):
    MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
    result = MANAGERRPC.deleteJob(id)
    if result["OK"]:
      c.result = ""
      c.result = {"success":"true","result":c.result}
    else:
      if result.has_key("InvalidJobIDs"):
        c.result = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
        c.result = {"success":"false","error":c.result}
      elif result.has_key("NonauthorizedJobIDs"):
        c.result = "You are nonauthorized to delete jobs with JobID: %s" % result["NonauthorizedJobIDs"]
        c.result = {"success":"false","error":c.result}
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("DELETE:",id)
    return c.result
################################################################################
  def __killJobs(self,id):
    MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
    result = MANAGERRPC.killJob(id)
    if result["OK"]:
      c.result = ""
      c.result = {"success":"true","result":c.result}
    else:
      if result.has_key("InvalidJobIDs"):
        c.result = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
        c.result = {"success":"false","error":c.result}
      elif result.has_key("NonauthorizedJobIDs"):
        c.result = "You are nonauthorized to delete jobs with JobID: %s" % result["NonauthorizedJobIDs"]
        c.result = {"success":"false","error":c.result}
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("KILL:",id)
    return c.result
################################################################################
  def __resetJobs(self,id):
    MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
    result = MANAGERRPC.resetJob(id)
    if result["OK"]:
      c.result = ""
      c.result = {"success":"true","result":c.result}
    else:
      if result.has_key("InvalidJobIDs"):
        c.result = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
        c.result = {"success":"false","error":c.result}
      elif result.has_key("NonauthorizedJobIDs"):
        c.result = "You are nonauthorized to delete jobs with JobID: %s" % result["NonauthorizedJobIDs"]
        c.result = {"success":"false","error":c.result}
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("RESET:",id)
    return c.result
################################################################################
  def __rescheduleJobs(self,id):
    MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
    result = MANAGERRPC.rescheduleJob(id)
    if result["OK"]:
      c.result = ""
      c.result = {"success":"true","result":c.result}
    else:
      if result.has_key("InvalidJobIDs"):
        c.result = "Invalid JobIDs: %s" % result["InvalidJobIDs"]
        c.result = {"success":"false","error":c.result}
      elif result.has_key("NonauthorizedJobIDs"):
        c.result = "You are nonauthorized to delete jobs with JobID: %s" % result["NonauthorizedJobIDs"]
        c.result = {"success":"false","error":c.result}
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("RESET:",id)
    return c.result
################################################################################
  def __pilotGetOutput(self,mode,id):
    print "PilotOutput:",id
    PILOTRPC = getRPCClient("WorkloadManagement/WMSAdministrator")
    result = PILOTRPC.getJobPilotOutput(id)
    if result["OK"]:
      output = result["Value"]
      if mode == "out" and output.has_key("StdOut"):
        c.result =  output["StdOut"]
        c.result = {"success":"true","result":c.result}
      elif mode == "err" and output.has_key("StdErr"):
        c.result =  output["StdErr"]
        c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("pilotGetOutput:",id)
    return c.result
################################################################################
  def __pilotGetURL(self,id):
    print "LogFile:",id
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      if attr.has_key("Log URL"):
        url = attr["Log URL"]
        url = url.split('"')
        c.result =  url[1]
        c.result = {"success":"true","result":c.result}
      else:
        c.result = "No URL found"
        c.result = {"success":"false","error":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("pilotGetURL:",id)
    return c.result
################################################################################
  def __getStagerReport(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobParameters(id)
    if result["OK"]:
      attr = result["Value"]
      c.result = []
      if attr.has_key("StagerReport"):
        c.result =  attr["StagerReport"]
        c.result = {"success":"true","result":c.result}
      else:
        c.result = {"success":"false","error":"StagerReport not available"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("getStagerReport:",id)
    return c.result
################################################################################
  def __globalStat(self):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobPageSummaryWeb({},globalSort,0,1,False)
    gLogger.info(" - result - :",result)
    if result["OK"]:
      result = result["Value"]
      if result.has_key("Extras"):
        extra = result["Extras"]
        back = []
        for i in sortList(extra.keys()):
          back.append([i,extra[i]])
        return back
################################################################################
  def __getSandBox(self,id):
    return {"success":"false","error":"Not ready yet"}
################################################################################
  def __getPlotSrc(self,type,args,timeToSet,img):
    rc = ReportsClient()
    type = str(type)
    args = str(args)
    name = type + args
    if args == "All":
      args = {}
    else:
      args = args.split(",")
      args = {"Site":args}
    time = str(timeToSet)
    now = datetime.datetime.utcnow()
    if  timeToSet == 'day':
      timeSpan = now - datetime.timedelta( seconds = 86400 ) 
    elif timeToSet == 'week':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 7 )
    elif timeToSet == 'month':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 30 )
    elif timeToSet == 'year':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 360 )
    else:
      timeSpan = now - datetime.timedelta( seconds = 86400 * 7 )
    if len(name) < 1:
      c.result = {"success":"false","error":"Recived empty value"}
    else:
      result = self.__imgCache.get(name)
      if not result:
        result = rc.listReports("Job")
        if result["OK"]:
          plots = result["Value"]
          if type == 'jobsBySite':
            if img == 'True':
              result = rc.generatePlot("Job",plots[8],timeSpan,now,args,"Site")
            else:
              result = rc.generatePlot("Job",plots[8],timeSpan,now,args,"Site",{'thumbnail':True,'widh':800,'height':600,'thb_width':190,'thb_height':125})
          elif type == 'jobCPUbySite':
            if img == 'True':
              result = rc.generatePlot("Job",plots[0],timeSpan,now,args,"Site")
            else:
              result = rc.generatePlot("Job",plots[0],timeSpan,now,args,"Site",{'thumbnail':True,'widh':800,'height':600,'thb_width':196,'thb_height':125})
          elif type == 'CPUUsedBySite':
            if img == 'True':
              result = rc.generatePlot("Job",plots[2],timeSpan,now,args,"Site")
            else:
              result = rc.generatePlot("Job",plots[2],timeSpan,now,args,"Site",{'thumbnail':True,'widh':800,'height':600,'thb_width':196,'thb_height':125})
          else:
            if img == 'True':
              result = rc.generatePlot("Job",plots[8],timeSpan,now,args,"Site")
            else:
              result = rc.generatePlot("Job",plots[8],timeSpan,now,{},"Site",{'thumbnail':True,'widh':800,'height':600,'thb_width':196,'thb_height':125})
          gLogger.info("-RES:",result)
          if result["OK"]:
            result = result["Value"]
            if img == 'True':
              result = result["plot"]
            else:
              result = result["thumbnail"]
            c.result = {"success":"true","result":result}
            self.__imgCache.add(name, 600, result)
          else:
            c.result = {"success":"false","error":result["Message"]}
        else:
          c.result = {"success":"false","error":result["Message"]}
      else:
        c.result = {"success":"true","result":result}
    gLogger.info("getPlotSrc:",c.result)
    return c.result
################################################################################
  @jsonify
  def jobSubmit(self):
    response.headers['Content-type'] = "text/html" # Otherwise the browser would offer you to download a JobSubmit file
    jdl = ""
    params = {}
    for tmp in request.params:
      try:
        if len(request.params[tmp]) > 0:
          params[tmp] = request.params[tmp]
      except:
        pass
    for item in params:
      if item == "OutputSandbox":
        jdl = jdl + str(item) + " = {" + str(params[item]) + "};"
      else:
        jdl = jdl + str(item) + " = \"" + str(params[item]) + "\";"
    store = []
    for key in request.params.keys():
      try:
        if request.params[key].filename:
          gLogger.info("\033[0;31m file - %s \033[0m " % request.params[key].filename)
          store.append(request.params[key])
      except:
        pass
    gLogger.info("\033[0;31m *** %s \033[0m " % params)
    clearFS = False # Clear directory flag
    fileNameList = []
    exception_counter = 0
    if len(store) > 0: # If there is a file(s) in sandbox
      clearFS = True
      import shutil
      import os
      storePath = tempfile.mkdtemp(prefix='DIRAC_')
      try:
        for file in store:
          name = os.path.join( storePath , file.filename.lstrip(os.sep) )
          tFile = open( name , 'w' )
          shutil.copyfileobj(file.file, tFile)
          file.file.close()
          tFile.close()
          fileNameList.append(name)
      except Exception,x:
        exception_counter = 1
        c.result = {"success":"false","error":"An EXCEPTION happens during saving your sandbox file(s): %s" % str(x)}
    if len(fileNameList) > 0 and exception_counter == 0:
      sndBox = "InputSandbox = {\"" + "\",\"".join(fileNameList) + "\"};"
    else:
      sndBox = ""
    if exception_counter == 0:
      jdl = jdl + sndBox
      from DIRAC.WorkloadManagementSystem.Client.WMSClient import WMSClient
      jobManager = WMSClient(getRPCClient("WorkloadManagement/JobManager"),getRPCClient("WorkloadManagement/SandboxStore"),getTransferClient("WorkloadManagement/SandboxStore"))
      jdl = str(jdl)
      gLogger.info("J D L : ",jdl)
      try:
        result = jobManager.submitJob(jdl)
        if result["OK"]:
          c.result = {"success":"true","result":result["Value"]}
        else:
          c.result = {"success":"false","error":result["Message"]}
      except Exception,x:
        c.result = {"success":"false","error":"An EXCEPTION happens during job submittion: %s" % str(x)}
    if clearFS:
      shutil.rmtree(storePath)
    return c.result
################################################################################
