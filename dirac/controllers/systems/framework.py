import logging

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
import simplejson

from DIRAC import S_OK, S_ERROR, gConfig, gLogger
from DIRAC.Core.Security import CS

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
    result = gConfig.getSections("/Registry/Users")
    if result["OK"]:
      users = result["Value"]
      if len(users)>0:
        users.sort()
        users = map(lambda x: [x], users)
        users.insert(0,["All"])
        users.append(["unknown"])
      else:
        users = [["Nothing to display"]]
    else:
      users = [["Error during RPC call"]]
    callback["username"] = users
    result = gConfig.getSections("/Registry/Groups")
    if result["OK"]:
      groups = result["Value"]
      if len(groups)>0:
        groups.sort()
        groups = map(lambda x: [x], groups)
        groups.insert(0,["All"])
      else:
        groups = [["Nothing to display"]]
    else:
      groups = [["Error during RPC call"]]
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
    gLogger.info("!!!  RESULT: %s",str(svcData) )
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
      proxies.append( { 'proxyid': "%s@%s" % ( record[0], record[1] ),
                                  'username' : username,
                                  'UserDN' : record[0],
                                  'UserGroup' : record[1],
                                  'ExpirationTime' : str( record[2] ),
                                  'PersistentFlag' : str( record[3] ) } )
    data = {"success":"true","result":proxies,"total":svcData[ 'TotalRecords' ]}
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
        username = str(request.params["username"]).split(separator)
        req['UserDN'] = []
        for i in username:
          result = CS.getDNForUsername(i)
          if result["OK"]:
            dns = result['Value']
            for j in dns:
              req['UserDN'].append(j)
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
