from dirac.lib.base import *
from dirac.lib.credentials import getUserDN, getUsername, getAvailableGroups
from dirac.lib.credentials import getProperties, checkUserCredentials
from DIRAC import gConfig, gLogger
from DIRAC.FrameworkSystem.Client.SystemAdministratorClient import SystemAdministratorClient
from dirac.controllers.info.general import GeneralController
from DIRAC.Core.Utilities.List import uniqueElements

items = 25
position = 0

class SystemadministrationController( BaseController ):

  """
  Controller is used to perform standard operation on DIRAC services
  
  """

  def display( self ):
    return render( "systems/SystemAdministration.mako" )


  """
  def __getSelectionData( self ):

    callback = {}
    if len( request.params ) > 0:
      tmp = {}
      for i in request.params:
        tmp[ i ] = request.params[ i ]
      callback[ "extra" ] = tmp

#    if user == "Anonymous":
#      callback["prod"] = [["Insufficient rights"]]
      
    result = gConfig.getSections( "/Registry/Hosts" )
    gLogger.debug( "Hosts: %s" % result )
    if not result[ "OK" ]:
      hosts = result[ "Message" ]
    else:
      hosts = result[ "Value" ]
    callback[ "hosts" ] =  map( lambda x: [ x ] , hosts )
    return callback
  """



  def flatten( self , dataDict ):

    """
    Flatten dict of dicts structure returned by getOverallStatus() method of
    SystemAdministrator client
    """

    for kind , a in dataDict.items():
      for system , b in a.items():
        for name , c in b.items():
          if ( "Installed" in c ) and ( c[ "Installed" ] ):
            c[ "Type" ] = kind
            c[ "System" ] = system
            c[ "Name" ] = name
            yield c



  @jsonify
  def submit( self ):

    """
    Returns flatten list of components (services, agents) installed on hosts
    taken at /Registry/Hosts section which has SystemAdministrator up & running
    """

    checkUserCredentials()

    request = self.__request()

    callback = list()
    
    gLogger.always( "Get services" )
    result = gConfig.getSections( "/Registry/Hosts" )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    hosts = result[ "Value" ]
    gLogger.always( "Hosts: %s" % hosts )

    for i in hosts:
      client = SystemAdministratorClient( i , None )
      result = client.getOverallStatus()
      gLogger.debug( "Result of getOverallStatus(): %s" % result )

      if not result[ "OK" ]:
        continue
      overall = result[ "Value" ]

      for record in self.flatten( overall ):
        record[ "Host" ] = i
        callback.append( record )

    return { "success" : "true" , "result" : callback }



  def request(self):

    """
    Parsing incoming request. Returns dict with param names as keys
    """

    req = dict()

    global items
    if request.params.has_key( "limit" ):
      try:
        items = int( request.params[ "limit" ] )
      except:
        pass

    global position
    if request.params.has_key( "start" ):
      try:
        position = int( request.params[ "start" ] )
      except:
        pass

    separator = gConfig.getValue( "/Website/ListSeparator" , ":::" )

    for key , value in request.params.iteritems():
      if key in [ "start" , "limit" ]:
        continue
      key = key.capitalize()
      try:
        value = str( value )
      except:
        continue
      if value == "All":
        continue
      req[ key ] = value

    gLogger.always( "Service incoming request: %s" % request.params )  
    gLogger.always("Finalized request: %s" % req )

    return req



  @jsonify
  def action(self):

  """
  Processing of incoming requests
  """

