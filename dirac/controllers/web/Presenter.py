from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction, getUsername, getSelectedGroup
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC import gConfig, gLogger
from DIRAC import S_OK, S_ERROR
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient
import json

USER_PROFILE_NAME = "Presenter"
LOAD_LAYOUT_ARGS = [ "name" , "user" , "group" ]
SAVE_LAYOUT_ARGS = [ "name" , "user" , "group" , "permissions" ]
DELETE_LAYOUT_ARGS = [ "name" ]

class PresenterController(BaseController):
################################################################################
  def display(self):
    gLogger.info( "Running display()" )
    msg = "display() for %s@%s" % ( getUsername() , getSelectedGroup() )
    if not authorizeAction():
      gLogger.info( "Result %s: %s" % ( msg , "Not authorized" ) )
      return render( "/login.mako" )
    result = self.__convert()
    if not result[ "OK" ]:
      c.error = result[ "Message" ]
      gLogger.error( "Result %s: %s" % ( msg , c.error ) )
      return render( "/error.mako" )
    c.select = dict()
    history = dict()
    for i in [ "Save" , "Load" ]:
      result = self.__getHistory( i )
      if not result[ "OK" ]:
        history[ i ] = result[ "Message" ]
      else:
        history[ i ] = result[ "Value" ]
    c.select[ "history" ] = history
    result = self.__lastUsed()
    if not result[ "OK" ]:
      c.select[ "layout" ] = ""
      c.select[ "error" ] = result[ "Message" ]
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return render("web/Presenter.mako")
    c.select[ "layout" ] = result[ "Value" ]
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
      if request.params.has_key( "loadLast" ):
        return self.__loadLast()
      return self.__loadLayout()
    elif request.params.has_key( "saveLayout" ):
      return self.__saveLayout()
    elif request.params.has_key( "deleteLayout" ):
      return self.__deleteLayout()
    else:
      return {"success":"false","error":"Action is not defined"}
################################################################################
  def __array2obj( self , array ):
    if not len( array ) > 3 :
      gLogger.error( "Length of array %s should be more then 3" % array )
      return {
                'user' : 'undefined'
                , 'group' : 'undefined'
                , 'VO' : 'undefined'
                , 'name' : 'undefined'
             }
    return {
              'user' : array[ 0 ]
              , 'group' : array[ 1 ]
              , 'VO' : array[ 2 ]
              , 'name' : array[ 3 ]
           }
################################################################################
  def __params2string( self , params ):
    if not params:
      return S_ERROR( "Missing first argument" )
    if not isinstance( params , list ):
      return S_ERROR( "List expected" )
    callback = dict()
    for i in params:
      if not request.params.has_key( i ):
        return S_ERROR( "Request has no key %s" % i )
      try:
        callback[ i ] = str( request.params[ i ] )
      except Exception , x :
        return S_ERROR ( x )
    return S_OK( callback )
