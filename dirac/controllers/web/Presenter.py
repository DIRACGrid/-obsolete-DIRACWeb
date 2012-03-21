#import logging
#from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gLogger
from DIRAC.Core.Utilities.List import uniqueElements
#from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials

########
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient
########

USER_PROFILE_NAME = "Summary"

class PresenterController(BaseController):
################################################################################
  @jsonify
  def layoutUser(self):
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.listAvailableVars()
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}    
    result = result["Value"]
    userList = []
    for i in result:
      userList.append(i[0])
    userList = uniqueElements(userList)
    userList = [{'name':x} for x in userList]
    total = len(userList)
    userList.sort()
    userList.insert(0,{'name':'All'})
    return {"success":"true","result":userList,"total":total}
################################################################################
  def display(self):
    if not authorizeAction():
      return render("/login.mako")
    c.select = self.__getBookmarks()
    return render("web/Presenter.mako")
###############################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getBookmarks") > 0:
      name = str(request.params["getBookmarks"])
      return self.__getBookmarks(name)
    elif request.params.has_key("setBookmarks") and len(request.params["setBookmarks"]) > 0:
      name = str(request.params["setBookmarks"])
      return self.__setBookmarks(name)
    elif request.params.has_key("delBookmarks") and len(request.params["delBookmarks"]) > 0:
      name = str(request.params["delBookmarks"])
      return self.__delBookmarks(name)
    elif request.params.has_key("delAllBookmarks") and len(request.params["delAllBookmarks"]) > 0:
      return self.__delAllBookmarks()
    else:
      return {"success":"false","error":"Action is not defined or not supported"}
################################################################################
  def __getDefaults():
    if not authorizeAction():
      return {"success":"false","error":"Insufficient rights"}
    upc = UserProfileClient( "Defaults", getRPCClient )
    defaults = {"success":"false"}
    result = upc.retrieveVar(USER_PROFILE_NAME)
    if result["OK"]:
      defaults = result["Value"]
################################################################################
  def __getBookmarks(self,name=False):
    if not authorizeAction():
      return {"success":"false","error":"Insufficient rights"}
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
# Set default layout
    in not name: # Returns all available variables
      result = upc.retrieveAllVars()
      if not result["OK"]:
        return {"success":"false","error":result["Message"]}
      result = result["Value"]
    else # Returns givven name
      result = upc.retrieveVar(name)
      if not result["OK"]:
        return {"success":"false","error":result["Message"]}
      result = result["Value"]
    defaults = self.__getDefaults()
    result.append( defaults )
    return {"success":"true","result":result}
################################################################################
  def __setBookmarks(self,name=False):
    if not authorizeAction():
      return {"success":"false","error":"Insufficient rights"}
    if not name:
      return {"success":"false","error":"Layout name to retrive is absent"}
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.storeVar( name )
    if result["OK"]:
      return self.__getBookmarks()
    else:
      return {"success":"false","error":result["Message"]}
################################################################################
  def __delBookmarks(self,name=False):
    if not authorizeAction():
      return {"success":"false","error":"Insufficient rights"}
    if not name:
      return {"success":"false","error":"Layout name to delete is absent"}
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.deleteVar( name )
    if result["OK"]:
      return self.__getBookmarks()
    else:
      return {"success":"false","error":result["Message"]}      
################################################################################
  def __delAllBookmarks(self):
    if not authorizeAction():
      return {"success":"false","error":"Insufficient rights"}
    username = credentials.getUsername()
    if username == "anonymous":
      return {"success":"false","error":"Forbiden action for anonymous users"}
    upc = UserProfileClient( USER_PROFILE_NAME, getRPCClient )
    result = upc.deleteProfiles( [name] )
    if result["OK"]:
      return self.__getBookmarks()
    else:
      return {"success":"false","error":result["Message"]}
