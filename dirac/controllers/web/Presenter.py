import logging, tempfile
from time import time, gmtime, strftime
from types import ListType
from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gLogger, S_OK, S_ERROR
from DIRAC.Core.Utilities.List import sortList
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials
import urlparse #for decode the URL
import cgi # for decode the URL
from DIRAC.AccountingSystem.private.FileCoding import extractRequestFromFileId

########
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient
########
import datetime
from DIRAC.Core.Utilities import List
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from dirac.controllers.systems.accountingPlots import parseFormParams
import json
log = logging.getLogger(__name__)

USER_PROFILE_NAME = "Summary"

class PresenterController(BaseController):
################################################################################
  def display(self):
    if not authorizeAction():
      return render("/login.mako")
    c.select = dict()
    result = self.__convert()
    if result["OK"]:
      c.select = self.__getData()
    if c.select.has_key("result"):
      c.select = c.select["result"]
    return render("web/Presenter.mako")
###############################################################################
  @jsonify
  def action(self):
    if not authorizeAction():
      return {"success":"false","error":"Insufficient rights"}
    if request.params.has_key("getBookmarks") > 0:
      name = str(request.params["getBookmarks"])
      return self.__getData(name)
    elif request.params.has_key("setBookmarks") and len(request.params["setBookmarks"]) > 0:
      name = str(request.params["setBookmarks"])
      return self.__setData(name)
    elif request.params.has_key("delBookmarks") and len(request.params["delBookmarks"]) > 0:
      name = str(request.params["delBookmarks"])
      return self.__delData(name)
    elif request.params.has_key("delAllBookmarks") and len(request.params["delAllBookmarks"]) > 0:
      return self.__delAllData()
    else:
      c.result = {"success":"false","error":"Action is not defined"}
      return c.result

  def getPlotsParameters(self, url, translate=True):
    """
    The input parameter is an URL. It decode the URL and creates a dictionary,
    which contains the detailes of the plot.
    """
    gLogger.debug('URL' + url)
    result = None
    parseRes = urlparse.urlparse(url)
    if parseRes.query:
      queryRes = cgi.parse_qs(parseRes.query)
      if 'file' in queryRes:
        fileId = queryRes[ 'file' ][0]

      retVal = extractRequestFromFileId(fileId)

      if not retVal[ 'OK' ]:
        gLogger.error("Could not decode fileId", "'%s', error was %s" % (fileId, retVal[ 'Message' ]))
        result = retVal
      else:
        if translate:
          result = S_OK({'ReportName':retVal['Value'].get('reportName', ''),
                     'Type':retVal['Value'].get('typeName', ''),
                     'Conditions':str(retVal['Value'].get('condDict', '')),
                     'Grouping':retVal['Value'].get('grouping', ''),
                     'StartTime':str(retVal['Value'].get('startTime', '')),
                     'EndTime':str(retVal['Value'].get('endTime', '')),
                     'ExtraArguments':str(retVal['Value'].get('extraArgs', ''))
                     })
        else:
          params = None
          if not retVal['OK']:
            return retVal
          else:
            params = retVal['Value']
            if 'endTime' in params:
              params['endTime'] = params['endTime'].strftime("%Y-%m-%d")
            if 'startTime' in params:
              params['startTime'] = params['startTime'].strftime("%Y-%m-%d")
          result = S_OK(params)
    return result

  ###############################################################################
  @jsonify
  def getDetails(self):
    """
    it used provide a detailed description about the plot creation
    """
    gLogger.debug("Action" + str(request))
    url = str(request.params.get('Url', ''))

    try:
      url = str(url);
    except Exception, e:
      return S_ERROR('StepId is not a number')
    return self.getPlotsParameters(url)

  ###############################################################################
  @jsonify
  def getPlotDecodedParameters(self):
    """
    It decodes a given URL and returns its requester.
    """
    result = S_ERROR("Can not decode the plot parameters!")
    gLogger.debug("Action" + str(request))
    url = str(request.params.get('Url', ''))
    urlList = request.params.get('UrlList', "[]")
    urlList = list(json.loads(urlList))
    change = request.params.get('ReplaceTime','{}')
    change = dict(json.loads(change))

    if len(urlList) > 0:
      values = {}
      repClient = ReportsClient(rpcClient=getRPCClient("Accounting/ReportGenerator"))
      for i in urlList:
        retVal = self.getPlotsParameters(str(i), False)
        if not retVal['OK']:
          return retVal
        else:
          params = self.createProperDictionary(retVal['Value'])
          for j in change: #change the time stamp before it will be decoded.
            params[str(j)] = str(change[j])
          retVal = parseFormParams(params)
          if not retVal['OK']:
            return retVal
          params = retVal['Value']
          retVal = repClient.generateDelayedPlot(*params)
          values[i] = retVal['Value']
      result = S_OK(values)
    else:
      result = self.getPlotsParameters(url, False)
    return result


