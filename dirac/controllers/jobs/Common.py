import logging, datetime, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials
from DIRAC.Interfaces.API.Dirac import Dirac
from DIRAC.FrameworkSystem.Client.PlottingClient  import PlottingClient
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient


log = logging.getLogger(__name__)

class CommonController(BaseController):
################################################################################
  def __getDataAndMeta( self ):
    params = dict()
    params["Data"] = dict()
    params["Meta"] = dict()
    params["PlotType"] = dict()
    paramcopy = dict()
    for i in request.params:
      if len(request.params[i]) > 0:
        paramcopy[i] = request.params[i]
    paramInt = [
      "width",
      "height",
      "legend_width",
      "legend_height",
      "legend_padding",
      "legend_max_rows",
      "legend_max_columns",
      "text_size",
      "subtitle_size",
      "subtitle_padding",
      "title_size",
      "title_padding",
      "text_padding",
      "figure_padding",
      "plot_padding",
      "text_padding",
      "figure_padding",
      "plot_title_size",
      "limit_labels",
      "dpi"
    ]
    paramStr= [
      "title",
      "subtitle",
      "background_color",
      "plot_grid",
      "frame",
#       "font",
#       "font_family",
      "legend",
      "legend_position",
      "square_axis",
      "graph_time_stamp"
    ]
    for i in paramcopy:
      if i in paramInt:
        params["Meta"][i] = int(paramcopy[i])
      elif i in paramStr:
        params["Meta"][i] = str(paramcopy[i])
      elif i == "plotType":
        params["PlotType"] = paramcopy["plotType"]
      else:
        if len(paramcopy[i]) > 0:
          params["Data"][i] = paramcopy[i]
    return params
