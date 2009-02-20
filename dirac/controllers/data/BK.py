import logging
from time import time, gmtime, strftime

from dirac.lib.diset import getRPCClient
from dirac.lib.base import *
from DIRAC.BookkeepingSystem.Client.LHCB_BKKDBClient  import LHCB_BKKDBClient
from DIRAC.Core.Utilities.List import sortList
from DIRAC import gLogger
import dirac.lib.credentials as credentials

from DIRAC.Core.Utilities import Time

log = logging.getLogger(__name__)

class BkController(BaseController):
################################################################################
  def display(self):
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      return render("/login.mako")
    return render("data/BK.mako")
################################################################################
  def download(self):
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      c.result = {"success":"false","error":"You are not authorised"}
      return c.result
    cl = LHCB_BKKDBClient(getRPCClient('Bookkeeping/BookkeepingManager'))
    req = ()
    if request.params.has_key("root") and len(request.params["root"]) > 0:
      req = str(request.params["root"])
    else:
      c.result = {"success":"false","error":"File name field is empty"}
      return c.result
    if request.params.has_key("start") and len(request.params["start"]) > 0:
      startItem = request.params["start"]
    else:
      startItem = 0
    if request.params.has_key("limit") and len(request.params["limit"]) > 0:
      maxItems = request.params["limit"]
    else:
      maxItems = 25
    if request.params.has_key("type") and len(request.params["type"]) > 0:
      fileType = request.params["type"]
    else:
      fileType = "txt"
    files = self.__showFiles(req,{},startItem,maxItems)
    files = files["result"]
    tmp = cl.writePythonOrJobOptions(startItem,maxItems,req,fileType)
    fileName = "lfn_list." + fileType
    gLogger.info("\033[0;31m - \033[0m",fileName)
    response.headers['Content-type'] = 'application/x-octet-stream'
    response.headers["Content-Disposition"] = "attachment; filename=%s" % fileName
    return tmp
################################################################################
  @jsonify
  def submit(self):
    req = ()
    if request.params.has_key("root") and len(request.params["root"]) > 0:
      req = str(request.params["root"])
    else:
      req = "/"
    if request.params.has_key("level") and len(request.params["level"]) > 0:
      level = str(request.params["level"])
      if level == "showFiles":
        sortDict = {}
        if request.params.has_key("start") and len(request.params["start"]) > 0:
          StartItem = request.params["start"]
        else:
          StartItem = 0
        if request.params.has_key("limit") and len(request.params["limit"]) > 0:
          MaxItems = request.params["limit"]
        else:
          MaxItems = 25
        MaxItems = int(StartItem) + int(MaxItems)
        sortDict = ['total','now']
        return self.__showFiles(req,sortDict,StartItem,MaxItems)
      else:
        return self.__showDir(req)
    else:
      return self.__showDir(req)
################################################################################
  def __showDir(self,request):
    cl = LHCB_BKKDBClient(getRPCClient('Bookkeeping/BookkeepingManager'))
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      c.result = {"success":"false","error":"You are not authorised"}
    else:
      result = cl.list(request)
      gLogger.info("\033[0;31m R: \033[0m",result)
      if len(result) > 0:
        tempDict = {}
        for i in result:
          if i.has_key("name") and len(i["name"]) > 0:
            tempDict[i["name"]] = i
        c.result = []
        for j in sortList(tempDict.keys()):
          returnD = {}
          i = tempDict[j]
          try:
            returnD["text"] = i["name"]
            returnD["extra"] = i["fullpath"]
            returnD["allowDrag"] = "false"
            if i.has_key("level") and len(i["level"]) > 0:
              level = i["level"]
              if i.has_key("showFiles"):
                returnD["qtip"] = "showFiles"
                returnD["leaf"] = "True"
                returnD["cls"] = "x-tree-node-collapsed"
              else:
                returnD["qtip"] = level
          except:
            gLogger.info("Some error happens here: ",j)
            pass
          c.result.append(returnD)
      else:
        c.result = {"success":"false","error":"Directory is empty"}
    gLogger.info("\033[0;31mBK ShowDirectory REQUEST:\033[0m")
    return c.result
