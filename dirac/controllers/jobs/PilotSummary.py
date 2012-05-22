import logging
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
#from dirac.lib.sessionManager import *
from DIRAC import gConfig, gLogger
import dirac.lib.credentials as credentials

log = logging.getLogger(__name__)
global numberOfJobs
global pageNumber
global globalSort
numberOfJobs = 2500
pageNumber = 0
globalSort = []

class PilotsummaryController(BaseController):
################################################################################
  def display(self):
    pagestart = time()
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      return render("/login.mako")
    c.select = self.__getSelectionData()
    return render("jobs/PilotSummary.mako")
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      c.result = {"success":"false","error":"You are not authorised"}
      return c.result
    RPC = getRPCClient("WorkloadManagement/WMSAdministrator")
    result = self.__request()
    gLogger.info("\033[0;31m VAL: \033[0m\n result: %s\nglobalSort: %s\npageNumber: %s\nnumberOfJobs: %s" % (result,globalSort,pageNumber,numberOfJobs))
    result = RPC.getPilotSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
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
    gLogger.info("\033[0;31m Pilot Summary SUBMIT REQUEST:\033[0m %s" % (time() - pagestart))
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
###
    if lhcbUser == "Anonymous":
      callback["site"] = [["Insufficient rights"]]
    else:
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
    return callback
################################################################################
  def __request(self):
    req = {}
    lhcbGroup = credentials.getSelectedGroup()
    lhcbUser = str(credentials.getUsername())
    global pageNumber
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
      if request.params.has_key("prod") and len(request.params["prod"]) > 0:
        if str(request.params["prod"]) != "All":
          req["JobGroup"] = str(request.params["prod"]).split(separator)
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        if str(request.params["site"]) != "All":
          tmp = str(request.params["site"]).split(separator)
          if len(tmp) == 1:
            req["ExpandSite"] = tmp[0]
          else:
            req["GridSite"] = tmp
      if request.params.has_key("stat") and len(request.params["stat"]) > 0:
        if str(request.params["stat"]) != "All":
          req["Status"] = str(request.params["stat"]).split(separator)
      if request.params.has_key("minorstat") and len(request.params["minorstat"]) > 0:
        if str(request.params["minorstat"]) != "All":
          req["MinorStatus"] = str(request.params["minorstat"]).split(separator)
      if request.params.has_key("app") and len(request.params["app"]) > 0:
        if str(request.params["app"]) != "All":
          req["ApplicationStatus"] = str(request.params["app"]).split(separator)
#      if lhcbGroup == "lhcb" or lhcbGroup == "lhcb_user":
#        req["Owner"] = str(lhcbUser)
      else:
        if request.params.has_key("owner") and len(request.params["owner"]) > 0:
          if str(request.params["owner"]) != "All":
            req["Owner"] = str(request.params["owner"]).split(separator)
      if request.params.has_key("date") and len(request.params["date"]) > 0:
        if str(request.params["date"]) != "YYYY-mm-dd":
          req["LastUpdate"] = str(request.params["date"])
      if request.params.has_key("sort") and len(request.params["sort"]) > 0:
        globalSort = str(request.params["sort"])
        key,value = globalSort.split(" ")
        globalSort = [[str(key),str(value)]]
      else:
#        globalSort = [["JobID","DESC"]]
        globalSort = [["GridSite","ASC"]]
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  @jsonify
  def action(self):
    if request.params.has_key("ExpandSite") and len(request.params["ExpandSite"]) > 0:
      site = int(request.params["ExpandSite"])
      return self.__expSite(site)
################################################################################
