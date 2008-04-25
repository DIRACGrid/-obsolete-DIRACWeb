import logging

from dirac.lib.base import *

log = logging.getLogger(__name__)

class AccountingController(BaseController):

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return redirect_to( url_for( "/systems/accounting/dataOperation" ) )

  def dataOperation(self):
    return render ("/systems/accounting/dataOperation.mako")

  @jsonify
  def ajaxCall(self):
    return True