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

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["JobID","DESC"]]

class RequestdbsummaryController(BaseController):
################################################################################
  def display(self):
    return render("data/RequestDBSummary.mako")
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
      if callback["extra"].has_key("prod"):
        callback["extra"]["prod"] = callback["extra"]["prod"].zfill(8)
        if callback["extra"]["prod"] == "00000000":
          callback["extra"]["prod"] = ""
      gLogger.info(" - ",callback["extra"])
    if lhcbUser == "Anonymous":
      callback["prod"] = [["Insufficient rights"]]
    else:
      RPC = getRPCClient("WorkloadManagement/JobMonitoring")
      result = RPC.getProductionIds()
      if result["OK"]:
        prod = []
        prods = result["Value"]
        if len(prods)>0:
          prod.append([str("All")])
          tmp = []
          for keys in prods:
            try:
              id = str(int(keys)).zfill(8)
            except:
              id = str(keys)
            tmp.append(str(id))
          tmp.sort(reverse=True)
          for i in tmp:
            prod.append([str(i)])
        else:
          prod = [["Nothing to display"]]
      else:
        prod = [["Error during RPC call"]]
      callback["prod"] = prod
###
    if lhcbUser == "Anonymous":
      callback["site"] = [["Insufficient rights"]]
    else:
      RPC = getRPCClient("WorkloadManagement/JobMonitoring")
      result = RPC.getSites()
      if result["OK"]:
        site = []
        tier1 = list(["LCG.CERN.ch","LCG.CNAF.it","LCG.GRIDKA.de","LCG.IN2P3.fr","LCG.NIKHEF.nl","LCG.PIC.es","LCG.RAL.uk"])
        if len(result["Value"])>0:
          s = list(result["Value"])
          site.append([str("All")])
          for i in tier1:
            site.append([str(i)])
          for i in s:
            if i not in tier1:
              site.append([str(i)])
        else:
          site = [["Nothing to display"]]
      else:
        site = [["Error during RPC call"]]
      callback["site"] = site
###
    if lhcbUser == "Anonymous":
      callback["stat"] = [["Insufficient rights"]]
    else:
      result = RPC.getStates()
      if result["OK"]:
        stat = []
        if len(result["Value"])>0:
          stat.append([str("All")])
          for i in result["Value"]:
            stat.append([str(i)])
        else:
          stat = [["Nothing to display"]]
      else:
        stat = [["Error during RPC call"]]
      callback["stat"] = stat
###
    if lhcbUser == "Anonymous":
      callback["minorstat"] = [["Insufficient rights"]]
    else:
      result = RPC.getMinorStates()
      if result["OK"]:
        stat = []
        if len(result["Value"])>0:
          stat.append([str("All")])
          for i in result["Value"]:
            stat.append([str(i)])
        else:
          stat = [["Nothing to display"]]
      else:
        stat = [["Error during RPC call"]]
      callback["minorstat"] = stat
###
    if lhcbUser == "Anonymous":
      callback["app"] = [["Insufficient rights"]]
    else:
      result = RPC.getApplicationStates()
      if result["OK"]:
        app = []
        if len(result["Value"])>0:
          app.append([str("All")])
          for i in result["Value"]:
            app.append([str(i)])
        else:
          app = [["Nothing to display"]]
      else:
        app = [["Error during RPC call"]]
      callback["app"] = app
###
    if lhcbUser == "Anonymous":
      callback["owner"] = [["Insufficient rights"]]
    elif lhcbGroup == "lhcb":
      callback["owner"] = [["All"],[str(credentials.getUsername())]]
    elif lhcbGroup == "lhcb_user":
      callback["owner"] = [["All"],[str(credentials.getUsername())]]
    else:
      result = RPC.getOwners()
      if result["OK"]:
        owner = []
        if len(result["Value"])>0:
          owner.append([str("All")])
          for i in result["Value"]:
            owner.append([str(i)])
        else:
          owner = [["Nothing to display"]]
      else:
        owner = [["Error during RPC call"]]
      callback["owner"] = owner
    return callback
################################################################################
  @jsonify
  def submit(self):
    gLogger.info(" -- SUBMIT --")
    pagestart = time()
    RPC = getRPCClient("RequestManagement/voBoxURLs")
    result = RPC.getDBSummary()
    if result["OK"]:
      result = result["Value"]
      gLogger.info("ReS",result)
# {'transfer': {'Assigned': 0, 'ToDo': 59}, 'diset': {'Assigned': 0, 'ToDo': 105}, 'register': {'Assigned': 0, 'ToDo': 63}, 'removal': {'Assigned': 0, 'ToDo': 59}}
      if len(result) > 0:
        total = len(result)
        c.result = []
        for key,value in result.items():
          value['Assigned']
          value['ToDo']
#        for i in pmt:
#          tmp.append(i)
        c.result.append(pmt)
        c.result.append(pmt)
        c.result = {"success":"true","result":c.result,"total":2}
      else:
        c.result = {"success":"false","result":"","error":"There were no data matching your selection"}  
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31mJOB SUBMIT REQUEST:\033[0m %s" % (time() - pagestart))
    return c.result
################################################################################
