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
from DIRAC import gConfig, gLogger
from DIRAC.FrameworkSystem.Client.SystemAdministratorIntegrator import SystemAdministratorIntegrator

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
  def getVersions( self ):

    """
    Return dict with lists of version both DIRAC and extensions 
    from all the hosts registered in /Registry/Hosts
    """

    from dirac.lib.credentials import getUserDN, getSelectedGroup

    DN = getUserDN()
    group = getSelectedGroup()
    #TODO: remove hosts code after v6r7 since it will be built-in

    result = gConfig.getSections( "/Registry/Hosts" )
    if not result[ "Value" ]:
      return result[ "Message" ]
    hosts = result[ "Value" ]

    client = SystemAdministratorIntegrator( hosts = hosts , delegatedDN=DN ,
                                                delegatedGroup=group )
    result = client.getInfo()
    if not result[ "OK" ]:
      return result[ "Message" ]
    result = result[ "Value" ]

    versions = dict( { "DIRAC" : list() } )
    for host in result:
      if not result[ host ][ "OK" ]:
        continue
      tmp = result[ host ][ "Value" ]

      if "DIRAC" in tmp:
        if not tmp[ "DIRAC" ] in versions[ "DIRAC" ]:
          versions[ "DIRAC" ].append( tmp[ "DIRAC" ] )

      if "Extensions" in tmp:
        for key , value in tmp[ "Extensions" ].items():
          if not key in versions:
            versions[ key ] = list()
          if not value in versions[ key ]:
            versions[ key ].append( value )

    for key , value in versions.items():
      versions[ key ] = ", ".join( value )

    final = '<br/>'.join( [ '%s: %s' % ( key , value )
                            for ( key , value ) in versions.items() ] )
    return "Version of software used on this installation:<br/><br/>%s" % final


# Include the '_' function in the public names
__all__ = [__name for __name in locals().keys() if not __name.startswith('_') \
           or __name == '_']
