
from pylons import request
import dirac.lib.credentials as credentials
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.TransferClient import TransferClient
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient

def __prepareArgs( kwargs ):
  if ( 'static' not in kwargs or not kwargs[ 'static' ] ) and credentials.getUserDN():
    kwargs[ 'delegatedGroup' ] =  str( credentials.getSelectedGroup() )
    kwargs[ 'delegatedDN' ] = str( credentials.getUserDN() )
  kwargs[ 'useCertificates' ] = True
  kwargs[ 'setup' ] = credentials.getSelectedSetup()
  return kwargs

def getRPCClient( *args, **kwargs ):
  kwargs = __prepareArgs( kwargs )
  return RPCClient( *args, **kwargs )

def getTransferClient( *args, **kwargs ):
  kwargs = __prepareArgs( kwargs )
  return TransferClient( *args, **kwargs )

def getUserProfileClient( controller = False, action = False ):
  routingDict = request.environ[ 'wsgiorg.routing_args' ][1]
  if not controller:
    controller = routingDict[ 'controller' ]
  if not action:
    action = routingDict[ 'action' ]
  actionPath = str( "%s/%s" % ( controller, action ) )
  return UserProfileClient( actionPath, rpcClient = getRPCClient( "Framework/UserProfileManager", timeout = 600 ) )
