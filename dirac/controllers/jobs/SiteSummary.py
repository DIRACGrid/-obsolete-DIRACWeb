import logging
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *

log = logging.getLogger(__name__)

RPC = getRPCClient("dips://volhcb03.cern.ch:9130/WorkloadManagement/JobMonitoring")
#RPC = getRPCClient("WorkloadManagement/JobMonitoring")
#MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
#PILOTRPC = getRPCClient("WorkloadManagement/WMSAdministrator")
#numberOfJobs = 25
#pageNumber = 0
#globalSort = "jobID"

class SitesummaryController(BaseController):
  def index(self):
    pagestart = time()
    result = RPC.getSiteSummary()
    if result["OK"]:
      result = result["Value"]
      c.listResult = []
      for i in result:
        stat = result[i]
        if i == "Total":
          total = []
          total.append(i)
          total.append(int(stat["Waiting"]))
          total.append(int(stat["Running"]))
          total.append(int(stat["Done"]))
          total.append(int(stat["Failed"]))
        else:
          tmp = []
          tmp.append(i)
          tmp.append(int(stat["Waiting"]))
          tmp.append(int(stat["Running"]))
          tmp.append(int(stat["Done"]))
          tmp.append(int(stat["Failed"]))
          c.listResult.append(tmp)
      c.listResult.append(total)
      return render("/jobs/SiteSummary.mako")
    else:
      return result["Message"]
