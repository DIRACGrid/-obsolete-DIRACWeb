import logging

import datetime
import simplejson
import tempfile
from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient

from DIRAC import S_OK, S_ERROR
from DIRAC.Core.Utilities import Time, List
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient

log = logging.getLogger(__name__)

class AccountingplotsController(BaseController):

  def __getUniqueKeyValues( self, typeName ):
    rpcClient = getRPCClient( "Accounting/ReportGenerator" )
    retVal = rpcClient.listUniqueKeyValues( typeName )
    if 'rpcStub' in retVal:
      del( retVal[ 'rpcStub' ] )
    return retVal

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return redirect_to( url_for( "/systems/accounting/dataOperation" ) )

  def dataOperation(self):
    return self.__showPlotPage( "DataOperation", "/systems/accounting/dataOperation.mako" )

  def job(self):
    return self.__showPlotPage( "Job", "/systems/accounting/job.mako" )

  def WMSHistory(self):
    return self.__showPlotPage( "WMSHistory", "/systems/accounting/WMSHistory.mako" )

  def pilot(self):
    return self.__showPlotPage( "Pilot", "/systems/accounting/Pilot.mako" )

  def __showPlotPage( self, typeName, templateFile ):
    #TODO: This can be cached
    retVal = self.__getUniqueKeyValues( typeName )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render ( "/error.mako" )
    c.selectionValues = simplejson.dumps( retVal[ 'Value' ] )
    #TODO: This can be cached
    repClient = ReportsClient( rpcClient = getRPCClient( "Accounting/ReportGenerator" ) )
    retVal = repClient.listPlots( typeName )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render ( "/error.mako" )
    c.plotsList = simplejson.dumps( retVal[ 'Value' ] )
    return render ( templateFile )

  def __parseFormParams( self ):
    pD = {}
    for name in request.params:
      if name.find( "_" ) != 0:
        continue
      value = request.params[ name ]
      name = name[1:]
      pD[ name ] = str( value )
    #Get plotname
    if not 'grouping' in pD:
      return S_ERROR( "Missing grouping!" )
    grouping = pD[ 'grouping' ]
    #Get plotname
    if not 'typeName' in pD:
      return S_ERROR( "Missing type name!" )
    typeName = pD[ 'typeName' ]
    del( pD[ 'typeName' ] )
    #Get plotname
    if not 'plotName' in pD:
      return S_ERROR( "Missing plot name!" )
    plotName = pD[ 'plotName' ]
    del( pD[ 'plotName' ] )
    #Get times
    if not 'timeSelector' in pD:
      return S_ERROR( "Missing time span!" )
    pD[ 'timeSelector' ] = int( pD[ 'timeSelector' ] )
    if pD[ 'timeSelector' ] > 0:
      end = Time.dateTime()
      start = end - datetime.timedelta( seconds = pD[ 'timeSelector' ] )
    else:
      for field in ( 'startTime', 'endTime' ):
        if not field in request.params:
          return S_ERROR( "Missing %s!" % field )
      end = Time.fromString( request.params[ 'endTime' ] )
      start = Time.fromString( request.params[ 'startTime' ] )
    del( pD[ 'timeSelector' ] )
    #Listify the rest
    for selName in pD:
      pD[ selName ] = List.fromChar( pD[ selName ], "," )
    return S_OK( ( typeName, plotName, start, end, pD, grouping, {} ) )

  def __translateToExpectedExtResult( self, retVal ):
    if retVal[ 'OK' ]:
      return { 'success' : True, 'data' : retVal[ 'Value' ] }
    else:
      return { 'success' : False, 'errors' : retVal[ 'Message' ] }

  def __queryForPlot( self ):
    retVal = self.__parseFormParams()
    print retVal
    if not retVal[ 'OK' ]:
      return self.__translateToExpectedExtResult( retVal )
    params = retVal[ 'Value' ]
    repClient = ReportsClient( rpcClient = getRPCClient( "Accounting/ReportGenerator" ) )
    retVal = repClient.generatePlot( *params )
    return retVal

  @jsonify
  def generatePlot( self ):
    return self.__translateToExpectedExtResult( self.__queryForPlot() )

  def generatePlotAndGetHTML(self):
    retVal = self.__queryForPlot()
    if not retVal[ 'OK' ]:
      return "<h2>Can't regenerate plot: %s</h2>" % retVal[ 'Message' ]
    return "<img src='getPlotImg?file=%s'/>" % retVal[ 'Value' ]

  def getPlotImg( self ):
    """
    Get plot image
    """
    if 'file' not in request.params:
      c.error = "Maybe you forgot the file?"
      return render( "/error.mako" )
    plotImageFile = request.params[ 'file' ]
    if plotImageFile.find( ".png" ) < -1:
      c.error = "Not a valid image!"
      return render( "/error.mako" )
    transferClient = getTransferClient( "Accounting/ReportGenerator" )
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