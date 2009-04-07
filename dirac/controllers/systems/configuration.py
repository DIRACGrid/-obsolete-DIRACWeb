# $Header: /tmp/libdirac/tmp.stZoy15380/dirac/DIRAC3/DIRAC/Interfaces/Web/dirac/controllers/systems/configuration.py,v 1.19 2009/04/07 14:27:25 acasajus Exp $
__RCSID__ = "$Id: configuration.py,v 1.19 2009/04/07 14:27:25 acasajus Exp $"

import types
import logging
import simplejson

from dirac.lib.base import *
from pylons.controllers.util import redirect_to
from pylons.decorators  import jsonify
import dirac.lib.helpers as helpers
from dirac.lib.credentials import authorizeAction
from dirac.lib.diset import getRPCClient
import dirac.lib.credentials as credentials
from DIRAC.ConfigurationSystem.private.Modificator import Modificator
from DIRAC.ConfigurationSystem.Client.CFG import CFG
from DIRAC.ConfigurationSystem.Client.Config import gConfig
import DIRAC.Core.Utilities.List as List
from DIRAC import S_OK, S_ERROR
from DIRAC import gLogger

log = logging.getLogger(__name__)

class ConfigurationController(BaseController):

  maxFileSize = 1024*1024*10 #10MB

  def index(self):
    return redirect_to( 'configuration/manageRemoteConfig' )

  def __getModificator( self ):
    rpcClient = getRPCClient( gConfig.getValue( "/DIRAC/Configuration/MasterServer", "Configuration/Server" ) )
    commiter = "%s@%s - %s" % ( credentials.getUsername(), credentials.getSelectedGroup(), credentials.getUserDN() )
    return Modificator( rpcClient, commiter )

  def __getRemoteConfiguration( self ):
    rpcClient = getRPCClient( gConfig.getValue( "/DIRAC/Configuration/MasterServer", "Configuration/Server" ) )
    modCfg = Modificator( rpcClient )
    retVal = modCfg.loadFromRemote()
    if retVal[ 'OK' ]:
      session[ 'cfgData' ] = str( modCfg )
      session[ 'csName' ] = "LHCb Configuration"
      session.save()
      c.cfgData = modCfg.cfgData
      c.csName = session[ 'csName' ]
    return retVal

  def resetConfigurationToRemote( self ):
    retVal = self.__getRemoteConfiguration()
    if retVal[ 'OK' ]:
      return redirect_to( 'manageRemoteConfig' )
    else:
      c.error = "Can't reset configuration<br/>%s" % retVal[ 'Message' ]
      return render( "/error.mako" )

  def __loadRemoteConfig(self):
    if not 'cfgData' in session or not 'csName' in session:
      if 'csFilename'  in session:
        del( session[ 'csFilename' ] )
      gLogger.info( "Loading configuration from server..." )
      retVal = self.__getRemoteConfiguration()
      if not retVal[ 'OK' ]:
        c.error = "Can't get configuration from server<br/>%s" % retVal[ 'Message' ]
        return S_ERROR()
    else:
      try:
        gLogger.info( "Recovering configuration" )
        c.cfgData = CFG()
        c.cfgData.loadFromBuffer( session[ 'cfgData' ] )
        c.csName = session[ 'csName' ]
      except Exception, e:
        c.error = "There was an error with your modifications. %s" % str(e)
        c.link = ( 'resetConfigurationToRemote', "Click here to reset your configuration" )
        gLogger.error( "There was an error with modified configuration %s" % str( e ) )
        S_ERROR()
    return S_OK()

  def manageRemoteConfig( self ):
    result = self.__loadRemoteConfig()
    if not result['OK']:
      return render( "/error.mako" )
    return render( "/systems/configuration/editGlobalConfig.mako" )

  def browseRemoteConfig( self ):
    result = self.__loadRemoteConfig()
    if not result['OK']:
      return render( "/error.mako" )
    return render( "/systems/configuration/browseGlobalConfig.mako" )

  def showTextConfiguration( self ):
    response.headers['Content-type'] = 'text/plain'
    if 'download' in request.params and request.params[ 'download' ] in ( 'yes', 'true', '1' ):
      version = ""
      try:
        cfg = CFG()
        cfg.loadFromBuffer( session[ 'cfgData' ] )
        cfg = cfg[ 'DIRAC' ][ 'Configuration' ]
        version = ".%s.%s" % ( cfg[ 'Name' ], cfg[ 'Version' ].replace( ":", "" ).replace( "-", "" ) )
      except Exception, e:
        print e
      print 'attachment; filename="cs%s.cfg"' % version.replace( " ", "_" )
      response.headers['Content-Disposition'] = 'attachment; filename="cs%s.cfg"' % version.replace( " ", "" )
      response.headers['Content-Length'] = len( session[ 'cfgData' ] )
      response.headers['Content-Transfer-Encoding'] = 'Binary'
    return session[ 'cfgData' ]

  def __generateHTMLDiff( self, diffGen ):
    diffList = []
    oldChange = False
    for diffLine in diffGen:
      if diffLine[0] == "-":
        diffList.append( ( "del", diffLine[1:], "" ) )
      elif diffLine[0] == "+":
        if oldChange:
          diffList[-1] = ( "mod", diffList[-1][1], diffLine[1:] )
          oldChange = False
        else:
          diffList.append( ( "add", "", diffLine[1:] ) )
      elif diffLine[0] == "?":
        if diffList[-1][0] == 'del':
          oldChange = True
        elif diffList[-1][0] == "mod":
          diffList[-1] = ( "conflict", diffList[-1][1], diffList[-1][2] )
        elif diffList[-1][0] == "add":
          diffList[-2] = ( "mod", diffList[-2][1], diffList[-1][2] )
          del( diffList[-1] )
      else:
        diffList.append( ( "", diffLine[1:], diffLine[1:] ) )
    return diffList

  def showDiff( self ):
    if not authorizeAction():
      return S_ERROR( "You are not authorized to get diff's!! Bad boy!" )
    try:
      fromDate = str( request.params[ 'fromVersion' ] )
      toDate = str( request.params[ 'toVersion' ] )
    except Exception, e:
      c.error = "Can't decode params: %s" % e
      return render( "/error.mako" )
    modifier = self.__getModificator()
    diffGen = modifier.getVersionDiff( fromDate, toDate )
    c.titles = ( "From version %s" % fromDate, "To version %s" % toDate )
    c.diffList = self.__generateHTMLDiff( diffGen )
    return render( "/systems/configuration/diff.mako" )

  def showCurrentDiff( self ):
    if not authorizeAction():
      return S_ERROR( "You are not authorized to get diff's!! Bad boy!" )
    modifier = self.__getModificator()
    modifier.loadFromBuffer( session[ 'cfgData' ] )
    diffGen = modifier.showCurrentDiff()
    c.titles = ( "Server's version", "User's current version" )
    c.diffList = self.__generateHTMLDiff( diffGen )
    return render( "/systems/configuration/diff.mako" )

  def __htmlComment( self, rawComment ):
    commentLines = []
    commiter = ""
    rawLines = rawComment.strip().split( "\n" )
    if rawLines[-1].find( "@@-" ) == 0:
      commiter = rawLines[-1][3:]
      rawLines.pop(-1)
    for line in rawLines:
      line = line.strip()
      if not line:
        continue
      commentLines.append( line )
    if commentLines or commiter:
      return "%s<hr/><small><strong>%s</strong></small>" % ( "<br/>".join( commentLines ), commiter )
    else:
      return False

  def showHistory( self ):
    if not authorizeAction():
      return render( "/error.mako" )
    rpcClient = getRPCClient( gConfig.getValue( "/DIRAC/Configuration/MasterServer", "Configuration/Server" ) )
    retVal = rpcClient.getCommitHistory()
    if retVal[ 'OK' ]:
      cDict = { 'numVersions' : 0, 'versions' : [] }
      for entry in retVal[ 'Value' ]:
        cDict[ 'numVersions' ] += 1
        cDict[ 'versions' ].append( { 'version' : entry[1], 'commiter' : entry[0] } )
      c.versions = simplejson.dumps( cDict )
      return render( "/systems/configuration/showHistory.mako" )
    else:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )

  def uploadUserConfig( self ):
    return render( "/systems/configuration/uploadUserConfig.mako" )

  def doUploadConfig( self ):
    if not 'cfgFile' in request.POST:
      c.error = "Oops! Missing file!"
      return render( "/error.mako" )
    file = request.POST[ 'cfgFile' ]
    if len( file.value ) > self.maxFileSize:
      c.error = "File size %s is too big" % len( file.value )
      return render( "/error.mako" )
    if 'csName' in session:
      del( session[ 'csName' ] )
    session[ 'csFilename' ] = file.filename
    session[ 'cfgData' ] = file.value
    session.save()
    return redirect_to( 'manageUserConfig' )

  def manageUserConfig( self ):
    if not 'csFilename' in session:
      return redirect_to( 'uploadUserConfig' )
    c.csName = session[ 'csFilename' ]
    return render( "/systems/configuration/editUserConfig.mako" )

  def rollbackToVersion( self ):
    if not authorizeAction():
      return S_ERROR( "You are not authorized to get diff's!! Bad boy!" )
    try:
      rollbackVersion = str( request.params[ 'rollbackVersion' ] )
    except Exception, e:
      c.error = "Can't decode params: %s" % e
      return render( "/error.mako" )
    modifier = self.__getModificator()
    retVal = modifier.rollbackToVersion( rollbackVersion )
    if retVal[ 'OK' ]:
      redirect_to( 'showHistory' )
    else:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )

  @jsonify
  def commitConfiguration( self ):
    if not authorizeAction():
      return S_ERROR( "You are not authorized to commit configurations!! Bad boy!" )
    gLogger.always( "User %s is commiting a new configuration version" % credentials.getUserDN() )
    modifier = self.__getModificator()
    modifier.loadFromBuffer( session[ 'cfgData' ] )
    retDict = modifier.commit()
    if not retDict[ 'OK' ]:
      return S_ERROR( retDict[ 'Message' ] )
    return S_OK()

  @jsonify
  def expandSection( self ):
    cfgData = CFG()
    cfgData.loadFromBuffer( session[ 'cfgData' ] )
    parentNodeId = str( request.params[ 'node' ] )
    sectionPath = str( request.params[ 'nodePath' ] )
    gLogger.info( "Expanding section", "%s" % sectionPath )
    try:
      sectionCfg = cfgData
      for section in [ section for section in sectionPath.split( "/" ) if not section.strip() == "" ]:
        sectionCfg = sectionCfg[ section ]
    except Exception, v:
      gLogger.error( "Section does not exist", "%s -> %s" % ( sectionPath, str(v) ) )
      return S_ERROR( "Section %s does not exist: %s" % ( sectionPath, str(v) ) )
    gLogger.verbose( "Section to expand %s" % sectionPath )
    retData = []
    for entryName in sectionCfg.listAll():
      id = "%s/%s" % ( parentNodeId, entryName )
      comment = sectionCfg.getComment( entryName )
      nodeDef = { 'text' : entryName, 'csName' : entryName, 'csComment' : comment }
      if not sectionCfg.isSection( entryName ):
         nodeDef[ 'leaf' ] = True
         nodeDef[ 'csValue' ] = sectionCfg[ entryName ]
      #Comment magic
      htmlC = self.__htmlComment( comment )
      if htmlC:
        qtipDict = { 'text' : htmlC }
        nodeDef[ 'qtipCfg' ] = qtipDict
      retData.append( nodeDef )
    return retData

  @jsonify
  def setOptionValue( self ):
    try:
      optionPath = str( request.params[ 'path' ] )
      optionValue = str( request.params[ 'value' ] )
    except Exception, e:
      return S_ERROR( "Can't decode path or value: %s" % str(e) )
    modCfg = self.__getModificator()
    modCfg.loadFromBuffer( session[ 'cfgData' ] )
    modCfg.setOptionValue( optionPath, optionValue )
    if modCfg.getValue( optionPath ) == optionValue:
      gLogger.info( "Set option value", "%s = %s" % ( optionPath, optionValue ) )
      session[ 'cfgData' ] = str( modCfg )
      session.save()
      return S_OK()
    else:
      return S_ERROR( "Can't update %s" % optionPath )

  @jsonify
  def setComment( self ):
    try:
      path = str( request.params[ 'path' ] )
      value = str( request.params[ 'value' ] )
    except Exception, e:
      return S_ERROR( "Can't decode path or value: %s" % str(e) )

    modCfg = self.__getModificator()
    modCfg.loadFromBuffer( session[ 'cfgData' ] )
    modCfg.setComment( path, value )
    gLogger.info( "Set comment", "%s = %s" % ( path, value ) )
    session[ 'cfgData' ] = str( modCfg )
    session.save()
    return S_OK( modCfg.getComment( path ) )

  @jsonify
  def moveNode( self ):
    try:
      nodePath = request.params[ 'nodePath' ]
      destinationParentPath = request.params[ 'parentPath' ]
      beforeOfIndex = int( request.params[ 'beforeOfIndex' ] )
    except Exception, e:
      return S_ERROR( "Can't decode parameter: %s" % str(e) )

    gLogger.info( "Moving %s under %s before pos %s" % ( nodePath, destinationParentPath, beforeOfIndex ) )
    cfgData = CFG()
    cfgData.loadFromBuffer( session[ 'cfgData' ] )
    nodeDict = cfgData.getRecursive( nodePath )
    if not nodeDict:
      return S_ERROR( "Moving entity does not exist" )
    oldParentDict = cfgData.getRecursive( nodePath, -1 )
    newParentDict = cfgData.getRecursive( destinationParentPath )
    if type( newParentDict ) == types.StringType:
      return S_ERROR( "Destination is not a section" )
    if not newParentDict:
      return S_ERROR( "Destination does not exist" )
    if not newParentDict == oldParentDict and newParentDict['value'].existsKey( nodeDict['key'] ):
      return S_ERROR( "Another entry with the same name already exists" )

    try:
      brothers = newParentDict[ 'value' ].listAll()
      if beforeOfIndex < len( brothers ):
        nodeDict[ 'beforeKey' ] = brothers[ beforeOfIndex ]
        print "beforekey", nodeDict[ 'beforeKey' ]
      else:
        print "last pos"
      oldParentDict[ 'value' ].deleteKey( nodeDict[ 'key' ] )
      newParentDict[ 'value' ].addKey( **nodeDict )
    except Exception, e:
      return S_ERROR( "Can't move node: %s" % str( e ))

    session[ 'cfgData' ] = str( cfgData )
    session.save()
    return S_OK()

  @jsonify
  def copyKey( self ):
    try:
      originalPath = str( request.params[ 'path' ] ).strip()
      newName = str( request.params[ 'newName' ] ).strip()
    except Exception, e:
      return S_ERROR( "Can't decode parameter: %s" % str(e) )
    try:
      if len( originalPath ) == 0:
        return S_ERROR( "Parent path is not valid" )
      if len( newName ) == 0:
        return S_ERROR( "Put any name for the new key!" )
      modificator = self.__getModificator()
      modificator.loadFromBuffer( session[ 'cfgData' ] )
      if modificator.copyKey( originalPath, newName ):
        session[ 'cfgData' ] = str( modificator )
        session.save()
        pathList = List.fromChar( originalPath, "/" )
        newPath = "/%s/%s" % ( "/".join( pathList[:-1] ), newName )
        if modificator.existsSection( newPath ):
          return S_OK( ( newName, modificator.getComment( newPath ) ) )
        else:
          return S_OK( ( newName, modificator.getValue( newPath ), modificator.getComment( newPath ) ) )
      else:
        return S_ERROR( "Path can't be created. Exists already?" )
    except Exception, e:
      raise
      return S_ERROR( "Can't create path: %s" % str( e ) )

  @jsonify
  def renameKey( self ):
    try:
      keyPath = str( request.params[ 'path' ] ).strip()
      newName = str( request.params[ 'newName' ] ).strip()
    except Exception, e:
      return S_ERROR( "Can't decode parameter: %s" % str(e) )
    try:
      if len( keyPath ) == 0:
        return S_ERROR( "Entity path is not valid" )
      if len( newName ) == 0:
        return S_ERROR( "Put any name for the entity!" )
      modificator = self.__getModificator()
      modificator.loadFromBuffer( session[ 'cfgData' ] )
      if modificator.existsOption( keyPath ) or modificator.existsSection( keyPath ) :
        if modificator.renameKey( keyPath, newName ):
          session[ 'cfgData' ] = str( modificator )
          session.save()
          return S_OK()
        else:
          return S_ERROR( "There was a problem while renaming" )
      else:
        return S_ERROR( "Path doesn't exist" )
    except Exception, e:
      return S_ERROR( "Can't rename entity: %s" % str( e ) )

  @jsonify
  def deleteKey( self ):
    try:
      keyPath = str( request.params[ 'path' ] ).strip()
    except Exception, e:
      return S_ERROR( "Can't decode parameter: %s" % str(e) )
    try:
      if len( keyPath ) == 0:
        return S_ERROR( "Entity path is not valid" )
      modificator = self.__getModificator()
      modificator.loadFromBuffer( session[ 'cfgData' ] )
      if modificator.removeOption( keyPath ) or modificator.removeSection( keyPath ):
        session[ 'cfgData' ] = str( modificator )
        session.save()
        return S_OK()
      else:
        return S_ERROR( "Entity doesn't exist" )
    except Exception, e:
      return S_ERROR( "Can't rename entity: %s" % str( e ) )

  @jsonify
  def createSection( self ):
    try:
      parentPath = str( request.params[ 'path' ] ).strip()
      sectionName = str( request.params[ 'name' ] ).strip()
    except Exception, e:
      return S_ERROR( "Can't decode parameter: %s" % str(e) )
    try:
      if len( parentPath ) == 0:
        return S_ERROR( "Parent path is not valid" )
      if len( sectionName ) == 0:
        return S_ERROR( "Put any name for the section!" )
      modificator = self.__getModificator()
      modificator.loadFromBuffer( session[ 'cfgData' ] )
      sectionPath = "%s/%s" % ( parentPath, sectionName )
      gLogger.info( "Creating section", "%s" % sectionPath )
      if modificator.createSection( sectionPath ):
        session[ 'cfgData' ] = str( modificator )
        session.save()
        nD = { 'text' : sectionName, 'csName' : sectionName, 'csComment' : modificator.getComment( sectionPath ) }
        htmlC = self.__htmlComment( nD[ 'csComment' ] )
        if htmlC:
          qtipDict = { 'text' : htmlC }
          nD[ 'qtipCfg' ] = qtipDict
        return S_OK( nD )
      else:
        return S_ERROR( "Section can't be created. It already exists?" )
    except Exception, e:
      return S_ERROR( "Can't create section: %s" % str( e ) )

  @jsonify
  def createOption( self ):
    try:
      parentPath = str( request.params[ 'path' ] ).strip()
      optionName = str( request.params[ 'name' ] ).strip()
      optionValue = str( request.params[ 'value' ] ).strip()
    except Exception, e:
      return S_ERROR( "Can't decode parameter: %s" % str(e) )
    try:
      if len( parentPath ) == 0:
        return S_ERROR( "Parent path is not valid" )
      if len( optionName ) == 0:
        return S_ERROR( "Put any name for the option!" )
      if "/" in optionName:
        return S_ERROR( "Options can't have a / in the name" )
      if len( optionValue ) == 0:
        return S_ERROR( "Options should have values!" )
      modificator = self.__getModificator()
      modificator.loadFromBuffer( session[ 'cfgData' ] )
      optionPath = "%s/%s" % ( parentPath, optionName )
      gLogger.info( "Creating option", "%s = %s" % ( optionPath, optionValue ) )
      if not modificator.existsOption( optionPath ):
        modificator.setOptionValue( optionPath, optionValue )
        session[ 'cfgData' ] = str( modificator )
        session.save()
        return S_OK( ( optionName, modificator.getValue( optionPath ), modificator.getComment( optionPath ) ) )
      else:
        return S_ERROR( "Option can't be created. It already exists?" )
    except Exception, e:
      return S_ERROR( "Can't create option: %s" % str( e ) )