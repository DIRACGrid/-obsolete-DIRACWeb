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
    gLogger.info( "Running display()" )
    msg = "display() for %s@%s" % ( getUsername() , getSelectedGroup() )
    if not authorizeAction():
      gLogger.info( "Result %s: %s" % ( msg , "Not authorized" ) )
      return render( "/login.mako" )
    c.select = dict()
    result = self.__getHistory()
    
    if result[ "OK" ]:
      history = result[ "Value" ]
      gLogger.info( "init history %s" % history )
      c.select[ "history" ] = history
      if history and len( history ) > 0:
        history = history[ 0 ]
        gLogger.info( "history: %s" % history )
        result = self.__layoutAction( history , 'get' )
        gLogger.always( "result: %s " % result )
        if result.has_key( "result" ):
          c.select[ "layout" ] = result[ "result" ]
    gLogger.info( "Result %s: %s" % ( msg , c.select ) )
    return render("web/Presenter.mako")
################################################################################
  def kaboom(self):
    uList = [ str( getUsername() ) ]
    result = list()
    for i in [ USER_PROFILE_NAME , "Default" ]:
      upc = UserProfileClient( i , getRPCClient )
      tmp = upc.deleteProfiles( uList )
      allvar = upc.retrieveAllVars() 
      result.append( allvar )
    return result
################################################################################
  def all(self):
    result = list()
    for i in [ USER_PROFILE_NAME , "Default" ]:
      upc = UserProfileClient( i , getRPCClient )
      allvar = upc.retrieveAllVars() 
      result.append( allvar )
    return result
################################################################################
  @jsonify
  def action(self):
    if not authorizeAction():
      return { "success" : "false" , "error" : "Insufficient rights" }
    if request.params.has_key( "getAvailbleLayouts" ):
      return self.__getLayout()
    if request.params.has_key( "getUserLayouts" ):
      return self.__getUserLayout()
    elif request.params.has_key( "loadLayout" ):
      return self.__layoutAction( request.params , 'get' )
    elif request.params.has_key( "saveLayout" ):
      return self.__layoutAction( request.params , 'set' )
    elif request.params.has_key( "deleteLayout" ):
      return self.__layoutAction( request.params , 'del' )
    else:
      return {"success":"false","error":"Action is not defined"}
################################################################################
  def __getUserLayout( self ) :
    gLogger.info( "Running getUserLayout()" )
    msg = "getUserLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.retrieveAllVars()
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    layouts = result[ "Value" ]
    data = list()
    for name , value in layouts.items():
      result = self.__getPermissions( name )
      if not result[ "OK" ]:
        perm = result[ "Message" ]
      else:
        perm = result[ "Value" ]
        if perm.has_key( "ReadAccess" ):
          perm = perm[ "ReadAccess" ]
        else:
          perm = "Undefined"
      if value.has_key( "group" ):
        group = value[ "group" ]
      else:
        group = "Undefined"
      data.append( { "name" : name , "permission" : perm , "group" : group } )
    gLogger.info( "Result %s: %s" % ( msg , data ) )
    return { "success" : "true" , "result" : data }
