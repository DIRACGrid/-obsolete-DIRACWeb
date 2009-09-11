import logging, datetime, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gLogger
from DIRAC.Core.Utilities.List import sortList
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials
from DIRAC.ConfigurationSystem.Client.Config import gConfig

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []

class StoragedirectoryController(BaseController):
################################################################################
  def display(self):
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      return render("/login.mako")
    c.select = self.__getSelectionData()
    if not c.select.has_key("extra"):
      c.select["extra"] = {}
    userName = credentials.getUsername()
    path = "/lhcb/user/" + userName[0] + "/" + userName
    path = str(path)
    if lhcbGroup == "lhcb":
      c.select["extra"]["dir"] = path
    elif lhcbGroup == "lhcb_user":
      c.select["extra"]["dir"] = path
    else:
      c.select["extra"]["dir"] = "/lhcb/MC/MC09"
    return render("data/DirectorySummary.mako")
################################################################################
  def __getSelectionData(self):
    callback = {}
    lhcbGroup = credentials.getSelectedGroup()
    lhcbUser = str(credentials.getUsername())
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
      gLogger.info(" - ",callback["extra"])
###
    RPC = getRPCClient("dips://volhcb08.cern.ch:9151/DataManagement/StorageUsage")
    result = RPC.getStorageElementSelection()
    if result["OK"]:
      se = []
      if len(result["Value"])>0:
        se.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          se.append([i])
      else:
        se = [["Nothing to display"]]
    else:
      se = [["Error during RPC call"]]
    callback["se"] = se
###
    return callback
################################################################################
  def __request(self):
    req = {}
    lhcbGroup = credentials.getSelectedGroup()
    lhcbUser = str(credentials.getUsername())
    global pageNumber
    global numberOfJobs
    global globalSort
    if request.params.has_key("limit") and len(request.params["limit"]) > 0:
      numberOfJobs = int(request.params["limit"])
      if request.params.has_key("start") and len(request.params["start"]) > 0:
        pageNumber = int(request.params["start"])
      else:
        pageNumber = 0
    else:
      numberOfJobs = 25
      pageNumber = 0
    if request.params.has_key("prod") and len(request.params["prod"]) > 0:
      if str(request.params["prod"]) != "All":
        req["Production"] = str(request.params["prod"])
    if request.params.has_key("type") and len(request.params["type"]) > 0:
      if str(request.params["type"]) != "All":
        req["FileType"] = str(request.params["type"])
    if request.params.has_key("se") and len(request.params["se"]) > 0:
      if str(request.params["se"]) != "All":
        req["SEs"] = str(request.params["se"]).split('::: ')
    if request.params.has_key("dir") and len(request.params["dir"]) > 0:
      if str(request.params["dir"]) != "All":
        req["Directory"] = str(request.params["dir"])
    if request.params.has_key("sort") and len(request.params["sort"]) > 0:
      globalSort = str(request.params["sort"])
      key,value = globalSort.split(" ")
      globalSort = [[str(key),str(value)]]
    else:
      globalSort = [["Production","DESC"]]
    gLogger.info("REQUEST:",req)
    return req
################################################################################
#self.__bytestr(extra["GlobalStatistics"]["Files Size"])

  @jsonify
  def submit(self):
    gLogger.info(" -- SUBMIT --")
    RPC = getRPCClient("dips://volhcb08.cern.ch:9151/DataManagement/StorageUsage")
    result = self.__request()
    gLogger.info(" req ", result)
    gLogger.info(" sort ", globalSort)
    gLogger.info(" start ", pageNumber)
    gLogger.info(" end ", numberOfJobs)
    result = RPC.getStorageDirectorySummaryWeb(result,globalSort,pageNumber,numberOfJobs)
    if result["OK"]:
      result = result["Value"]
      gLogger.info("ReS",result)
      if result.has_key("TotalRecords"):
        if  result["TotalRecords"] > 0:
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
                for i in c.result:
                  if i.has_key("Size"):
                    i["Size"] = self.__bytestr(i["Size"])
#                  if i.has_key("Files"):
#                    i["Files"] = self.__niceNumbers(i["Files"])
                total = result["TotalRecords"]
                if result.has_key("Extras"):
                  extra = []
                  tmpExtra = result["Extras"]
                  for i in tmpExtra:
                    mySize = self.__bytestr(tmpExtra[i]["Size"])
                    extra.append([i,tmpExtra[i]["Files"],mySize])
                  c.result = {"success":"true","result":c.result,"total":total,"extra":extra}
                else:
                  c.result = {"success":"true","result":c.result,"total":total}
              else:
                c.result = {"success":"false","result":"","error":"There are no data to display"}
            else:
              c.result = {"success":"false","result":"","error":"ParameterNames field is missing"}
          else:
            c.result = {"success":"false","result":"","error":"Data structure is corrupted"}
        else:
          c.result = {"success":"false","result":"","error":"There were no data matching your selection"}
      else:
        c.result = {"success":"false","result":"","error":"Data structure is corrupted"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31mJOB SUBMIT REQUEST:\033[0m")
    return c.result
################################################################################
  def __niceNumbers(self,number):
    strList = list(str(number))
    newList = [ strList[max(0,i-3):i] for i in range( len( strList ), 0, -3 ) ]
    newList.reverse()
    finalList = []
    for i in newList:
      finalList.append(str(''.join(i)))
    finalList = " ".join( map(str,finalList) )
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
