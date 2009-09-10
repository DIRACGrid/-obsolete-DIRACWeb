import logging, os, tempfile, datetime
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC import gLogger
from DIRAC import S_ERROR, S_OK
#from DIRAC.Core.Utilities.DictCache import DictCache

log = logging.getLogger(__name__)

#cache = DictCache()

class SitemapController(BaseController):
  
  def index(self):
    return redirect_to( action='display', id=None )
  
  def display(self):
    return render("web/siteMap.mako")
  
  @jsonify
  def getSitesData( self ):
    result = getRPCClient( "Monitoring/SiteMap" ).getSitesData()
    if 'rpcStub' in result:
      del( result[ 'rpcStub' ] )
    return result
  
  @jsonify
  def getSiteMaskLog(self):
    if 'siteName' not in request.params or not request.params[ "siteName" ]:
      return { "success" : "false" , "result" : "Please, define a site!" }
    site = str( request.params[ "siteName" ] )
    rpcClient = getRPCClient( "WorkloadManagement/WMSAdministrator" )
    gLogger.info("- siteName:", site )
    result = rpcClient.getSiteMaskLogging( site )
    gLogger.info("- siteName:", site )
    gLogger.info("- Info result:", result )
    if not result[ "OK" ]:
      return { "success" : "false" , "result" : result[ "Message" ] }
    return result['Value'][ site ]
  
  @jsonify
  def applySiteMaskAction(self):
    params = request.params
    for reqParam in ( 'action', 'comment', 'siteName' ):
      if reqParam not in params or not params[ reqParam ]:
        return { "success" : "false",
                 "result" : "%s parameter is not defined" % reqParam }
    action = str( params[ 'action' ] )
    comment = str( params[ 'comment' ] )
    site = str( params[ 'siteName' ] )
    rpcClient = getRPCClient("WorkloadManagement/WMSAdministrator")
    if action == "ban":
      result = rpcClient.banSite( site, comment )
    elif action == "unban":
      result = rpcClient.allowSite( site, comment )
    else:
      return { "success" : "false", "result" : "Invalid action" }
    if not result["OK"]:
      return { "success" : "false", "result" : result[ "Message" ] }
    return { "success" : "true" , "result" : result[ 'Value' ] }