################################################################################
  def __getLayout( self ) :
    gLogger.info( "Running getLayout()" )
    msg = "getLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.listAvailableVars()
    gLogger.always( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
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
    gLogger.info( "Result %s: %s AND %s" % ( msg , availble , users ) )
    return { "success" : "true" , "result" : availble , "users" : users }
################################################################################
  def __deleteAll( self ):
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.retrieveAllVars()
    gLogger.always( result )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = result[ "Value" ]
    for key , value in result.items():
      self.__delLayout( key )
################################################################################
  def __delLayout( self , name = False ) :
    gLogger.info( "Running delLayout( %s )" % name )
    msg = "delLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    if not name:
      err = "name of the layout is absent"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return { "success" : "false" , "error" : err }
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.deleteVar( name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = self.__delHistory( name )
    if not result[ "OK" ]:
      result[ "Value" ] = ""
    history = result[ "Value" ]
    gLogger.info( "Result %s: %s AND %s" % ( msg , "true" , history ) )
    return { "success" : "true" , "result" : "true" , "history" : history }
################################################################################
  def __loadLayout( self , **kwargs ):
    gLogger.info( "Running loadLayout( %s )" % kwargs )
    msg = "loadLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    for i in [ "name" , "user" , "group" ]:
      if not kwargs.has_key( i ):
        err = "Function call missing an argument '%s'" % i
        gLogger.error( "Result %s: %s" % ( msg , err ) )
        return { "success" : "false" , "error" : err }        
    name = kwargs[ "name" ]
    user = kwargs[ "user" ]
    group = kwargs[ "group" ]
    if not name:
      err = "name of the layout is absent"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return { "success" : "false" , "error" : err }
    if not user:
      user = str( getUsername() )
    if not group:
      group = str( getSelectedGroup() )
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.retrieveVarFromUser( user , group, name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      if result[ "Message" ].find( "No data" ) < 0 :
        gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
        return { "success" : "false" , "error" : result[ "Message" ] }
      err = "No data found for '%s' by %s@%s" % ( name , user , group )
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return { "success" : "false" , "error" : err }
    layout = result[ "Value" ]
    if not layout.has_key( "name" ):
      layout[ "name" ] = name
    if not layout.has_key( "user" ):
      layout[ "user" ] = user
    result = self.__setHistory( name , user , group )
    if not result[ "OK" ]:
      result[ "Value" ] = ""
    history = result[ "Value" ]
    gLogger.info( "Result %s: %s AND %s" % ( msg , layout , history ) )
    return { "success" : "true" , "result" : layout , "history" : history }
################################################################################
  def __saveLayout( self , **kwargs ):
    gLogger.info( "Running saveLayout( %s )" % kwargs )
    msg = "saveLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    for i in [ "name" , "permissions" , "user" , "group" ]:
      if not kwargs.has_key( i ):
        err = "Function call missing an argument '%s'" % i
        gLogger.error( "Result %s: %s" % ( msg , err ) )
        return { "success" : "false" , "error" : err }        
    name = kwargs[ "name" ]
    permissions = kwargs[ "permissions" ]
    user = kwargs[ "user" ]
    group = kwargs[ "group" ]
    if not name:
      err = "name of the layout is absent"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return { "success" : "false" , "error" : err }
    result = self.__parsePermissions( name , permissions )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    permissions = result[ "Value" ]
    if not user:
      user = str( getUsername() )
    if not group:
      group = str( getSelectedGroup() )
    data = dict()
    exceptList = [ "permissions" , "saveLayout" ]
    for key , value in request.params.items():
      try:
        if not key in exceptList and len( value ) > 0:
          data[ key ] = str( value )
      except:
        pass
    if not len( data ) > 0:
      err = "Data to store has zero length"
      gLogger.error( "Result %s: %s" % ( msg , err ) )      
      return { "success" : "false" , "error" : err }
    if not data.has_key( "group" ):
      data[ "group" ] = group
    if not data.has_key( "user" ):
      data[ "user" ] = user
    if not data.has_key( "name" ):
      data[ "name" ] = name
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.storeVar( name , data , permissions )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = self.__setHistory( name , user , group )
    if not result[ "OK" ]:
      result[ "Value" ] = ""
    history = result[ "Value" ]
    gLogger.info( "Result %s: %s AND %s" % ( msg , data , history ) )
    return { "success" : "true" , "result" : data , "history" : history }
################################################################################
  def __layoutAction( self, params = False , mode = False ):
    gLogger.info( "Running layoutAction( mode = %s)" % mode )
    msg = "layoutAction() for %s@%s" % ( getUsername() , getSelectedGroup() )
    if not params:
      err = "Argument 'params' is missing"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return { "success" : "false" , "error" : err }
    if not params:
      err = "Argument 'mode' is missing"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return { "success" : "false" , "error" : err }
    refList = [ "name" ] # Used for delete layout operation
    if mode == "get":
      refList = [ "name" , "user" , "group" ]
    elif mode == "set":
      refList = [ "name" , "permissions" , "user" , "group" ]
    kwargs = dict()
    for i in refList:
      if not params.has_key( i ):
        kwargs[ i ] = False
      else:
        try:
          kwargs[ i ] = str( params[ i ] )
        except Exception , x :
          err = "Can't convert variable %s to a string. " % params[ i ]
          err = err + str( x )
          gLogger.error( "Result %s: %s" % ( msg , err ) )
          return { "success" : "false" , "error" : err }
    if mode == "get":
      return self.__loadLayout( **kwargs )
    elif mode == "set":
      return self.__saveLayout( **kwargs )
    elif mode == "del":
      return self.__delLayout( kwargs[ "name" ] )
    else:
      err = "Variable mode has wrong value: '%s'" % mode
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return { "success" : "false" , "error" : err }
################################################################################
  def __setHistory( self , name = False , user = False , group = False ):
    gLogger.info( "Running setHistory( %s , %s ,%s )" % ( name , user, group ) )
    msg = "setHistory() for %s@%s" % ( getUsername() , getSelectedGroup() )
    if not name:
      err = "Layout name to be saved in history is absent"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return S_ERROR( err )
    if not user:
      user = str( getUsername() )
    if not group:
      group = str( getSelectedGroup() )
    opt = "/Website/" + USER_PROFILE_NAME + "/ShowHistory"
    history_length = gConfig.getOptions( opt , 5 )
    result = self.__delHistory( name )
    if not result[ "OK" ]:
      if result[ "Message" ].find( "No data" ) < 0 :
        gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
        return S_ERROR( result[ "Message" ] )
      result[ "Value" ] = list()
    history = result[ "Value" ]
    history.insert( 0 , { "name" : name , "user" : user , "group" : group } )      
    if( len( history ) > history_length ):
      history = result[ history_length ]
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History." + str( getSelectedGroup() )
    result = upc.storeVar( profile_name , history )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    gLogger.info( "Result %s: %s" % ( msg , history ) )
    return S_OK( history )
################################################################################
  def __getHistory( self ):
    gLogger.info( "Running getHistory()" )
    msg = "getHistory() for %s@%s" % ( getUsername() , getSelectedGroup() )
    opt = "/Website/" + USER_PROFILE_NAME + "/ShowHistory"
    history_length = gConfig.getOptions( opt , 5 )
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History." + str( getSelectedGroup() )
    result = upc.retrieveVar( profile_name )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    history = result[ "Value" ]
    if not isinstance( history , list ):
      err = "Not a list: %s" % history
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return S_ERROR( err )
    if( len( history ) > history_length ):
      history = result[ history_length ]
    for i in history:
      if i[ "name" ]:
        result = self.__getPermissions( i["name"] )
        if not result[ "OK" ]:
          i[ "permissions" ] = result[ "Message" ]
        tmpPerm = result[ "Value" ]
        if not tmpPerm[ "ReadAccess" ]:
          i[ "permissions" ] = "undefined"
        i[ "permissions" ] = tmpPerm[ "ReadAccess" ]
    gLogger.info( "Result %s: %s" % ( msg , history ) )
    return S_OK( history )
################################################################################
  def __delHistory( self , name = False ):
    gLogger.info( "Running delHistory( %s )" % name )
    msg = "delHistory() for %s@%s" % ( getUsername() , getSelectedGroup() )
    if not name:
      err = "Name of the layout to be deleted is absent"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return S_ERROR( err )
    opt = "/Website/" + USER_PROFILE_NAME + "/ShowHistory"
    history_length = gConfig.getOptions( opt , 5 )
    result = self.__getHistory()
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    result = result[ "Value" ]
    history = list()
    for i in result:
      if not i["name"] == name:
        history.append( i )
    if( len( history ) > history_length ):
      history = result[ history_length ]
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History." + str( getSelectedGroup() )
    result = upc.storeVar( profile_name , history )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    gLogger.info( "Result %s: %s" % ( msg , history ) )
    return S_OK( history )
################################################################################
  def __clearHistory( self ):
    gLogger.info( "Running clearHistory()" )
    msg = "clearHistory() for %s@%s" % ( getUsername() , getSelectedGroup() )
    upc = UserProfileClient( "Default" , getRPCClient )
    profile_name = USER_PROFILE_NAME + ".History." + str( getSelectedGroup() )
    result = upc.deleteVar( profile_name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    gLogger.info( "Result %s: %s" % ( msg , result[ "Value" ] ) )
    return { "success" : "true" , "result" : result[ "Value" ] }
################################################################################
  def __getPermissions( self , name = False ):
    gLogger.info( "getPermissions( %s )" % name )
    msg = "getPermissions() for %s@%s" % ( getUsername() , getSelectedGroup() )
    if not name:
      err = "'name' argument for getPermissions function is absent"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return S_ERROR( err )
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.getVarPermissions( name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    gLogger.info( "Result %s: %s" % ( msg , result[ "Value" ] ) )
    return S_OK( result[ "Value" ] )
################################################################################
  def __parsePermissions( self , name = False , permissions = False ):
    if not name:
      err = "'name' argument for parsePermissions function is absent"
      return S_ERROR( err )
    if not permissions:
      err = "'permissions' argument for parsePermissions function is absent"
      return S_ERROR( err )
    if permissions == "SAME" :
      result = self.__getPermissions( name )
      if not result[ "OK" ]:
        return S_ERROR( result[ "Message" ] )
      return S_OK( result[ "Value" ] )
    permissions = permissions.strip()
    permissions = permissions.upper()
    allPermissions = [ "USER" , "GROUP" , "VO" , "ALL" ]
    if not permissions in allPermissions:
      err = "Value '%s' should be one of %s" % ( permissions , allPermissions )
      return S_ERROR( err )
    return S_OK( { "ReadAccess" : permissions } )