################################################################################
  def __getAtomicData(self,name=False):
    gLogger.info("__getAtomicData(%s) function" % name)
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    if not name:
      gLogger.info("upc.retrieveAllVars()")
      result = upc.retrieveAllVars()
    else:
      gLogger.info("upc.retrieveVar(%s)" % name)
      result = upc.retrieveVar(name)
    gLogger.debug(result)
    if not result["OK"]:
      if result['Message'].find("No data for") != -1:
        return {"success":"true","result":{}}
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    return {"success":"true","result":result}
################################################################################
  def __getData(self,name=False):
    gLogger.info("__getData(%s) function" % name)
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    gLogger.info("upc.retrieveAllVars()")
    result = upc.retrieveAllVars()
    gLogger.debug(result)
    if not result["OK"]:
      if result['Message'].find("No data for") != -1:
        return {"success":"true","result":{}}
      return {"success":"false","error":result["Message"]}
    callback = dict()
    callback["layouts"] = result["Value"]
    keys = result["Value"].keys()
    callback["layoutNames"] = ";".join(keys)
    if not name:
      last = self.__lastHistory()
      if not last["OK"]:
        last = ""
      else:
        last = last["Value"]
    else:
      last = name
    callback["defaultLayout"] = last
    if name:
      result = self.__setHistory(name)
      if not result["OK"]:
        gLogger.error(result["Message"])
    return {"success":"true","result":callback}
################################################################################
  def __setData(self,name=False):
    gLogger.info("__setData(%s) function" % name)
    if not name:
      return {"success":"false","error":"Name of the layout is absent"}
    data = {}
    for i in request.params:
      try:
        if len(request.params[i]) > 0:
          data[i] = str(request.params[i])
      except:
        pass
    gLogger.info("Data to save: %s" % data)
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    gLogger.info("upc.storeVar(%s,%s)" % (name,data))
    result = upc.storeVar(name,data)
    gLogger.debug(result)
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = self.__setHistory(name)
    if not result["OK"]:
      gLogger.error(result["Message"])
    return self.__getData()
################################################################################
  def __delData(self,name=False):
    gLogger.info("__delData(%s) function" % name)
    if not name:
      return {"success":"false","error":"Name of the layout is absent"}
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    gLogger.info("upc.deleteVar(%s)" % name)
    result = upc.deleteVar(name)
    gLogger.debug(result)
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = self.__delHistory(name)
    if not result["OK"]:
      gLogger.error(result["Message"])
    return self.__getData()    
################################################################################
  def __delAllData(self):
    gLogger.info("__delAllData(%s) function")
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    username = getUsername()
    if not type(username) == type({}):
      username = list(username)
    gLogger.info("upc.deleteProfiles(%s)" % username)
    result = upc.deleteProfiles(username)
    gLogger.debug(result)
    if not result["OK"]:
      gLogger.error(result["Message"])
      return {"success":"false","error":result["Message"]}
    result = self.__delHistory()
    if not result["OK"]:
      gLogger.error(result["Message"])
    return self.__getData()
