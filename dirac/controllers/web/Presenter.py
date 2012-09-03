from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction, getUsername, getSelectedGroup
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
    c.select = dict()
#    self.__clearHistory()
    result = self.__getHistory()
    if result[ "OK" ]:
      history = result[ "Value" ]
      gLogger.info( "init history %s" % history )
      c.select[ "history" ] = history
      if history and len( history ) > 0:
        result = self.__loadLayout( history[ 0 ] )
        gLogger.always( "result: %s " % result )
        if result.has_key( "result" ):
          c.select[ "layout" ] = result[ "result" ]
    return render("web/Presenter.mako")
###############################################################################
  @jsonify
  def action(self):
    if not authorizeAction():
      return { "success" : "false" , "error" : "Insufficient rights" }
    if request.params.has_key( "getAvailbleLayouts" ):
      return self.__getLayout()
    elif request.params.has_key( "loadLayout" ):
      return self.__loadLayout( request.params )
    elif request.params.has_key( "saveLayout" ):
      return self.__saveLayout( request.params )
    elif request.params.has_key( "deleteLayout" ):
      return self.__delLayout( request.params[ "deleteLayout" ] )
    else:
      return {"success":"false","error":"Action is not defined"}
################################################################################      
  def __getLayout( self ) :
    gLogger.debug( "start __getLayout()" )
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.listAvailableVars()
    gLogger.always( result )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = result[ "Value" ]
    def toObj( array ):
      if not len( array ) > 3 :
        gLogger.error( "Length of array %s should be more then 3" % array )        
        return { 'user' : 'undefined' , 'group' : 'undefined' , 'VO' : 'undefined' , 'name' : 'undefined' }
      return { 'user' : array[ 0 ] , 'group' : array[ 1 ] , 'VO' : array[ 2 ] , 'name' : array[ 3 ] }
    availble = map( toObj , result )
    gLogger.always( availble )
    users = list()
    for i in result :
      if len( i ) > 1 :
        users.append( { "user" : i[ 0 ] } )
    users = uniqueElements( users )
    gLogger.debug( "end __getLayout()" )
    return { "success" : "true" , "result" : availble , "users" : users }
