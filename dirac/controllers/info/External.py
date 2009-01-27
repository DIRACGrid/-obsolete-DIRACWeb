import logging

from dirac.lib.base import *

log = logging.getLogger(__name__)

class ExternalController(BaseController):
  def display(self):
    if request.params.has_key("site") and len(request.params["site"]) > 0:
      if str(request.params["site"]) != "All":
        c.select = str(request.params["site"])
    return render("info/External.mako")
