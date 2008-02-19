import logging
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *

log = logging.getLogger(__name__)

RPC = getRPCClient("dips://volhcb03.cern.ch:9191/DataManagement/TransferDBMonitoring")
#RPC = getRPCClient("WorkloadManagement/JobMonitoring")
#MANAGERRPC = getRPCClient("WorkloadManagement/JobManager")
#PILOTRPC = getRPCClient("WorkloadManagement/WMSAdministrator")

class FtsmonitorController(BaseController):
################################################################################
  def index(self):
    pagestart = time()
    result = RPC.getFTSJobs()
    if result["OK"]:
      result = result["Value"]
      c.listResult = []
      for i in result:
        tmp = []
        tmp.append(int(i[0]))
        tmp.append(str(i[1]))
        tmp.append(str(i[2]))
        tmp.append(str(i[3]))
        tmp.append(str(i[4]))
        tmp.append(float(i[5]))
        tmp.append(str(i[6]))
        tmp.append(int(i[7]))
        tmp.append(int(i[8]))
        c.listResult.append(tmp)
      return render("/data/FTSMonitor.mako")
    else:
      return result["Message"]
      RPC.getFTSInfo(id)
################################################################################
  def action(self):
    pagestart = time()
    if request.params.has_key("getFTSInfo") and len(request.params["getFTSInfo"]) > 0:
      id = int(request.params["getFTSInfo"])
      return self.__getFTSInfo(id)
    elif request.params.has_key("getStandardOutput") and len(request.params["getStandardOutput"]) > 0:
      id = int(request.params["getStandardOutput"])
      return self.__getStandardOutput(id)
    elif request.params.has_key("getBasicInfo") and len(request.params["getBasicInfo"]) > 0:
      id = int(request.params["getBasicInfo"])
      return self.__getBasicInfo(id)
    elif request.params.has_key("LoggingInfo") and len(request.params["LoggingInfo"]) > 0:
      id = int(request.params["LoggingInfo"])
      return self.__getLoggingInfo(id)
    elif request.params.has_key("getParams") and len(request.params["getParams"]) > 0:
      id = int(request.params["getParams"])
      return self.__getParams(id)
    elif request.params.has_key("deleteJobs") and len(request.params["deleteJobs"]) > 0:
      id = request.params["deleteJobs"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__delJobs(id)
    elif request.params.has_key("killJobs") and len(request.params["killJobs"]) > 0:
      id = request.params["killJobs"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__killJobs(id)
    elif request.params.has_key("resetJobs") and len(request.params["resetJobs"]) > 0:
      id = request.params["resetJobs"]
      id = id.split(",")
      id = [int(i) for i in id ]
      return self.__resetJobs(id)
    elif request.params.has_key("pilotStdOut") and len(request.params["pilotStdOut"]) > 0:
      id = request.params["pilotStdOut"]
      return self.__pilotGetOutput("out",int(id))
    elif request.params.has_key("pilotStdErr") and len(request.params["pilotStdErr"]) > 0:
      id = request.params["pilotStdErr"]
      return self.__pilotGetOutput("err",int(id))
    else:
      c.error = "Failed to get parameters"
      print "+++ E:",c.error
      return c.error
################################################################################
  def __getFTSInfo(self,id):
    print "FTS:",id
    result = RPC.getFTSInfo(id)
    if result["OK"]:
      fts = result["Value"]
      if not len(fts) > 0 :
        return "false"
      else:
        ftsResult = []
        for i in fts:
          tmp = []
          tmp.append(i[0])
          tmp.append(i[1])
          tmp.append(int(i[2]))
          tmp.append(i[3])
          tmp.append(int(i[4]))
          tmp.append(int(i[5]))
          ftsResult.append(tmp)
        print ftsResult
        return ftsResult
    else:
      c.error = result["Message"]
      print "+++ E:",c.error
      return c.error

