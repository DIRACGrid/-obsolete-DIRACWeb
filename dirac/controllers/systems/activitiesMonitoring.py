import logging

import simplejson
import time
import tempfile
from dirac.lib.base import *
from pylons.controllers.util import redirect_to
from DIRAC import gLogger, S_OK, S_ERROR
from DIRAC.Core.Utilities import List, Time, DEncode
from dirac.lib.credentials import authorizeAction
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.webBase import defaultRedirect

log = logging.getLogger( __name__ )

class ActivitiesmonitoringController( BaseController ):

  def index( self ):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return defaultRedirect()

  def systemPlots( self ):
    """
    Return template for showing a system plots
    """
    if not 'componentName' in request.params:
      c.error = "Missing component name"
      return render( "/error.mako" )
    c.componentName = request.params[ 'componentName' ]
    return render( "/systems/activitiesMonitoring/componentPlots.mako" )

  def plotStaticViews( self ):
    rpcClient = getRPCClient( "Framework/Monitoring" )
    retVal = rpcClient.getViews( True )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )
    c.viewsList = simplejson.dumps( retVal[ 'Value' ] )
    return render( "/systems/activitiesMonitoring/plotViews.mako" )

  def createViews( self ):
    return render( "/systems/activitiesMonitoring/createViews.mako" )

  def manageViews( self ):
    return render( "/systems/activitiesMonitoring/manageViews.mako" )

  def manageActivities( self ):
    return render( "/systems/activitiesMonitoring/manageActivities.mako" )

  def variablesHelp( self ):
    return """
  <html>
 <head><title>Variables for substitution</title></head>
 <body>
  <table summary="">
   <tr>
    <th>Variable name</th><th>Description</th>
   </tr>
   <tr><td>$DESCRIPTION</td><td>Description of the activity</td></tr>
   <tr><td>$SITE</td><td>Site for the originating component</td></tr>
   <tr><td>$COMPONENTTYPE</td><td>Type of component to generate the activity (for example: service, agent, web)</td></tr>
   <tr><td>$COMPONENTNAME</td><td>Full name of component</td></tr>
   <tr><td>$COMPONENTLOCATION</td><td>Location of component</td></tr>
   <tr><td>$UNIT</td><td>Activity unit</td></tr>
   <tr><td>$CATEGORY</td><td>Activity category</td></tr>
  </table>
 </body>
</html>
  """

  def __dateToSecs( self, timeVar ):
    dt = Time.fromString( timeVar )
    return int( Time.toEpoch( dt ) )

  def __translateToExpectedExtResult( self, retVal ):
    if retVal[ 'OK' ]:
      return { 'success' : True, 'data' : retVal[ 'Value' ] }
    else:
      return { 'success' : False, 'errors' : retVal[ 'Message' ] }

  def getPlotImg( self ):
    """
    Get plot image
    """
    if 'file' not in request.params:
      c.error( "Maybe you forgot the file?" )
      return render( "/error.mako" )
    plotImageFile = request.params[ 'file' ]
    if plotImageFile.find( ".png" ) < -1:
      c.error( "Not a valid image!" )
      return render( "/error.mako" )
    transferClient = getTransferClient( "Framework/Monitoring" )
    tempFile = tempfile.TemporaryFile()
    retVal = transferClient.receiveFile( tempFile, plotImageFile )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )
    tempFile.seek( 0 )
    data = tempFile.read()
    response.headers['Content-type'] = 'image/png'
    #response.headers['Content-Disposition'] = 'attachment; filename="%s"' % plotImageFile
    response.headers['Content-Length'] = len( data )
    response.headers['Content-Transfer-Encoding'] = 'Binary'
    print len( data )
    return data

  @jsonify
  def plotView( self ):
    """
    Plot a saved view
    """
    plotRequest = {}
    try:
      webRequest = simplejson.loads( request.params[ 'plotRequest' ] )
      if 'id' not in webRequest:
        return S_ERROR( "Missing viewID in plot request" )
      plotRequest[ 'id' ] = webRequest[ 'id' ]
      if 'size' not in webRequest:
        return S_ERROR( "Missing plotsize in plot request" )
      plotRequest[ 'size' ] = webRequest[ 'size' ]
      if 'time' not in webRequest:
        return S_ERROR( "Missing time span in plot request" )
      timeReq = webRequest[ 'time' ]
      if timeReq[ 'timespan' ] < 0:
        toSecs = self.__dateToSecs( str( timeReq[ 'toDate' ] ) )
        fromSecs = self.__dateToSecs( str( timeReq[ 'fromDate' ] ) )
      else:
        toSecs = int( Time.toEpoch() )
        fromSecs = toSecs - timeReq[ 'timespan' ]
      plotRequest[ 'fromSecs' ] = fromSecs
      plotRequest[ 'toSecs' ] = toSecs
      if 'varData' in webRequest:
        plotRequest[ 'varData' ] = webRequest[ 'varData' ]
    except Exception, e:
      return self.__translateToExpectedExtResult( S_ERROR( "Error while processing plot parameters: %s" % str( e ) ) )
    rpcClient = getRPCClient( "Framework/Monitoring" )
    return self.__translateToExpectedExtResult( rpcClient.plotView( plotRequest ) )

  @jsonify
  def getViewsList( self ):
    try:
      start = int( request.params[ 'start' ] )
    except:
      start = 0
    try:
      limit = int( request.params[ 'limit' ] )
    except:
      limit = 0

    try:
      sortField = str( request.params[ 'sortField' ] )
      sortDir = str( request.params[ 'sortDirection' ] )
      sort = [ ( sortField, sortDir ) ]
    except:
      sort = []
    rpcClient = getRPCClient( "Framework/Monitoring" )
    retVal = rpcClient.getViews( False )
    if not retVal[ 'OK' ]:
      return retVal
    svcData = retVal[ 'Value' ]
    data = { 'numViews' : len( svcData ), 'views' : [] }
    for record in svcData[ start : start + limit ]:
      data[ 'views' ].append( { 'id': record[0],
                                'name' : record[1],
                                'variableData' : record[2], } )
    return data

  @jsonify
  def deleteViews( self ):
    try:
      webIds = simplejson.loads( str( request.params[ 'idList' ] ) )
    except Exception, e:
      return S_ERROR( "No valid id's specified" )
    idList = []
    for webId in webIds:
      try:
        idList.append( int( webId ) )
      except Exception, e:
        return S_ERROR( "Error while processing arguments: %s" % str( e ) )
    rpcClient = getRPCClient( "Framework/Monitoring" )
    print idList
    retVal = rpcClient.deleteViews( idList )
    if 'rpcStub' in retVal:
      del( retVal[ 'rpcStub' ] )
    return retVal

  @jsonify
  def getActivitiesList( self ):
    try:
      start = int( request.params[ 'start' ] )
    except:
      start = 0
    try:
      limit = int( request.params[ 'limit' ] )
    except:
      limit = 0

    try:
      sortField = str( request.params[ 'sortField' ] ).replace( "_", "." )
      sortDir = str( request.params[ 'sortDirection' ] )
      sort = [ ( sortField, sortDir ) ]
    except:
      sort = []
    rpcClient = getRPCClient( "Framework/Monitoring" )
    retVal = rpcClient.getActivitiesContents( {}, sort, start, limit )
    if not retVal[ 'OK' ]:
      return retVal
    svcData = retVal[ 'Value' ]
    data = { 'numActivities' : svcData[ 'TotalRecords' ], 'activities' : [] }
    now = Time.toEpoch()
    for record in svcData[ 'Records' ]:
      formatted = {}
      for i in range( len( svcData[ 'Fields' ] ) ):
        formatted[ svcData[ 'Fields' ][i].replace( ".", "_" ) ] = record[i]
      if 'activities_lastUpdate' in formatted:
        formatted[ 'activities_lastUpdate' ] = now - int( formatted[ 'activities_lastUpdate' ] )
      data[ 'activities' ].append( formatted )
    return data

  @jsonify
  def deleteActivities( self ):
    try:
      webIds = simplejson.loads( str( request.params[ 'idList' ] ) )
    except Exception, e:
      return S_ERROR( "No valid id's specified" )
    print webIds, "<-"
    idList = []
    for webId in webIds:
      try:
        idList.append( [ int( field ) for field in webId.split( "." ) ] )
      except Exception, e:
        return S_ERROR( "Error while processing arguments: %s" % str( e ) )
    rpcClient = getRPCClient( "Framework/Monitoring" )
    print idList
    retVal = rpcClient.deleteActivities( idList )
    if 'rpcStub' in retVal:
      del( retVal[ 'rpcStub' ] )
    return retVal

  @jsonify
  def queryFieldValue( self ):
    """
    Query a value for a field
    """
    fieldQuery = str( request.params[ 'queryField' ] )
    definedFields = simplejson.loads( request.params[ 'selectedFields' ] )
    rpcClient = getRPCClient( "Framework/Monitoring" )
    result = rpcClient.queryField( fieldQuery, definedFields )
    if 'rpcStub' in result:
      del( result[ 'rpcStub' ] )
    return result

  @jsonify
  def tryView( self ):
    """
    Try plotting graphs for a view
    """
    try:
      plotRequest = simplejson.loads( request.params[ 'plotRequest' ] )
      if 'timeLength' in request.params:
        timeLength = str( request.params[ 'timeLength' ] )
        toSecs = int( Time.toEpoch() )
        if timeLength == "hour":
          fromSecs = toSecs - 3600
        elif timeLength == "day":
          fromSecs = toSecs - 86400
        elif timeLength == "month":
          fromSecs = toSecs - 2592000
        elif fromSecs == "year":
          fromDate = toSecs - 31104000
        else:
          return S_ERROR( "Time length value not valid" )
      else:
        fromDate = str( request.params[ 'fromDate' ] )
        toDate = str( request.params[ 'toDate' ] )
        fromSecs = self.__dateToSecs( fromDate )
        toSecs = self.__dateToSecs( toDate )
    except Exception, e:
      return S_ERROR( "Error while processing plot parameters: %s" % str( e ) )
    rpcClient = getRPCClient( "Framework/Monitoring" )
    requestStub = DEncode.encode( plotRequest )
    retVal = rpcClient.tryView( fromSecs, toSecs, requestStub )
    if not retVal[ 'OK' ]:
      return retVal
    return S_OK( { 'images' : retVal[ 'Value' ], 'stub' : requestStub } )

  @jsonify
  def saveView( self ):
    """
    Save a view
    """
    try:
      plotRequest = simplejson.loads( request.params[ 'plotRequest' ] )
      viewName = str( request.params[ 'viewName' ] )
    except Exception, e:
      return S_ERROR( "Error while processing plot parameters: %s" % str( e ) )
    rpcClient = getRPCClient( "Framework/Monitoring" )
    requestStub = DEncode.encode( plotRequest )
    result = rpcClient.saveView( viewName, requestStub )
    if 'rpcStub' in result:
      del( result[ 'rpcStub' ] )
    return result
