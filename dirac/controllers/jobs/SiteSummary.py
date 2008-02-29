import logging
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gLogger

log = logging.getLogger(__name__)

class SitesummaryController(BaseController):
################################################################################
  def display(self):
    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    pagestart = time()
    result = RPC.getSiteSummary()
    now = Time.dateTime()
    currentDate = now.strftime("%Y-%m-%d %H:%M:%S %Z")
    currentDate = "%s UTC" % currentDate
    currentTime = []
    currentTime.append(currentDate)
    if result["OK"]:
      result = result["Value"]
      c.listResult = []
      for i in result:
        stat = result[i]
        i = i.replace("\""," ? ")
        if i == "Total":
          total = []
          total.append(i)
          total.append(int(stat["Waiting"]))
          total.append(int(stat["Running"]))
          total.append(int(stat["Done"]))
          total.append(int(stat["Failed"]))
          total.append(int(stat["Stalled"]))
        else:
          tmp = []
          tmp.append(i)
          tmp.append(int(stat["Waiting"]))
          tmp.append(int(stat["Running"]))
          tmp.append(int(stat["Done"]))
          tmp.append(int(stat["Failed"]))
          tmp.append(int(stat["Stalled"]))
          c.listResult.append(tmp)
      c.listResult.append(total)
      c.listResult.append(currentTime)
      gLogger.info("SiteSummary call successful")
      return render("/jobs/SiteSummary.mako")
    else:
      gLogger.info(result["Message"])
      return result["Message"]
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("Refresh") and len(request.params["Refresh"]) > 0:
      id = str(request.params["Refresh"])
      return self.__getData(id)
    else:
      c.error = "Failed to get data"
      gLogger.info("+++ E:",c.error)
      return c.error
################################################################################
  def __getData(self,id):
    if id == "true":
      RPC = getRPCClient("WorkloadManagement/JobMonitoring")
      pagestart = time()
      result = RPC.getSiteSummary()
      now = Time.dateTime()
      currentDate = now.strftime("%Y-%m-%d %H:%M:%S %Z")
      currentDate = "%s UTC" % currentDate
      currentTime = []
      currentTime.append(currentDate)
      if result["OK"]:
        result = result["Value"]
        c.listResult = []
        for i in result:
          stat = result[i]
          i = i.replace("\""," ? ")
          if i == "Total":
            total = []
            total.append(i)
            total.append(int(stat["Waiting"]))
            total.append(int(stat["Running"]))
            total.append(int(stat["Done"]))
            total.append(int(stat["Failed"]))
            total.append(int(stat["Stalled"]))
          else:
            tmp = []
            tmp.append(i)
            tmp.append(int(stat["Waiting"]))
            tmp.append(int(stat["Running"]))
            tmp.append(int(stat["Done"]))
            tmp.append(int(stat["Failed"]))
            tmp.append(int(stat["Stalled"]))
            c.listResult.append(tmp)
        c.listResult.append(total)
        c.listResult.append(currentTime)
        gLogger.info("SiteSummary call successful")
        return c.listResult
      else:
        c.error = result["Message"]
        gLogger.info("+++ E:",c.error)
        return c.error
    else:
      c.error = "Not a correct argument"
      gLogger.info("+++ E:",c.error)
      return c.error
