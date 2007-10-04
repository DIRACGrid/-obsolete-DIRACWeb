import logging

from dirac.lib.base import *
from dirac.lib.credentials import authorizeAction
from dirac.lib.diset import getRPCClient

log = logging.getLogger(__name__)

class ConfigurationController(BaseController):

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return 'Hello World'

  def showHistory( self ):
    if not authorizeAction():  
      return render( "/error.mako" )
    rpcClient = getRPCClient( "Configuration/Server" )
    print "GOT RPC CLIENT"
    c.data = rpcClient.getCommitHistory()
    return render( "/systems/configuration/history.mako" )

  def showConfig( self ):
    rpcClient = getRPCClient( "Configuration/Server" )
    print "GOT RPC CLIENT"
    c.data = rpcClient.getCommitHistory()
    return render( "/systems/configuration/history.mako" )