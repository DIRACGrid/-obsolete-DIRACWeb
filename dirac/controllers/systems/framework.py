import logging

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
import simplejson

from DIRAC import S_OK, S_ERROR
from DIRAC.Core.Security import CS

log = logging.getLogger(__name__)

class FrameworkController(BaseController):

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return redirect_to( h.url_for( controller="info/general", action ="diracOverview" ) )

  def manageProxies(self):
    return render(  "/systems/framework/manageProxies.mako" )

  def showProxyActionLogs(self):
    if not authorizeAction():
      return render( "/error.mako" )
    return render(  "/systems/framework/showProxyActionLog.mako" )

  @jsonify
  def getProxiesList(self):
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
    rpcClient = getRPCClient( "Framework/ProxyManager" )
    retVal = rpcClient.getContents( {}, sort, start, limit )
    if not retVal[ 'OK' ]:
      return retVal
    svcData = retVal[ 'Value' ]
    data = { 'numProxies' : svcData[ 'TotalRecords' ], 'proxies' : [] }
    dnMap = {}
    for record in svcData[ 'Records' ]:
      dn = record[0]
      if dn in dnMap:
        username = dnMap[ dn ]
      else:
        retVal = CS.getUsernameForDN( dn )
        if not retVal[ 'OK' ]:
          username = 'unknown'
        else:
          username = retVal[ 'Value' ]
        dnMap[ dn ] = username
      data[ 'proxies' ].append( { 'proxyid': "%s@%s" % ( record[0], record[1] ),
                                  'username' : username,
                                  'UserDN' : record[0],
                                  'UserGroup' : record[1],
                                  'ExpirationTime' : str( record[2] ),
                                  'PersistentFlag' : str( record[3] ) } )
    return data

  @jsonify
  def deleteProxies(self):
    try:
      webIds = simplejson.loads( str( request.params[ 'idList' ] ) )
    except Exception, e:
      print e
      return S_ERROR( "No valid id's specified" )
    idList = []
    for id in webIds:
      spl = id.split("@")
      dn = "@".join( spl[:-1] )
      group = spl[-1]
      idList.append( ( dn, group ) )
    rpcClient = getRPCClient( "Framework/ProxyManager" )
    retVal = rpcClient.deleteProxyBundle( idList )
    if 'rpcStub' in retVal:
      del( retVal[ 'rpcStub' ] )
    return retVal

  @jsonify
  def getProxyActionList(self):
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
    selDict = {}
    try:
      for i in ( 'afterDate', 'beforeDate' ):
        if i in request.params:
          selDict[ i ] = str( request.params[ i] )
    except:
      pass
    try:
      filters = str( request.params[ 'filters' ] )
      for filter in filters.split( "|" ):
        fL = filter.split( "=" )
        key = fL[0].strip()
        if key not in selDict:
          selDict[ key ] = []
        values = "=".join( fL[1:] )
        for value in values.split( "," ):
          selDict[ key ].append( value.strip() )
    except Exception, e:
      pass
    rpcClient = getRPCClient( "Framework/ProxyManager" )
    retVal = rpcClient.getLogContents( selDict, sort, start, limit )
    if not retVal[ 'OK' ]:
      return retVal
    svcData = retVal[ 'Value' ]
    data = { 'numActions' : svcData[ 'TotalRecords' ], 'actions' : [] }
    dnMap = {}
    for record in svcData[ 'Records' ]:
      dd = { 'actionid': str(record) }
      for i in range(len( svcData[ 'ParameterNames' ])):
        dd[ svcData[ 'ParameterNames' ][i] ] = str( record[i] )
      data[ 'actions' ].append( dd )
    return data
