import logging
import os.path
from pylons import request
#from paste.deploy import CONFIG

from dirac.lib.base import *
from dirac.lib.webconfig import gWebConfig
from pylons.decorators.cache import beaker_cache

from DIRAC import gLogger
from DIRAC.Core.DISET.AuthManager import AuthManager
from DIRAC.Core.Security import CS

gAuthManager = AuthManager( "%s/Authorization" % gWebConfig.getWebSection() )

log = logging.getLogger(__name__)

def checkURL(environ, result):
  result[ 'dsetup' ] = __checkSetup( result[ 'dsetup' ] )
  userDN, userName = __checkDN( environ )
  environ[ 'DIRAC.userDN' ] = userDN
  environ[ 'DIRAC.userName' ] = userName
  result[ 'dgroup' ], environ[ 'DIRAC.availableGroups' ] = __checkGroup( userName, result[ 'dgroup' ] )
  return True

def __checkSetup( setup ):
  if setup not in gWebConfig.getSetups():
    return gWebConfig.getDefaultSetup()
  return setup

def __checkDN( environ ):
  userDN = False
  if 'SERVER_SOFTWARE' not in environ:
    gLogger.info( "Getting the DN from /Website/DebugDN" )
    userDN = gWebConfig.getDebugDN()
  if 'HTTPS' in environ and environ[ 'HTTPS' ] == 'on':
    if 'SSL_CLIENT_S_DN' in environ:
      userDN = environ[ 'SSL_CLIENT_S_DN' ]
    else:
      gLogger.error( "Apache is not properly configured to get SSL_CLIENT_S_DN in env" )
  if not userDN:
    userName = "anonymous"
  else:
    retVal = CS.getUsernameForDN( userDN )
    if not retVal[ 'OK' ]:
      userName = "anonymous"
    else:
      userName = retVal[ 'Value' ]
  gLogger.info( "Got username for user" " => %s for %s" % ( userName, userDN ) )
  return ( userDN, userName )

def __checkGroup( userName, group ):
  retVal = CS.getGroupsForUser( userName )
  if not retVal[ 'OK' ]:
    availableGroups = []
  else:
    availableGroups = retVal[ 'Value' ]
  if group in availableGroups:
    return ( group, availableGroups )

  defaultGroup = False
  for tgroup in gWebConfig.getDefaultGroups():
    if tgroup in availableGroups:
      defaultGroup = tgroup
      break
  if not defaultGroup:
    defaultGroup = "visitor"
  return ( defaultGroup, availableGroups )

def checkUserCredentials():
  return
  #Setup
  request.environ[ 'pylons.routes_dict' ][ 'dsetup' ] = __checkSetup( request.environ[ 'pylons.routes_dict' ][ 'dsetup' ] )
  gLogger.info( "URL setup is %s" % request.environ[ 'pylons.routes_dict' ][ 'dsetup' ] )

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
  retVal = CS.getUsernameForDN( userDN )
  if not retVal[ 'OK' ]:
    username = "anonymous"
  else:
    username = retVal[ 'Value' ]
  gLogger.info( "Got username for user" " => %s for %s" % ( username, userDN ) )
  session[ 'username' ] = username
  #Check the selected group
  retVal = CS.getGroupsForUser( session[ 'username' ] )
  if not retVal[ 'OK' ]:
    availableGroups = []
  else:
    availableGroups = retVal[ 'Value' ]
  session[ 'availableGroups' ] = availableGroups
  selectedGroup = request.environ[ 'pylons.routes_dict' ][ 'dgroup' ]
  if selectedGroup not in availableGroups:
    defaultGroup = False
    for tgroup in gWebConfig.getDefaultGroups():
      if tgroup in availableGroups:
        defaultGroup = tgroup
        break
    if not defaultGroup:
      defaultGroup = "visitor"
    request.environ[ 'pylons.routes_dict' ][ 'dgroup' ] = defaultGroup
  gLogger.info( "URL group is %s" % request.environ[ 'pylons.routes_dict' ][ 'dgroup' ] )

  if False:
    #Check selected group
    if 'group' in session:
      if session[ 'group' ] not in session[ 'availableGroups' ]:
        del( session[ 'group' ] )
    if 'group' not in session:
      for group in gWebConfig.getDefaultGroups():
        if group in session[ 'availableGroups' ]:
          session[ 'group' ] = group
          break
    if 'group' not in session:
      session[ 'group' ] = "visitor"

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

#Retrieve info from the connection user, DN, group, setup...

def getUsername():
  if 'DIRAC.userName' in request.environ:
    return request.environ[ 'DIRAC.userName' ]
  else:
    return "anonymous"

def getUserDN():
  if 'DIRAC.userDN' in request.environ:
    return request.environ[ 'DIRAC.userDN' ]
  else:
    return False

def getSelectedSetup():
  setup = request.environ[ 'pylons.routes_dict' ][ 'dsetup' ]
  if setup not in gWebConfig.getSetups():
   return gWebConfig.getDefaultSetup()
  return setup

def getSelectedGroup():
  return request.environ[ 'pylons.routes_dict' ][ 'dgroup' ]

def getAvailableGroups():
  if 'DIRAC.availableGroups' in request.environ:
    return request.environ[ 'DIRAC.availableGroups' ]
  else:
    return []
