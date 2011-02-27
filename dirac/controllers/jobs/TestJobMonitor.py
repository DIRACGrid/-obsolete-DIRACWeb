import logging, datetime, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from DIRAC import gConfig, gLogger
import dirac.lib.credentials as credentials
from DIRAC.Interfaces.API.Dirac import Dirac

log = logging.getLogger(__name__)

class MetaFCController(BaseController):
  def display(self):
    return render("jobs/JobMonitor.mako")