################################################################################
  def __delLayout( self , name = False ) :
    gLogger.debug( "start __delLayout()" )
    if not name:
      return { "success" : "false" , "error" : "Name of the layout is absent" }
    try:
      name = str( name )
    except Exception , x :
      err = "Can't convert variable to a string. Seems there are non ASCII symbols"
      err = err + "\n" + str( x )
      return { "success" : "false" , "error" : err }
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.deleteVar( name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    history = self.__delHistory( name )
    if not history[ "OK" ]:
      gLogger.error( history[ "Message" ] )
    gLogger.debug( "end __delLayout()" )
    return { "success" : "true" , "result" : result[ "Value" ] , "history" : history }
################################################################################
  def __loadLayout( self , cfg = False ) :
    gLogger.debug( "start __loadLayout()" )
    if not cfg :
      return { "success" : "false" , "error" : "Request is empty" }
    if not cfg.has_key( "name" ):
      return { "success" : "false" , "error" : "Name of the layout is absent" }
    if not cfg.has_key( "user" ):
      return { "success" : "false" , "error" : "Owner Username of the layout is absent" }
    if not cfg.has_key( "group" ):
      return { "success" : "false" , "error" : "Owner group of the layout is absent" }
    try:
      name = str( cfg[ "name" ] )
      user = str( cfg[ "user" ] )
      group = str( cfg[ "group" ] )
    except Exception , x :
      err = "Can't convert variable to a string. Seems there are non ASCII symbols"
      err = err + "\n" + str( x )
      return { "success" : "false" , "error" : err }
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.retrieveVarFromUser( user , group, name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    history = self.__setHistory( { "name" : name , "user" : user , "group" : group } )
    if not history[ "OK" ]:
      gLogger.error( history[ "Message" ] )
    for i in result[ "Value" ] :
      try:
        result[ "Value" ][ i ] = str( result[ "Value" ][ i ] )
      except:
        continue
    result[ "Value" ][ "name" ] = name
    result[ "Value" ][ "user" ] = user
    result[ "Value" ][ "group" ] = group
    gLogger.debug( "end __saveLayout()" )
    return { "success" : "true" , "result" : result[ "Value" ] , "history" : history }
################################################################################
  def __saveLayout( self , cfg = False ) :
    gLogger.debug( "start __saveLayout()" )
    if not cfg :
      return { "success" : "false" , "error" : "Request is empty" }
    if not cfg.has_key( "name" ):
      return { "success" : "false" , "error" : "Name of the layout is absent" }
    try:
      name = str( cfg[ "name" ] )
    except Exception , x :
      err = "Can't convert variable to a string. Seems there are non ASCII symbols"
      err = err + "\n" + str( x )
      return { "success" : "false" , "error" : err }
    if not cfg.has_key( "permissions" ):
      return { "success" : "false" , "error" : "Permissions for the layout is absent" }
    try:
      permissions = str( cfg["permissions"] )
    except:
      return { "success" : "false" , "error" : "Passed permissions are not string" }
    gLogger.info( "perm - %s" % permissions )
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    if permissions == "SAME" :
      result = upc.getVarPermissions( name )
      gLogger.debug( result )
      if not result[ "OK" ]:
        return { "success" : "false" , "error" : result[ "Message" ] }
      permissions = result[ "Value" ]
    else:
      permissions = { "ReadAccess" : permissions }
    data = {}
    banList = [ "name" , "permissions" , "saveLayout" , "user" , "group" ]
    for i in cfg:
      try:
        if not i in banList and len( cfg[ i ] ) > 0:
          data[ i ] = cfg[ i ]
      except:
        pass
    gLogger.info( "Data to save: %s" % data )
    result = upc.storeVar( name , data , permissions )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    history = self.__setHistory( { 'name' : name , 'user' : user , 'group' : group } )
    if not history[ "OK" ]:
      gLogger.error( history[ "Message" ] )
    gLogger.debug( "end __saveLayout()" )
    return { "success" : "true" , "result" : result[ "Value" ] , "history" : history  }
################################################################################
  def __delHistory( self , name = False ):
    gLogger.info( "start __delHistory()")
    if not name:
      return S_ERROR( "Name of the layout to be deleted is absent" )
    result = self.__getHistory()
    gLogger.info( "!!! returns: %s" % result )    
    if not result[ "OK" ]:
      return S_ERROR( result[ "Message" ] )
    result = result[ "Value" ]
    history = list()
    for i in result:
      if not i["name"] == name:
        history.append( i )
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    gLogger.info( "upc.storeVar( %s , %s )" % ( profile_name , history ))      
    result = upc.storeVar( profile_name , history )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return S_ERROR( result[ "Message" ] )
    gLogger.info( "end __delHistory()" )
    return S_OK( result[ "Value" ] )
################################################################################
  def __clearHistory( self ):
    gLogger.info( "start __clearHistory()")
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    result = upc.deleteVar( profile_name )
    gLogger.info( "upc.deleteVar( %s )" % profile_name )
    gLogger.info( "end __clearHistory()")
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    return { "success" : "true" , "result" : result[ "Value" ] }
################################################################################
  def __setHistory( self , cfg = False ):
    gLogger.info( "start __setHistory()")
    history_length = gConfig.getOptions("/Website/" + USER_PROFILE_NAME + "/ShowHistory", 10 )
    if not cfg :
      return S_ERROR( "Object with layout properties to be memorized in history is absent" )
    if not cfg.has_key( "name" ):
      return S_ERROR( "Object with layout properties to be memorized in history is absent" )
    result = self.__delHistory( cfg[ "name" ] )
    try:
      for key , value in cfg.items():
        cfg[ key ] = str( value )
    except Exception , x :
      err = "Failed to convert to string. "
      err = err + x
      gLogger.error( err )
      return S_ERROR( err )
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History"
    gLogger.info( "upc.retrieveVar( %s )" % profile_name )
    history = list()
    result = upc.retrieveVar( profile_name )
    gLogger.info( result )
    if result[ "OK" ]:
      result = result[ "Value" ]
    else:
      result = ""
    try:
      history = list( result )
    except:
      gLogger.error( "Failed to convert %s to list" % result )
    history.append( cfg )
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
    gLogger.info( result )
    if not result[ "OK" ]:
      return S_ERROR( result[ "Message" ] )
    result = result[ "Value" ]
    if not isinstance( result , list ):
      return S_ERROR( "List expected: %s" % result )
    history = result[ :history_length ]
    gLogger.info( "end __getHistory()" )
    return S_OK( history )
