import logging

from dirac.lib.base import *
from dirac.lib.credentials import authorizeAction

log = logging.getLogger(__name__)

class ControlController(BaseController):

  def index(self):
    return render( '/web/environment.mako' )
 