import logging, os, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
#from DIRAC.Core.Utilities.DictCache import DictCache
from DIRAC import gLogger
from DIRAC import S_ERROR, S_OK

log = logging.getLogger(__name__)

#cache = DictCache()

class MapController(BaseController):
  #__imgCache = DictCache()
  def display(self):
    return render("web/Map.mako")
################################################################################
  def getKML(self):
    pagestart = time()
    transferClient = getTransferClient('Monitoring/SiteMapping')
    name = request.params["name"]
    tmpFile = tempfile.NamedTemporaryFile()
    gLogger.info('-- Arguments to SiteMapping service: %s %s ' %(tmpFile.name,name))
    result = transferClient.receiveFile(tmpFile.name,name)
    teststring = "operation result for request file " + name + ": "
    gLogger.info(teststring, result)
    if not result["OK"]:
      c.result = result["Message"]
      return c.result
    tmpFile.seek( 0 )
    data = tmpFile.read()
    #self.__imgCache.add(name, 600, data)
    return data

    transferClient = getTransferClient('Monitoring/SiteMapping')
    if "name" not in request.params:
      c.result = "file name is absent"
      return c.result
    name = request.params["name"]
#    if name.find( ".kml" ) < -1:
#      c.result = "Not a valid file"
#      return c.result
    gLogger.info("request for the file:", name)
    data = self.__imgCache.get(name)
    gLogger.info("data from cache:", data)
    if not data:
      tmpFile = tempfile.NamedTemporaryFile()
      result = transferClient.receiveFile(tmpFile.name,name)
      teststring = "operation result for request file " + name + ": "
      gLogger.info(teststring, result)
      if not result["OK"]:
        c.result = result["Message"]
        return c.result
      tmpFile.seek( 0 )
      data = tmpFile.read()
      self.__imgCache.add(name, 600, data)
#      gLogger.info("CACHE after add:", self.__imgCache.getKeys(100))
    else:
      gLogger.info("this file taken from cache:", name)
    response.headers['Content-type'] = 'text/xml; charset=utf-8'
    gLogger.info("CACHE:", self.__imgCache.getKeys(600))
    return data
################################################################################
  def getImg(self):
    pagestart = time()
    transferClient = getTransferClient("Monitoring/SiteMapping")
    if "name" not in request.params:
      c.result = "file name is absent"
      return c.result
    name = request.params["name"]
#    if name.find( ".png" ) < -1:
#      c.result = "Not a valid image file"
#      return c.result
    gLogger.info("request for the file:", name)
    #data = self.__imgCache.get(name)
    #if not data:
    tmpFile = tempfile.NamedTemporaryFile()
    result = transferClient.receiveFile(tmpFile.name,name)
    teststring = "operation result for request file " + name + ": "
    gLogger.info(teststring, result)
    if not result["OK"]:
      c.result = result["Message"]
      return c.result
    tmpFile.seek( 0 )
    data = tmpFile.read()
      #self.__imgCache.add(name, 600, data)
    #else:
    #  gLogger.info("this file taken from cache:", name)
    response.headers['Content-type'] = 'image/png'
    response.headers['Content-Disposition'] = 'attachment; filename="%s"' % name
    response.headers['Content-Length'] = len(data)
    response.headers['Content-Transfer-Encoding'] = 'Binary'
    return data
