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
      gLogger.always( "Results: %s" % result )
      if not result[ "OK" ]:
        continue
      overall = result[ "Value" ]

      for record in self.flatten( overall ):
        record[ "Host" ] = i
        callback.append( record )

    return { "success" : "true" , "result" : callback }



  def __request(self):

    """
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
    if "get" in request.params:
      get = request.params[ "get" ]
      if ( get == "email" ) and ( "user" in request.params ):
        return self.__returnEmail()
      elif get == "user":
        return self.__returnUsers()
      elif get == "group":
        return self.__returnGroups()
      else:
        error = "The request parameters get '%s' is not defined" % get
        gLogger.debug( error )
        return { "success" : "false" , "error" : error }
    elif "action" in request.params:
      action = request.params[ "action" ]
      
      if not "host" in request.params:
        error = "Hostname to perform an action at is not in request"
        gLogger.debug( error )
        return { "success" : "false" , "error" : error }
      host = request.params[ "host" ]

      if not "system" in request.params:
        error = "Name of system to perform an action on is not in request"
        gLogger.debug( error )
        return { "success" : "false" , "error" : error }
      system = request.params[ "system" ]
      
      if not "name" in request.params:
        error = "name of service to perform an action on is not in request"
        gLogger.debug( error )
        return { "success" : "false" , "error" : error }
      service = request.params[ "name" ]
      
      if action == "restart":
        return self.__serviceDoAction( action , host , system , service )
      elif action == "start":
        return self.__serviceDoAction( action , host , system , service )
      elif action == "stop":
        return self.__serviceDoAction( action , host , system , service )
      else:
        error = "The request parameters action '%s' is unknown" % action
        gLogger.debug( error )
        return { "success" : "false" , "error" : error }

    elif "send" in request.params:
      return self.__sendMessage()
    else:
      result = "The request parameters are not defined"
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }



  def __serviceDoAction( self , action = None , host = None , system = None , component = None ):

    """
    """

    if ( not action ) or ( not len( action ) > 0 ):
      error = "Action is not defined or has zero length"
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }    
    if ( not host ) or ( not len( host ) > 0 ):
      error = "Hostname is not defined or has zero length"
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }
    if ( not system ) or ( not len( system ) > 0 ):
      error = "Name of system is not defined or has zero length"
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }
    if ( not component ) or ( not len( component ) > 0 ):
      error = "Name of component is not defined or has zero length"
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }
    
    client = SystemAdministratorClient( host , None )
    
    if action == "restart":
      result = client.restartComponent( system , component )
    elif action == "start":
      result = client.startComponent( system , component )
    elif action == "stop":
      result = client.stopComponent( system , component )
    else:
      result = "Action %s is not valid" % action
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }

    if not result['OK']:
      gLogger.debug( result['Message'] )
      return { "success" : "false" , "error" : result['Message'] }
    return { "success" : "true" , "result" : result['Value'] }



  def __sendMessage( self ):

    """
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



  def __returnUsers( self ):

    """
    """
    
    result = gConfig.getSections( "/Registry/Users" )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    groups = result[ "Value" ]
    groups = map( lambda x : { "user" : x } , groups )
    return { "success" : "true" , "result" : groups }



  def __returnGroups( self ):

    """
    """
    
    result = gConfig.getSections( "/Registry/Groups" )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    groups = result[ "Value" ]
    groups = map( lambda x : { "group" : x } , groups )
    return { "success" : "true" , "result" : groups }



  def __returnEmail( self ):

    """
    """

    email = GeneralController().getRequesterEmail()
    if not email:
      error = "Can't get e-mail from CS"
      gLogger.error( error )
      return { "success" : "false" , "error" : error }
    return { "success" : "true" , "result" : email }
