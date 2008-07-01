import logging

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from DIRAC.Core.Security import CS

log = logging.getLogger(__name__)

class FrameworkController(BaseController):

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return redirect_to( url_for( controller="info/general", action ="diracOverview" ) )

  def manageProxies(self):
    return render(  "/systems/framework/manageProxies.mako" )

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

    rpcClient = getRPCClient( "Framework/ProxyManager" )
    retVal = rpcClient.getContents( {}, start, limit )
    if not retVal[ 'OK' ]:
      return retVal
    data = { 'numProxies' : 0, 'proxies' : [] }
    dnMap = {}
    for record in retVal[ 'Value' ][1]:
      print record
      data[ 'numProxies' ] += 1
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
      data[ 'proxies' ].append( { 'proxyid': data[ 'numProxies' ],
                                  'username' : username,
                                  'DN' : record[0],
                                  'group' : record[1],
                                  'expiration' : str( record[2] ),
                                  'persistent' : str( record[3] ) } )
    return data