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

  def getSchemaSections( self, path ):
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

  def getPageTitle( self, controllerPath, section = "" ):
    normControllerPath = "/".join( [ dir for dir in controllerPath.split("/") if not dir.strip() == "" ][1:] )
    for page in self.getSchemaPages( section ):
      pageData = self.getSchemaPageData( "%s/%s" % ( section, page ) )
      if pageData[0] == normControllerPath:
        return pageData[1]
    for subSection in self.getSchemaSections( section ):
      foundPage = self.getPageTitle( controllerPath, "%s/%s" % ( section, subSection ) )
      if foundPage != "":
        return foundPage
    return ""

  def getSchemaPathFromURL( self, controllerPath, section = "" ):
    normControllerPath = "/".join( [ dir for dir in controllerPath.split("/") if not dir.strip() == "" ][1:] )
    for page in self.getSchemaPages( section ):
      pageData = self.getSchemaPageData( "%s/%s" % ( section, page ) )
      if pageData[0] == normControllerPath:
        return page
    for subSection in self.getSchemaSections( section ):
      foundPage = self.getSchemaPathFromURL( controllerPath, "%s/%s" % ( section, subSection ) )
      if foundPage != "":
        return "%s/%s" % ( subSection, foundPage )
    return ""

gWebConfig = WebConfig()
