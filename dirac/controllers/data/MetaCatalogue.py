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
  def submit(self):
    RPC = getRPCClient("DataManagement/FileCatalog")
    req = self.__request()
    result = RPC.findFilesByMetadata(req,"/")
    gLogger.always(" - REZ: %s" % result)
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    if not len(result) > 0:
      return {"success":"true","result":{},"total":0}
    callback = list()
    for key,value in result.items():
      if len(value) > 0:
        for j in value:
          callback.append({"filename":key + "/" + j})
    return {"success":"true","result":callback,"total":len(callback)}
################################################################################
  def __request(self):
    req = {}  
    global R_NUMBER
    global P_NUMBER
    R_NUMBER = 25
    if request.params.has_key("limit") and len(request.params["limit"]) > 0:
      R_NUMBER = int(request.params["limit"])
    P_NUMBER = 0
    if request.params.has_key("start") and len(request.params["start"]) > 0:
      P_NUMBER = int(request.params["start"])
    result = gConfig.getOption("/Website/ListSeparator")
    if result["OK"]:
      separator = result["Value"]
    else:
      separator = ":::"
    RPC = getRPCClient("DataManagement/FileCatalog")
    result = RPC.getMetadataFields()
    gLogger.always(" +++ ",result)
    if not result["OK"]:
      return {}
    result = result["Value"]
    meta = []
    for key,value in result.items():
      for j in value:
        meta.append(j)
    gLogger.always(" * * * ",meta)
    for i in request.params:
      if i in meta:
        meta_list = str(request.params[i]).split(separator)
        if len(meta_list) == 1:
          meta_list = meta_list[0]
        req[i] = meta_list
    gLogger.always(" * * * ",req)
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
    if len( param ) > 0 :
      arg = str( param )
################################################################################  
  def __prepareURL(self,files):
#    gLogger.always(" *** ",files)
    files = files.split(",")
#    gLogger.always(" *** ",files)
    if not len(files) > 0:
      return {"success":"false","error":"No LFN given"}
#    se = getRPCClient("DataManagement/StorageElementProxy")
    se = getRPCClient("dips://volcd04.cern.ch:9199/DataManagement/StorageElementProxy")
    result = se.prepareFileForHTTP(files)
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
  def __getSelectorGrid(self):
    gLogger.always(" === ")
#    RPC = getRPCClient("DataManagement/FileCatalog")
    RPC = getRPCClient("dips://volcd04.cern.ch:9199/DataManagement/StorageElementProxy")
    result = RPC.getMetadataFields()
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    callback = list()

    for key,value in result.items():
      tmp = dict()
      tmp["Name"] = key
      tmp["Type"] = value.lower()
      callback.append(tmp)
    """
    callback = [{"Type": "varchar(128)", "Name": "EvtType"}, {"Type": "int", "Name": "NumberOfEvents"}, {"Type": "int", "Name": "BXoverlayed"}, {"Type": "datetime", "Name": "StartDate"}, {"Type": "varchar(128)", "Name": "Datatype"}, {"Type": "int", "Name": "Luminosity"}, {"Type": "varchar(128)", "Name": "Energy"}, {"Type": "varchar(128)", "Name": "MachineParams"}, {"Type": "varchar(128)", "Name": "DetectorType"}, {"Type": "varchar(128)", "Name": "Machine"}, {"Type": "int", "Name": "ProdID"}, {"Type": "int", "Name": "runnumber"}, {"Type": "varchar(128)", "Name": "Owner"}, {"Type": "varchar(128)", "Name": "DetectorModel"}, {"Type": "varchar(128)", "Name": "JobType"}]
    """
    gLogger.always(" * * * ",callback)
    return {"success":"true","result":callback,"total":len(result)}
