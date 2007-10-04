
import dirac.lib.sessionManager as sessionManager 
from DIRAC.Core.DISET.RPCClient import RPCClient

def getRPCClient( *args, **kwargs ):
	kwargs[ 'groupToUse' ] = ( str( sessionManager.getUserDN() ), str( sessionManager.getSelectedGroup() ) )
	kwargs[ 'useCertificates' ] = True
	return RPCClient( *args, **kwargs )
