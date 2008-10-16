import logging
import cgi

from dirac.lib.base import *
from pylons.controllers.util import redirect_to
import dirac.lib.helpers as helpers

import dirac.lib.credentials as credentials
from dirac.lib.webconfig import gWebConfig
from dirac.lib.webBase import defaultRedirect
from DIRAC import gLogger

log = logging.getLogger(__name__)

class UserdataController(BaseController):

  def index(self):
    return defaultRedirect()

  def __mapReferer(self):
    ref = request.environ[ 'HTTP_REFERER' ]
    ref = ref[ ref.find( "/", 8 ) : ]
    scriptName = request.environ[ 'SCRIPT_NAME' ]
    if scriptName:
      if scriptName[0] != "/":
        scriptName = "/%s" % scriptName
      if ref.find( scriptName ) == 0:
        ref = ref[ len( scriptName ): ]
    pI = ref.find( '?' );
    if pI > -1:
      params = ref[ pI+1: ]
      ref = ref[ :pI ]
    else:
      params = ""
    pDict = dict( cgi.parse_qsl( params ) ) 
    return ( config[ 'routes.map' ].match( ref ), pDict  )

  def changeGroup( self ):
    return self.__changeURLPropertyAndRedirect( 'dgroup', credentials.getAvailableGroups() )

  def changeSetup( self ):
    return self.__changeURLPropertyAndRedirect( 'dsetup', gWebConfig.getSetups() )

  def __changeURLPropertyAndRedirect( self, propKey, validValues ):
    requestedValue = request.environ[ 'pylons.routes_dict' ][ 'id' ]
    redDict = False
    if 'HTTP_REFERER' in request.environ:
      refDict, paramsDict = self.__mapReferer()
      if refDict:
        redDict = paramsDict
        for key in ( 'controller', 'action' ):
          if key in refDict:
            redDict[ key ] = refDict[ key ]
        if 'id' in refDict:
          redDict[ 'id' ] = refDict[ 'id' ]
        else:
          redDict[ 'id' ] = None
        if 'controller' in redDict and 'action' in redDict and \
           redDict[ 'controller' ] == 'template' and \
           redDict[ 'action' ] == 'view':
          redDict = False
    if requestedValue in validValues:
      request.environ[ 'pylons.routes_dict' ][ propKey ] = requestedValue
    else:
      gLogger.info( "Requested change to %s invalid %s" % ( requestedValue, validValues ) )
    if redDict:
      return redirect_to( **redDict )
    return defaultRedirect()

  def unauthorizedAction( self ):
    c.error = "You're not authorized!"
    return render( "/error.mako" )


