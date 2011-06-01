import logging

from dirac.lib.base import *
from DIRAC.ConfigurationSystem.Client.Config import gConfig

log = logging.getLogger(__name__)

class ExternalController(BaseController):

  def index(self):
    return self.display() 

  def display(self):
    if request.params.has_key( "site" ) and len( request.params[ "site" ] ) > 0:
      if str( request.params[ "site" ] ) != "All":
        c.select = str( request.params[ "site" ] )
    else:
      c.select =  gConfig.getValue( "/Website/DefaultExternalURL", "http://diracgrid.org" )
    return render( "web/External.mako" )

