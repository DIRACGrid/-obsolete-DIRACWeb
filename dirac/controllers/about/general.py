import logging
import os

from dirac.lib.base import *

log = logging.getLogger(__name__)

class GeneralController(BaseController):

  def index(self):
    return render( "/about/welcome.mako" )

  def download(self):
    return render( "/about/welcome.mako" )

  def team(self):
    return render( "/about/welcome.mako" )

  def logos(self):
    c.imagePath = "%s/public/images/logos/" % os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return render( "/about/logos.mako" )
