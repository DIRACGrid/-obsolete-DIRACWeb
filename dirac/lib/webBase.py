import logging

from dirac.lib.base import *

import dirac.lib.credentials as credentials
import dirac.lib.yuiWidgets as yuiWidgets
from dirac.lib.webconfig import gWebConfig
import dirac.lib.helpers as helpers
from pylons import request
from DIRAC import gMonitor, gLogger

def currentPath():
  rD = request.environ[ 'pylons.routes_dict' ]
  path = "%s/%s" % ( rD[ 'controller' ], rD[ 'action' ] )
  if 'QUERY_STRING' in request.environ and len( request.environ[ 'QUERY_STRING' ] ) > 0:
    queryString = "?%s" % request.environ[ 'QUERY_STRING' ]
  else:
    queryString = ""
  return "%s%s" % ( path, queryString )

def htmlShortcuts():
  htmlData = ""
  for entryTuple in gWebConfig.getShortcutsForGroup( credentials.getSelectedGroup() ):
    htmlData += " %s |" % helpers.link_to( entryTuple[0], url = diracURL( entryTuple[1] ) )
  return htmlData[:-2]

def htmlUserInfo():
  username = credentials.getUsername()
  if not username or username == "anonymous":
    htmlData = "Anonymous"
  else:
    selectedGroup = credentials.getSelectedGroup()
    availableGroups = [ ( groupName, diracURL( controller='web/userdata', action='changeGroup', id=groupName ) ) for groupName in credentials.getAvailableGroups() ]
    htmlData = "%s@%s" % ( username, yuiWidgets.dropDownMenu( "UserGroupPos", selectedGroup, availableGroups  ) )
  dn = credentials.getUserDN()
  if dn:
    htmlData += " (%s)" % dn
  else:
    if 'REQUEST_URI' in request.environ:
      uri = str( request.environ[ 'REQUEST_URI' ] )
    else:
      uri = ""
    htmlData += " (<a href='https://%s%s'>certificate login</a>)" % ( str( request.environ[ 'HTTP_HOST' ] ), uri )
  return htmlData

def htmlSetups():
  selectedSetup = "<strong>%s</strong>" % credentials.getSelectedSetup()
  availableSetups = [ ( setupName, diracURL( controller='web/userdata', action='changeSetup', id=setupName ) ) for setupName in gWebConfig.getSetups() ]
  return yuiWidgets.dropDownMenu( "UserSetupPos", selectedSetup, availableSetups )

def htmlPageTitle():
  gMonitor.addMark( "pagesServed" )
  path = currentPath()
  return gWebConfig.getPageTitle( path )

def schemaAreas():
  return gWebConfig.getSchemaSections( "" )

def jsSchemaSection( area, section ):
  jsTxt = "["
  for subSection in gWebConfig.getSchemaSections( section ):
    subSectionPath = "%s/%s" % ( section, subSection )
    subJSTxt = jsSchemaSection( area, subSectionPath )
    if len( subJSTxt ) > 0:
      jsTxt += "{ text: '%s', submenu : { id: '%s', itemdata : %s } }, " % ( subSection, subSectionPath, subJSTxt )
  for page in gWebConfig.getSchemaPages( section ):
    pageData = gWebConfig.getSchemaPageData( "%s/%s" % ( section, page ) )
    if len( pageData ) < 3 or 'all' in pageData[2:] or credentials.getSelectedGroup() in pageData[2:]:
      if pageData[0].find( "http" ) == 0:
        pagePath = pageData[0]
      else:
        pagePath = diracURL( "/%s/%s" % ( area, pageData[0] ) )
      jsTxt += "{ text : '%s', url : '%s' }," % ( page, pagePath )
  jsTxt += "]"
  return jsTxt

def htmlSchemaAreas( areasList = False):
  actualWebPath = currentPath()
  dirList = [ dir.strip() for dir in actualWebPath.split( "/" ) if not dir.strip() == "" ]
  htmlData = ""
  if not areasList:
    areasList = gWebConfig.getSchemaSections( "" )
  for area in areasList:
    htmlData += "<td id='%sPosition' class='menuSection'>" % area
    if area.lower() == dirList[0]:
      htmlData += "<div id='%sMenuAnchor' class='selectedLabel'>" % area
    else:
      htmlData += "<div id='%sMenuAnchor' class='label'>" % area
    htmlData += "%s</div></td>\n" % area.capitalize()
  return htmlData

def htmlPath():
  path = currentPath()
  schemaPath = gWebConfig.getSchemaPathFromURL( path )
  dirList = [ dir for dir in schemaPath.split( "/" ) if not dir.strip() == "" ]
  return " > ".join( dirList )

##For extjs

