import logging
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
from DIRAC import gLogger

log = logging.getLogger(__name__)

class PilotsummaryController(BaseController):
################################################################################
  def display(self):
    RPC = getRPCClient("WorkloadManagement/WMSAdministrator")
    pagestart = time()
    result = RPC.getPilotSummary()
    now = Time.dateTime()
    currentDate = now.strftime("%Y-%m-%d %H:%M:%S %Z")
    currentDate = "%s UTC" % currentDate
    currentTime = []
    currentTime.append(currentDate)
    if result["OK"]:
      result = result["Value"]
      c.listResult = []
      for key,value in result.items():
        if key == "Multiple":
          key = "_unknown_"
        submited = 0
        ready = 0
        scheduled = 0
        running = 0
        done = 0
        cleared = 0
        aborted = 0
        if value.has_key("Submited"):
          submited = int(value["Submited"])
        if value.has_key("Ready"):
          ready = int(value["Ready"])
        if value.has_key("Scheduled"):
          scheduled = int(value["Scheduled"])
        if value.has_key("Running"):
          running = int(value["Running"])
        if value.has_key("Done"):
          done = int(value["Done"])
        if value.has_key("Cleared"):
          cleared = int(value["Cleared"])
        if value.has_key("Aborted"):
          aborted = int(value["Aborted"])
        c.listResult.append([key,submited,ready,scheduled,running,done,cleared,aborted])
      c.listResult.append(currentTime)
      gLogger.info("PilotSummary call successful")
      return render("/jobs/PilotSummary.mako")
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
      RPC = getRPCClient("WorkloadManagement/WMSAdministrator")
      pagestart = time()
      result = RPC.getPilotSummary()
      now = Time.dateTime()
      currentDate = now.strftime("%Y-%m-%d %H:%M:%S %Z")
      currentDate = "%s UTC" % currentDate
      currentTime = []
      currentTime.append(currentDate)
      if result["OK"]:
        result = result["Value"]
        c.listResult = []
        for key,value in result.items():
          if key == "Multiple":
            key = "_unknown_"
          submited = 0
          ready = 0
          scheduled = 0
          running = 0
          done = 0
          cleared = 0
          aborted = 0
          if value.has_key("Submited"):
            submited = int(value["Submited"])
          if value.has_key("Ready"):
            ready = int(value["Ready"])
          if value.has_key("Scheduled"):
            scheduled = int(value["Scheduled"])
          if value.has_key("Running"):
            running = int(value["Running"])
          if value.has_key("Done"):
            done = int(value["Done"])
          if value.has_key("Cleared"):
            cleared = int(value["Cleared"])
          if value.has_key("Aborted"):
            aborted = int(value["Aborted"])
          c.listResult.append([key,submited,ready,scheduled,running,done,cleared,aborted])
        c.listResult.append(currentTime)
        gLogger.info("PilotSummary call successful")
        return c.listResult
      else:
        c.error = result["Message"]
        gLogger.info("+++ E:",c.error)
        return c.error
    else:
      c.error = "Not a correct argument"
      gLogger.info("+++ E:",c.error)
      return c.error
