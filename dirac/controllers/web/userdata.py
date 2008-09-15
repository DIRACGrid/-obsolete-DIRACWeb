import logging

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
    return config[ 'routes.map' ].match( ref )

  def changeGroup( self ):
    return self.__changeURLPropertyAndRedirect( 'dgroup', credentials.getAvailableGroups() )

  def changeSetup( self ):
    return self.__changeURLPropertyAndRedirect( 'dsetup', gWebConfig.getSetups() )

  def __changeURLPropertyAndRedirect( self, propKey, validValues ):
    requestedValue = request.environ[ 'pylons.routes_dict' ][ 'id' ]
    if requestedValue in validValues:
      request.environ[ 'pylons.routes_dict' ][ propKey ] = requestedValue
    if 'HTTP_REFERER' in request.environ:
      refererDict = self.__mapReferer()
      if refererDict:
        redirectDict = {}
        for key in ( 'controller', 'action' ):
          if key in refererDict:
            redirectDict[ key ] = refererDict[ key ]
        if 'id' in refererDict:
          redirectDict[ 'id' ] = refererDict[ 'id' ]
        else:
          redirectDict[ 'id' ] = None
        return redirect_to( **redirectDict )

    return defaultRedirect()