################################################################################
  def __delHistory(self,name=False):
    gLogger.info("__delHistory(%s) function" % name)
    upc = UserProfileClient( "Default", getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    gLogger.info("upc.retrieveVar(%s)" % profile_name)
    result = upc.retrieveVar(profile_name)
    gLogger.debug(result)
    if not result["OK"]:
      return S_ERROR( result["Message"] )
    data = result["Value"]
    try:
      data = list(data)
    except:
      return S_ERROR( "Failed to convert '%s' to list" % data )
    if name:
      if data.count(name) > 0:
        while data.count(name) > 0:
          data.remove(name)
    else:
      data = list()
    while len(data) > 50:
      data.popleft()
    gLogger.info("upc.storeVar(%s,%s)" % (profile_name,data))
    result = upc.storeVar(profile_name,data)
    gLogger.debug(result)
    if not result["OK"]:
      return S_ERROR( result["Message"] )
    return S_OK( result["Value"] )
################################################################################
  def __setHistory(self,name=False):
    gLogger.info("__setHistory(%s) function" % name)
    if not name:
      return S_ERROR( "Name of the layout to save in history is absent" )
    upc = UserProfileClient( "Default", getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    gLogger.info("upc.retrieveVar(%s)" % profile_name)
    result = upc.retrieveVar(profile_name)
    gLogger.debug(result)
    if not result["OK"]:
      result = dict()
      result["Value"] = dict()
    data = result["Value"]
    try:
      data = list(data)
    except:
      data = list()
    data.append(name)
    while len(data) > 50:
      data.popleft()
    gLogger.info("upc.storeVar(%s,%s)" % (profile_name,data))      
    result = upc.storeVar(profile_name,data)
    gLogger.debug(result)
    if not result["OK"]:
      return S_ERROR( result["Message"] )
    return S_OK( result["Value"] )
################################################################################
  def __lastHistory(self):
    gLogger.info("__lastHistory() function")
    upc = UserProfileClient( "Default", getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    gLogger.info("upc.retrieveVar(%s)" % profile_name)
    result = upc.retrieveVar(profile_name)
    gLogger.debug(result)
    if not result["OK"]:
      return S_ERROR( result["Message"] )
    data = result["Value"]
    try:
      data = list(data)
    except:
      return S_ERROR( "Failed to convert %s to list" % data )
    last = ""
    if len(data) > 0:
      last = data.pop()
    return S_OK( last )
################################################################################
  def __convert(self):
    gLogger.info("START of DATA CONVERTION")
    upc = UserProfileClient( "Default", getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    gLogger.info("1) Init of history var")
    result = upc.storeVar(profile_name,list())
    if not result["OK"]:
      gLogger.info("Initialization of history records has failed")
      return S_OK()
    gLogger.info("Done")
    gLogger.info("2) Get old data")
    result = self.__getData()
    if not result["result"]:
      gLogger.info("getData returns no result")
      return S_OK()
    gLogger.info("Done")
    gLogger.info("3) Is bookmark exists")
    data = result["result"]["layouts"]
    if not data.has_key("Bookmarks"):
      gLogger.info("No old Bookmarks found")    
      return S_OK()
    data = data["Bookmarks"]
    gLogger.info("Done")
    gLogger.info("4) Is layouts exists")
    if not data.has_key("layouts"):
      gLogger.info("No layouts to convert")
      return S_OK()
    layouts = data["layouts"]
    gLogger.info("Done")
    gLogger.info("5) Layouts is dict")
    try:
      layouts = dict(layouts)
    except:
      gLogger.info("Layouts '%s' is not dictionary" % layouts)
      return S_OK()
    gLogger.info("Done")
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    gLogger.info("6) Deleting old data")
    old = self.__delData("Bookmarks")
    gLogger.info("Should be empty: %s" % old)
    gLogger.info("Done")
    gLogger.info("8) Saving old data to new")
    for i in layouts:
      gLogger.info("Name: '%s'" % i)
      gLogger.info("Data: '%s'" % layouts[i])
      result = upc.storeVar(i,layouts[i])
      gLogger.info(result)
    if data.has_key("defaultLayout"):
      name = data["defaultLayout"]
      result = self.__setHistory(name)
      if not result["OK"]:
        gLogger.error(result["Message"])
    gLogger.info("GOOD END of DATA CONVERTION")
    return S_OK()