################################################################################
  def __showFiles(self,request,sortDict,StartItem,MaxItems):
    cl = LHCB_BKKDBClient(getRPCClient('Bookkeeping/BookkeepingManager'))
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      c.result = {"success":"false","error":"You are not authorised"}
    else:
      request = {'fullpath':request}
      gLogger.info("\033[0;31m - \033[0m",request)
      gLogger.info("\033[0;31m - \033[0m",sortDict)
      gLogger.info("\033[0;31m - \033[0m",StartItem)
      gLogger.info("\033[0;31m - \033[0m",MaxItems)
      result = cl.getLimitedFiles(request,sortDict,StartItem,MaxItems)
      gLogger.info("\033[0;31m RESULT \033[0m",result)
      if result.has_key("TotalRecords"):
        if result["TotalRecords"] >= 0:
          if result.has_key("ParameterNames") and result.has_key("Records"):
            if len(result["ParameterNames"]) > 0:
              if len(result["Records"]) > 0:
                c.result = []
                jobs = result["Records"]
                head = result["ParameterNames"]
                head[0] = head[0].capitalize()
                headLength = len(head)
                for i in jobs:
                  tmp = {}
                  for j in range(0,headLength):
                    tmp[head[j]] = i[j]
                  c.result.append(tmp)
                total = result["TotalRecords"]
                if result.has_key("Extras"):
                  extra = result["Extras"]
                  gLogger.info("\033[0;31m -extra: \033[0m",extra)
                  toSend = {}
                  if extra.has_key("GlobalStatistics"):
                    temExtra = extra["GlobalStatistics"]
                    if temExtra.has_key("Files Size"):
                      extra["GlobalStatistics"]["Files Size"] = self.__bytestr(extra["GlobalStatistics"]["Files Size"])
                    if temExtra.has_key("Number of Events"):
                      extra["GlobalStatistics"]["Number of Events"] = self.__niceNumbers(extra["GlobalStatistics"]["Number of Events"])
                    extra["GlobalStatistics"]["Number of Files"] = self.__niceNumbers(total)
                  for k in extra:
                    toSend[k] = {}
                    for l in extra[k]:
                      m = l.replace(" ","")
                      toSend[k][m] = extra[k][l]
                  c.result = {"success":"true","result":c.result,"total":total,"extra":toSend}
                else:
                  c.result = {"success":"true","result":c.result,"total":total}
              else:
                c.result = {"success":"false","result":"","error":"There are no data to display"}
            else:
              c.result = {"success":"false","result":"","error":"ParameterNames field is missing"}
          else:
            c.result = {"success":"false","result":"","error":"Data structure is corrupted, there is no either 'ParameterNames' key or 'Records' key"}
        else:
          c.result = {"success":"false","result":"","error":"There were no data matching your selection"}
      else:
        c.result = {"success":"false","result":"","error":"Data structure is corrupted, there is no 'TotalRecords' key"}
    gLogger.info("\033[0;31mBK ShowFiles REQUEST:\033[0m")
    return c.result
################################################################################
  def __niceNumbers(self,number):
    strList = list(str(number))
    newList = [ strList[max(0,i-3):i] for i in range( len( strList ), 0, -3 ) ]
    newList.reverse()
    gLogger.info("\033[0;31m newList: \033[0m",newList)
    finalList = []
    for i in newList:
      finalList.append(str(''.join(i)))
    gLogger.info("\033[0;31m newList \033[0m",newList)
    gLogger.info("\033[0;31m finalList \033[0m",finalList)
    finalList = " ".join( map(str,finalList) )
    gLogger.info("\033[0;31m finalList \033[0m",finalList)
    return finalList
################################################################################
  def __bytestr(self,size,precision=1):
    """Return a string representing the greek/metric suffix of a size"""
    abbrevs = [(1<<50L, ' PB'),(1<<40L, ' TB'),(1<<30L, ' GB'),(1<<20L, ' MB'),(1<<10L, ' kB'),(1, ' bytes')]
    if size==1:
      return '1 byte'
    for factor, suffix in abbrevs:
      if size >= factor:
        break
    float_string_split = `size/float(factor)`.split('.')
    integer_part = float_string_split[0]
    decimal_part = float_string_split[1]
    if int(decimal_part[0:precision]):
      float_string = '.'.join([integer_part, decimal_part[0:precision]])
    else:
      float_string = integer_part
    return float_string + suffix
################################################################################
  @jsonify
  def action(self):
    if request.params.has_key("byProd"):
      if request.params.has_key("restrictFiles"):
        type = str(request.params["restrictFiles"])
      else:
        type = "ALL"
      if request.params.has_key("prodID"):
        id = int(request.params["prodID"])
      else:
        id = 0
      if request.params.has_key("start") and len(request.params["start"]) > 0:
        start = request.params["start"]
      else:
        start = 0
      if request.params.has_key("limit") and len(request.params["limit"]) > 0:
        limit = request.params["limit"]
      else:
        limit = 25
      limit = int(start) + int(limit)
      return self.__production(id,type,start,limit)
    elif request.params.has_key("byFile"):
      if request.params.has_key("lfn"):
        id = request.params["lfn"]
      return self.__file(id)
    elif request.params.has_key("getLogInfoLFN"):
      lfn = str(request.params["getLogInfoLFN"])
      return self.__logLFN(lfn)
    elif request.params.has_key("fileTypes"):
      return self.__getFileTypes()