mainPageHandler = "mainPageRedirectHandler"

def checkPropertiesWithUser( properties ):
  if 'all' in properties:
    return True
  if credentials.getSelectedGroup() != 'visitor' and 'authenticated' in properties:
    return True
  for userProp in credentials.getProperties():
    if userProp in properties:
      return True
  return False

def getAreaContents( area, section ):
  subContents = []
  for subSection in gWebConfig.getSchemaSections( section ):
    subSectionPath = "%s/%s" % ( section, subSection )
    subJSTxt = getAreaContents( area, subSectionPath )
    if len( subJSTxt ) > 0:
      subContents.append( "{ text: '%s', menu : %s }" % ( subSection, subJSTxt ) )
  for page in gWebConfig.getSchemaPages( section ):
    pageData = gWebConfig.getSchemaPageData( "%s/%s" % ( section, page ) )
    if len( pageData ) < 3 or checkPropertiesWithUser( pageData[2:] ):
      if pageData[0].find( "http" ) == 0:
        pagePath = pageData[0]
      else:
        pagePath = diracURL( "/%s/%s" % ( area, pageData[0] ) )
      subContents.append( "{ text : '%s', url : '%s', handler : %s }" % ( page, pagePath, mainPageHandler ) )
  return "[%s]" % ",".join( subContents )

def getSchemaAreas( areasList = False ):
  actualWebPath = currentPath()
  dirList = [ dir.strip() for dir in actualWebPath.split( "/" ) if not dir.strip() == "" ]
  jsTxt = ""
  if not areasList:
    areasList = gWebConfig.getSchemaSections( "" )
  for area in areasList:
    jsTxt += "{ text :'%s', menu : %s }," % ( area.capitalize(), getAreaContents( area, area ) )
  return "[%s]" % jsTxt

def getSetups():
  availableSetups = [ "{ text : '%s', url : '%s', handler : %s }" % ( setupName,
                                                      diracURL( controller='web/userdata',
                                                                action='changeSetup',
                                                                id=setupName ),
                                                      mainPageHandler ) for setupName in gWebConfig.getSetups() ]
  return "[%s]" % ",".join( availableSetups )

def pagePath():
  path = currentPath()
  schemaPath = gWebConfig.getSchemaPathFromURL( path )
  dirList = [ dir for dir in schemaPath.split( "/" ) if not dir.strip() == "" ]
  return "'%s'" % " > ".join( dirList )

def getUserData():
  userData = []
  username = credentials.getUsername()
  if not username or username == "anonymous":
    userData.append( "username : 'Anonymous'" )
  else:
    userData.append( "username : '%s'" % username )
    userData.append( "group : '%s'" % credentials.getSelectedGroup() )
    availableGroups = [ "{ text : '%s', url : '%s', handler : %s }" % ( groupName,
                                                                        diracURL( controller='web/userdata',
                                                                                  action='changeGroup',
                                                                                  id=groupName ),
                                                                        mainPageHandler ) for groupName in credentials.getAvailableGroups() ]
    userData.append( "groupMenu : [%s]" % ",".join( availableGroups ) )
  dn = credentials.getUserDN()
  if not dn:
    if 'REQUEST_URI' in request.environ:
      uri = str( request.environ[ 'REQUEST_URI' ] )
    else:
      uri = ""
    dn = "<a href=\"https://%s%s\">certificate login</a>" % ( str( request.environ[ 'HTTP_HOST' ] ), uri )
  userData.append( "DN : '%s'" % dn )
  return "{%s}" % ",".join( userData )

def getJSPageData():
  pageData = []
  pageData.append( "navMenu : %s" % getSchemaAreas() )
  pageData.append( "setupMenu : %s" % getSetups() )
  pageData.append( "selectedSetup : '%s'" % credentials.getSelectedSetup() )
  pageData.append( "pagePath : %s" % pagePath() )
  pageData.append( "userData : %s" % getUserData() )
  return "{%s}" % ",".join( pageData )

## DEFAULT REDIRECT
def defaultRedirect():
  return redirect_to( controller='info/general', action='diracOverview', id=None )

def diracURL( controller, action = None, id = None ):
  urlEnd = controller.find( "?" )
  if urlEnd >-1 :
    urlArgs = controller[ urlEnd : ]
    controller = controller[ : urlEnd ]
  else:
    urlArgs = ""
  return "%s%s" % ( helpers.url_for( controller = controller,
                                    action = action,
                                    id = id,
                                    dsetup = request.environ[ 'pylons.routes_dict' ][ 'dsetup' ],
                                    dgroup = request.environ[ 'pylons.routes_dict' ][ 'dgroup' ] ),
                    urlArgs )
  
