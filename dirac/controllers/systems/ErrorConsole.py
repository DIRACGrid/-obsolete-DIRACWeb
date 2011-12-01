import logging
from time import time, gmtime, strftime
import datetime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gLogger
from DIRAC.Core.Utilities import Time

log = logging.getLogger( __name__ )


class ErrorconsoleController( BaseController ):
  def display( self ):
    c.select = self.__getSelectionData()
    gLogger.info( "SELECTION RESULTS:", c.select )
    return render( "systems/ErrorConsole.mako" )
################################################################################
  def __getSelectionData( self ):
    callback = {}
    if len( request.params ) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str( request.params[i] )
        gLogger.info( " value ", request.params[i] )
      callback["extra"] = tmp
    RPC = getRPCClient( "Framework/SystemLoggingReport" )
    result = RPC.getSystems()
    gLogger.info( "- raw systems result:", result )
    if result["OK"]:
      systems = []
      if len( result["Value"] ) > 0:
        systems.append( [str( "All" )] )
        for i in result["Value"]:
          systems.append( [str( i )] )
      else:
        systems = "Nothing to display"
    else:
      systems = "Error during RPC call"
    callback["systems"] = systems
    gLogger.info( "- systems:", systems )
    result = RPC.getSubSystems()
    if result["OK"]:
      subSystems = []
      if len( result["Value"] ) > 0:
        subSystems.append( [str( "All" )] )
        for i in result["Value"]:
          subSystems.append( [str( i )] )
      else:
        subSystems = "Nothing to display"
    else:
      subSystems = "Error during RPC call"
    callback["subSystems"] = subSystems
    return callback
################################################################################
  @jsonify
  def submit( self ):
    RPC = getRPCClient( "Framework/SystemLoggingReport" )
    result = self.__request()
    result = RPC.getGroupedMessages( result, globalSort, pageNumber, numberOfJobs )
    gLogger.info( "- REQUEST:", result )
    if result["OK"]:
      result = result["Value"]
      c.result = []
      jobs = result["Records"]
      if result.has_key( "ParameterNames" ) and result.has_key( "Records" ):
        if len( result["ParameterNames"] ) > 0:
          if len( result["Records"] ) > 0:
            c.result = []
            jobs = result["Records"]
            head = result["ParameterNames"]
            headLength = len( head )
            for i in jobs:
              tmp = {}
              for j in range( 0, headLength ):
                tmp[head[j]] = i[j]
              c.result.append( tmp )
            total = result["TotalRecords"]
            timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
#            c.result = {"success":"true", "result":c.result, "total":total,"date":timestamp}
            c.result = {"success":"true", "result":c.result, "total":total}
          else:
            c.result = {"success":"false", "result":"", "error":"There are no data to display"}
        else:
          c.result = {"success":"false", "result":"", "error":"ParameterNames field is missing"}
      else:
        c.result = {"success":"false", "result":"", "error":"Data structure is corrupted"}
    else:
      c.result = {"success":"false", "error":result["Message"]}
    gLogger.info( "\033[0;31mRESULT:\033[0m" )
    return c.result
################################################################################
  def __request( self ):
    req = {}
    global pageNumber
    global numberOfJobs
    global globalSort
    if request.params.has_key( "limit" ) and len( request.params["limit"] ) > 0:
      numberOfJobs = int( request.params["limit"] )
    else:
      numberOfJobs = 25
    if request.params.has_key( "start" ) and len( request.params["start"] ) > 0:
      pageNumber = int( request.params["start"] )
    else:
      pageNumber = 0
    if request.params.has_key( "sort" ) and len( request.params["sort"] ) > 0:
      globalSort = str( request.params["sort"] )
      key, value = globalSort.split( " " )
      globalSort = [[str( key ), str( value )]]
    else:
      globalSort = [["SystemName", "DESC"]]
    if request.params.has_key( "startDate" ) and len( request.params["startDate"] ) > 0:
      req["beginDate"] = str( request.params["startDate"] )
    if request.params.has_key( "finalDate" ) and len( request.params["finalDate"] ) > 0:
      req["endDate"] = str( request.params["finalDate"] )
    if request.params.has_key( "system" ) and len( request.params["system"] ) > 0:
      req["SystemName"] = str( request.params["system"] )
    gLogger.info( "REQUEST:", req )
    return req
