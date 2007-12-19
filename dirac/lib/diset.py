
import dirac.lib.sessionManager as sessionManager
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.TransferClient import TransferClient

def __prepareArgs( kwargs ):
	if str( sessionManager.getUserDN() ):
		kwargs[ 'delegatedGroup' ] =  str( sessionManager.getSelectedGroup() )
		kwargs[ 'delegatedDN' ] = str( sessionManager.getUserDN() )
	kwargs[ 'useCertificates' ] = True
	kwargs[ 'setup' ] = sessionManager.getSelectedSetup()
	return kwargs

def getRPCClient( *args, **kwargs ):
	kwargs = __prepareArgs( kwargs )
	return RPCClient( *args, **kwargs )

def getTransferClient( *args, **kwargs ):
	kwargs = __prepareArgs( kwargs )
	return TransferClient( *args, **kwargs )