from DIRAC import gLogger
from dirac.lib.base import *
from dirac.lib.webconfig import gWebConfig


def getSelectedSetup():
  if 'setup' in session:
    selectedSetup = session[ 'setup' ]
    if selectedSetup in gWebConfig.getSetups():
      return selectedSetup
    else:
      return gWebConfig.getDefaultSetup()
  else:
    return gWebConfig.getDefaultSetup()

def setSelectedSetup( setup ):
  if setup in gWebConfig.getSetups():
    session[ 'setup' ] = setup
    session.save()

def getUsername():
  if 'username' in session:
    return session[ 'username' ]
  else:
    return "anonymous"

def getUserDN():
  if 'DN' in session:
    return session[ 'DN' ]
  else:
    return False

def getAvailableGroups():
  if 'availableGroups' in session:
    return session[ 'availableGroups' ]
  else:
    return []

def getSelectedGroup():
  if 'group' in session:
    return session [ 'group' ]
  else:
    for group in gWebConfig.getDefaultGroups():
      if group in getAvailableGroups():
        return group
    return "no group"

def setSelectedGroup( group ):
  if group in getAvailableGroups():
    session[ 'group' ] = group
    session.save()

def getDN():
  if 'DN' in session:
    return session[ 'DN' ]
  return ""
