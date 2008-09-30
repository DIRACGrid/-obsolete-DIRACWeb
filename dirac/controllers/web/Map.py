import logging, os, tempfile, datetime
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC import gLogger
from DIRAC import S_ERROR, S_OK
#from DIRAC.Core.Utilities.DictCache import DictCache

log = logging.getLogger(__name__)

#cache = DictCache()

class MapController(BaseController):
#  __imgCache = DictCache()
  def display(self):
    return render("web/Map.mako")
################################################################################
  def getKML(self):
    pagestart = time()
    transferClient = getTransferClient('Monitoring/SiteMapping')
    name = request.params["name"]
    tmpFile = tempfile.NamedTemporaryFile()
    gLogger.info('-- Arguments to SiteMapping service: %s %s ' %(tmpFile.name,name))
    result = transferClient.receiveFile(tmpFile.name,name)
    teststring = "operation result for request file " + name + ": "
    gLogger.info(teststring, result)
    if not result["OK"]:
      c.result = result["Message"]
      return c.result
    tmpFile.seek( 0 )
    data = tmpFile.read()
    #self.__imgCache.add(name, 600, data)
    return data

    transferClient = getTransferClient('Monitoring/SiteMapping')
    if "name" not in request.params:
      c.result = "file name is absent"
      return c.result
    name = request.params["name"]
#    if name.find( ".kml" ) < -1:
#      c.result = "Not a valid file"
#      return c.result
    gLogger.info("request for the file:", name)
    data = self.__imgCache.get(name)
    gLogger.info("data from cache:", data)
    if not data:
      tmpFile = tempfile.NamedTemporaryFile()
      result = transferClient.receiveFile(tmpFile.name,name)
      teststring = "operation result for request file " + name + ": "
      gLogger.info(teststring, result)
      if not result["OK"]:
        c.result = result["Message"]
        return c.result
      tmpFile.seek( 0 )
      data = tmpFile.read()
      self.__imgCache.add(name, 600, data)
#      gLogger.info("CACHE after add:", self.__imgCache.getKeys(100))
    else:
      gLogger.info("this file taken from cache:", name)
    response.headers['Content-type'] = 'text/xml; charset=utf-8'
    gLogger.info("CACHE:", self.__imgCache.getKeys(600))
    return data
################################################################################
  def getImg(self):
    pagestart = time()
    transferClient = getTransferClient("Monitoring/SiteMapping")
    if "name" not in request.params:
      c.result = "file name is absent"
      return c.result
    name = request.params["name"]
#    if name.find( ".png" ) < -1:
#      c.result = "Not a valid image file"
#      return c.result
    gLogger.info("request for the file:", name)
    #data = self.__imgCache.get(name)
    #if not data:
    tmpFile = tempfile.NamedTemporaryFile()
    result = transferClient.receiveFile(tmpFile.name,name)
    teststring = "operation result for request file " + name + ": "
    gLogger.info(teststring, result)
    if not result["OK"]:
      c.result = result["Message"]
      return c.result
    tmpFile.seek( 0 )
    data = tmpFile.read()
      #self.__imgCache.add(name, 600, data)
    #else:
    #  gLogger.info("this file taken from cache:", name)
    response.headers['Content-type'] = 'image/png'
    response.headers['Content-Disposition'] = 'attachment; filename="%s"' % name
    response.headers['Content-Length'] = len(data)
    response.headers['Content-Transfer-Encoding'] = 'Binary'
    return data
################################################################################
  @jsonify
  def action(self):
    if request.params.has_key("siteName") and len(request.params["siteName"]) > 0:
      site = request.params["siteName"]
    else:
      site = "LCG.CERN.ch"
    if request.params.has_key("timeSpan") and len(request.params["timeSpan"]) > 0:
      time = request.params["timeSpan"]
    else:
      time = "week"
    if request.params.has_key("type") and len(request.params["type"]) > 0:
      type = request.params["type"]
    else:
      type = "jobsBySite"
    return self.__getPlotSrc(site,time,type)
################################################################################
  def __getPlotSrc(self,name,time,type):
    rc = ReportsClient()
    time = str(time)
    now = datetime.datetime.utcnow()
    if  time == 'day':
      timeSpan = now - datetime.timedelta( seconds = 86400 )
    elif time == 'week':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 7 )
    elif time == 'month':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 30 )
    elif time == 'year':
      timeSpan = now - datetime.timedelta( seconds = 86400 * 360 )
    else:
      timeSpan = now - datetime.timedelta( seconds = 86400 * 7 )
    if len(name) < 1:
      c.result = {"success":"false","error":"Recived empty value"}
    else:
      result = rc.listReports("Job")
      if result["OK"]:
        plots = result["Value"]
        if type == 'jobsBySite':
          result = rc.generatePlot("Job",plots[8],timeSpan,now,{"Site":name},"Site")
        elif type == 'jobCPUbySite':
          result = rc.generatePlot("Job",plots[0],timeSpan,now,{"Site":name},"Site")
        elif type == 'CPUUsedBySite':
          result = rc.generatePlot("Job",plots[2],timeSpan,now,{"Site":name},"Site")
        else:
          result = rc.generatePlot("Job",plots[8],timeSpan,now,{"Site":name},"Site")
        if result["OK"]:
          result = result["Value"]
          result = result["plot"]
          gLogger.info("result:",result)
          c.result = {"success":"true","result":result}
        else:
          c.result = {"success":"false","error":result["Message"]}
      else:
        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("getPlotSrc:",c.result)
    return c.result
################################################################################
  @jsonify
  def act(self):
    if request.params.has_key("action") and len(request.params["action"]) > 0:
      action = request.params["action"]
    else:
      action = ""
    if request.params.has_key("comment") and len(request.params["comment"]) > 0:
      text = request.params["comment"]
    else:
      text = ""
    if request.params.has_key("siteName") and len(request.params["siteName"]) > 0:
      site = request.params["siteName"]
    else:
      site = ""
    return self.__getAction(action,text,site)
################################################################################
  def __getAction(self,action,text,site):
    action = str(action)
    text = str(text)
    site = str(site)
    if len(action) == 0 or len(text) == 0 or len(site) == 0:
      c.result = {"success":"false","result":"Either action or comment message or site not defined"}
    else:
      RPCClient = getRPCClient("WorkloadManagement/WMSAdministrator")
      if action == "ban":
        result = RPCClient.banSite(site,text)
      elif action == "unban":
        result = RPCClient.allowSite(site,text)
      else:
        result = "This " + action + " action is not supported"
      if result["OK"]:
        result = result["Value"]
        c.result = {"success":"true","result":result}
      else:
        c.result = {"success":"false","result":result["Message"]}
    return c.result
################################################################################
  @jsonify
  def info(self):
    if request.params.has_key("siteName") and len(request.params["siteName"]) > 0:
      site = request.params["siteName"]
    else:
      site = ""
    return self.__getInfo(site)
################################################################################
  def __getInfo(self,site):
    if len(site) == 0:
      c.result = {"success":"false","result":"Site not defined"}
    else:
      RPCClient = getRPCClient("WorkloadManagement/WMSAdministrator")
      result = RPCClient.getSiteMaskLogging(site)
      gLogger.info("- siteName:",site)
      gLogger.info("- Info result:",result)
      if result["OK"]:
        result = result["Value"]
        c.result = result[site]
      else:
        c.result = {"success":"false","result":result["Message"]}
    return c.result