################################################################################
  def __production(self,prodID,type,start=0,limit=25):
    pagestart = time()
    RPC = getRPCClient('Bookkeeping/BookkeepingManager')
    if prodID == 0:
      c.result = {"success":"false","error":"There is no production with ID: %s" % prodID}
    else:
      prodID = int(prodID)
      start = long(start)
      limit = long(limit)
      result = RPC.getProductionFilesForUsers(prodID,{"type":type},{"total":"now"},start,limit)
      gLogger.info("\033[0;31m result: \033[0m",result)
      gLogger.info("\033[0;31m getProductionFilesForUsers(%s,{'type':%s},{'total':'now'},%s,%s) \033[0m" % (prodID,type,start,limit))
      if result["OK"]:
        result = result["Value"]
        if result.has_key("TotalRecords"):
          if result["TotalRecords"] >= 0:
            if result.has_key("ParameterNames") and result.has_key("Records"):
              if len(result["ParameterNames"]) > 0:
                if len(result["Records"]) > 0:
                  c.result = []
                  jobs = result["Records"]
                  head = result["ParameterNames"]
                  headLength = len(head)
                  for i in jobs:
                    tmp = {}
                    for j in range(0,headLength):
                      tmp[head[j]] = i[j]
                    c.result.append(tmp)
                  total = result["TotalRecords"]
                  if result.has_key("Extras"):
                    extra = result["Extras"]
                    gLogger.info("\033[0;31m extra: \033[0m",extra)
                    toSend = {}
                    if extra.has_key("GlobalStatistics"):
                      temExtra = extra["GlobalStatistics"]
                      if temExtra.has_key("Files Size"):
                        extra["GlobalStatistics"]["Files Size"] = self.__bytestr(extra["GlobalStatistics"]["Files Size"])
                      if temExtra.has_key("Number of Events"):
                        extra["GlobalStatistics"]["Number of Events"] = self.__niceNumbers(extra["GlobalStatistics"]["Number of Events"])
                      extra["GlobalStatistics"]["Number of Files"] = self.__niceNumbers(total)
                    for k in extra:
                      toSend[k] = {}
                      for l in extra[k]:
                        m = l.replace(" ","")
                        toSend[k][m] = extra[k][l]
                    c.result = {"success":"true","result":c.result,"total":total,"extra":toSend}
                  else:
                    c.result = {"success":"true","result":c.result,"total":total}
                else:
                  c.result = {"success":"false","result":"","error":"There are no data to display"}
              else:
                c.result = {"success":"false","result":"","error":"ParameterNames field is missing"}
            else:
              c.result = {"success":"false","result":"","error":"Data structure is corrupted, there is no either 'ParameterNames' key or 'Records' key"}
          else:
            c.result = {"success":"false","result":"","error":"There were no data matching your selection"}
        else:
          c.result = {"success":"false","result":"","error":"Data structure is corrupted, there is no 'TotalRecords' key"}
      else:
        c.result = {"success":"false","error":result["Message"]}
#      gLogger.info(result)
    gLogger.info("\033[0;31m * * * Bookkeeping REQUEST: \033[0m %s" % (time() - pagestart))
    gLogger.info("Bookkeeping/BookkeepingManager getProductionFiles: ",prodID)
    return c.result
