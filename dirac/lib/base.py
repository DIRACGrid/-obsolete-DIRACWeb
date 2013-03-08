"""The base Controller API

Provides the BaseController class for subclassing, and other objects
utilized by Controllers.
"""
from pylons import c, cache, config, g, request, response, session
from pylons.controllers import WSGIController
from pylons.controllers.util import abort, etag_cache, redirect_to
from pylons.decorators import jsonify, validate
from pylons.i18n import _, ungettext, N_
from pylons.templating import render

import dirac.lib.helpers as h
import dirac.model as model
from dirac.lib.helpers import logo_wrap as w


class BaseController(WSGIController):

  def __call__(self, environ, start_response):
    """Invoke the Controller"""
    # WSGIController.__call__ dispatches to the Controller method
    # the request is routed to. This routing information is
    # available in environ['pylons.routes_dict']
    return WSGIController.__call__(self, environ, start_response)

  @w
  def getVersion( self ):

    """
    Return dict with lists of version both DIRAC and extensions 
    from all the hosts registered in /Registry/Hosts
    """
    if 'version' not in config:
      config[ 'version' ] = "Unknown"
    return "Web portal version: %s" % config[ 'version' ]


# Include the '_' function in the public names
__all__ = [__name for __name in locals().keys() if not __name.startswith('_') \
           or __name == '_']
