from DIRAC import gLogger
from DIRAC.ConfigurationSystem.Client.Config import gConfig
from DIRAC.Core.Utilities import List

class WebConfig:

  def __init__(self):
    self.webSection = "/Website"

  def getDebugDN( self ):
    return gConfig.getValue( "%s/DebugDN" % self.webSection, "" )

  def getWebSection( self ):
    return self.webSection

  def getShortcutsForGroup( self, group ):
    groupSection = "%s/Shortcuts/%s" % ( self.webSection, group )
    retVal = gConfig.getOptions( groupSection, listOrdered = True )
    if retVal[ 'OK' ]:
      names = retVal[ 'Value' ]
    else:
      names = []
    entries = []
    for entryName in names:
      actionPath = gConfig.getValue( "%s/%s" % ( groupSection, entryName ) )
      entries.append( ( entryName, actionPath ) )
    return entries

  def getDefaultSetup( self ):
    return gConfig.getValue( "%s/DefaultSetup" % self.webSection, "Production" )

  def getDefaultGroups( self ):
    return gConfig.getValue( "%s/DefaultGroups" % self.webSection, [] )

  def getSetups( self ):
    setupsList = gConfig.getSections( "/DIRAC/Setups" )
    if not setupsList[ 'OK' ]:
      return []
    return setupsList[ 'Value' ]

  def getSchemaSections( self, path = "" ):
    retDict = gConfig.getSections( "%s/Schema/%s" % ( self.webSection, path ), listOrdered = True )
    if retDict[ 'OK' ]:
      return retDict[ 'Value' ]
    else:
      return []

  def getSchemaPages( self, path ):
    retDict = gConfig.getOptions( "%s/Schema/%s" % ( self.webSection, path ), listOrdered = True )
    if retDict[ 'OK' ]:
      return retDict[ 'Value' ]
    else:
      return []

  def getSchemaPageData( self, path ):
    return gConfig.getValue( "%s/Schema/%s" % ( self.webSection, path ), [] )

  def __getSchemaPathFromController( self, controllerPath, parentSection = "" ):
    normControllerPath = "/".join( [ dir for dir in controllerPath.split("/") if not dir.strip() == "" ] )
    for page in self.getSchemaPages( parentSection ):
      pageData = self.getSchemaPageData( "%s/%s" % ( parentSection, page ) )
      if page != "Delimiter" and pageData[0] == normControllerPath:
        return ( "%s/%s" % ( parentSection, page ), pageData )
    for subSection in self.getSchemaSections( parentSection ):
      res = self.__getSchemaPathFromController( normControllerPath , "%s/%s" % ( parentSection, subSection ) )
      if res:
        return res
    return False

  def getPageTitle( self, controllerPath, section = "" ):
    res = self.__getSchemaPathFromController( controllerPath, section )
    if not res:
      return ""
    return res[1][1]
  
  def getSchemaPathFromURL( self, controllerPath, section = "" ):
    res = self.__getSchemaPathFromController( controllerPath, section )
    if not res:
      return ""
    return res[0]

  def getDocSection( self ):
    docList = gConfig.getOptionsDict( "%s/Documentation" % self.webSection )
    if not docList[ 'OK' ]:
      return "'none'"
    return docList[ 'Value' ]

  def getHelpSection(self):
    helpSection = gConfig.getOptionsDict( "%s/Help" % ( self.webSection) )
    if not helpSection[ 'OK' ]:
      return False
    return helpSection[ 'Value' ]

  def getLogo(self):
    url = gConfig.getValue( "%s/LogoURL" % self.webSection, "" )
    if not url:
      return "http://diracgrid.org/"
    return url

gWebConfig = WebConfig()
