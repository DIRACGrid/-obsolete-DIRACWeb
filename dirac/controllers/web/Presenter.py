import logging, tempfile
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gLogger
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials

########
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient
########

log = logging.getLogger(__name__)

global numberOfJobs
global pageNumber
global globalSort
numberOfJobs = 25
pageNumber = 0
globalSort = None

class PresenterController(BaseController):
################################################################################
#  def convert(self):
#
#    users = RPC.getOwners()
#    for i in 
################################################################################
  @jsonify
  def layoutUser(self):
    upProfileName = "Summary"
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.listAvailableVars()
    if result["OK"]:
      result = result["Value"]
      userList = []
      for i in result:
        userList.append(i[0])
      userList = uniqueElements(userList)
      resultList = []
      for j in userList:
        resultList.append({'name':j})
      total = len(resultList)
      resultList.sort()
      resultList.insert(0,{'name':'All'})
      c.result = {"success":"true","result":resultList,"total":total}
    else:
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  @jsonify
  def layoutAvailable(self):
    upProfileName = "Summary"
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.listAvailableVars()
    gLogger.info("\033[0;31m listAvailableVars: \033[0m",result)
    if result["OK"]:
      result = result["Value"]
      resultList = []
      for i in result:
        resultList.append({'name':i[3],'owner':i[0]})
    return {"success":"true","result":resultList,"total":"55"}
################################################################################
  def display(self):
#    layer = self.__getSelections()
#    if layer:
#      c.select = self.__getBookmarks()
#    else:
    c.select = self.__getBookmarks()
    if c.select.has_key("result"):
      c.select = c.select["result"]
    return render("web/Presenter.mako")
################################################################################
  def __getSelections(self):
    if request.params.has_key("layout") > 0:
      name = str(request.params["layout"])
      return self.__getBookmarks(name)
    else:
      return False
###############################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getBookmarks") > 0:
      name = str(request.params["getBookmarks"])
      return self.__getBookmarks(name)
    elif request.params.has_key("setBookmarks") and len(request.params["setBookmarks"]) > 0:
      name = str(request.params["setBookmarks"])
      return self.__setBookmarks(name)
    elif request.params.has_key("delBookmarks") and len(request.params["delBookmarks"]) > 0:
      name = str(request.params["delBookmarks"])
      return self.__delBookmarks(name)
    elif request.params.has_key("delAllBookmarks") and len(request.params["delAllBookmarks"]) > 0:
      return self.__delAllBookmarks()
    else:
      c.result = {"success":"false","error":"Action is not defined"}
      return c.result
################################################################################

# width - value
# time - value
# defaultLayout - value
# layouts - dict {name:src}

################################################################################
  def __getBookmarks(self,name=""):
    if name == "columns" or name == "refresh" or name == "defaultLayout" or name == "layouts":
      return {"success":"false","error":"The name \"" + name + "\" is reserved, operation failed"}
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.retrieveVar( "Bookmarks" )
    gLogger.info("\033[0;31m UserProfile getBookmarks response: \033[0m",result)
    if result["OK"]:
      result = result["Value"]
      if name != "":
        result["defaultLayout"] = name
        save = upc.storeVar( "Bookmarks", result )
        gLogger.info("\033[0;31m saving new default layout \033[0m",name)
        if not save["OK"]:
          return {"success":"false","error":save["Message"]}
      elif name == "" and not result.has_key("defaultLayout"):
        result["defaultLayout"] = ""
      if result.has_key("layouts"):
        layouts = ""
        for i in result["layouts"]:
          layouts = layouts + str(i) + ";"
        result["layoutNames"] = layouts
      c.result = {"success":"true","result":result}
    else:
      if result['Message'].find("No data for") != -1:
        c.result = {"success":"true","result":{}}
      else:
        c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  def __setBookmarks(self,name):
    if name == "columns" or name == "refresh" or name == "defaultLayout" or name == "layouts":
      return {"success":"false","error":"The name \"" + name + "\" is reserved, operation failed"}
    if not request.params.has_key("columns") and len(request.params["columns"]) <= 0:
      return {"success":"false","error":"Parameter 'Columns' is absent"}
    if not request.params.has_key("refresh") and len(request.params["refresh"]) <= 0:
      return {"success":"false","error":"Parameter 'Refresh' is absent"}
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.retrieveVar( "Bookmarks" )
    if result["OK"]:
      data = result["Value"]
    else:
      data = {}
    data["defaultLayout"] = name
    if not data.has_key("layouts"):
      data["layouts"] =  {}
    data["layouts"][name] = {}
    if request.params.has_key("plots") and len(request.params["plots"]) > 0:
      data["layouts"][name]["url"] = str(request.params["plots"])
    else:
      data["layouts"][name]["url"] = ""
    data["layouts"][name]["columns"] = str(request.params["columns"])
    data["layouts"][name]["refresh"] = str(request.params["refresh"])
    gLogger.info("\033[0;31m Data to save: \033[0m",data)
    result = upc.storeVar( "Bookmarks", data )
    gLogger.info("\033[0;31m UserProfile response: \033[0m",result)
    if result["OK"]:
      return self.__getBookmarks()
    else:
      return {"success":"false","error":result["Message"]}
################################################################################
  def __delBookmarks(self,name):
    if name == "columns" or name == "refresh" or name == "defaultLayout" or name == "layouts":
      return {"success":"false","error":"The name \"" + name + "\" is reserved, please choose another name. Operation failed"}
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.retrieveVar( "Bookmarks" )
    if result["OK"]:
      data = result["Value"]
    else:
      data = {}
    gLogger.info("\033[0;31m data: \033[0m",data)
    if data.has_key("layouts"):
      if name in data["layouts"]:
        del data["layouts"][name]
      else:
        return {"success":"false","error":"Can't delete not existing layout: \"" + name + "\""}
    else:
      return {"success":"false","error":"Can't read existing layouts, operation failed"}
    if len(data["layouts"]) > 0:
      data["defaultLayout"] = data["layouts"].keys()[0]
    else:
      data["defaultLayout"] = ""
    gLogger.info("\033[0;31m data: \033[0m",data)
    result = upc.storeVar( "Bookmarks", data )
    gLogger.info("\033[0;31m result: \033[0m",result)
    if result["OK"]:
      return self.__getBookmarks()
    else:
      return {"success":"false","error":result["Message"]}
################################################################################
  def __delAllBookmarks(self):
    upc = UserProfileClient( "Summary", getRPCClient )
    data = {}
    result = upc.storeVar( "Bookmarks", data )
    if result["OK"]:
      return self.__getBookmarks()
    else:
      return {"success":"false","error":result["Message"]}
################################################################################
  def adm(self):
    overall = ""
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.listAvailableVars()
    gLogger.info("\033[0;31m result: \033[0m",result)
    overall = overall + "<br><br><br>" + str( result["Value"] )
    result = upc.listAvailableVars({ 'user' : [ 'msapunov', 'acasajus' ] } )
    overall = overall + "<br><br><br>" + str( result )
    result = upc.retrieveVar( "Bookmarks" )
    overall = overall + "<br><br><br>" + str( result )
    return overall
