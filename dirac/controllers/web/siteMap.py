import logging
import datetime
import tempfile

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import getProperties
from dirac.lib.sessionManager import *
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.FrameworkSystem.Client.SiteMapClient import SiteMapClient
from DIRAC.Core.Security import Properties
from DIRAC import gLogger
from DIRAC import S_ERROR, S_OK
#from DIRAC.Core.Utilities.DictCache import DictCache

log = logging.getLogger( __name__ )

gSiteMapClient = SiteMapClient( getRPCClient )
#cache = DictCache()

class SitemapController( BaseController ):

  def index( self ):
    return redirect_to( action = 'display', id = None )

  def display( self ):
    if "SiteManager" in getProperties():
      c.allowActions = True
    else:
      c.allowActions = False
    return render( "web/siteMap.mako" )

  @jsonify
  def generateAccountingPlot( self ):
    try:
      site = str( request.params[ 'site' ] )
      plotName = str( request.params[ 'plotName' ] )
      plotTime = str( request.params[ 'plotTime' ] )
      height = int( request.params[ 'height' ] )
      width = int( request.params[ 'width' ] )
    except:
      S_ERROR( "Oops, Invalid parameters!" )

    extraParams = { 'height' : height, 'width' : width }
    if plotName == 'CPU Used':
      typeName = "Job"
      reportName = "CPUUsed"
      grouping = "FinalMajorStatus"
      condDict = { 'Site' : [ site ] }
      extraParams[ 'plotTitle' ] = "CPU used for site %s" % site
    elif plotName == "Running jobs":
      typeName = "WMSHistory"
      reportName = "NumberOfJobs"
      grouping = "JobGroup"
      condDict = { 'Site' : [ site ], 'Status' : [ 'Running' ] }
      extraParams[ 'plotTitle' ] = "Jobs running for site %s" % site
    else:
      return S_ERROR( "Oops, invalid plot name!" )

    if plotTime == "Last day":
      extraParams[ 'lastSeconds' ] = 86400
    elif plotTime == "Last week":
      extraParams[ 'lastSeconds' ] = 604800
    elif plotTime == "Last month":
      extraParams[ 'lastSeconds' ] = 2592000
    else:
      return S_ERROR( "Oops, invalid time!" )

    end = datetime.datetime.utcnow()
    start = end - datetime.timedelta( seconds = extraParams[ 'lastSeconds' ] )
    repClient = ReportsClient( rpcClient = getRPCClient( "Accounting/ReportGenerator" ) )
    result = repClient.generateDelayedPlot( typeName, reportName, start, end, condDict, grouping, extraParams )
    if not result[ 'OK' ]:
      return S_ERROR( result[ 'Message' ] )
    return S_OK( result[ 'Value' ][ 'plot' ] )

  @jsonify
  def getSitesData( self ):
    result = gSiteMapClient.getSitesData()
    if 'rpcStub' in result:
      del( result[ 'rpcStub' ] )
    return result

  @jsonify
  def getSiteMaskLog( self ):
    if 'siteName' not in request.params or not request.params[ "siteName" ]:
      return { "success" : "false" , "result" : "Please, define a site!" }
    site = str( request.params[ "siteName" ] )
    rpcClient = getRPCClient( "WorkloadManagement/WMSAdministrator" )
    gLogger.info( "- siteName:", site )
    result = rpcClient.getSiteMaskLogging( site )
    gLogger.info( "- siteName:", site )
    gLogger.info( "- Info result:", result )
    if not result[ "OK" ]:
      return { "success" : "false" , "result" : result[ "Message" ] }
    return result['Value'][ site ]

  @jsonify
  def applySiteMaskAction( self ):
    params = request.params
    for reqParam in ( 'action', 'comment', 'siteName' ):
      if reqParam not in params or not params[ reqParam ]:
        return { "success" : "false",
                 "result" : "%s parameter is not defined" % reqParam }
    action = str( params[ 'action' ] )
    comment = str( params[ 'comment' ] )
    site = str( params[ 'siteName' ] )
    rpcClient = getRPCClient( "WorkloadManagement/WMSAdministrator" )
    if action == "ban":
      result = rpcClient.banSite( site, comment )
    elif action == "unban":
      result = rpcClient.allowSite( site, comment )
    else:
      return { "success" : "false", "result" : "Invalid action" }
    if not result["OK"]:
      return { "success" : "false", "result" : result[ "Message" ] }
    return { "success" : "true" , "result" : result[ 'Value' ] }

  def getAccountingPlotImg( self ):
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
    #response.headers['Content-Disposition'] = 'attachment; filename="%s"' % plotImageFile
    response.headers['Content-Length'] = len( data )
    response.headers['Content-Transfer-Encoding'] = 'Binary'
    return data
