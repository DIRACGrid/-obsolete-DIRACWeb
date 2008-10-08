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

log = logging.getLogger(__name__)

class ActivitiesmonitoringController(BaseController):

  def index(self):
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

  def __dateToSecs( self, timeVar ):
    timeList = timeVar.split( "/" )
    dt = Time.fromString( "%s-%s-%s" % ( timeList[2], timeList[1], timeList[0] ) )
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
        fromSecs = self.__dateToSecs( str( timeReq[ 'fromDate' ] ) )
        toSecs = self.__dateToSecs( str( timeReq[ 'toDate' ] ) )
      else:
        toSecs = int( Time.toEpoch() )
        fromSecs = toSecs - timeReq[ 'timespan' ]
      plotRequest[ 'fromSecs' ] = fromSecs
      plotRequest[ 'toSecs' ] = toSecs
      if 'varData' in webRequest:
        plotRequest[ 'varData' ] = webRequest[ 'varData' ]
    except Exception, e:
      return S_ERROR( "Error while processing plot parameters: %s" % str( e ) )
    rpcClient = getRPCClient( "Monitoring/Server" )
    return self.__translateToExpectedExtResult( rpcClient.plotView( plotRequest ) )