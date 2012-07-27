import logging, datetime, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.List import sortList
from DIRAC.Core.Utilities import Time
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials
#from DIRAC.Interfaces.API.Dirac import Dirac

log = logging.getLogger(__name__)

R_NUMBER = 25 #
P_NUMBER = 0 # 

class MetacatalogueController(BaseController):
  __imgCache = DictCache()
################################################################################
  def display(self):
    pagestart = time()
    group = credentials.getSelectedGroup()
    if group == "visitor" and credentials.getUserDN == "":
      return render("/login.mako")
#    c.select = self.__getSelectionData()
#    if not c.select.has_key("extra"):
#      groupProperty = credentials.getProperties(group)
#      if ( "JobAdministrator" or "JobSharing" ) not in groupProperty: #len(groupProperty) == 1 and groupProperty[0] == "NormalUser":
#        c.select["extra"] = {"owner":credentials.getUsername()}
    return render("data/MetaCatalogue.mako")
################################################################################
  @jsonify
  def submit( self ) :
    RPC = getRPCClient( "DataManagement/FileCatalog" )
    req = self.__request()
    gLogger.debug( "submit: incoming request %s" % req )
    result = RPC.findFilesByMetadata( req["selection"] , req["path"] )
    gLogger.debug( "submit: result of findFilesByMetadata %s" % result )
    if not result[ "OK" ] :
      gLogger.error( "submit: %s" % result[ "Message" ] )
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = result[ "Value" ]
    if not len(result) > 0:
      return { "success" : "true" , "result" : {} , "total" : 0 }
    callback = list()
    for key , value in result.items() :
      if len( value ) > 0 :
        for j in value :
          callback.append({ "filename" : key + "/" + j })
    return { "success" : "true" , "result" : callback , "total" : len( callback )}
################################################################################
  def __request(self):
    req = { "selection" : {} , "path" : "/" }  
    global R_NUMBER
    global P_NUMBER
    R_NUMBER = 25
    if request.params.has_key( "limit" ) and len( request.params[ "limit" ] ) > 0:
      R_NUMBER = int( request.params[ "limit" ] )
    P_NUMBER = 0
    if request.params.has_key( "start" ) and len( request.params[ "start" ] ) > 0:
      P_NUMBER = int( request.params[ "start" ] )
    result = gConfig.getOption( "/Website/ListSeparator" )
    if result[ "OK" ] :
      separator = result[ "Value" ]
    else:
      separator = ":::"
    RPC = getRPCClient("DataManagement/FileCatalog")
    result = RPC.getMetadataFields()
    gLogger.debug( "request: %s" % result )
    if not result["OK"]:
      gLogger.error( "request: %s" % result[ "Message" ] )
      return req
    result = result["Value"]
    if not result.has_key( "FileMetaFields" ):
      error = "Service response has no FileMetaFields key. Return empty dict"
      gLogger.error( "request: %s" % error )
      return req
    if not result.has_key( "DirectoryMetaFields" ):
      error = "Service response has no DirectoryMetaFields key. Return empty dict"
      gLogger.error( "request: %s" % error )
      return req
    filemeta = result[ "FileMetaFields" ]
    dirmeta = result[ "DirectoryMetaFields" ]
    meta = []
    for key,value in dirmeta.items() :
      meta.append( key )
    gLogger.always( "request: metafields: %s " % meta )
    for i in request.params :
      tmp = str( i ).split( '.' )
      if len( tmp ) < 3 :
        continue
      logic = tmp[ 1 ]
      if not logic in [ "=" , "!=" , ">=" , "<=" , ">" , "<" ] :
        gLogger.always( "Operand '%s' is not supported " % logic )
        continue
      name = ''.join( tmp[ 2: ] )
      if name in meta :
        if not req[ "selection" ].has_key( name ):
          req[ "selection" ][ name ] = dict()
        value = str( request.params[ i ] ).split( separator )
        gLogger.always( "Value for metafield %s: %s " % ( name , value ) )
        if not logic in [ "=" , "!=" ] :
          if len( value ) > 1 :
            gLogger.always( "List of values is not supported for %s " % logic )
            continue
          value = value[ 0 ]
          req[ "selection" ][ name ][ logic ] = value
        else :
          if not req[ "selection" ][ name ].has_key( logic ) :
            req[ "selection" ][ name ][ logic ] = value
            continue
          for j in value:
            req[ "selection" ][ name ][ logic ].append( j )
    if request.params.has_key("path") :
      req["path"] = request.params["path"]
    gLogger.always(" REQ: ",req)
    return req
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getSelector") and len(request.params["getSelector"]) > 0:
      return self.__getSelector( str(request.params["getSelector"]) )
    if request.params.has_key("getSelectorGrid"):
      return self.__getSelectorGrid()
    elif request.params.has_key("getCache"):
      return self.__getMetaCache( str( request.params["getCache"] ) )
    elif request.params.has_key("getMeta") and len(request.params["getMeta"]) > 0:
      return self.__getMetadata( str(request.params["getMeta"]) )
    elif request.params.has_key("getFile") and len(request.params["getFile"]) > 0:
      return self.__prepareURL( str(request.params["getFile"]) )
    else:
      return {"success":"false","error":"The request parameters can not be recognized or they are not defined"}
