from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction, getUsername
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC import gConfig, gLogger
from DIRAC import S_OK, S_ERROR
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient
import json

USER_PROFILE_NAME = "Presenter"

class PresenterController(BaseController):
################################################################################
  def display(self):
    if not authorizeAction():
      return render( "/login.mako" )
#    result = self.__convert()
#    if not result[ "OK" ]:
#      gLogger.error( result[ "Message" ] )
    result = self.__getHistory()
    if result["OK"]:
      c.select = result[ "Value" ]
#    if c.select.has_key("result"):
#      c.select = c.select["result"]
    return render("web/Presenter.mako")
###############################################################################
  @jsonify
  def action(self):
    if not authorizeAction():
      return {"success":"false","error":"Insufficient rights"}
    if request.params.has_key("getAvailbleLayouts"):
      if request.params.has_key("username") :
        return self.__getUsers()
      if request.params.has_key("userOnly") :
        return self.getData( user )
      return self.__getData()
    elif request.params.has_key("saveLayout"):
      return self.__saveLayout(request.params)
    elif request.params.has_key("setBookmarks") and len(request.params["setBookmarks"]) > 0:
      name = str(request.params["setBookmarks"])
      return self.__setData(name)
    elif request.params.has_key("delBookmarks") and len(request.params["delBookmarks"]) > 0:
      name = str(request.params["delBookmarks"])
      return self.__delData(name)
    elif request.params.has_key("delAllBookmarks") and len(request.params["delAllBookmarks"]) > 0:
      return self.__delAllData()
    else:
      return {"success":"false","error":"Action is not defined"}
################################################################################
  def __saveLayout( self , cfg = False ) :
    gLogger.debug( "start __saveLayout()" )
    if not cfg :
      return { "success" : "false" , "error" : "Request is empty" }
    if not cfg.has_key( "Name" ):
      return { "success" : "false" , "error" : "Name of the layout is absent" }
    try:
      name = str( cfg[ "Name" ] )
    except:
      err = "Can't convert variable 'Name' to a string. "
      err = err + "Seems there are non ASCII symbols in layout name"
      return { "success" : "false" , "error" : err }
    if not cfg.has_key( "Permissions" ):
      return { "success" : "false" , "error" : "Permissions for the layout is absent" }
    try:
      permissions = str( cfg["Permissions"] )
    except:
      return { "success" : "false" , "error" : "Passed permissions are not string" }
    permissions = { "ReadAccess" : permissions }
    data = {}
    banList = [ "Name" , "Permissions" , "saveLayout" ]
    for i in cfg:
      try:
        if not i in banList and len( cfg[ i ] ) > 0:
          data[ i ] = cfg[ i ]
      except:
        pass
    gLogger.info( "Data to save: %s" % data )
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.storeVar( name , data , permissions )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    history = self.__setHistory( name )
    if not history[ "OK" ]:
      gLogger.error( history[ "Message" ] )
    gLogger.debug( "end __saveLayout()" )
    return { "success" : "true" , "result" : data }
################################################################################
  def __getUsers(self):
    return
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
  def __setHistory( self , name = False ):
    gLogger.info( "start __setHistory()")
    history_length = gConfig.getOptions("/Website/" + USER_PROFILE_NAME + "/ShowHistory", 10 )
    if not name:
      return S_ERROR( "Name of the layout to be memorized is absent" )
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    gLogger.info( "upc.retrieveVar( %s )" % profile_name )
    history = list()
    result = upc.retrieveVar( profile_name )
    gLogger.debug( result )
    if result[ "OK" ]:
      result = result[ "Value" ]
    try:
      history = list( result )
    except:
      gLogger.error( "Failed to convert %s to list" % result )
    history.append( name )
    history = uniqueElements( history )
    while len( history ) > history_length:
      history.popleft()
    gLogger.info( "upc.storeVar( %s , %s )" % ( profile_name , history ))      
    result = upc.storeVar( profile_name , history )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return S_ERROR( result[ "Message" ] )
    gLogger.info( "end __setHistory()" )
    return S_OK( result[ "Value" ] )
################################################################################
  def __getHistory( self ):
    gLogger.info( "start __getHistory()")
    history_length = gConfig.getValue("/Website/" + USER_PROFILE_NAME + "/ShowHistory", 10 )
    gLogger.debug( "History length: %s" % history_length )
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    gLogger.info( "upc.retrieveVar( %s )" % profile_name )
    result = upc.retrieveVar( profile_name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return S_ERROR( result[ "Message" ] )
    result = result[ "Value" ]
    if not isinstance( result , list ):
      return S_ERROR( "List expected: %s" % result )
    history = result[ :history_length ]
    gLogger.info( "end __getHistory()" )
    return S_OK( history )
