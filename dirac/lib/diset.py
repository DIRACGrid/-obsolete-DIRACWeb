
import dirac.lib.credentials as credentials
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.TransferClient import TransferClient

def __prepareArgs( kwargs ):
  if credentials.getUserDN():
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
