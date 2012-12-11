from dirac.lib.base import *
from dirac.lib.credentials import getUserDN, getUsername, getAvailableGroups
from dirac.lib.credentials import getProperties, checkUserCredentials
from DIRAC import gConfig, gLogger
from DIRAC.FrameworkSystem.Client.SystemAdministratorClient import SystemAdministratorClient

items = 25
position = 0

class SystemadministrationController( BaseController ):

  """
  Controller is used to perform standard operation on DIRAC services
  
  """

  def display( self ):
    c.select = self.__getSelectionData()
    gLogger.always( "__getSelectionData():" , c.select )
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
      
    for i in hosts:

      record = dict()
      record[ "Host" ] = i

      client = SystemAdministratorClient( i , None )
      result = client.getOverallStatus()
      if not result[ "OK" ]:
        #TODO: Error handling
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
    if request.params.has_key( "" ) and len( request.params[ "" ] ) > 0:
      return { "success" : "true" , "result" : self.somefunction() }
    else:
      result = "The request parameters can are not defined"
      gLogger.debug( result )
      return { "success" : "false" , "error" : result }
