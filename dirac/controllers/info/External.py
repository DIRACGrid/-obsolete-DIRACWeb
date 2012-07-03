from dirac.lib.base import *
from DIRAC import gConfig, gLogger

class ExternalController(BaseController):

  def index(self):
    return self.display() 

  def display(self):
    if request.params.has_key( "site" ) and len( request.params[ "site" ] ) > 0:
      if str( request.params[ "site" ] ) != "All":
        c.select = str( request.params[ "site" ] )
        gLogger.debug("Request's body:")
        for key in request.params.keys():
          if not key == "site" and len(request.params[key]) > 0:
            c.select = c.select + "&" + key + "=" + request.params[key]
            try:
              gLogger.debug("%s - %s" % (key,request.params[key]))
            except Exception,x:
              gLogger.error("Exception: %s" % str(x))
              pass
    else:
      c.select =  gConfig.getValue( "/Website/DefaultExternalURL", "http://diracgrid.org" )
    return render( "web/External.mako" )

