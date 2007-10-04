import logging

from dirac.lib.base import *
from pylons.controllers.util import redirect_to
import dirac.lib.helpers as helpers

import dirac.lib.sessionManager as sessionManager

log = logging.getLogger(__name__)

class UserdataController(BaseController):

  def index(self):
    return 'Hello World'

  def changeGroup( self ):
    group = request.environ[ 'pylons.routes_dict' ][ 'id' ]
    log.info( "User has selected group %s" % group )
    sessionManager.setSelectedGroup( group )
    if 'HTTP_REFERER' in request.environ:
      return redirect_to( request.environ[ 'HTTP_REFERER' ] )
    else:
      return redirect_to( helpers.url_for( "/" ) )
    
  def changeSetup( self ):
    setup = request.environ[ 'pylons.routes_dict' ][ 'id' ]
    log.info( "User has selected setup %s" % setup )
    sessionManager.setSelectedSetup( setup )
    if 'HTTP_REFERER' in request.environ:
      return redirect_to( request.environ[ 'HTTP_REFERER' ] )
    else:
      return redirect_to( helpers.url_for( "/" ) )

