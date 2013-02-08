#from pygments import highlight
#from pygments.lexers import ValaLexer
#from pygments.lexers import PythonLexer
#from pygments.formatters import HtmlFormatter

from dirac.lib.base import *
from dirac.lib.credentials import getUserDN, getUsername, getAvailableGroups
from dirac.lib.credentials import getProperties, checkUserCredentials, getSelectedGroup
from DIRAC import gConfig, gLogger
from DIRAC.FrameworkSystem.Client.SystemAdministratorClient import SystemAdministratorClient
from DIRAC.FrameworkSystem.Client.SystemAdministratorIntegrator import SystemAdministratorIntegrator
from dirac.controllers.info.general import GeneralController
from DIRAC.Core.Utilities.List import uniqueElements

items = 25
position = 0

class SystemadministrationController( BaseController ):

  """
  Controller is used to perform standard operation on DIRAC services
  """

  def display( self ):
  
    c.init = dict()
    
    result = gConfig.getSections( "/Registry/Hosts" )
    if result[ "Value" ]:
      c.init[ "hosts" ] = result[ "Value" ]
    
    return render( "systems/SystemAdministration.mako" )


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
    returned by getHosts function
    """

    checkUserCredentials()
    DN = getUserDN()
    group = getSelectedGroup()

    callback = list()
    
    request = self.request()
    if not 'Hostname' in request:
      return { "success" : "false" , "error" : "Name of the host is absent" }
    
    host = request[ 'Hostname' ]
    client = SystemAdministratorClient( host , None , delegatedDN=DN ,
                                          delegatedGroup=group )
    result = client.getOverallStatus()
    gLogger.debug( "Result of getOverallStatus(): %s" % result )

    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    overall = result[ "Value" ]

    for record in self.flatten( overall ):
      record[ "Host" ] = host
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
    elif "showSysInfo" in request.params:
      return self.__getSysInfo()
    elif "action" in request.params:
      return self.__componentAction( request.params[ "action" ] )
    elif "send" in request.params:
      return self.__sendMessage()
    else:
      result = "The request parameters are not defined"
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }

  @jsonify
  def showHostErrors( self ):

    DN = getUserDN()
    group = getSelectedGroup()
    
    if not "host" in request.params:
      return { "success" : "false" , "error" : "Name of the host is missing or not defined" }
    host = str( request.params[ "host" ] )

    client = SystemAdministratorClient( host , None , delegatedDN=DN , delegatedGroup=group )

    result = client.checkComponentLog( "*" )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = result[ "Value" ]
    
    callback = list()
    for key, value in result.items():
      system, component = key.split( "/" )
      value[ "System" ] = system
      value[ "Name" ] = component
      value[ "Host" ] = host
      callback.append( value )
    total = len( callback )

    return { "success" : "true" , "result" : callback , "total" : total }


  def showLog( self ):

    DN = getUserDN()
    group = getSelectedGroup()
    
    if not "host" in request.params:
      return "Name of the host is missing or not defined"
    host = str( request.params[ "host" ] )

    if not "system" in request.params:
      return "Name of the system is missing or not defined"
    system = str( request.params[ "system" ] )

    if not "component" in request.params:
      return "Name of component is missing or not defined"
    name = str( request.params[ "component" ] )

    client = SystemAdministratorClient( host , None , delegatedDN=DN , delegatedGroup=group )

    result = client.getLogTail( system , name )
#    result = client.checkComponentLog( "*" )
    gLogger.debug( result )
    if not result[ "OK" ]:
      return result[ "Message" ]
    result = result[ "Value" ]
    key = system + "_" + name
    if not key in result:
      return "%s key is absent in service response" % key
    log = result[ key ]
    return log.replace( "\n" , "<br>" )
 #   return highlight( log , ValaLexer() , HtmlFormatter() )


  @jsonify
  def sysinfo( self ):

    DN = getUserDN()
    group = getSelectedGroup()

    #TODO: remove hosts code after v6r7 since it will be built-in
    result = gConfig.getSections( "/Registry/Hosts" )
    if not result[ "Value" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    hosts = result[ "Value" ]

    client = SystemAdministratorIntegrator( hosts = hosts , delegatedDN=DN ,
                                          delegatedGroup=group )
    result = client.getHostInfo()
    gLogger.debug( result )
    if not result[ "OK" ]:
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = result[ "Value" ]

    callback = list()
    for i in result:
      if result[ i ][ "OK" ]:
        tmp = result[ i ][ "Value" ]
      else:
        tmp = dict()
      tmp[ "Host" ] = i
      callback.append( tmp )

    total = len( callback )
    if not total > 0:
      return { "success" : "false" , "error" : "No system information found" }
    return { "success" : "true" , "result" : callback , "total" : total }



  def __actionHost( self ):

    """
    Restart all DIRAC components on a given host
    """

    if not "hostname" in request.params:
      return { "success" : "false" , "error" : "No hostname given" }
    hosts = request.params[ "hostname" ].split( "," )

    DN = getUserDN()
    group = getSelectedGroup()

    self.actionSuccess = list()
    self.actionFailed = list()

    for i in hosts:
      client = SystemAdministratorClient( str( i ) , None , delegatedDN=DN ,
                                          delegatedGroup=group )
      if self.action is "restart":
        result = client.restartComponent( str( "*" ) , str( "*" ) )
      elif self.action is "revert":
        result = client.revertSoftware()
      else:
        error = i + ": Action %s is not defined" % self.action
        self.actionFailed.append( error )
        continue

      gLogger.always( result )

      if not result[ "OK" ]:
        if result[ "Message" ].find( "Unexpected EOF" ) > 0:
          msg = "Signal 'Unexpected EOF' received. Most likely DIRAC components"
          msg = i + ": " + msg + " were successfully restarted."
          self.actionSuccess.append( msg )
          continue
        error = i + ": " + result[ "Message" ]
        self.actionFailed.append( error )
        gLogger.error( error )
      else:
        gLogger.info( result[ "Value" ] )
        self.actionSuccess.append( i )
      
    self.prefix = "Host"
    return self.__aftermath()



  @jsonify
  def restartHost( self ):
    self.action = "restart"
    return self.__actionHost()



  @jsonify
  def revertHost( self ):
    self.action = "revert"
    return self.__actionHost()



  def __componentAction( self , action = None ):

    """
    Actions which should be done on components. The only parameters is an action
    to perform.
    Returns standard JSON response structure with with service response
    or error messages
    """

    DN = getUserDN()
    group = getSelectedGroup()

    if ( not action ) or ( not len( action ) > 0 ):
      error = "Action is not defined or has zero length"
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }

    if action not in [ "restart" , "start" , "stop" , "uninstall" ]:
      error = "The request parameters action '%s' is unknown" % action
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }
    self.action = action

    result = dict()
    for i in request.params:
      if i == "action":
        continue

      target = i.split( " @ " , 1 )
      if not len( target ) == 2:
        continue

      system = request.params[ i ]
      gLogger.always( "System: %s" % system )
      host = target[ 1 ]
      gLogger.always( "Host: %s" % host )
      component = target[ 0 ]
      gLogger.always( "Component: %s" % component )
      if not host in result:
        result[ host ] = list()
      result[ host ].append( [ system , component ] )

    if not len( result ) > 0:
      error = "Failed to get component(s) for %s" % action
      gLogger.debug( error )
      return { "success" : "false" , "error" : error }
      
    gLogger.always( result )
    self.actionSuccess = list()
    self.actionFailed = list()

    for hostname in result.keys():

      if not len( result[ hostname ] ) > 0:
        continue

      client = SystemAdministratorClient( hostname , None , delegatedDN=DN ,
                                          delegatedGroup=group )

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
          elif action == "uninstall":
            result = client.uninstallComponent( system , component )
          else:
            result = list()
            result[ "Message" ] = "Action %s is not valid" % action
        except Exception, x:
          result = list()
          result[ "Message" ] = "Exception: %s" % str( x )
        gLogger.debug( "Result: %s" % result )

        if not result[ "OK" ]:
          error = hostname + ": " + result[ "Message" ]
          self.actionFailed.append( error )
          gLogger.error( "Failure during component %s: %s" % ( action , error ) )
        else:
          gLogger.always( "Successfully %s component %s" % ( action , component ) )
          self.actionSuccess.append( component )

    self.prefix = "Component"
    return self.__aftermath()


  def __aftermath( self ):

    action = self.action

    success = ", ".join( self.actionSuccess )
    failure = "\n".join( self.actionFailed )

    if len( self.actionSuccess ) > 1:
      sText = self.prefix + "s"
    else:
      sText = self.prefix
      
    if len( self.actionFailed ) > 1:
      fText = self.prefix + "s"
    else:
      fText = self.prefix

    if len( success ) > 0 and len( failure ) > 0:
      sMessage = "%s %sed successfully: " % ( sText , action , success)
      fMessage = "Failed to %s %s:\n%s" % ( action , fText , failure )
      result = sMessage + "\n\n" + fMessage
      return { "success" : "true" , "result" : result }
    elif len( success ) > 0 and len( failure ) < 1:
      result = "%s %sed successfully: %s" % ( sText , action , success )
      return { "success" : "true" , "result" : result }
    elif len( success ) < 1 and len( failure ) > 0:
      result = "Failed to %s %s:\n%s" % ( action , fText , failure )
      gLogger.always( result )
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