################################################################################
  def __file(self,lfn=""):
    RPC = getRPCClient('Bookkeeping/BookkeepingManager')
    lfn = str(lfn)
    if len(lfn) == 0:
      c.result = {"success":"false","error":"LFN name is empty"}
    else:
      result = RPC.getFileMetaDataForUsers([lfn])
      gLogger.info(result)
      if result["OK"]:
        result = result["Value"]
        if result.has_key("TotalRecords"):
          if result["TotalRecords"] >= 0:
            if result.has_key("ParameterNames") and result.has_key("Records"):
              if len(result["ParameterNames"]) > 0:
                if len(result["Records"]) > 0:
                  c.result = []
                  jobs = result["Records"]
                  head = result["ParameterNames"]
                  headLength = len(head)
                  for i in jobs:
                    tmp = {}
                    for j in range(0,headLength):
                      tmp[head[j]] = i[j]
                    c.result.append(tmp)
                  total = result["TotalRecords"]
                  if result.has_key("Extras"):
                    extra = result["Extras"]
                    gLogger.info("\033[0;31m -extra: \033[0m",extra)
                    toSend = {}
                    if extra.has_key("GlobalStatistics"):
                      temExtra = extra["GlobalStatistics"]
                      if temExtra.has_key("Files Size"):
                        extra["GlobalStatistics"]["Files Size"] = self.__bytestr(extra["GlobalStatistics"]["Files Size"])
                      if temExtra.has_key("Number of Events"):
                        extra["GlobalStatistics"]["Number of Events"] = self.__niceNumbers(extra["GlobalStatistics"]["Number of Events"])
                      extra["GlobalStatistics"]["Number of Files"] = self.__niceNumbers(total)
                    for k in extra:
                      toSend[k] = {}
                      for l in extra[k]:
                        m = l.replace(" ","")
                        toSend[k][m] = extra[k][l]
                    c.result = {"success":"true","result":c.result,"total":total,"extra":toSend}
                  else:
                    c.result = {"success":"true","result":c.result,"total":total}
                else:
                  c.result = {"success":"false","result":"","error":"There are no data to display"}
              else:
                c.result = {"success":"false","result":"","error":"ParameterNames field is missing"}
            else:
              c.result = {"success":"false","result":"","error":"Data structure is corrupted, there is no either 'ParameterNames' key or 'Records' key"}
          else:
            c.result = {"success":"false","result":"","error":"There were no data matching your selection"}
        else:
          c.result = {"success":"false","result":"","error":"Data structure is corrupted, there is no 'TotalRecords' key"}
      else:
        c.result = {"success":"false","error":result["Message"]}
#      if result["OK"]:
#        c.result = result["Value"]
#        c.result = {"success":"true","result":c.result}
#      else:
#        c.result = {"success":"false","error":result["Message"]}
    gLogger.info("Bookkeeping/BookkeepingManager getFileMetadata: ",lfn)
    return c.result
################################################################################
  def __getFileTypes(self):
    RPC = getRPCClient('Bookkeeping/BookkeepingManager')
    result = RPC.getAvailableFileTypes()
    if result["OK"]:
      oldValue = result["Value"]
      c.result = [{"type":"ALL"}]
      for i in oldValue:
        tmp = {"type":i[0]}
        c.result.append(tmp)
      c.result = {"result":c.result}
    else:
      c.result = {"result":{"type":"Error during RPC call"}}
    return c.result
################################################################################
#  @jsonify
  def info(self):
    if request.params.has_key("start") and len(request.params["start"]) > 0:
      StartItem = request.params["start"]
    else:
      StartItem = 0
    gLogger.info("\033[0;31m !!! \033[0m")
    if request.params.has_key("limit") and len(request.params["limit"]) > 0:
      MaxItems = request.params["limit"]
    else:
      MaxItems = 1
    gLogger.info("\033[0;31m !!! \033[0m")
    if request.params.has_key("root") and len(request.params["root"]) > 0:
      root = request.params["root"]
    else:
      return "Error! Root variable is not defined"
    gLogger.info("\033[0;31m !!! \033[0m")
    cl = LHCB_BKKDBClient(getRPCClient('Bookkeeping/BookkeepingManager'))
    result = cl.getLimitedInformations(StartItem,MaxItems,root)
    if result["OK"]:
      result = result["Value"]
      if result["Number of files"]:
        nof = "<b>Number of files:</b> " + str( result["Number of files"] ) + "<br>"
      else:
        nof = "<b>Number of files:</b> Cant' get this value<br>"
      if result["Number of Events"]:
        noe = "<b>Number of Events:</b> " + str( self.__niceNumbers(result["Number of Events"]) ) + "<br>"
      else:
        noe = "<b>Number of Events:</b> Cant' get this value<br>"
      if result["Files Size"]:
        fs = "<b>Files Size:</b> " + str( self.__bytestr(result["Files Size"]) ) + "<br>"
      else:
        fs = "<b>Files Size:</b> Cant' get this value<br>"
      c.result = nof + noe + fs
    else:
      c.result = result["Message"]
    return c.result
################################################################################
#  @jsonify
  def __logLFN(self,lfn):
    RPC = getRPCClient("DataManagement/DataLogging")
    result = RPC.getFileLoggingInfo(lfn)
    gLogger.info("\033[0;31m logLFN: \033[0m",result)
    if result["OK"]:
      result = result["Value"]
      c.result = []
      for i in result:
        c.result.append({"Status":i[0],"MinorStatus":i[1],"StatusTime":i[2],"Source":i[3]})
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31m logLFN: \033[0m",c.result)
    return c.result
