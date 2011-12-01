import logging

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
import simplejson

from DIRAC import S_OK, S_ERROR, gConfig, gLogger
from DIRAC.Core.Security import CS
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.Core.Utilities import Time

log = logging.getLogger(__name__)

class FrameworkController(BaseController):

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return redirect_to( h.url_for( controller="info/general", action ="diracOverview" ) )

  def manageProxies(self):
    if not authorizeAction():
      return render("/login.mako")
    c.select = self.__getSelectionData()
    return render(  "/systems/framework/manageProxies.mako" )

  def showProxyActionLogs(self):
    if not authorizeAction():
      return render( "/error.mako" )
    return render(  "/systems/framework/showProxyActionLog.mako" )

  def __humanize_time(self, sec=False):
    """
    Converts number of seconds to human readble values. Max return value is 
    "More then a year" year and min value is "One day"
    """
    if not sec:
      return "Time span is not specified"
    try:
      sec = int(sec)
    except:
      return "Value from CS is not integer"
    month, week = divmod(sec,2592000)
    if month > 0:
      if month > 12:
        return "More then a year"
      elif month > 1:
        return str(month) + " months"
      else:
        return "One month"
    week, day = divmod(sec,604800)
    if week > 0:
      if week == 1:
        return "One week"
      else:
        return str(week) + " weeks"
    day, hours = divmod(sec,86400)
    if day > 0:
      if day == 1:
        return "One day"
      else:
        return str(day) + " days"

  def __getSelectionData(self):
    callback = {}
    if not authorizeAction():
      return {"success":"false","error":"You are not authorize to access these data"}
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
    rpcClient = getRPCClient( "Framework/ProxyManager" )
    retVal = rpcClient.getContents( {}, [], 0, 0 )
    if not retVal[ "OK" ]:
      return {"success":"false","error":retVal["Message"]}
    data = retVal[ "Value" ]
    users = []
    groups = []
    for record in data[ "Records" ]:
      users.append( str(record[0]) )
      groups.append( str(record[2]) )
    users = uniqueElements(users)
    groups = uniqueElements(groups)
    users.sort()
    groups.sort()
    users = map(lambda x: [x], users)
    groups = map(lambda x: [x], groups)
    if len(users) > 3:
      users.insert(0,["All"])
    if len(groups) > 3:
      groups.insert(0,["All"])
    callback["username"] = users
    callback["usergroup"] = groups
    result = gConfig.getOption("/Website/ProxyManagementMonitoring/TimeSpan")
    if result["OK"]:
      tmp = result["Value"]
      tmp = tmp.split(", ")
      if len(tmp)>0:
        timespan = []
        for i in tmp:
          human_readable = self.__humanize_time(i)
          timespan.append([i, human_readable])
      else:
        timespan = [["Nothing to display"]]
    else:
      timespan = [["Error during RPC call"]]
    callback["expiredBefore"] = timespan
    callback["expiredAfter"] = timespan
    return callback
    
  def submit(self):
    return self.getProxiesList()
    
  @jsonify
  def getProxiesList(self):
    if not authorizeAction():
      return {"success":"false","error":"You are not authorize to access these data"}
    start, limit, sort, req = self.__request()
    rpcClient = getRPCClient( "Framework/ProxyManager" )
    retVal = rpcClient.getContents( req, sort, start, limit )
    if not retVal[ 'OK' ]:
      return {"success":"false","error":retVal["Message"]}
    svcData = retVal[ 'Value' ]
    proxies = []
    dnMap = {}
    gLogger.info("!!!  RESULT: %s" % str(svcData) )
    for record in svcData[ 'Records' ]:
      proxies.append( { 'proxyid': "%s@%s" % ( record[1], record[2] ),
                                  'username' : str( record[0] ),
                                  'UserDN' : record[1],
                                  'UserGroup' : record[2],
                                  'ExpirationTime' : str( record[3] ),
                                  'PersistentFlag' : str( record[4] ) } )
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    data = {"success":"true","result":proxies,"total":svcData[ 'TotalRecords' ],"date":timestamp}
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

  def __request(self):
    gLogger.info("!!!  PARAMS: ",str(request.params))
    req = {}
    try:
      start = int( request.params[ 'start' ] )
    except:
      start = 0
    try:
      limit = int( request.params[ 'limit' ] )
    except:
      limit = 25
    try:
      sort = str( request.params[ 'sort' ] )
      sortField, sortDir = sort.split(" ")
      sort = [ ( sortField, sortDir ) ]
    except:
      sort = []
    result = gConfig.getOption("/Website/ListSeparator")
    if result["OK"]:
      separator = result["Value"]
    else:
      separator = ":::"
    if request.params.has_key("username") and len(request.params["username"]) > 0:
      if str(request.params["username"]) != "All":
        req["UserName"] = str(request.params["username"]).split(separator)
    if request.params.has_key("usergroup") and len(request.params["usergroup"]) > 0:
      if str(request.params["usergroup"]) != "All":
        req["UserGroup"] = str(request.params["usergroup"]).split(separator)
    if request.params.has_key("persistent") and len(request.params["persistent"]) > 0:
      if str(request.params["persistent"]) in ["True","False"]:
        req["PersistentFlag"] = str(request.params["persistent"])
    before = False
    after = False
    if request.params.has_key("expiredBefore") and len(request.params["expiredBefore"]) > 0:
      try:
        before = int(request.params["expiredBefore"])
      except:
        pass
    if request.params.has_key("expiredAfter") and len(request.params["expiredAfter"]) > 0:
      try:
        after = int(request.params["expiredAfter"])
      except:
        pass
    if before and after:
      if before > after:
        req["beforeDate"] = before      
        req["afterDate"] = after
    else:
      if before:
        req["beforeDate"] = before
      if after:
        req["afterDate"] = after
    gLogger.always("REQUEST:",req)
    return (start, limit, sort, req)
