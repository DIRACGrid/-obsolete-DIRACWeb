import os

from dirac.lib.base import *
from DIRAC import gConfig, gLogger, rootPath
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import getUserDN, getUsername
from dirac.lib.credentials import getSelectedGroup, checkUserCredentials
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient

class ExternalController(BaseController):

  def index(self):
    return self.display() 

  def display(self):
    checkUserCredentials()
    dn = getUserDN()
    user = getUsername()
    group = getSelectedGroup()
    gLogger.always( "User: %s, Group: %s, DN: %s" % ( user , group , dn ) )
    templates = [ "reg_%s.mako" % i for i in [ "done" , "form" , "info" ] ]
    html = [ "reg_%s.html" % i for i in [ "footer" , "header" , "conditions" , "form" , "done" ] ]
    files = templates + html
    basedir = os.path.join( rootPath , "Web" , "dirac" , "templates" )
    for i in files:
      f = os.path.join( basedir , i )
      if not os.path.exists( f ):
        gLogger.error( "File does not exists: %s" % f )
        return render( "web/External.mako" )
    if dn and user == "anonymous":
      upc = UserProfileClient( "Registration" , getRPCClient )
      result =  upc.retrieveVar( dn )
      if result[ "OK" ]:
        c.sent = result[ "Value" ]
        return render( "/reg_done.mako" )
      else:
        return render("/reg_form.mako")
    if not dn or dn == "":
      return render("/reg_info.mako")

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
