import logging
import os.path
from pylons import request
#from paste.deploy import CONFIG

from dirac.lib.base import *
from dirac.lib.webconfig import gWebConfig
from pylons.decorators.cache import beaker_cache

from DIRAC import gLogger
from DIRAC.Core.DISET.AuthManager import AuthManager

gAuthManager = AuthManager( "%s/Authorization" % gWebConfig.getWebSection() )

log = logging.getLogger(__name__)

def checkUserCredentials():
  userDN = ""
  if 'SERVER_SOFTWARE' not in request.environ:
    #Not running direct pylons paste server
    gLogger.info( "Getting the DN from /Website/DebugDN" )
    userDN = gWebConfig.getDebugDN()
  else:
    if 'HTTPS' in request.environ and request.environ[ 'HTTPS' ] == 'on':
        if 'SSL_CLIENT_S_DN' in request.environ:
            userDN = request.environ[ 'SSL_CLIENT_S_DN' ]
        else:
            gLogger.error( "Apache is not properly configured" )
  #Set the DN
  if userDN:
    session[ 'DN' ] = userDN
  else:
    if 'DN' in session:
      del( session[ 'DN' ] )
  #Set the username
  username = gAuthManager.findUsername( userDN )
  if not username:
    username = "anonymous"
  gLogger.info( "Got username for user" " => %s for %s" % ( username, userDN ) )
  session[ 'username' ] = username
  #Set the available groups
  session[ 'availableGroups' ] = gAuthManager.getGroupsForUsername( session[ 'username' ] )
  #Check selected group
  if 'group' in session:
    if not session[ 'group' ] in session[ 'availableGroups' ]:
      del( session[ 'group' ] )
  if 'group' not in session:
    for group in gWebConfig.getDefaultGroups():
      if group in session[ 'availableGroups' ]:
        session[ 'group' ] = group
        break
  if 'group' not in session:
    session[ 'group' ] = "noGroup"
  session.save()

def authorizeAction():
  checkUserCredentials()
  routeDict = request.environ[ 'pylons.routes_dict' ]
  actionPath = "%s/%s" % ( routeDict[ 'controller' ], routeDict[ 'action' ] )
  if 'DN' in session:
    userDN = session[ 'DN' ]
  else:
    userDN = 'anonymous'
  log.info( "AUTHORIZING %s for %s" % ( actionPath, userDN ) )
  c.error = "You shouldn't be here :) (not enough karma maybe?)"
  return gAuthManager.authQuery( actionPath, session )