# Authorize    
    if "get" in request.params:
      get = request.params[ "get" ]
      if ( get == "email" ) and ( "user" in request.params ):
        return self.__returnEmail()
      elif get == "user":
        return self.__returnListFromCS( "/Registry/Users" )
      elif get == "group":
        return self.__returnListFromCS( "/Registry/Groups" )
      else:
        error = "The request parameters get '%s' is not defined" % get
        gLogger.debug( error )
        return { "success" : "false" , "error" : error }
    elif "action" in request.params:
      return self.__componentAction( request.params[ "action" ] )
    elif "send" in request.params:
      return self.__sendMessage()
    else:
      result = "The request parameters are not defined"
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }



  def __componentAction( self , action = None ):

    """
    Actions which should be done on components. The only parameters is an action
    to perform.
    Returns standard JSON response structure with with service response
    or error messages
    """

    if ( not action ) or ( not len( action ) > 0 ):
      error = "Action is not defined or has zero length"
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }    

    if action not in [ "restart" , "start" , "stop" ]:
      error = "The request parameters action '%s' is unknown" % action
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }

    result = dict()
    for i in request.params:
      if i == "action":
        continue

      target = i.split( " @ " , 1 )
      if not len( target ) == 2:
        continue

      host = request.params[ i ]
      if not host in result:
        result[ host ] = list()
      result[ host ].append( [ target[ 0 ] , target[ 1 ] ] )

    if not len( result ) > 0:
      error = "Failed to get component(s) for %s" % action
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }

    actionSuccess = list()
    actionFailed = list()

    for hostname in result.keys():

      if not len( result[ hostname ] ) > 0:
        continue

      client = SystemAdministratorClient( hostname , None )

      for i in result[ hostname ]:

        system = i[ 0 ]
        component = i[ 1 ]

        try:
          if action == "restart":
            result = client.restartComponent( system , component )
          elif action == "start":
            result = client.startComponent( system , component )
          elif action == "stop":
            result = client.stopComponent( system , component )
          else:
            result = list()
            result[ "Message" ] = "Action %s is not valid" % action
        except Exception, x:
          result = list()
          result[ "Message" ] = "Exception: %s" % str( x )
        gLogger.debug( "Result: %s" % result )

        if not result[ "OK" ]:
          error = hostname + ": " + result[ "Message" ]
          actionFailed.append( error )
          gLogger.error( "Failure during component %s: %s" % ( action , error ) )
        else:
          gLogger.always( "Successfully %s component %s" % ( action , component ) )
          actionSuccess.append( component )

    success = ", ".join( actionSuccess )
    failure = "\n".join( actionFailed )

    if len( actionSuccess ) > 1:
      sText = "Components"
    else:
      sText = "Component"
      
    if len( actionFailed ) > 1:
      fText = "Components"
    else:
      fText = "Component"

    if len( success ) > 0 and len( failure ) > 0:
      sMessage = "%s %sed successfully: " % ( sText , action , success)
      fMessage = "Failed to %s %s:\n%s" % ( action , fText , failure )
      result = sMessage + "\n\n" + fMessage
      gLogger.debug( result )
      return { "success" : "true" , "result" : result }
    elif len( success ) > 0 and len( failure ) < 1:
      result = "%s %sed successfully: %s" % ( sText , action , success )
      gLogger.debug( result )
      return { "success" : "true" , "result" : result }
    elif len( success ) < 1 and len( failure ) > 0:
      result = "Failed to %s %s:\n%s" % ( action , fText , failure )
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }
    else:
      result = "No action has performed due technical failure. Check the logs please"
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }



  def __sendMessage( self ):

    """
    Send message(not implemented yet) or email getting parameters from request
    """

    getEmail = self.__returnEmail()
    if not "result" in getEmail:
      return getEmail
    email = getEmail[ "result" ]

    if not "subject" in request.params:
      result = "subject parameter is not in request... aborting"
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }
    subject = GeneralController().checkUnicode( request.params[ "subject" ] )
    if not len( subject ) > 0:
      subject = "Message from %s" % email

    if not "msg" in request.params:
      result = "msg parameter is not in request... aborting"
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }
    body = GeneralController().checkUnicode( request.params[ "msg" ] )
    if not len( body ) > 0:
      result = "Message body has zero length... aborting"
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }

    users = list()
    userList = GeneralController().userlistFromRequest()
    gLogger.info( "List of users from request: %s" % userList )
    if userList:
      users.extend( userList )

    groupList = GeneralController().grouplistFromRequest()
    gLogger.info( "List of groups from request: %s" % groupList )
    if groupList:
      for i in groupList:
        userList = GeneralController().userlistFromGroup( i )
        gLogger.info( "Get users: %s from group %s" % ( userList , i ) )
        if userList:
          users.extend( userList )
    gLogger.info( "Merged list of users from users and group %s" % users )

    if not len( users ) > 0:
      error = "Length of list of recipients is zero size"
      gLogger.info( error )
      return { "success" : "false" , "error" : error }
    users = uniqueElements( users )
    gLogger.info( "Final list of users to send message/mail: %s" % users )
    
    if "email" in request.params:
      sendDict = GeneralController().getMailDict( users )
      return GeneralController().sendMail( sendDict , subject , body , email )
    return { "success" : "false" , "error" : result }



  def __returnListFromCS( self , path = None ):

    """
    Return list of subsections from section defined by path argument as JSON
    """
    
    if not path:
      return { "success" : "false" , "error" : "Path argument is undefined" }
    result = gConfig.getSections( path )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    groups = result[ "Value" ]
    groups = map( lambda x : { "user" : x } , groups )
    return { "success" : "true" , "result" : groups }



  def __returnEmail( self ):
  
    """
    Return email of owner of the request as JSON structure
    """

    email = GeneralController().getRequesterEmail()
    if not email:
      error = "Can't get e-mail from CS"
      gLogger.error( error )
      return { "success" : "false" , "error" : error }
    return { "success" : "true" , "result" : email }
