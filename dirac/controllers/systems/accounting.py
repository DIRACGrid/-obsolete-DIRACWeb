import logging

import datetime
import simplejson
import tempfile
from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient

from DIRAC import S_OK, S_ERROR
from DIRAC.Core.Utilities import Time, List

log = logging.getLogger(__name__)

class AccountingController(BaseController):

  def __getUniqueKeyValues( self, typeName ):
    rpcClient = getRPCClient( "Accounting/ReportGenerator" )
    retVal = rpcClient.listUniqueKeyValues( typeName )
    if not retVal[ 'OK' ]:
      return retVal
    rawValuesDict = retVal[ 'Value' ]
    valuesDict = {}
    for keyName in rawValuesDict:
      valuesDict[ keyName ] = [ tup[0] for tup in rawValuesDict[ keyName ] ]
    return S_OK( valuesDict )

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return redirect_to( url_for( "/systems/accounting/dataOperation" ) )

  def dataOperation(self):
    #TODO: This can be cached
    retVal = self.__getUniqueKeyValues( "DataOperation" )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render ( "/error.mako" )
    c.selectionValues = simplejson.dumps( retVal[ 'Value' ] )
    #TODO: This can be cached
    rpcClient = getRPCClient( "Accounting/ReportGenerator" )
    retVal = rpcClient.listPlots( "DataOperation" )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render ( "/error.mako" )
    c.plotsList = simplejson.dumps( retVal[ 'Value' ] )
    return render ("/systems/accounting/dataOperation.mako")

  def __parseFormParams( self ):
    pD = {}
    for name in request.params:
      if name.find( "_" ) != 0:
        continue
      value = request.params[ name ]
      name = name[1:]
      pD[ name ] = str( value )
    if not 'plotName' in pD:
      return S_ERROR( "Missing plot name!" )
    plotName = pD[ 'plotName' ]
    del( pD[ 'plotName' ] )
    if not 'timeSelector' in pD:
      return S_ERROR( "Missing time span!" )
    pD[ 'timeSelector' ] = int( pD[ 'timeSelector' ] )
    if pD[ 'timeSelector' ] > 0:
      end = Time.dateTime()
      start = end - datetime.timedelta( seconds = pD[ 'timeSelector' ] )
    else:
      for field in ( 'startTime', 'endTime' ):
        if not field in pD:
          return S_ERROR( "Missing %s!" % field )
      del( pD[ 'endTime' ] )
      del( pD[ 'startTime' ] )
      end = Time.fromString( pD[ 'endTime' ] )
      start = Time.fromString( pD[ 'startTime' ] )
    del( pD[ 'timeSelector' ] )
    for selName in pD:
      pD[ selName ] = List.fromChar( pD[ selName ], "," )
    return S_OK( ( plotName, start, end, pD ) )

  def __translateToExpectedExtResult( self, retVal ):
    if retVal[ 'OK' ]:
      return { 'success' : True, 'data' : retVal[ 'Value' ] }
    else:
      return { 'success' : False, 'errors' : retVal[ 'Message' ] }

  @jsonify
  def generatePlot(self):
    retVal = self.__parseFormParams()
    print retVal
    if not retVal[ 'OK' ]:
      return self.__translateToExpectedExtResult( retVal )
    params = retVal[ 'Value' ]
    rpcClient = getRPCClient( "Accounting/ReportGenerator" )
    retVal = rpcClient.generatePlot( "DataOperation", *params )
    return self.__translateToExpectedExtResult( retVal )

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