import logging

import datetime
import simplejson
import tempfile
try:
  from hashlib import md5
except:
  from md5 import md5
from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.sessionManager import getUsername, getSelectedGroup, getSelectedSetup

from DIRAC import S_OK, S_ERROR, gLogger, gConfig
from DIRAC.Core.Utilities import Time, List, DictCache
from DIRAC.Core.Security import CS
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from dirac.lib.webBase import defaultRedirect

log = logging.getLogger( __name__ )


class AccountingplotsController( BaseController ):

  __keysCache = DictCache()

  def __getUniqueKeyValues( self, typeName ):
    userGroup = getSelectedGroup()
    if 'NormalUser' in CS.getPropertiesForGroup( userGroup ):
      cacheKey = ( getUserName(), userGroup, getSelectedSetup(), typeName )
    else:
      cacheKey = ( userGroup, getSelectedSetup(), typeName )
    data = AccountingplotsController.__keysCache.get( cacheKey )
    if not data:
      rpcClient = getRPCClient( "Accounting/ReportGenerator" )
      retVal = rpcClient.listUniqueKeyValues( typeName )
      if 'rpcStub' in retVal:
        del( retVal[ 'rpcStub' ] )
      if not retVal[ 'OK' ]:
        return retVal

      #Site ordering based on TierLevel / alpha
      if 'Site' in retVal[ 'Value' ]:
        siteLevel = {}
        for siteName in retVal[ 'Value' ][ 'Site' ]:
          sitePrefix = siteName.split( "." )[0].strip()
          level = gConfig.getValue( "/Resources/Sites/%s/%s/MoUTierLevel" % ( sitePrefix, siteName ), 10 )
          if level not in siteLevel:
            siteLevel[ level ] = []
          siteLevel[ level ].append( siteName )
        orderedSites = []
        for level in sorted( siteLevel ):
          orderedSites.extend( sorted( siteLevel[ level ] ) )
        retVal[ 'Value' ][ 'Site' ] = orderedSites
      data = retVal
      AccountingplotsController.__keysCache.add( cacheKey, 300, data )
    return data

  def index( self ):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return defaultRedirect()

  def dataOperation( self ):
    return self.__showPlotPage( "DataOperation", "/systems/accounting/dataOperation.mako" )

  def job( self ):
    return self.__showPlotPage( "Job", "/systems/accounting/job.mako" )

  def WMSHistory( self ):
    return self.__showPlotPage( "WMSHistory", "/systems/accounting/WMSHistory.mako" )

  def pilot( self ):
    return self.__showPlotPage( "Pilot", "/systems/accounting/Pilot.mako" )

  def SRMSpaceTokenDeployment( self ):
    return self.__showPlotPage( "SRMSpaceTokenDeployment", "/systems/accounting/SRMSpaceTokenDeployment.mako" )

  def plotPage( self ):
    try:
      typeName = str( request.params[ 'typeName' ] )
    except:
      c.errorMessage = "Oops. missing type"
      return render( "/error.mako" )

    return self.__showPlotPage( typeName , "/systems/accounting/%s.mako" % typeName )

  def __showPlotPage( self, typeName, templateFile ):
    #Get unique key values
    retVal = self.__getUniqueKeyValues( typeName )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render ( "/error.mako" )
    c.selectionValues = simplejson.dumps( retVal[ 'Value' ] )
    #Cache for plotsList?
    data = AccountingplotsController.__keysCache.get( "reportsList:%s" % typeName )
    if not data:
      repClient = ReportsClient( rpcClient = getRPCClient( "Accounting/ReportGenerator" ) )
      retVal = repClient.listReports( typeName )
      if not retVal[ 'OK' ]:
        c.error = retVal[ 'Message' ]
        return render ( "/error.mako" )
      data = simplejson.dumps( retVal[ 'Value' ] )
      AccountingplotsController.__keysCache.add( "reportsList:%s" % typeName, 300, data )
    c.plotsList = data
    return render ( templateFile )

  @jsonify
  def getKeyValuesForType( self ):
    try:
      typeName = str( request.params[ 'typeName' ] )
    except:
      return S_ERROR( "Missing or invalid type name!" )
    retVal = self.__getUniqueKeyValues( typeName )
    if not retVal[ 'OK' ] and 'rpcStub' in retVal:
      del( retVal[ 'rpcStub' ] )
    return retVal

  def __parseFormParams(self):
    params = request.params
    return parseFormParams(params)


  def __translateToExpectedExtResult( self, retVal ):
    if retVal[ 'OK' ]:
      return { 'success' : True, 'data' : retVal[ 'Value' ][ 'plot' ] }
    else:
      return { 'success' : False, 'errors' : retVal[ 'Message' ] }

  def __queryForPlot( self ):
    retVal = self.__parseFormParams()
    if not retVal[ 'OK' ]:
      return retVal
    params = retVal[ 'Value' ]
    repClient = ReportsClient( rpcClient = getRPCClient( "Accounting/ReportGenerator" ) )
    retVal = repClient.generateDelayedPlot( *params )
    return retVal

  def getPlotData( self ):
    retVal = self.__parseFormParams()
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )
    params = retVal[ 'Value' ]
    repClient = ReportsClient( rpcClient = getRPCClient( "Accounting/ReportGenerator" ) )
    retVal = repClient.getReport( *params )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )
    rawData = retVal[ 'Value' ]
    groupKeys = rawData[ 'data' ].keys()
    groupKeys.sort()
    if 'granularity' in rawData:
      granularity = rawData[ 'granularity' ]
      data = rawData['data']
      tS = int( Time.toEpoch( params[2] ) )
      timeStart = tS - tS % granularity
      strData = "epoch,%s\n" % ",".join( groupKeys )
      for timeSlot in range( timeStart, int( Time.toEpoch( params[3] ) ), granularity ):
        lineData = [ str( timeSlot ) ]
        for key in groupKeys:
          if timeSlot in data[ key ]:
            lineData.append( str( data[ key ][ timeSlot ] ) )
          else:
            lineData.append( "" )
        strData += "%s\n" % ",".join( lineData )
    else:
      strData = "%s\n" % ",".join( groupKeys )
      strData += ",".join( [ str( rawData[ 'data' ][ k ] ) for k in groupKeys ] )
    response.headers['Content-type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename="%s.csv"' % md5( str( params ) ).hexdigest()
    response.headers['Content-Length'] = len( strData )
    return strData

  @jsonify
  def generatePlot( self ):
    return self.__translateToExpectedExtResult( self.__queryForPlot() )

  def generatePlotAndGetHTML( self ):
    retVal = self.__queryForPlot()
    if not retVal[ 'OK' ]:
      return "<h2>Can't regenerate plot: %s</h2>" % retVal[ 'Message' ]
    return "<img src='getPlotImg?file=%s'/>" % retVal[ 'Value' ][ 'plot' ]

  def getPlotImg( self ):
    """
    Get plot image
    """
    if 'file' not in request.params:
      c.error = "Maybe you forgot the file?"
      return render( "/error.mako" )
    plotImageFile = str( request.params[ 'file' ] )
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
    response.headers['Content-Disposition'] = 'attachment; filename="%s.png"' % md5( plotImageFile ).hexdigest()
    response.headers['Content-Length'] = len( data )
    response.headers['Content-Transfer-Encoding'] = 'Binary'
    response.headers['Cache-Control'] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers['Pragma'] = "no-cache"
    response.headers['Expires'] = ( datetime.datetime.utcnow() - datetime.timedelta( minutes = -10 ) ).strftime( "%d %b %Y %H:%M:%S GMT" )
    return data

  @jsonify
  def getPlotListAndSelectionValues(self):
    result = {}
    try:
      typeName = str( request.params[ 'typeName' ] )
    except:
      return S_ERROR( "Missing or invalid type name!" )
    retVal = self.__getUniqueKeyValues( typeName )
    if not retVal[ 'OK' ] and 'rpcStub' in retVal:
      del( retVal[ 'rpcStub' ] )
      return retVal
    selectionValues = retVal['Value']
    data = AccountingplotsController.__keysCache.get( "reportsList:%s" % typeName )
    if not data:
      repClient = ReportsClient( rpcClient = getRPCClient( "Accounting/ReportGenerator" ) )
      retVal = repClient.listReports( typeName )
      if not retVal[ 'OK' ]:
        c.error = retVal[ 'Message' ]
        return render ( "/error.mako" )
      data = simplejson.dumps( retVal[ 'Value' ] )
      AccountingplotsController.__keysCache.add( "reportsList:%s" % typeName, 300, data )
    try:
      plotsList = eval(data)
    except:
      return S_ERROR('Failed to convert a string to a list!')
    return S_OK({'SelectionData':selectionValues, 'PlotList':plotsList})

def parseFormParams(params):
  pD = {}
  extraParams = {}
  pinDates = False
  print 'Found it!!!',params
  for name in params:
    if name.find( "_" ) != 0:
      continue
    value = params[ name ]
    name = name[1:]
    pD[ name ] = str( value )
  #Personalized title?
  if 'plotTitle' in pD:
    extraParams[ 'plotTitle' ] = pD[ 'plotTitle' ]
    del( pD[ 'plotTitle' ] )
  #Pin dates?
  if 'pinDates' in pD:
    pinDates = pD[ 'pinDates' ]
    del( pD[ 'pinDates' ] )
    pinDates = pinDates.lower() in ( "yes", "y", "true", "1" )
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
  reportName = pD[ 'plotName' ]
  del( pD[ 'plotName' ] )
  #Get times
  if not 'timeSelector' in pD:
    return S_ERROR( "Missing time span!" )
  #Find the proper time!
  pD[ 'timeSelector' ] = int( pD[ 'timeSelector' ] )
  if pD[ 'timeSelector' ] > 0:
    end = Time.dateTime()
    start = end - datetime.timedelta( seconds = pD[ 'timeSelector' ] )
    if not pinDates:
      extraParams[ 'lastSeconds' ] = pD[ 'timeSelector' ]
  else:
    if 'endTime' not in pD:
      end = False
    else:
      end = Time.fromString( pD[ 'endTime' ] )
      del( pD[ 'endTime' ] )
    if 'startTime' not in pD:
      return S_ERROR( "Missing starTime!" )
    else:
      start = Time.fromString( pD[ 'startTime' ] )
      del( pD[ 'startTime' ] )
  del( pD[ 'timeSelector' ] )

  for k in pD:
    if k.find( "ex_" ) == 0:
      extraParams[ k[3:] ] = pD[ k ]
  #Listify the rest
  for selName in pD:
    pD[ selName ] = List.fromChar( pD[ selName ], "," )
  return S_OK( ( typeName, reportName, start, end, pD, grouping, extraParams ) )

