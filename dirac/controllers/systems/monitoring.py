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

log = logging.getLogger(__name__)

class MonitoringController(BaseController):

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return redirect_to( url_for( controller="info/general", action ="diracOverview" ) )


  def viewMaker(self):
    """
    Render template for making views
    """
    if not authorizeAction():
      return render( "/error.mako" )
    return render( "/systems/monitoring/viewMaker.mako" )

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
    transferClient = getTransferClient( "Monitoring/Server" )
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
    print len(data)
    return data

  def manageViews( self ):
    """
    Return template for managing views
    """
    if not authorizeAction():
      return render( "/error.mako" )
    rpcClient = getRPCClient( "Monitoring/Server" )
    retVal = rpcClient.getViews( False )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )
    c.viewsList = retVal[ 'Value' ]
    return render( "/systems/monitoring/manageViews.mako" )

  def deleteView( self ):
    """
    Delete a view
    """
    if not authorizeAction():
      return render( "/error.mako" )
    if not 'id' in request.params:
      c.error = "Missing view id to delete!"
      return render( "/error.mako" )
    try:
      id = int( request.params[ 'id' ] )
    except Exception, e:
      c.error = "View id is not valid"
      return render( "/error.mako" )
    rpcClient = getRPCClient( "Monitoring/Server" )
    retVal = rpcClient.deleteView( id )
    if not retVal[ 'OK' ]:
      c.error = "Error while deleting view %s" % retVal[ 'Message' ]
      return render( "/error.mako" )
    return redirect_to( 'manageViews' )

  @jsonify
  def queryAttribs( self ):
    """
    Query a value for a field
    """
    fieldQuery = str( request.params[ 'query' ] )
    print request.params[ 'defined' ]
    definedFields = simplejson.loads( request.params[ 'defined' ] )
    rpcClient = getRPCClient( "Monitoring/Server" )
    return rpcClient.queryField( fieldQuery, definedFields )

  def __dateToSecs( self, timeVar ):
    timeList = timeVar.split( "/" )
    dt = Time.fromString( "%s-%s-%s" % ( timeList[2], timeList[1], timeList[0] ) )
    return int( time.mktime( dt.timetuple() ) )

  def systemPlots( self ):
    """
    Return template for showing a system plots
    """
    if not 'componentName' in request.params:
      c.error = "Missing component name"
      return render( "/error.mako" )
    c.componentName = request.params[ 'componentName' ]
    return render( "/systems/monitoring/componentPlots.mako" )

  @jsonify
  def tryView( self ):
    """
    Try plotting graphs for a view
    """
    if not authorizeAction():
      return S_ERROR( "Unauthorized!" )
    try:
      plotRequest = simplejson.loads( request.params[ 'plotRequest' ] )
      if 'timeLength' in request.params:
        timeLength = str( request.params[ 'timeLength' ] )
        toSecs = int( time.mktime( time.gmtime() ) )
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
    rpcClient = getRPCClient( "Monitoring/Server" )
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
    if not authorizeAction():
      return S_ERROR( "Unauthorized!" )
    try:
      plotRequest = simplejson.loads( request.params[ 'plotRequest' ] )
      viewName = str( request.params[ 'viewName' ] )
    except Exception, e:
      return S_ERROR( "Error while processing plot parameters: %s" % str( e ) )
    rpcClient = getRPCClient( "Monitoring/Server" )
    requestStub = DEncode.encode( plotRequest )
    return rpcClient.saveView( viewName, requestStub )

  @jsonify
  def plotView( self ):
    """
    Plot a saved view
    """
    try:
      plotRequest = simplejson.loads( request.params[ 'plotRequest' ] )
      if 'timeLength' in plotRequest:
        timeLength = str( plotRequest[ 'timeLength' ] )
        toSecs = int( time.mktime( time.gmtime() ) )
        if timeLength == "hour":
          fromSecs = toSecs - 3600
        elif timeLength == "day":
          fromSecs = toSecs - 86400
        elif timeLength == "week":
          fromSecs = toSecs - 604800
        elif timeLength == "month":
          fromSecs = toSecs - 2592000
        elif timeLength == "year":
          fromDate = toSecs - 31104000
        elif timeLength == "manual":
          fromDate = str( plotRequest[ 'fromDate' ] )
          toDate = str( plotRequest[ 'toDate' ] )
          fromSecs = self.__dateToSecs( fromDate )
          toSecs = self.__dateToSecs( toDate )
        else:
          return S_ERROR( "Time length value not valid" )
        plotRequest[ 'fromSecs' ] = fromSecs
        plotRequest[ 'toSecs' ] = toSecs
        del( plotRequest[ 'timeLength' ] )
      else:
        return S_ERROR( "Time not defined!" )
      if not 'id'  in plotRequest:
        return S_ERROR( "Missing view id!" )
    except Exception, e:
      return S_ERROR( "Error while processing plot parameters: %s" % str( e ) )
    rpcClient = getRPCClient( "Monitoring/Server" )
    return rpcClient.plotView( plotRequest )
