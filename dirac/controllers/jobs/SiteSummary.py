import logging, tempfile
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
#from dirac.lib.sessionManager import *
from DIRAC import gLogger
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []

global imgCache
imgCache = DictCache()
#globalSort = [["SiteName","DESC"]]

class SitesummaryController(BaseController):
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
    result = self.__request()
    result = RPC.getSiteSummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    gLogger.info("\033[0;31m YO: \033[0m",result)
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
              plots = 'test.png'
              if result.has_key("Plots"):
                imgCache.add("test.png",600,result["Plots"])
                res = imgCache.exists(name)
                gLogger.info("exists? ", res)
#                tmpFile = tempfile.NamedTemporaryFile(suffix='.png')
#                tmpFile.write(result["Plots"])
#                tmpFile.close()
#                plots = tmpFile.name
#                gLogger.info("\033[0;31mSITESUMMARY INDEX REQUEST:\033[0m",tempfile.gettempdir())
              if result.has_key("Extras"):
                extra = result["Extras"]
                c.result = {"success":"true","result":c.result,"total":total,"extra":extra,"plots":plots}
              else:
                c.result = {"success":"true","result":c.result,"total":total,"plots":plots}
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
    gLogger.info("\033[0;31mJOB SUBMIT REQUEST:\033[0m %s" % (time() - pagestart))
    return c.result
###############################################################################
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
          pageNumber = int(request.params["start"])
        else:
          pageNumber = 0
      else:
        numberOfJobs = 25
      if request.params.has_key("prod") and len(request.params["prod"]) > 0:
        if str(request.params["prod"]) != "All":
          req["JobGroup"] = str(request.params["prod"]).split('::: ')
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        if str(request.params["site"]) != "All":
          req["GridSite"] = str(request.params["site"]).split('::: ')
      if request.params.has_key("stat") and len(request.params["stat"]) > 0:
        if str(request.params["stat"]) != "All":
          req["Status"] = str(request.params["stat"]).split('::: ')
      if request.params.has_key("minorstat") and len(request.params["minorstat"]) > 0:
        if str(request.params["minorstat"]) != "All":
          req["MinorStatus"] = str(request.params["minorstat"]).split('::: ')
      if request.params.has_key("app") and len(request.params["app"]) > 0:
        if str(request.params["app"]) != "All":
          req["ApplicationStatus"] = str(request.params["app"]).split('::: ')
      else:
        if request.params.has_key("owner") and len(request.params["owner"]) > 0:
          if str(request.params["owner"]) != "All":
            req["Owner"] = str(request.params["owner"]).split('::: ')
      if request.params.has_key("date") and len(request.params["date"]) > 0:
        if str(request.params["date"]) != "YYYY-mm-dd":
          req["LastUpdate"] = str(request.params["date"])
      globalSort = []
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  def getImg(self):
    if "name" not in request.params:
      c.result = "file name is absent"
      return c.result
    name = request.params["name"]
    if name.find( ".png" ) < -1:
      c.result = "Not a valid image file"
      return c.result
    gLogger.info("request for the file:", name)
    res = imgCache.exists(name)
    gLogger.info("exists? ", res)
    data = imgCache.getKeys()
    gLogger.info("getKeys ", data) 
#    tmpFile.seek( 0 )
#    data = tmpFile.read()
#    response.headers['Content-type'] = 'image/png'
#    response.headers['Content-Disposition'] = 'attachment; filename="%s"' % name
#    response.headers['Content-Length'] = len(data)
#    response.headers['Content-Transfer-Encoding'] = 'Binary'
    return data

