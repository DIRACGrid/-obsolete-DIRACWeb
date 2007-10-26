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

  maxFileSize = 1024*1024*10 #10MB

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return 'Hello World'

  def showHistory( self ):
    if not authorizeAction():  
      return render( "/error.mako" )
    rpcClient = getRPCClient( "Configuration/Server" )
    retVal = rpcClient.getCommitHistory()
    if retVal[ 'OK' ]:
      c.changes = retVal[ 'Value' ]
      return render( "/systems/configuration/history.mako" )
    else:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )

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
    if not 'cfgData' in session or not 'csName' in session:
      if 'csFilename'  in session:
        del( session[ 'csFilename' ] )
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

  def uploadUserConfig( self ):
    return render( "/systems/configuration/uploadUserConfig.mako" )
  
  def doUploadConfig( self ):
    file = request.POST[ 'cfgFile' ]
    if len( file.value ) > self.maxFileSize:
      c.error = "File size %s is too big" % len( file.value )
      return render( "/error.mako" )
    if 'csName' in session:
      del( session[ 'csName' ] )
    session[ 'csFilename' ] = file.filename
    session[ 'cfgData' ] = file.value 
    session.save()
    return redirect_to( helpers.url_for( action='manageUserConfig' ) )

  def manageUserConfig( self ):
    if not 'csFilename' in session:
      return redirect_to( helpers.url_for( action='uploadUserConfig' ) )
    c.csName = session[ 'csFilename' ]
    return render( "/systems/configuration/manageUser.mako" )

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

  def showDiff( self ):
    if not authorizeAction():
      return S_ERROR( "You are not authorized to commit configurations!! Bad boy!" )
    modifier = self.__getModificator()
    modifier.loadFromBuffer( session[ 'cfgData' ] )
    remoteData = modifier.getRemoteData()
    diffGen = modifier.showDiff( remoteData )    
    c.diffList = self.__generateHTMLDiff( diffGen )
    return render( "/systems/configuration/diff.mako" )

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
    
  #AJAX CALLS
  @jsonify
  def commitConfiguration( self ):
    if not authorizeAction():
      return S_ERROR( "You are not authorized to commit configurations!! Bad boy!" )
    modifier = self.__getModificator()
    modifier.loadFromBuffer( session[ 'cfgData' ] )
    return modifier.commit()


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
  def setComment( self ):
    keyPath = request.params[ 'path' ]
    commentValue = request.params[ 'value' ]
    
    modCfg = self.__getModificator()
    modCfg.loadFromBuffer( session[ 'cfgData' ] )
    modCfg.setComment( keyPath, commentValue )
    log.info( "Set comment %s = %s" % ( keyPath, commentValue ) )
    session[ 'cfgData' ] = str( modCfg ) 
    session.save()
    return S_OK( modCfg.getComment( keyPath ) )    

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
