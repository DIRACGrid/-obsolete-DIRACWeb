import logging

from dirac.lib.base import *

log = logging.getLogger(__name__)

class MonitoringController(BaseController):

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return 'Hello World'


  def showByCategory(self):
    return render( "/systems/monitoring/byCategory.mako" )
