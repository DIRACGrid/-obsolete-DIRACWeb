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
    pagestart = time()
    RPC = getRPCClient("DataManagement/FileCatalog")
    req = self.__request()
    result = RPC.findFilesByMetadata(req,"/")
    gLogger.always(" - REZ: %s" % result)
    if result["OK"]:
      c.result = {"success":"false","result":"","error":result["Value"]}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31mJOB SUBMIT REQUEST:\033[0m %s" % (time() - pagestart))
    return c.result
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
    if not result["OK"]:
      return {}
    result = result["Value"]
    meta = []
    for key,value in result.items():
      meta.append(key)
    for i in request.params:
      if i in meta:
        req[i] = str(request.params[i]).split(separator)
    gLogger.always(" * * * ",req)
    return req
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getSelector") and len(request.params["getSelector"]) > 0:
      return self.__getSelector( str(request.params["getSelector"]) )
    elif request.params.has_key("getMeta") and len(request.params["getMeta"]) > 0:
      return self.__getMetadata( str(request.params["getMeta"]) )
    elif request.params.has_key("getFile") and len(request.params["getFile"]) > 0:
      return self.__prepareURL()
    else:
      return {"success":"false","error":"The request parameters can not be recognized or they are not defined"}
################################################################################
  def __prepareURL(self):
    import time
    time.sleep(20)
    return {"success":"true","result":"https://mardirac.in2p3.fr/DIRAC/images/content/overview1.png"}
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
    result = result["DirectoryMetaFields"]
    for key,value in result.items():
      result[key] = value.lower()
    gLogger.always(" * * * ",result)
    return {"success":"true","result":result}
