import dirac.lib.sessionManager as sessionManager
import dirac.lib.yuiWidgets as yuiWidgets
from dirac.lib.webconfig import gWebConfig
import dirac.lib.helpers as helpers
from pylons import request

def currentPath():
  path = request.environ[ 'PATH_INFO' ]
  scriptName = request.environ[ 'SCRIPT_NAME' ]
  i = path.find( scriptName )
  if i == -1:
    return path
  else:
    return path[ :i ] + path[ i+len(scriptName): ]

def htmlShortcuts():
  htmlData = ""
  for entryTuple in gWebConfig.getShortcutsForGroup( sessionManager.getSelectedGroup() ):
    htmlData += " %s |" % helpers.link_to( entryTuple[0], url = helpers.url_for( entryTuple[1] ) )
  return htmlData[:-2]

def htmlUserInfo():
  username = sessionManager.getUsername()
  if not username or username == "anonymous":
    htmlData = "Anonymous"
  else:
    selectedGroup = sessionManager.getSelectedGroup()
    availableGroups = [ ( groupName, helpers.url_for( controller='web/userdata', action='changeGroup', id=groupName ) ) for groupName in sessionManager.getAvailableGroups() ]
    htmlData = "%s@%s" % ( username, yuiWidgets.dropDownMenu( "UserGroupPos", selectedGroup, availableGroups  ) )
  dn = sessionManager.getUserDN()
  if dn:
    htmlData += " (%s)" % dn
  else:
    htmlData += " (<a href='https://%s%s'>certificate login</a>)" % ( str( request.environ[ 'REMOTE_ADDR' ] ), str( request.environ[ 'REQUEST_URI' ] ) )
  return htmlData

def htmlSetups():
  selectedSetup = "<strong>%s</strong>" % sessionManager.getSelectedSetup()
  availableSetups = [ ( setupName, helpers.url_for( controller='web/userdata', action='changeSetup', id=setupName ) ) for setupName in gWebConfig.getSetups() ]
  return yuiWidgets.dropDownMenu( "UserSetupPos", selectedSetup, availableSetups )

def htmlPageTitle():
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
    if len( pageData ) < 3 or 'all' in pageData[2:] or sessionManager.getSelectedGroup() in pageData[2:]:
      pagePath = "/%s/%s" % ( area, pageData[0] )
      jsTxt += "{ text : '%s', url : '%s' }," % ( page.capitalize(), helpers.url_for( pagePath ) )
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
      htmlData += "<div class='selectedLabel'>"
    else:
      htmlData += "<div class='label'>"
    htmlData += "%s</div></td>\n" % area.capitalize()
  return htmlData

def htmlPath():
  path = currentPath()
  schemaPath = gWebConfig.getSchemaPathFromURL( path )
  dirList = [ dir.capitalize() for dir in schemaPath.split( "/" ) if not dir.strip() == "" ]
  return " > ".join( dirList )

