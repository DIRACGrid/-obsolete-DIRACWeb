import logging, tempfile
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.controllers.info.general import GeneralController
#from dirac.lib.sessionManager import *
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.DictCache import DictCache
from dirac.lib.credentials import getUserDN, getUsername, getSelectedGroup

########
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient
########

log = logging.getLogger(__name__)

global numberOfJobs
global pageNumber
global globalSort
numberOfJobs = 25
pageNumber = 0
globalSort = []

global imgCache
imgCache = DictCache()
#globalSort = [["SiteName","DESC"]]

class SitesummaryController(BaseController):
################################################################################
#  def profile(self):
#    upc = UserProfileClient( profileName, getRPCClient( "Framework/UserProfileManager" ) )
#    upc.storeWebData( varNameInProfile, data )
#    upc.retrieveWebData( varInProfile )
################################################################################
  def display(self):
    pagestart = time()
    c.select = self.__getSelectionData()
    gLogger.info("SELECTION RESULTS:",c.select)
    gLogger.info("\033[0;31mSITESUMMARY INDEX REQUEST:\033[0m %s" % (time() - pagestart))
    return render("jobs/SiteSummary.mako")
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    RPC = getRPCClient("WorkloadManagement/WMSAdministrator")
    gLogger.info("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    result = self.__request()
    gLogger.always( "getSiteSummaryWeb(%s,%s,%s,%s)" % (result,globalSort,pageNumber,numberOfJobs) )
    result = RPC.getSiteSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    gLogger.always("\033[0;31m YO: \033[0m",result)
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
              countryCode = GeneralController().getCountries()
              for i in jobs:
                tmp = {}
                for j in range(0,headLength):
                  tmp[head[j]] = i[j]
                if countryCode.has_key(i[2]):
                  tmp["FullCountry"] = countryCode[i[2]]
                else:
                  tmp["FullCountry"] = "Unknown"
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
      gLogger.always("- E R R O R -")
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31m SITESUMMARY INDEX REQUEST: \033[0m %s" % (time() - pagestart))
    return c.result
################################################################################
  @jsonify
  def action(self):
    if request.params.has_key("refreshSelection") and len(request.params["refreshSelection"]) > 0:
      return self.__getSelectionData()
###############################################################################
  def __getSelectionData(self):
    callback = {}
###
    RPC = getRPCClient("WorkloadManagement/WMSAdministrator")
    result = RPC.getSiteSummarySelectors()
    gLogger.info("\033[0;31m ++++++: \033[0m %s" % result)
    if result["OK"]:
      result = result["Value"]
      if result.has_key("Status") and len(result["Status"]) > 0:
        status = []
        status.append([str("All")])
        for i in result["Status"]:
          status.append([str(i)])
      else:
        status = [["Nothing to display"]]
      callback["status"] = status
      if result.has_key("GridType") and len(result["GridType"]) > 0:
        gridtype = []
        gridtype.append([str("All")])
        for i in result["GridType"]:
          gridtype.append([str(i)])
      else:
        gridtype = [["Nothing to display"]]
      callback["gridtype"] = gridtype
      if result.has_key("MaskStatus") and len(result["MaskStatus"]) > 0:
        maskstatus = []
        maskstatus.append([str("All")])
        for i in result["MaskStatus"]:
          maskstatus.append([str(i)])
      else:
        maskstatus = [["Nothing to display"]]
      callback["maskstatus"] = maskstatus
      if result.has_key("Site") and len(result["Site"]) > 0:
        s = list(result["Site"])
        tier1 = gConfig.getValue("/Website/PreferredSites",[])
        site = list()
        site.append(["All"])
        for i in tier1:
          site.append([str(i)])
        for i in s:
          if i not in tier1:
            site.append([str(i)])
      else:
        site = [["Error during RPC call"]]
      callback["site"] = site
      if result.has_key("Country") and len(result["Country"]) > 0:
        country = []
        country.append(["All"])
        countryCode = GeneralController().getCountries()
        for i in result["Country"]:
          if countryCode.has_key(i):
            j = countryCode[i]
          country.append([str(j)])
      else:
        country = [["Nothing to display"]]
      country.sort()
      callback["country"] = country
    else:
      callback["status"] = [["Error during RPC call"]]
      callback["gridtype"] = [["Error during RPC call"]]
      callback["maskstatus"] = [["Error during RPC call"]]
      callback["site"] = [["Error during RPC call"]]
      callback["country"] = [["Error during RPC call"]]
###
    return callback
################################################################################
  def __request(self):
    req = {}
    global pageNumber
    global numberOfJobs
    global globalSort
    if request.params.has_key("id") and len(request.params["id"]) > 0:
      pageNumber = 0
      req["JobID"] = str(request.params["id"])
    elif request.params.has_key("expand") and len(request.params["expand"]) > 0:
      globalSort = [["GridSite","ASC"]]
      numberOfJobs = 500
      pageNumber = 0
      req["ExpandSite"] = str(request.params["expand"])
    else:
      result = gConfig.getOption("/Website/ListSeparator")
      if result["OK"]:
        separator = result["Value"]
      else:
        separator = ":::"
      pageNumber = 0
      numberOfJobs = 500
      if request.params.has_key("country") and len(request.params["country"]) > 0:
        if str(request.params["country"]) != "All":
          code = GeneralController().getCountriesReversed()
          tmpValue = str(request.params["country"]).split(separator)
          newValue = []
          for i in tmpValue:
            if code.has_key(i):
              newValue.append(code[i])
          req["Country"] = newValue
#          req["Country"] = str(request.params["country"]).split(separator)
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        if str(request.params["site"]) != "All":
          req["Site"] = str(request.params["site"]).split(separator)
      if request.params.has_key("status") and len(request.params["status"]) > 0:
        if str(request.params["status"]) != "All":
          req["Status"] = str(request.params["status"]).split(separator)
      if request.params.has_key("maskstatus") and len(request.params["maskstatus"]) > 0:
        if str(request.params["maskstatus"]) != "All":
          req["MaskStatus"] = str(request.params["maskstatus"]).split(separator)
      if request.params.has_key("gridtype") and len(request.params["gridtype"]) > 0:
        if str(request.params["gridtype"]) != "All":
          req["GridType"] = str(request.params["gridtype"]).split(separator)
      else:
        if request.params.has_key("owner") and len(request.params["owner"]) > 0:
          if str(request.params["owner"]) != "All":
            req["Owner"] = str(request.params["owner"]).split(separator)
      if request.params.has_key("date") and len(request.params["date"]) > 0:
        if str(request.params["date"]) != "YYYY-mm-dd":
          req["LastUpdate"] = str(request.params["date"])
      globalSort = []
    gLogger.info("REQUEST:",req)
    return req

  @jsonify
  def allowSite( self ):
    return self.action( "Allow" )

  @jsonify
  def banSite( self ):
    return self.action( "Ban" )


  def action( self , act = None ):

    """
    """

    RPC = getRPCClient( "WorkloadManagement/WMSAdministrator" )

    if not "name" in request.params:
      return { "success" : "false" , "error" : "Name of site is undefined" }
    site = request.params["name"]
    sites = site.split( "," )
    
    user = getUsername()
    group = getSelectedGroup()

    if not "comment" in request.params:
      comment = "%s by %s@%s" % ( act , user , group )
    comment = request.params["comment"]

    if not act in [ "Allow" , "Ban" ]:
      return { "success" : "false" , "error" : "Action %s is unsupported" % act }

    gc = GeneralController()
    gc.action = act
    gc.actionSuccess = list()
    gc.actionFailed = list()
    gc.prefix = "Site"

    for i in sites:
      i = i.strip()
      if act is "Allow":
        result = RPC.allowSite( i , comment )
      elif act is "Ban":
        result = RPC.banSite( i , comment )
      else:
        continue
      gLogger.debug( "RPC return: %s" % result )        
      if not result["OK"]:
        error = "%s: %s" % ( i , result[ "Message" ] )
        gc.actionFailed.append( error )
        gLogger.error( "Failure during %s host %s" % ( act , i ) )
        continue
      gc.actionSuccess.append( i )
      gLogger.info( "Successfully %s host %s" % ( act , i ) )

    return gc.aftermath()
