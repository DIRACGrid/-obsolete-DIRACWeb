from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from DIRAC import gLogger
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient

class PresenterController(BaseController):
################################################################################
  def display(self):
    name = 'Presenter'
    self.__convert(name)
#    default_values = 'ZGVmYXVsdA==' # Var to store default layout
    upc = UserProfileClient(name,getRPCClient )
#    result = upc.retrieveVar(default_values)
    result = upc.retrieveAllVars()
    if result["OK"]:
      c.select = result["Value"]          
    else:
      gLogger.error(result["Message"])
      c.select = ''
    return render("web/Presenter.mako")
################################################################################
  def __convert(self,profile):
    profileName = 'Summary'    
    upc = UserProfileClient( profileName, getRPCClient )
    upc_new = UserProfileClient( profile, getRPCClient )
    result = upc.retrieveAllVars()
    if result["OK"]:
      result = result["Value"]
      gLogger.error("************")
      gLogger.error(result)
      gLogger.error("************")
      if result.has_key('Bookmarks') and result['Bookmarks'].has_key('defaultLayout'):
        upc_new.storeVar('ZGVmYXVsdA==',result['Bookmarks']['defaultLayout'])
      if result.has_key('Bookmarks') and result['Bookmarks'].has_key('layouts'):
        for i in result['Bookmarks']['layouts'].keys():
          new_profile = {}
          index = 0
          for j in result['Bookmarks']['layouts'][i].keys():
            if j == 'url':
              url = result['Bookmarks']['layouts'][i][j].split(';')
              for k in url:
                k = k.strip()
                if len(k) > 1:
                  if k != '[ampersand]':
                      new_profile['img_'+str(index)] = k
                      index = index + 1
            else:
              new_profile[j] = result['Bookmarks']['layouts'][i][j]
          upc_new.storeVar(i,new_profile)      
      c.result = True
    else:
      gLogger.error(result["Message"])
      c.result = False
    return c.result
################################################################################