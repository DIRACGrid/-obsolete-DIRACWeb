import logging
from dirac.lib.base import *
import dirac.lib.credentials as credentials
from DIRAC import S_OK, S_ERROR,gLogger
from DIRAC.WorkloadManagementSystem.Client.SandboxStoreClient import SandboxStoreClient

log = logging.getLogger(__name__)

class JobadministratorController(BaseController):

  def getSandbox( self ):
    """ Get job sandbox 
    """
    if 'jobID' not in request.params:
      c.error = "Maybe you forgot the jobID ?"
      return render( "/error.mako" )
    jobID = int(request.params['jobID']) 
    sbType = 'Output'
    if 'sandbox' in request.params:
      sbType = str(request.params['sandbox'])
        
    client = SandboxStoreClient(useCertificates=True,
                                delegatedDN=str( credentials.getUserDN() ),
                                delegatedGroup=str( credentials.getSelectedGroup() ),
                                setup = credentials.getSelectedSetup() )
    result = client.downloadSandboxForJob(jobID,sbType,inMemory=True)
    if not result['OK']:
      c.error = "Error: %s" % result['Message']
      return render( "/error.mako" ) 
    
    data = result['Value'] 
    fname = "%s_%sSandbox.tar" % (str(jobID),sbType)
    response.headers['Content-type'] = 'application/x-tar'
    response.headers['Content-Disposition'] = 'attachment; filename="%s"' % fname
    response.headers['Content-Length'] = len( data )
    return data