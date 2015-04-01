import logging, datetime, tempfile
from time import time

from dirac.lib.base import BaseController, render, c, jsonify, request, response
from dirac.lib.diset import getRPCClient, getTransferClient
from DIRAC import gConfig, gLogger, S_OK
from DIRAC.Core.Utilities.List import sortList, uniqueElements
from DIRAC.Core.Utilities import Time
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache
from DIRAC.WorkloadManagementSystem.Service.JobPolicy import JobPolicy, RIGHT_GET_INFO
from DIRAC.ConfigurationSystem.Client.Helpers.Operations import Operations
from DIRAC.RequestManagementSystem.Client.Request       import Request

import dirac.lib.credentials as credentials
#from DIRAC.Interfaces.API.Dirac import Dirac

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
    group = credentials.getSelectedGroup()
    if group == "visitor" and credentials.getUserDN() == "":
      return render("/login.mako")
    c.select = self.__getSelectionData()
    if not c.select.has_key("extra"):
      groupProperty = credentials.getProperties(group)
      if "JobAdministrator" not in groupProperty and "JobSharing" not in groupProperty:
        c.select["extra"] = {"owner":credentials.getUsername()}
    return render("jobs/JobMonitor.mako")
################################################################################
  def __getEligibleOwners( self, userDN, group ):
    """ Get users which jobs can be in principle shown in the page
    """
    owners = []
    allInfo = Operations( group = group ).getValue('/Services/JobMonitoring/GlobalJobsInfo', False )
    jobPolicy = JobPolicy( userDN, group, allInfo = allInfo )
    result = jobPolicy.getControlledUsers( RIGHT_GET_INFO )
    if not result['OK']:
      return result
    elif result['Value']:
      allowedUsers = []
      if result['Value'] != "ALL":
        for aUser, aGroup in result['Value']:
          allowedUsers.append( aUser )
        allowedUsers = list( set( allowedUsers ) )
      RPC = getRPCClient("WorkloadManagement/JobMonitoring")
      result = RPC.getOwners()
      if result["OK"]:
        if len(result["Value"])>0:
          owners.append( str("All") )
          for owner in result["Value"]:
            if allowedUsers and owner in allowedUsers:
              owners.append( str( owner ) )
            elif not allowedUsers:
              owners.append( str(  owner ) )
      else:
        gLogger.error( "RPC.getOwners() return error:", result["Message"] )
        return result

    return S_OK( owners )
################################################################################
  def __getJobSummary(self,jobs,head):
    valueList = []
    for i in jobs:
      valueList.append({"id":str(i[2]),"status":str(i[6]),"minorStatus":str(i[10]),"applicationStatus":str(i[11]),"site":str(i[26]),"jobname":str(i[22]),"lastUpdate":str(i[25]),"owner":str(i[31]),"submissionTime":str(i[12]),"signTime":str(i[3])})
    return valueList
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    user = str(credentials.getUsername())
    userDN = str(credentials.getUserDN())
    group = str(credentials.getSelectedGroup())
    result = RPC.getOwners()
    haveJobsToDisplay = False
    if result["OK"]:
      resultEligible = self.__getEligibleOwners( userDN, group )
      if resultEligible['OK']:
        for own in resultEligible['Value']:
          if own in result["Value"]:
            # There is something to display probably
            haveJobsToDisplay = True
            break
        if not haveJobsToDisplay:
          c.result = {"success":"false","error":"You don't have any jobs eligible to display"}
          return c.result
      else:
        c.result = {"success":"false","error":"Failed to evaluate eligible users"}
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
    if user == "Anonymous":
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
        gLogger.error("RPC.getProductionIds() return error: %s" % result["Message"])
        prod = [["Error happened on service side"]]
      callback["prod"] = prod