################################################################################
  def __deleteLayout( self ):
    gLogger.info( "Running deleteLayout()" )
    msg = "delLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    result = self.__params2string( DELETE_LAYOUT_ARGS )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    args = result[ "Value" ]
    name = args[ "name" ]
    history = dict()
    for i in [ "Save" , "Load" ]:
      result = self.__deleteHistory( name , i )
      if not result[ "OK" ]:
        history[ i ] = result[ "Message" ]
      else:
        history[ i ] = result[ "Value" ]
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.deleteVar( name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    gLogger.info( "Result %s: %s AND %s" % ( msg , "true" , history ) )
    return { "success" : "true" , "result" : "true" , "history" : history }
################################################################################
  def __saveLayout( self ):
    gLogger.info( "Running saveLayout()" )
    msg = "saveLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    result = self.__params2string( SAVE_LAYOUT_ARGS )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    args = result[ "Value" ]
    name = args[ "name" ]
    user = args[ "user" ]
    group = args[ "group" ]
    permissions = args[ "permissions" ]
    result = self.__parsePermissions( name , permissions )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    permissions = result[ "Value" ]
    data = dict()
    for key , value in request.params.items():
      try:
        if not key in SAVE_LAYOUT_ARGS and len( value ) > 0:
          data[ key ] = str( value )
      except:
        pass
    if not len( data ) > 0:
      err = "Data to store has zero length"
      gLogger.error( "Result %s: %s" % ( msg , err ) )      
      return { "success" : "false" , "error" : err }
    for i in LOAD_LAYOUT_ARGS : # Add params to layout if they are absent
      if not data.has_key( i ):
        data[ i ] = args[ i ]
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.storeVar( name , data , permissions )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = self.__setHistory( args , "Save" )
    history = dict()
    if not result[ "OK" ]:
      history[ "Save" ] = result[ "Message" ]
    else:
      history[ "Save" ] = result[ "Value" ]
    gLogger.info( "Result %s: %s AND %s" % ( msg , data , history ) )
    return { "success" : "true" , "result" : data , "history" : history }
################################################################################
  def __lastUsed( self ):
    gLogger.info( "Running lastUsed()" )
    msg = "lastUsed() for %s@%s" % ( getUsername() , getSelectedGroup() )
    result = self.__getHistory( "Load" )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    history = result[ "Value" ]
    if not len( history ) > 0:
      err = "Load history is empty"
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return S_ERROR( err )
    args = history[ 0 ]
    name = args[ "name" ]
    user = args[ "user" ]
    group = args[ "group" ]
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.retrieveVarFromUser( user , group, name )
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    layout = result[ "Value" ]
    for i in LOAD_LAYOUT_ARGS : # Add params to layout if they are absent
      if not layout.has_key( i ):
        layout[ i ] = args[ i ]
    gLogger.info( "Result %s: %s" % ( msg , layout ) )
    return S_OK( layout )
################################################################################    
  def __loadLast( self ):
    gLogger.info( "Running loadLast()" )
    msg = "loadLast() for %s@%s" % ( getUsername() , getSelectedGroup() )
    result = self.__lastUsed()
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    layout = result[ "Value" ]
    gLogger.info( "Result %s: %s" % ( msg , layout ) )
    return { "success" : "true" , "result" : layout }
################################################################################
  def __loadLayout( self ):
    gLogger.info( "Running loadLayout()" )
    msg = "loadLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    result = self.__params2string( LOAD_LAYOUT_ARGS )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    args = result[ "Value" ]
    name = args[ "name" ]
    user = args[ "user" ]
    group = args[ "group" ]
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
    for i in LOAD_LAYOUT_ARGS : # Add params to layout if they are absent
      if not layout.has_key( i ):
        layout[ i ] = args[ i ]
    result = self.__setHistory( args , "Load" )
    history = dict()
    if not result[ "OK" ]:
      history[ "Load" ] = result[ "Message" ]
    else:
      history[ "Load" ] = result[ "Value" ]
    gLogger.info( "Result %s: %s AND %s" % ( msg , layout , history ) )
    return { "success" : "true" , "result" : layout , "history" : history }
################################################################################
  def __setHistory( self , item , state ):
    """
    Insert item to  Load or Save history list in first position and checking for
    duplications.
    Return resulting list
    "item" is a dict
    "state" should be either "Save" or "Load" but can be any other value
    """
    gLogger.info( "Running setHistory( %s , %s )" % ( item , state ) )
    msg = "setHistory() for %s@%s" % ( getUsername() , getSelectedGroup() )
    opt = "/Website/" + USER_PROFILE_NAME + "/ShowHistory"
    history_length = gConfig.getOptions( opt , 5 )
    upc = UserProfileClient( "Default" , getRPCClient )
    group = str( getSelectedGroup() )
    profile_name = USER_PROFILE_NAME + ".History." + state + "." + group
    result = upc.retrieveVar( profile_name )
    gLogger.info( result )
    if not result[ "OK" ]:
      if result[ "Message" ].find( "No data" ) < 0 :
        gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
        return S_ERROR( result[ "Message" ] )
      history = list()
    else:
      history = result[ "Value" ]
    if not isinstance( history , list ):
      err = "List expected at: %s" % profile_name
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return S_ERROR( err )
    if( len( history ) > history_length ):
      history = result[ history_length ]
    history.insert( 0 , item )
    history = uniqueElements( history )
    gLogger.error( "History: %s" % history )
    result = upc.storeVar( profile_name , history )
    gLogger.info( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    gLogger.info( "Result %s: %s" % ( msg , history ) )
    return S_OK( history )
################################################################################
  def __getHistory( self , state ):
    """
    Just get the history based on state
    Return resulting list
    "state" can be either "Save" or "Load"
    """
    gLogger.info( "Running getHistory( %s )" % state )
    msg = "getHistory() for %s@%s" % ( getUsername() , getSelectedGroup() )
    opt = "/Website/" + USER_PROFILE_NAME + "/ShowHistory"
    history_length = gConfig.getOptions( opt , 5 )
    upc = UserProfileClient( "Default" , getRPCClient )
    group = str( getSelectedGroup() )
    profile_name = USER_PROFILE_NAME + ".History." + state + "." + group
    result = upc.retrieveVar( profile_name )
    gLogger.info( result )
    if not result[ "OK" ]:
      if result[ "Message" ].find( "No data" ) < 0 :
        gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
        return S_ERROR( result[ "Message" ] )
      history = list()
    else:
      history = result[ "Value" ]
    if not isinstance( history , list ):
      err = "List expected at: %s" % profile_name
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return S_ERROR( err )
    if( len( history ) > history_length ):
      history = result[ history_length ]
    gLogger.info( "Result %s: %s" % ( msg , history ) )
    return S_OK( history )
################################################################################
  def __deleteHistory( self , name , state ):
    """
    Deleting item from Load and Save history list
    Return resulting list
    "name" is a string
    "state" can be either "Save" or "Load"
    """
    gLogger.info( "Running deleteHistory( %s )" % name )
    msg = "deleteHistory() for %s@%s" % ( getUsername() , getSelectedGroup() )
    opt = "/Website/" + USER_PROFILE_NAME + "/ShowHistory"
    history_length = gConfig.getOptions( opt , 5 )
    upc = UserProfileClient( "Default" , getRPCClient )
    group = str( getSelectedGroup() )
    profile_name = USER_PROFILE_NAME + ".History." + state + "." + group
    result = upc.retrieveVar( profile_name )
    gLogger.info( result )
    if not result[ "OK" ]:
      if result[ "Message" ].find( "No data" ) < 0 :
        gLogger.info( "Result %s: %s" % ( msg , result[ "Message" ] ) )
        return S_OK( list() ) # Nothing to delete, return an empty list
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    else:
      result = result[ "Value" ]
    if not isinstance( result , list ):
      err = "List expected at: %s" % profile_name
      gLogger.error( "Result %s: %s" % ( msg , err ) )
      return S_ERROR( err )
    history = list()
    for i in result:
      if i.has_key( "name" ) and not i["name"] == name:
        history.append( i )
    if( len( history ) > history_length ):
      history = result[ history_length ]
    gLogger.error( "History: %s" % history )
    result = upc.storeVar( profile_name , history )
    gLogger.info( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return S_ERROR( result[ "Message" ] )
    gLogger.info( "Result %s: %s" % ( msg , history ) )
    return S_OK( history )
################################################################################
  def __getLayout( self ) :
    gLogger.info( "Running getLayout()" )
    msg = "getLayout() for %s@%s" % ( getUsername() , getSelectedGroup() )
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.listAvailableVars()
    gLogger.debug( result )
    if not result[ "OK" ]:
      gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = result[ "Value" ]
    gLogger.always( "array2obj" )
    availble = map( self.__array2obj , result )
    gLogger.always( availble )
    users = list()
    for i in result :
      if len( i ) > 1 :
        users.append( { "user" : i[ 0 ] } )
    users = uniqueElements( users )
    gLogger.info( "Result %s: %s AND %s" % ( msg , availble , users ) )
    return { "success" : "true" , "result" : availble , "users" : users }
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
################################################################################
  def __convert(self):
    gLogger.info("Running convert()")
    msg = "convert() for %s@%s" % ( getUsername() , getSelectedGroup() )
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.retrieveAllVars()
    gLogger.info( result )
    if not result["OK"]:
      if result[ "Message" ].find( "No data" ) < 0 :
        gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
        return S_ERROR( result[ "Message" ] )
      result = "No data found, nothing to convert"
      gLogger.info( "Result %s: %s" % ( msg , result ) )
      return S_OK( result )
    result = result[ "Value" ]
    try:
      layouts = dict( result )
    except:
      result = "Layouts '%s' is not dictionary, can't convert" % layouts
      gLogger.info( "Result %s: %s" % ( msg , result ) )
      return S_OK( result )
    err = list()
    done = list()
    gLogger.info( "Saving old data to new place" )
    for i in layouts:
      kwargs = dict()
      gLogger.info("Name: '%s'" % i)
      kwargs[ "name" ] = i
      kwargs[ "permissions" ] = "USER"
      kwargs[ "user" ] = str( getUsername() )
      kwargs[ "group" ] = str( getSelectedGroup() )
      kwargs[ "data" ] = dict()
      kwargs[ "data" ][ "url" ] = layouts[ i ][ "url" ]
      kwargs[ "data" ][ "columns" ] = layouts[ i ][ "columns" ]
      kwargs[ "data" ][ "refresh" ] = layouts[ i ][ "refresh" ]
      result = self.__saveLayout( **kwargs )
      if result.has_key( "error" ):
        err.append( result["error"] )
        continue
      done.append( result[ "result" ] )
      result = upc.deleteVar( i )
      if not result["OK"]:
        gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
        err.append( result["Message"] )
      continue
    gLogger.info( "Is something left?" )
    result = upc.retrieveAllVars()
    gLogger.info( result )
    if result[ "OK" ] and len( result[ "Value" ] ) > 0:
      text = "Some data has left at old place. Please remove them manually"
      gLogger.info( "Result %s: %s" % ( msg , text ) )
    if not result["OK"]:
      if result[ "Message" ].find( "No data" ) < 0 :
        gLogger.error( "Result %s: %s" % ( msg , result[ "Message" ] ) )
        return S_ERROR( result[ "Message" ] )
    gLogger.info( "Looks like old data are erased" )
    if len( err ) == 0 and len( done ) == 0:
      good = "Some magic has happens. Neither errors nor succesfull results"
      good = good + " Perhaps there is no old profile to convert"
      gLogger.info( "Result %s: %s" % ( msg , good ) )
      return S_OK( good )
    if len( err ) > 0 and len( done ) == 0:
      error = "No succesfull results, only errors:\n"
      tmp = "\n".join( err )
      error = error + tmp
      gLogger.error( "Result %s: %s" % ( msg , error ) )
      return S_ERROR( error )
    if len( err ) > 0 and len( done ) > 0:
      good = "Conversion has finished partially sucessfull"
      if len( err ) > 0:
        good = good + ". There are some errors though\n"
      else:
        good = good + ". There is an error though\n"
      error = "\n".join( err )
      good = good + error
      gLogger.info( "Result %s: %s" % ( msg , good ) )
      return S_OK( good )
    if len( err ) == 0 and len( done ) > 0:
      good = "Conversion has finished sucessfully"
      gLogger.info( "Result %s: %s" % ( msg , good ) )
      return S_OK( good )