################################################################################
  def getImage(self):
    params = self.__getDataAndMeta()
    cl = PlottingClient()
    if not params.has_key("Meta"):
      params["Meta"] = {"graph_size":"normal"}
    elif not params.has_key("Data"):
      result = cl.textGraph("Data for the plot is not defined","Memory",params["Meta"])
    elif not params.has_key("PlotType"):
      result = cl.textGraph('Type of plot is absent','Memory',params["Meta"])
    else:
      if params["PlotType"] == "pieGraph":
        result = cl.pieGraph(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "histogram":
        result = cl.histogram(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "qualityGraph":
        result = cl.qualityGraph(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "cumulativeGraph":
        result = cl.cumulativeGraph(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "lineGraph":
        result = cl.lineGraph(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "barGraph":
        result = cl.barGraph(params["Data"],'Memory',params["Meta"])
      else:
        result = cl.textGraph('The plot type ' + str(params["PlotType"]) + ' is not known','Memory',params["Meta"])
    if result["OK"]:
      plot = result["Value"]
      response.headers['Content-type'] = 'image/png'
      response.headers['Content-Length'] = len(plot)
      response.headers['Content-Transfer-Encoding'] = 'Binary'
      response.headers['Cache-Control'] = 'no-cache' # cache switchoff
      response.headers['Expires'] = '-1' # cache switchoff for old clients
      return plot
    else:
      return result["Message"]
################################################################################
  def get100Thumb(self):
    params = self.__getDataAndMeta()
    cl = PlottingClient()
    if not params.has_key("Meta"):
      params["Meta"] = {'graph_size':'thumbnail','height':100}
    elif not params.has_key("Data"):
      result = cl.textGraph('Data for the plot is not defined','Memory',params["Meta"])
    elif not params.has_key("PlotType"):
      result = cl.textGraph('Type of plot is absent','Memory',params["Meta"])
    else:
      params["Meta"] = {'graph_size':'thumbnail','height':100}
      if params["PlotType"] == "pieGraph":
        result = cl.pieGraph(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "histogram":
        result = cl.histogram(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "qualityGraph":
        result = cl.qualityGraph(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "cumulativeGraph":
        result = cl.cumulativeGraph(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "lineGraph":
        result = cl.lineGraph(params["Data"],'Memory',params["Meta"])
      elif params["PlotType"] == "barGraph":
        result = cl.barGraph(params["Data"],'Memory',params["Meta"])
      else:
        result = cl.textGraph('The plot type ' + str(params["PlotType"]) + ' is not known','Memory',params["Meta"])
    if result["OK"]:
      plot = result["Value"]
      response.headers['Content-type'] = 'image/png'
      response.headers['Content-Length'] = len(plot)
      response.headers['Content-Transfer-Encoding'] = 'Binary'
      response.headers['Cache-Control'] = 'no-cache' # cache switchoff
      response.headers['Expires'] = '-1' # cache switchoff for old clients
      return plot
    else:
      return result["Message"]
################################################################################
  @jsonify
  def getSelections(self):
    if request.params.has_key("selectionFor") and len(request.params["selectionFor"]) > 0:
      selection = str(request.params["selectionFor"])
      if selection == "JobMonitor":
        c.result = [["Status"],["Site"],["Minor status"],["Application status"],["Owner"],["JobGroup"]]
      elif selection == "ProductionMonitor":
        c.result = [["Status"],["AgentType"],["Type"],["Group"],["Plugin"]]
      else:
        c.result = ["Unknown selection's request"]
    else:
      c.result = ["No Selections"]
    return c.result
################################################################################
  def matvey_cpu(self):
    data = self.parseFile(None,'cpu')
    return self.buildPlot(data,{"title":"CPU","limit_labels":300,"cumulate_data":False})
################################################################################
  def matvey_mem(self):
    data = self.parseFile(None,'mem')
    return self.buildPlot(data,{"title":"Memory","limit_labels":300,"cumulate_data":False})
################################################################################
  def matvey_rss(self):
    data = self.parseFile(None,'rss')
    return self.buildPlot(data,{"title":"RSS","limit_labels":300,"cumulate_data":False})
################################################################################
  def matvey_vsize(self):
    data = self.parseFile(None,'vsz')
    return self.buildPlot(data,{"title":"VSIZE","limit_labels":300,"cumulate_data":False})  
################################################################################
  def parseFile(self,filename,type):
    logfile = open("/tmp/log.30.08.2010","r")
    uniqList = []
    megaList = []
    while 1:
      log = logfile.readline()
      if not log:
        break
      d = {}
      line = log
      line = line.replace("'","")
      line = line.replace("\"","")
      line = line.split("; ")
      for i in line:
        if i.count('time') > 0:
          key,value = i.split(': ')
          d[key] = value
          pass
        elif i.count('pidList') > 0:
          i = i.replace(']\n','')
          i = i.replace('pidList: [','')
          d['pidList'] = i.split(", ")
          pass
        else:
          i = i.split(" :(")
          if i[0] == 'PID':
            pass
          else:
            d[i[0]] = {}
            i[1] = i[1].replace(')','')
            i[1] = i[1].replace('(','')
            tmpList = i[1].split(', ')
            for j in tmpList:
              key,value = j.split(': ')
              d[i[0]][key] = value
      megaList.append(d)
      uniqList.extend(d['pidList'])
    for i in megaList:
      if i.has_key('PID'):
        del i
    for i in megaList:
      if not i.has_key('time'):
        del i
    uniqList = set(uniqList)
    uniqList = list(uniqList)
    try:
      ind = uniqList.index('PID')
      if ind > 0:
        del uniqList[ind]
    except:
      pass
    legend = {}
    for i in uniqList:
      for j in megaList:
        if j.has_key(i):
          legend[i] = str(i) + ': ' + j[i]["cmd"]
          break
    print legend
    data = {}
    for j in uniqList:
      if legend.has_key(j):
        data[legend[j]] = {}
    for i in megaList:
      for j in uniqList:
        if legend.has_key(j):
          if i.has_key(j):
            data[legend[j]][i['time']] = i[j][type]
          else:
            data[legend[j]][i['time']] = 0
    return data
################################################################################
  def buildPlot(self,data,title):
    cl = PlottingClient()
    result = cl.lineGraph(data,'Memory',title)
    if result["OK"]:
      plot = result["Value"]
      response.headers['Content-type'] = 'image/png'
      response.headers['Content-Length'] = len(plot)
      response.headers['Content-Transfer-Encoding'] = 'Binary'
      response.headers['Cache-Control'] = 'no-cache' # cache switchoff
      response.headers['Expires'] = '-1' # cache switchoff for old clients
      return plot
    else:
      return result["Message"]
################################################################################
  @jsonify
  def getLayoutUserList(self):
    if request.params.has_key("profile") and len(request.params["profile"]) > 0:
      try:
        profileName = str(request.params["profile"])
      except:
        gLogger.error("Can not convert profile name to string")
        return {"success":"false","error":"Can not convert profile name to string"}
    else:
      gLogger.error("Failed to get profile name from the request")
      return {"success":"false","error":"Failed to get profile name from the request"}
    upc = UserProfileClient( profileName, getRPCClient )
    result = upc.listAvailableVars()
    if result["OK"]:
      result = result["Value"]
      userList = []
      for i in result:
        userList.append(i[0])
      userList = uniqueElements(userList)
      resultList = []
      for j in userList:
        resultList.append({'name':j})
      total = len(resultList)
      resultList.sort()
      resultList.insert(0,{'name':'All'})
      c.result = {"success":"true","result":resultList,"total":total}
    else:
      gLogger.error(result["Message"])
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  def __preRequest(self):
    if request.params.has_key("page") and len(request.params["page"]) > 0:
      try:
        profileName = str(request.params["page"]).lower()
      except Exception, x:
        gLogger.error(x)
        profileName = False
    else:
      gLogger.error("Failed to get profile name from the request")
      profileName = False
    user = "All"
    if request.params.has_key("user") and len(request.params["user"]) > 0:
      try:
        user = str(request.params["user"])
      except Exception, x:
        gLogger.error(x)
        user = False
    return profileName, user
################################################################################
  def __returnLayouts(self,kind):
    profileName,user = self.__preRequest()
    if not profileName:
      return {"success":"false","error":"Failed to get layout name from the request"}
    elif not user:
      return {"success":"false","error":"Failed to get user name from the request"}
    upc = UserProfileClient(profileName,getRPCClient)
    result = upc.listAvailableVars()
    if result["OK"]:
      result = result["Value"]
      gLogger.error(result)
      resultList = []
      if user == "All":
        for i in result:
          if i[3] != 'ZGVmYXVsdA==':
            if kind == 'list':
              resultList.append(i[3])
            elif kind == 'with_owner':
              resultList.append({'name':i[3],'owner':i[0]})
        total = len(resultList)
        c.result = {"success":"true","result":resultList,"total":total}
      else:
        for i in result:
          gLogger.error("*** ",i)
          if i[0] == user:
            if i[3] != 'ZGVmYXVsdA==':
              if kind == 'list':
                resultList.append(i[3])
              elif kind == 'with_owner':
                resultList.append({'name':i[3],'owner':i[0]})
        total = len(resultList)
        c.result = {"success":"true","result":resultList,"total":total}
    else:
      gLogger.error(result["Message"])
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  @jsonify
  def getLayoutAndOwner(self):
    return self.__returnLayouts('with_owner')
################################################################################
  @jsonify
  def getLayoutList(self):
    return self.__returnLayouts('list')
################################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("getLayout") > 0:
      name = str(request.params["getLayout"])
      return self.__getLayout(name)
    elif request.params.has_key("setLayout") and len(request.params["setLayout"]) > 0:
      name = str(request.params["setLayout"])
      return self.__setLayout(name)
    elif request.params.has_key("delLayout") and len(request.params["delLayout"]) > 0:
      name = str(request.params["delLayout"])
      return self.__delLayout(name)
    elif request.params.has_key("delAllLayouts") and len(request.params["delAllLayouts"]) > 0:
      return self.__delAllLayouts()
    else:
      c.result = {"success":"false","error":"Action is not defined"}
      return c.result
#      if name != "":
#        result["ZGVmYXVsdA=="] = name
#        save = upc.storeVar("ZGVmYXVsdA==",name )
#        if not save["OK"]:
#          gLogger.error(save["Message"])
#          return {"success":"false","error":save["Message"]}
#      elif name == "" and not result.has_key("ZGVmYXVsdA=="):
#        result["ZGVmYXVsdA=="] = ""
################################################################################
  def __getLayout(self,name=None):
    if name and name == "ZGVmYXVsdA==":
      return {"success":"false","error":"The name \"" + name + "\" is reserved, operation failed"}
    profileName,user = self.__preRequest()
    if not profileName:
      return {"success":"false","error":"Failed to get profile name from the request"}
    elif not user:
      return {"success":"false","error":"Failed to get user name from the request"}
    upc = UserProfileClient(profileName,getRPCClient)
    self.__setDefaultLayout(upc,name)
    if not user == "All":
      result = upc.retrieveVarFromUser(user,g,name)
    else:
      if name:
        result = upc.retrieveVar(name)
      else:
        result = upc.retrieveAllVars()
    if result:
      if result["OK"]:
        result = result["Value"]
        c.result = {"success":"true","result":result}
      else:
        if result['Message'].find("No data for") != -1:
          c.result = {"success":"true","result":{}}
        else:
          c.result = {"success":"false","error":result["Message"]}
    else:
      c.result = {"success":"false","error":"Client failed to return any value"}
    return c.result
################################################################################
  def __delLayout(self,name):
    profileName,user = self.__preRequest()
    if not profileName:
      return {"success":"false","error":"Failed to get layout name from the request"}
    elif not user:
      return {"success":"false","error":"Failed to get user name from the request"}
    upc = UserProfileClient(profileName,getRPCClient)
    result = upc.deleteVar(name)
    if result["OK"]:
      self.__setDefaultLayout(upc)
      return self.__getLayout()
    else:
      gLogger.error(result["Message"])
      return {"success":"false","error":result["Message"]}
################################################################################
  def __delAllLayouts(self):
    profileName,user = self.__preRequest()
    if not profileName:
      return {"success":"false","error":"Failed to get layout name from the request"}
    elif not user:
      return {"success":"false","error":"Failed to get user name from the request"}
    upc = UserProfileClient(profileName,getRPCClient)
    result = upc.listAvailableVars()
    if result["OK"]:
      result = result["Value"]
      for i in result:
        self.__delLayout(i[3])
      self.__setDefaultLayout(upc)
      return self.__getLayout()
    else:
      gLogger.error(result["Message"])
      return {"success":"false","error":result["Message"]}
################################################################################
  def __setDefaultLayout(self,upc,name=None):
    if not upc:
      return False
    if name:
      upc.storeVar("ZGVmYXVsdA==",name)
    else:        
      available = self.__returnLayouts('list')
      gLogger.error(available)
'''
################################################################################
  def __setBookmarks(self,name):
    if name == "columns" or name == "refresh" or name == "defaultLayout" or name == "layouts":
      return {"success":"false","error":"The name \"" + name + "\" is reserved, operation failed"}
    if not request.params.has_key("columns") and len(request.params["columns"]) <= 0:
      return {"success":"false","error":"Parameter 'Columns' is absent"}
    if not request.params.has_key("refresh") and len(request.params["refresh"]) <= 0:
      return {"success":"false","error":"Parameter 'Refresh' is absent"}
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.retrieveVar( "Bookmarks" )
    if result["OK"]:
      data = result["Value"]
    else:
      data = {}
    data["defaultLayout"] = name
    if not data.has_key("layouts"):
      data["layouts"] =  {}
    data["layouts"][name] = {}
    if request.params.has_key("plots") and len(request.params["plots"]) > 0:
      data["layouts"][name]["url"] = str(request.params["plots"])
    else:
      data["layouts"][name]["url"] = ""
    data["layouts"][name]["columns"] = str(request.params["columns"])
    data["layouts"][name]["refresh"] = str(request.params["refresh"])
    gLogger.info("\033[0;31m Data to save: \033[0m",data)
    result = upc.storeVar( "Bookmarks", data )
    gLogger.info("\033[0;31m UserProfile response: \033[0m",result)
    if result["OK"]:
      return self.__getBookmarks()
    else:
      return {"success":"false","error":result["Message"]}

'''
'''
  @jsonify
  def layoutUser(self):
    upProfileName = "Summary"
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.listAvailableVars()
    if result["OK"]:
      result = result["Value"]
      userList = []
      for i in result:
        userList.append(i[0])
      userList = uniqueElements(userList)
      resultList = []
      for j in userList:
        resultList.append({'name':j})
      total = len(resultList)
      resultList.sort()
      resultList.insert(0,{'name':'All'})
      c.result = {"success":"true","result":resultList,"total":total}
    else:
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  @jsonify
  def layoutAvailable(self):
    upProfileName = "Summary"
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.listAvailableVars()
    gLogger.info("\033[0;31m listAvailableVars: \033[0m",result)
    if result["OK"]:
      result = result["Value"]
      resultList = []
      for i in result:
        resultList.append({'name':i[3],'owner':i[0]})
    return {"success":"true","result":resultList,"total":"55"}
################################################################################
  def __getSelections(self):
    if request.params.has_key("layout") > 0:
      name = str(request.params["layout"])
      return self.__getBookmarks(name)
    else:
      return False
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
      c.result = {"success":"false","error":"Action is not defined"}
      return c.result
################################################################################

# width - value
# time - value
# defaultLayout - value
# layouts - dict {name:src}

################################################################################
  def __getBookmarks(self,name=""):
    if name == "columns" or name == "refresh" or name == "defaultLayout" or name == "layouts":
      return {"success":"false","error":"The name \"" + name + "\" is reserved, operation failed"}
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.retrieveVar( "Bookmarks" )
    gLogger.info("\033[0;31m UserProfile getBookmarks response: \033[0m",result)
    if result["OK"]:
      result = result["Value"]
      if name != "":
        result["defaultLayout"] = name
        save = upc.storeVar( "Bookmarks", result )
        gLogger.info("\033[0;31m saving new default layout \033[0m",name)
        if not save["OK"]:
          return {"success":"false","error":save["Message"]}
      elif name == "" and not result.has_key("defaultLayout"):
        result["defaultLayout"] = ""
      if result.has_key("layouts"):
        layouts = ""
        for i in result["layouts"]:
          layouts = layouts + str(i) + ";"
        result["layoutNames"] = layouts
      c.result = {"success":"true","result":result}
    else:
      if result['Message'].find("No data for") != -1:
        c.result = {"success":"true","result":{}}
      else:
        c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  def __setBookmarks(self,name):
    if name == "columns" or name == "refresh" or name == "defaultLayout" or name == "layouts":
      return {"success":"false","error":"The name \"" + name + "\" is reserved, operation failed"}
    if not request.params.has_key("columns") and len(request.params["columns"]) <= 0:
      return {"success":"false","error":"Parameter 'Columns' is absent"}
    if not request.params.has_key("refresh") and len(request.params["refresh"]) <= 0:
      return {"success":"false","error":"Parameter 'Refresh' is absent"}
    upc = UserProfileClient( "Summary", getRPCClient )
    result = upc.retrieveVar( "Bookmarks" )
    if result["OK"]:
      data = result["Value"]
    else:
      data = {}
    data["defaultLayout"] = name
    if not data.has_key("layouts"):
      data["layouts"] =  {}
    data["layouts"][name] = {}
    if request.params.has_key("plots") and len(request.params["plots"]) > 0:
      data["layouts"][name]["url"] = str(request.params["plots"])
    else:
      data["layouts"][name]["url"] = ""
    data["layouts"][name]["columns"] = str(request.params["columns"])
    data["layouts"][name]["refresh"] = str(request.params["refresh"])
    gLogger.info("\033[0;31m Data to save: \033[0m",data)
    result = upc.storeVar( "Bookmarks", data )
    gLogger.info("\033[0;31m UserProfile response: \033[0m",result)
    if result["OK"]:
      return self.__getBookmarks()
    else:
      return {"success":"false","error":result["Message"]}
'''