###
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getSites()
    if result["OK"]:
      tier1 = gConfig.getValue("/Website/PreferredSites",[]) # Always return a list
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
      gLogger.error("RPC.getSites() return error: %s" % result["Message"])
      site = [["Error happened on service side"]]
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
      gLogger.error("RPC.getStates() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
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
      gLogger.error("RPC.getMinorStates() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
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
      gLogger.error("RPC.getApplicationstates() return error: %s" % result["Message"])
      app = [["Error happened on service side"]]
    callback["app"] = app
###
    result = RPC.getJobTypes()
    if result["OK"]:
      types = []
      if len(result["Value"])>0:
        types.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          types.append([i])
      else:
        types = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getJobTypes() return error: %s" % result["Message"])
      types = [["Error happened on service side"]]
    callback["types"] = types
###
    userDN = credentials.getUserDN()
    result = self.__getEligibleOwners( userDN, group )
    if not result['OK']:
      callback["owner"] = [["Failed to evaluate access rights"]]
    else:
      eligibleOwners = result['Value']
      if not eligibleOwners:
        callback["owner"] = [["Nothing to display"]]
      else:
        callback["owner"] = [ [str( own )] for own in eligibleOwners ]

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
    elif request.params.has_key("getStat") and len(request.params["getStat"]) > 0:
      selector = str(request.params["getStat"])
      return self.__getStats(selector)
    elif request.params.has_key("globalStat"):
      return self.__globalStat()
    elif request.params.has_key("getPageOptions") and len(request.params["getPageOptions"]) > 0:
      return self.__getPageOptions()
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
      return self.__getPlotSrc( type, id, timeToSet, img )
    elif request.params.has_key( "getPending" ) and len( request.params["getPending"] ) > 0:
      return self.__getPending( request.params["getPending"] )
    elif request.params.has_key( "canRunJobs" ) and request.params["canRunJobs"]:
      return self.__canRunJobs()
    elif request.params.has_key("getProxyStatus") and len(request.params["getProxyStatus"]) > 0:
      return self.__getProxyStatus()
    elif request.params.has_key("getLaunchpadOpts") and len(request.params["getLaunchpadOpts"]) > 0:
      return self.__getLaunchpadOpts()
    else:
      c.result = {"success":"false","error":"The request parameters can not be recognized or they are not defined"}
      return c.result
################################################################################
  def __getPageOptions( self ):
    gLogger.info( "start __getPageOptions" )
    callback = dict()
    for i in [ "ShowRequest" , "ShowStagerReport" , "ShowLogFile" ]:
      value = gConfig.getValue( "/Website/JobMonitor/Context/%s" % i , 'false' )
      callback[ i ] = value
    gLogger.debug( "Page options: %s" % callback )
    gLogger.info( "end __getPageOptions" )
    return { "success" : "true" , "result" : callback }
################################################################################
  def __getPlatform( self ):
    gLogger.info( "start __getPlatform" )
    path = "/Resources/Computing/OSCompatibility"
    result = gConfig.getOptionsDict( path )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return False
    platformDict = result[ "Value" ]
    platform = platformDict.keys()
    gLogger.debug( "platform: %s" % platform )
    gLogger.info( "end __getPlatform" )
    return platform
################################################################################
  def __getOptionsFromCS( self , path = "/Website/Launchpad/Options" , delimiter = "," ):
    gLogger.info( "start __getOptionsFromCS" )
    result = gConfig.getOptionsDict( path )
    gLogger.always( result )
    if not result["OK"]:
      return False
    options = result["Value"]
    for i in options.keys():
      options[ i ] = options[ i ].split( delimiter )
    result = gConfig.getSections(path)
    if result["OK"]:
      sections = result["Value"]
    if len(sections) > 0:
      for i in sections:
        options[ i ] = self.__getOptionsFromCS( path + '/' + i , delimiter )
    gLogger.always( "options: %s" % options )
    gLogger.info( "end __getOptionsFromCS" )
    return options
################################################################################
  def __getLaunchpadOpts(self):
    gLogger.info( "start __getLaunchpadOpts" )
    delimiter = gConfig.getValue( "/Website/Launchpad/ListSeparator" , ',' )
    options = self.__getOptionsFromCS( delimiter = delimiter)
    platform = self.__getPlatform()
    if platform and options:
      if not options.has_key( "Platform" ):
        options[ "Platform" ] = platform
      else:
        csPlatform = list( options[ "Platform" ] )
        allPlatforms = csPlatform + platform
        platform = uniqueElements( allPlatforms )
        options[ "Platform" ] = platform
    gLogger.debug( "Combined options from CS: %s" % options )
    override = gConfig.getValue( "/Website/Launchpad/OptionsOverride" , False)
    gLogger.info( "end __getLaunchpadOpts" )
    return {"success":"true","result":options,"override":override,"separator":delimiter}
################################################################################
  def __getStats(self,selector):
    gLogger.always(" --- selector : %s" % selector)
#    import sys
#    sys.stdout.flush()
    req = self.__request()
    selector = str(selector)
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    if selector == "Minor status":
      selector = "MinorStatus"
    elif selector == "Application status":
      selector = "ApplicationStatus"
    gLogger.always(" --- getJobStats(%s,%s) : " % (str(selector),str(req)))
    result = RPC.getJobStats(selector,req)
    if result["OK"]:
      c.result = []
      result = dict(result["Value"])
      keylist = result.keys()
      keylist.sort()
      if selector == "Site":
        tier1 = gConfig.getValue("/Website/PreferredSites",[])
        if len(tier1) > 0:
          tier1.sort()
          for i in tier1:
            if result.has_key(i):
              countryCode = i.rsplit(".",1)[1]
              c.result.append({"Key":i,"Value":result[i],"Code":countryCode})
      for key in keylist:
        if selector == "Site" and tier1:
          if key not in tier1:
            try:
              countryCode = key.rsplit(".",1)[1]
            except:
              countryCode = "Unknown"
            c.result.append({"Key":key,"Value":result[key],"Code":countryCode})
        elif selector == "Site" and not tier1:
          try:
            countryCode = key.rsplit(".",1)[1]
          except:
            countryCode = "Unknown"
          c.result.append({"Key":key,"Value":result[key],"Code":countryCode})
        else:
          c.result.append({"Key":key,"Value":result[key]})
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  def __canRunJobs(self):
    groupPropertie = credentials.getProperties( credentials.getSelectedGroup() )
    if "NormalUser" in groupPropertie:
      return True
    else:
      return False
################################################################################
  def __getProxyStatus(self,secondsOverride = None):

    from DIRAC.FrameworkSystem.Client.ProxyManagerClient import ProxyManagerClient

    proxyManager = ProxyManagerClient()
    group = str(credentials.getSelectedGroup())
    if group == "visitor":
      return {"success":"false","error":"User is anonymous or is not registered in the system"}
    userDN = str(credentials.getUserDN())
    if secondsOverride and str(secondsOverride).isdigit():
      validSeconds = int(secondsOverride)
    else:
      defaultSeconds = 24 * 3600 + 60 # 24H + 1min
      validSeconds = gConfig.getValue("/Registry/DefaultProxyLifeTime",defaultSeconds)
    gLogger.info("\033[0;31m userHasProxy(%s, %s, %s) \033[0m" % (userDN,group,validSeconds))
    result = proxyManager.userHasProxy(userDN,group,validSeconds)
    if result["OK"]:
      if result["Value"]:
        c.result = {"success":"true","result":"true"}
      else:
        c.result = {"success":"true","result":"false"}
    else:
      c.result = {"success":"false","error":"false"}
    gLogger.info("\033[0;31m PROXY: \033[0m",result)
    return c.result
################################################################################
  def __getJdl(self,id):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getJobJDL( id, False )
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
  def __getPending(self,id):
    try:
      id = int(id)
    except Exception,x:
      c.result = {"success":"false","error":"%s" % str(x)}
      return c.result
    RPC = getRPCClient( "RequestManagement/ReqManager" )
    result = RPC.readRequestsForJobs( [id] )
    if result["OK"]:
      c.result = []
      if id in result['Value']['Successful']:
        req = Request(result['Value']['Successful'][id]).getDigest()['Value']
        c.result.append( ["PendingRequest", req] )
        c.result = {"success":"true", "result":c.result}
      elif id in result['Value']['Failed']: # when no request associated to the job
        c.result = {"success":"false", "error":result['Value']["Failed"][id]}
      else:
        c.result = {"success":"false", "error":"No request found with unknown reason"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("Params:",id)
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
    if not self.__canRunJobs():
      return {"success":"false","error":"You are not allowed to run the jobs"}
    proxy = self.__getProxyStatus(86460)
    if proxy["success"] == "false" or proxy["result"] == "false":
      return {"success":"false","error":"You can not run a job: your proxy is valid less then 24 hours"}
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
      if item == "Parameters":
        try:
          parameters = int(params[item])
          jdl = jdl + str(item) + " = \"" + str(parameters) + "\";"
        except:
          parameters = str(params[item])
          if parameters.find("{") >= 0 and parameters.find("}") >= 0:
            parameters = parameters.rstrip("}")
            parameters = parameters.lstrip("{")
            if len(parameters) > 0:
              jdl = jdl + str(item) + " = {" + parameters + "};"
            else:
              return {"success":"false","error":"Parameters vector has zero length"}
          else:
            return {"success":"false","error":"Parameters must be an integer or a vector. Example: 4 or {1,2,3,4}"}
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
      jobManager = WMSClient(getRPCClient("WorkloadManagement/JobManager"),
                             getRPCClient("WorkloadManagement/SandboxStore"),
                             getTransferClient("WorkloadManagement/SandboxStore"))
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
