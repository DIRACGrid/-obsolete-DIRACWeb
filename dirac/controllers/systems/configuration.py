import logging

from dirac.lib.base import *
from pylons.controllers.util import redirect_to
from pylons.decorators  import jsonify
import dirac.lib.helpers as helpers
from dirac.lib.credentials import authorizeAction
from dirac.lib.diset import getRPCClient
import dirac.lib.sessionManager as sessionManager
from DIRAC.ConfigurationSystem.private.Modificator import Modificator
from DIRAC.ConfigurationSystem.private.CFG import CFG
from DIRAC.ConfigurationSystem.Client.Config import gConfig
import DIRAC.Core.Utilities.List as List
from DIRAC import S_OK, S_ERROR

log = logging.getLogger(__name__)

class ConfigurationController(BaseController):

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return 'Hello World'

  def showHistory( self ):
    if not authorizeAction():  
      return render( "/error.mako" )
    rpcClient = getRPCClient( "Configuration/Server" )
    print "GOT RPC CLIENT"
    c.data = rpcClient.getCommitHistory()
    return render( "/systems/configuration/history.mako" )

  def __getModificator( self ):
    rpcClient = getRPCClient( gConfig.getValue( "/DIRAC/Configuration/MasterServer", "Configuration/Server" ) )
    commiter = "%s@%s - %s" % ( sessionManager.getUsername(), sessionManager.getSelectedGroup(), sessionManager.getUserDN() )
    return Modificator( rpcClient, commiter )

  def __getRemoteConfiguration( self ):
    rpcClient = getRPCClient( gConfig.getValue( "/DIRAC/Configuration/MasterServer", "Configuration/Server" ) )
    modCfg = Modificator( rpcClient )
    retVal = modCfg.loadFromRemote()
    if retVal[ 'OK' ]:
      session[ 'cfgData' ] = str( modCfg )
      session[ 'csName' ] = modCfg.getValue( "/DIRAC/Configuration/Name" )
      session.save()
      c.cfgData = modCfg.cfgData
      c.csName = session[ 'csName' ] 
    return retVal

  def resetConfigurationToRemote( self ):
    retVal = self.__getRemoteConfiguration()
    if retVal[ 'OK' ]:
      return redirect_to( helpers.url_for( action='manageRemoteConfig' ) )
    else:
      c.error = "Can't reset configuration<br/>%s" % retVal[ 'Message' ]
      return render( "/error.mako" )

  def manageRemoteConfig( self ):
    if not 'cfgData' in session:
      log.info( "Loading configuration..." )
      retVal = self.__getRemoteConfiguration()
      if not retVal[ 'OK' ]:
        c.error = "Can't get configuration from server<br/>%s" % retVal[ 'Message' ]
        return render( "/error.mako" )
    else:
      log.info( "Recovering configuration" )
      c.cfgData = CFG()
      c.cfgData.loadFromBuffer( session[ 'cfgData' ] )
      c.csName = session[ 'csName' ]
    return render( "/systems/configuration/manageRemote.mako" )

  #AJAX CALLS
  @jsonify
  def expandSection( self ):
    cfgData = CFG()
    cfgData.loadFromBuffer( session[ 'cfgData' ] )
    sectionPath = str( request.params[ 'section' ] )
    log.info( "Expanding %s" % sectionPath )
    try:
      sectionCfg = cfgData
      for section in [ section for section in sectionPath.split( "/" ) if not section.strip() == "" ]:
        sectionCfg = sectionCfg[ section ]
    except Exception, v:
      log.error( "Section %s does not exist: %s" % ( sectionPath, str(v) ) ) 
      return S_ERROR( "Section %s does not exist: %s" % ( sectionPath, str(v) ) )
    log.info( "Section to expand %s" % sectionPath )
    retData = []
    for entryName in sectionCfg.listAll():
      if sectionCfg.isSection( entryName ):
        retData.append( ( entryName, sectionCfg.getComment( entryName ) ) )
      else:
        retData.append( ( entryName, sectionCfg[ entryName ], sectionCfg.getComment( entryName ) ) )
    return S_OK( retData )
    
  @jsonify
  def setOptionValue( self ):
    optionPath = request.params[ 'path' ]
    optionValue = request.params[ 'value' ]
    
    modCfg = self.__getModificator()
    modCfg.loadFromBuffer( session[ 'cfgData' ] )
    modCfg.setOptionValue( optionPath, optionValue )
    if modCfg.getValue( optionPath ) == optionValue:
      log.info( "Set option value %s = %s" % ( optionPath, optionValue ) )
      session[ 'cfgData' ] = str( modCfg ) 
      session.save()
      return S_OK()
    else:
      return S_ERROR( "Can't update %s" % optionPath )
      
  @jsonify
  def moveKeyInside( self ):
    originPath = request.params[ 'entry' ]
    destPath = request.params[ 'destination' ]   
    
    cfgData = CFG()
    cfgData.loadFromBuffer( session[ 'cfgData' ] ) 
    
    originDict = cfgData.getRecursive( originPath )
    if not originDict:
      return S_ERROR( "Moving entity does not exist" )
    originParentDict = cfgData.getRecursive( originPath, -1 )
    destDict = cfgData.getRecursive( destPath )
    if type( destDict ) == type ( "" ):
      return S_ERROR( "Destination is not a section" )
    if not destDict:
      return S_ERROR( "Destination does not exist" )
    try:
      originParentDict[ 'value' ].deleteKey( originDict[ 'key' ] )
      destDict[ 'value' ].addKey( **originDict )
    except Exception, e:
      return S_ERROR( "Can't move inside %s: %s" % ( destPath, str( e ) ) )
    session[ 'cfgData' ] = str( cfgData ) 
    session.save()
    return S_OK()
    
  @jsonify
  def moveKeyAfter( self ):
    originPath = str( request.params[ 'entry' ] )
    destPath = str( request.params[ 'destination' ] )
    
    cfgData = CFG()
    cfgData.loadFromBuffer( session[ 'cfgData' ] ) 
    
    originDict = cfgData.getRecursive( originPath )
    if not originDict:
      return S_ERROR( "Moving entity does not exist" )
    originParentDict = cfgData.getRecursive( originPath, -1 )
    destDict = cfgData.getRecursive( destPath )
    if not destDict:
      return S_ERROR( "Destination does not exist" )
    destParentDict = cfgData.getRecursive( destPath, -1 )
    
    try:
      originParentDict[ 'value' ].deleteKey( originDict[ 'key' ] )
      destParentDict[ 'value' ].addKey( beforeKey = destDict[ 'key' ], **originDict )
    except Exception, e:
      return S_ERROR( "Can't move after %s: %s" % ( destPath, str( e ) ) )
    session[ 'cfgData' ] = str( cfgData ) 
    session.save()
    return S_OK()
    
  @jsonify
  def createSection( self ):
    try:
      parentPath = str( request.params[ 'path' ] )
      parentPath = parentPath.strip()
      if len( parentPath ) == 0:
        return S_ERROR( "Parent path is not valid" )
      sectionName = str( request.params[ 'sectionName' ] )
      sectionName = sectionName.strip()
      if len( sectionName ) == 0:
        return S_ERROR( "Put any name for the section!" )
      modificator = self.__getModificator()
      modificator.loadFromBuffer( session[ 'cfgData' ] )
      sectionPath = "%s/%s" % ( parentPath, sectionName )
      log.info( "Creating section %s" % sectionPath )
      if modificator.createSection( sectionPath ):
        session[ 'cfgData' ] = str( modificator )
        session.save()
        return S_OK( ( sectionName, modificator.getComment( sectionPath ) ) )
      else:
        return S_ERROR( "Section can't be created. It already exists?" )
    except Exception, e:
      return S_ERROR( "Can't create section: %s" % str( e ) )
    
  @jsonify
  def createOption( self ):
    try:
      parentPath = str( request.params[ 'path' ] )
      parentPath = parentPath.strip()
      if len( parentPath ) == 0:
        return S_ERROR( "Parent path is not valid" )
      optionName = str( request.params[ 'optionName' ] )
      optionName = optionName.strip()
      if len( optionName ) == 0:
        return S_ERROR( "Put any name for the option!" )
      if "/" in optionName:
        return S_ERROR( "Options can't have a / in the name" )
      optionValue = str( request.params[ 'optionValue' ] )
      optionValue = optionValue.strip()
      if len( optionValue ) == 0:
        return S_ERROR( "Options should have values!" )
      modificator = self.__getModificator()
      modificator.loadFromBuffer( session[ 'cfgData' ] )
      optionPath = "%s/%s" % ( parentPath, optionName )
      log.info( "Creating option %s" % optionPath )
      if not modificator.existsOption( optionPath ):
        modificator.setOptionValue( optionPath, optionValue )
        session[ 'cfgData' ] = str( modificator )
        session.save()
        return S_OK( ( optionName, modificator.getValue( optionPath ), modificator.getComment( optionPath ) ) )
      else:
        return S_ERROR( "Option can't be created. It already exists?" )
    except Exception, e:
      return S_ERROR( "Can't create option: %s" % str( e ) )
      
  @jsonify
  def renameKey( self ):
    try:
      keyPath = str( request.params[ 'path' ] )
      keyPath = keyPath.strip()
      if len( keyPath ) == 0:
        return S_ERROR( "Entity path is not valid" )
      newName = str( request.params[ 'newName' ] )
      newName = newName.strip()
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
        return S_ERROR( "Entity doesn't exist" )
    except Exception, e:
      return S_ERROR( "Can't rename entity: %s" % str( e ) )
      
  @jsonify
  def deleteKey( self ):
    try:
      keyPath = str( request.params[ 'path' ] )
      keyPath = keyPath.strip()
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
  def copyKey( self ):
    try:
      originalPath = str( request.params[ 'path' ] )
      originalPath = originalPath.strip()
      if len( originalPath ) == 0:
        return S_ERROR( "Parent path is not valid" )
      newName = str( request.params[ 'newName' ] )
      newName = newName.strip()
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
        return S_ERROR( "Section can't be created. It already exists?" )
    except Exception, e:
      raise  
      return S_ERROR( "Can't create section: %s" % str( e ) )