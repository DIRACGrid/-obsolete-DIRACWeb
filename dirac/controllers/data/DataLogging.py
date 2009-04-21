import logging
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from dirac.lib.sessionManager import *
import dirac.lib.credentials as credentials

log = logging.getLogger(__name__)

numberOfJobs = 25
pageNumber = 0
globalSort = []
globalSort = [["FileID","DESC"]]

class DataloggingController(BaseController):
################################################################################
  def display(self):
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      return render("/login.mako")
    return render("data/DataLogging.mako")
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      c.result = {"success":"false","error":"You are not authorised"}
      return c.result
    if request.params.has_key("lfn") and len(request.params["lfn"]) > 0:
      lfn = str(request.params["lfn"])
    else:
#      c.result = {"success":"false","error":"The LFN is absent"}
      c.result = {"success":"true","result":""}
      return c.result
    RPC = getRPCClient("DataManagement/DataLogging")
    result = RPC.getFileLoggingInfo(lfn)
    if result["OK"]:
      result = result["Value"]
      c.result = []
      for i in result:
        c.result.append({"Status":i[0],"MinorStatus":i[1],"StatusTime":i[2],"Source":i[3]})
      c.result = {"success":"true","result":c.result}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31m Pilot Summary SUBMIT REQUEST:\033[0m %s" % (time() - pagestart))
    return c.result
################################################################################
