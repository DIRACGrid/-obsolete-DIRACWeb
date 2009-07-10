import logging

from dirac.lib.base import *

log = logging.getLogger(__name__)

class MessageController(BaseController):
  @jsonify
  def index(self):
#    c.res = {"success":"false","error":"Test message"}
    c.res = {"success":"true","message":"Andrew's message N2, now with URL but it could fsiled<br><a href='https://lhcbtest.pic.es/DIRAC/LHCb-Production/lhcb/data/RunDBMonitor/display'></a>","id":"7"}
    return c.res
#    return 'Hello World'
