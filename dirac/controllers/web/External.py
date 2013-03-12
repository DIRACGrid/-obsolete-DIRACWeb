from dirac.lib.base import *
from DIRAC import gConfig, gLogger
from dirac.lib.credentials import getUserDN, getUsername
from dirac.lib.credentials import getSelectedGroup, checkUserCredentials

class ExternalController(BaseController):

  def index(self):
    return self.display() 

  def display(self):
    checkUserCredentials()
    dn = getUserDN()
    user = getUsername()
    group = getSelectedGroup()
    gLogger.always( "User: %s, Group: %s, DN: %s" % ( user , group , dn ) )
    if dn and user == "anonymous":
      return render("/register.mako")
    if not dn or dn == "":
      return render("/info.mako")

    if "site" not in request.params:
      c.select =  gConfig.getValue( "/Website/DefaultExternalURL", "http://diracgrid.org" )
      return render( "web/External.mako" )

    # No idea what this code should do...
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

    return render( "web/External.mako" )