################################################################################
  def __getMetaCache( self , param ):
    result = {"EvtType":[{"Name":"aa_e1e1e3e3_o"},{"Name":"Z_uds"}],"NumberOfEvents":[{"Name": 10},{"Name": 1500000}],"BXoverlayed":[{"Name":60}],"Polarisation":[{"Name":"m80p20"},{"Name":"p80m20"}],"Datatype":[{"Name": "DST"},{"Name": "gen"}],"Luminosity": [{"Name": 98.76},{"Name": 294.4}],"Energy": [{"Name": "1.4tev"},{"Name": "1000"}],"MachineParams": [{"Name": "B1b_ws"}],"DetectorType": [{"Name": "ILD"},{"Name": "SIM"}],"Machine":[{"Name":"3tev"},{"Name":"ilc"}],"Owner":[{"Name":"alucacit"},{"Name":"yimingli"}],"DetectorModel":[{"Name":"clic_sid_cdr"},{"Name":"clic_sid_cdr3"}],"JobType":[{"Name":"gen"}]}
    return {"success":"true","result":result}
################################################################################  
  def __prepareURL(self,files):

    files = files.split(",")

    if not len(files) > 0:
      return {"success":"false","error":"No LFN given"}
    se = getRPCClient("DataManagement/StorageElementProxy")
    result = se.prepareFileForHTTP(files)
    gLogger.always(" *** ",result)    
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    httpURLs = result['HttpURL']
    httpKey = result['HttpKey']
    return {"success":"true","result":{"url":httpURLs,"cookie":httpKey}}
################################################################################
  def __getMetadata(self,key=False):
    if not key:
      return {"success":"false","error":""}
    RPC = getRPCClient("DataManagement/FileCatalog")
    result = RPC.getCompatibleMetadata({})
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    if result.has_key(key):
      result = result[key]
    callback = []
    for i in result:
      callback.append({"name":i})
    return {"success":"true","result":callback}  
################################################################################
  def __getSelector(self,select="All"):
    RPC = getRPCClient("DataManagement/FileCatalog")
    result = RPC.getMetadataFields()
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    gLogger.always(" * * * ",result)
    for key,value in result.items():
      result[key] = value.lower()
    gLogger.always(" * * * ",result)
    return {"success":"true","result":result}
################################################################################
  def __getSelectorGrid( self ):
    """
    Get the metadata tags and prepare them to be used by ExtJS AJAX store
    """
    RPC = getRPCClient( "DataManagement/FileCatalog" )
    result = RPC.getMetadataFields()
    gLogger.debug( "request: %s" % result )
    if not result[ "OK" ] :
      gLogger.error( "getSelectorGrid: %s" % result[ "Message" ] )
      return { "success" : "false" , "error" : result[ "Message" ] }
    result = result["Value"]
    callback = list()
    if not result.has_key( "FileMetaFields" ):
      error = "Service response has no FileMetaFields key"
      gLogger.error( "getSelectorGrid: %s" % error )
      return { "success" : "false" , "error" : error }
    if not result.has_key( "DirectoryMetaFields" ):
      error = "Service response has no DirectoryMetaFields key"
      gLogger.error( "getSelectorGrid: %s" % error )
      return { "success" : "false" , "error" : error }
    filemeta = result[ "FileMetaFields" ]
    if len( filemeta ) > 0 :
      for key , value in filemeta.items():
        tmp = dict()
        tmp[ "Name" ] = key
        tmp[ "Type" ] = "label"
        callback.append( tmp )
    gLogger.debug( "getSelectorGrid: FileMetaFields callback %s" % callback )
    dirmeta = result[ "DirectoryMetaFields" ]
    if len( dirmeta ) > 0 :
      for key , value in dirmeta.items():
        tmp = dict()
        tmp[ "Name" ] = key
        tmp[ "Type" ] = value.lower()
        callback.append( tmp )
    gLogger.debug( "getSelectorGrid: Resulting callback %s" % callback )
    return { "success" : "true" , "result" : callback , "total" : len( callback )}
