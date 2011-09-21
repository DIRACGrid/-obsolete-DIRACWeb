import dirac.lib.credentials as credentials

from time import time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import getUsername, getSelectedGroup
from DIRAC import gLogger, S_OK, S_ERROR
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.FrameworkSystem.Client.PlottingClient  import PlottingClient
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient

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
  def getLayoutAndOwner(self):
    result = self.__returnListLayouts('with_owners')
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    return {"success":"true","result":result,"total":len(result)} 
################################################################################
  @jsonify
  def getLayoutList(self):
    result = self.__returnListLayouts('no_owners')
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    return {"success":"true","result":result,"total":len(result)}
################################################################################
  @jsonify
  def getLayoutUserList(self):
    result = self.__returnListLayouts('just_owners')
    if not result["OK"]:
      return {"success":"false","error":result["Message"]}
    result = result["Value"]
    return {"success":"true","result":result,"total":len(result)}
################################################################################
  @jsonify
  def action(self):
    try:
      if request.params.has_key("getLayout") > 0:
        name = str(request.params["getLayout"])
        result = self.__getLayout(name)
      elif request.params.has_key("setLayout") and len(request.params["setLayout"]) > 0:
        name = str(request.params["setLayout"])
        result = self.__setLayout(name)
      elif request.params.has_key("changeLayout") and len(request.params["changeLayout"]) > 0:
        name = str(request.params["changeLayout"])
        result = self.__changeLayout(name)
      elif request.params.has_key("delLayout") and len(request.params["delLayout"]) > 0:
        name = str(request.params["delLayout"])
        result = self.__delLayout(name)
      elif request.params.has_key("delAllLayouts") and len(request.params["delAllLayouts"]) > 0:
        result = self.__delAllLayouts()
      elif request.params.has_key("test"):
        result = self.__testLayout()
      else:
        return {"success":"false","error":"Action is not defined"}
      if not result["OK"]:
        return {"success":"false","error":result["Message"]}
      return {"success":"true","result":result["Value"]}
    except Exception, x:
      gLogger.error(x)
      return {"success":"false","error":x}
################################################################################
  def __changeLayout(self,name=None,value=None,access="USER"):
    """
    """
    gLogger.info("* Start changeLayout()")
    if name and name == "ZGVmYXVsdA==":
      gLogger.error("The name '%s' is reserved, operation failed" % name)
      return S_ERROR("The name '%s' is reserved, operation failed" % name)
    if not name:
      gLogger.error("Provide a name for changed profile")
      return S_ERROR("Provide a name for changed profile")
    if not value:
      gLogger.error("Value to be save in profile '%s' is absent" % name)
      return S_ERROR("Value to be save in profile '%s' is absent" % name)
    if not access in ['USER','GROUP','ALL']:
      gLogger.error("Provided access option '%s' is not valid" % access)
      return S_ERROR("Provided access option '%s' is not valid" % access)
    result = self.__preRequest()
    if not result["OK"]:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
    else:
      upc = result["Value"]["UPC"]
      user = result["Value"]["User"]
      group = result["Value"]["Group"]
    access = {"ReadAccess":access}
    gLogger.info("storeVar(%s,%s,%s)" % (name,value,access))
    result = upc.storeVar(name,value,access)
    if not result["OK"]:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
    layout = result["Value"]
    gLogger.info("+ End of changeLayout(): %s" % layout)
    return S_OK(layout)
################################################################################
  def __setLayout(self,name=None,value=None,access="USER"):
    """
    """
    gLogger.info("* Start setLayout()")
    if name and name == "ZGVmYXVsdA==":
      gLogger.error("The name '%s' is reserved, operation failed" % name)
      return S_ERROR("The name '%s' is reserved, operation failed" % name)
    if not name:
      gLogger.error("Provide a name under which you want to save profile")
      return S_ERROR("Provide a name under which you want to save profile")
    if not value:
      result = self.__getValueFromRequest()
      if not result["OK"]:
        gLogger.error("Value to be save in profile '%s' is absent" % name)
        return S_ERROR("Value to be save in profile '%s' is absent" % name)
      else:
        value = result["Value"]
    if not access in ['USER','GROUP','ALL']:
      gLogger.error("Provided access option '%s' is not valid" % access)
      return S_ERROR("Provided access option '%s' is not valid" % access)
    result = self.__preRequest()
    if not result["OK"]:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
    else:
      upc = result["Value"]["UPC"]
      user = result["Value"]["User"]
      group = result["Value"]["Group"]
    result = self.__checkDefaultLayout(upc)
    if not result["OK"]:
      owner = str(getUsername())
      result = self.__setDefaultLayout(upc," ",user,group)
      if not result["OK"]:
        gLogger.error(result["Message"])
    access = {"ReadAccess":access}
    gLogger.info("storeVar(%s,%s,%s)" % (name,value,access))
    result = upc.storeVar(name,value,access)
    if not result["OK"]:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
    layout = result["Value"]
    result = self.__setDefaultLayout(upc,name,user,group)
    if not result["OK"]:
        gLogger.error(result["Message"])
    gLogger.info("+ End of setLayout(): %s" % layout)
    return S_OK(layout)
################################################################################
  def __getLayout(self,name=None):
    gLogger.info("* Start getLayout()")
    if name and name == "ZGVmYXVsdA==":
      return S_ERROR("The name '%s' is reserved, operation failed" % name)
    if not name:
      return S_ERROR("The name of a profile to load is not provided")
    result = self.__preRequest()
    if not result["OK"]:
      return S_ERROR(result["Message"])
    else:
      upc = result["Value"]["UPC"]
      user = result["Value"]["User"]
      group = result["Value"]["Group"]
    result = self.__checkDefaultLayout(upc)
    if not result["OK"]:
      owner = str(getUsername())
      result = self.__setDefaultLayout(upc," ",owner,group)
      if not result["OK"]:
        gLogger.error(result["Message"])
    gLogger.info("retrieveVarFromUser(%s,%s,%s)" % (user,group,name))
    result = upc.retrieveVarFromUser(user,group,name)
    if not result["OK"]:
      return S_ERROR(result["Message"])
    layout = result["Value"]
    result = self.__setDefaultLayout(upc,name,user,group)
    if not result["OK"]:
        gLogger.error(result["Message"])
    gLogger.info("+ End of getLayout(): %s" % layout)
    return S_OK(layout)
################################################################################
  def __delLayout(self,name=None):
    """
    Deletes a layout with provided name which belongs to a current user only
    """
    gLogger.info("* Start delLayout()")
    if not name:
      return S_ERROR("Name of a layout to delete is absent in request")
    result = self.__preRequest()
    if not result["OK"]:
      return S_ERROR(result["Message"])
    else:
      upc = result["Value"]["UPC"]
      user = result["Value"]["User"]
      group = result["Value"]["Group"]
    result = upc.deleteVar(name)
    if not result["OK"]:
      return S_ERROR(result["Message"])
    result = self.__checkDefaultLayout(upc)
    if not result["OK"]:
      result = self.__setLastDefaultLayout(upc,user,group)
    result = name + ": deleted"
    gLogger.info("+ End of delLayout(): %s" % result)      
    return S_OK(result)
################################################################################
  def __delAllLayouts(self):
    """
    Deletes all the layouts belongs to a current user only
    """
    gLogger.info("* Start delAllLayouts()")
    result = self.__preRequest()
    if not result["OK"]:
      return S_ERROR(result["Message"])
    else:
      upc = result["Value"]["UPC"]
      user = result["Value"]["User"]
      group = result["Value"]["Group"]
    result = self.__returnListLayouts("with_owners")
    if not result["OK"]:
      return S_ERROR(result["Message"])
    available = result["Value"]
    report = []
    for i in available:
      if i["owner"] == user and i["group"] == group:
        name = i[3]
        gLogger.error("MATCH!")
        result = upc.deleteVar(name)
        if not result["OK"]:
          result = name + ": " + str(result["Message"])
        else:
          result = name + ": deleted"
        report.append(result)
    if not len(report) > 0:
      return S_ERROR("User: %s with group: %s has nothing to delete." % (user,group))
    report.join("\n")
    gLogger.info("+ End of delAllLayouts(): %s" % report)
    return S_OK(report)
################################################################################
  def __checkDefaultLayout(self,upc=None):
    """
    If the layout with name and owner stored in default value "ZGVmYXVsdA==" is exists
    the function returns dict with name and owner
    """
    gLogger.info("* Start checkDefaultLayout()")
    if not upc:
      return S_ERROR("Failed to get UserProfile client")
    result = upc.retrieveVar("ZGVmYXVsdA==")
    if not result["OK"]:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
    value = result["Value"]
    if type(value) is dict and value.has_key("name") and value.has_key("owner") and value.has_key("group"):
      name = value["name"]
      owner = value["owner"]
      group = value["group"]
    else: 
      try:
        name = str(value)
        owner = str(getUsername())
        group = str(getSelectedGroup())
      except Exception, x:
        gLogger.error(x)
        return S_ERROR(x)          
    result = self.__returnListLayouts('with_owners',"All")
    if not result["OK"]:
      return S_ERROR(result["Message"])
    available = result["Value"]
    exists = False
    for i in available:
      if i["name"] == name and i["owner"] == owner and i["group"] == group:
        gLogger.info("MATCH!")
        exists = True
    if not exists:
      message = "Layout \"%s\" of user \"%s\" with group \"%s\" does not exists or you have no rights to read it" % (name,owner,group)
      gLogger.error(message)
      return S_ERROR(message)
    result = {"name":name,"owner":owner,"group":group}
    gLogger.info("+ End of checkDefaultLayout(): %s" % result)
    return S_OK(result)
################################################################################
  def __setDefaultLayout(self,upc=None,name=None,user=None,group=None):
    """
    Just save the layout to "ZGVmYXVsdA==" variable which stands for default
    """
    gLogger.info("* Start setDefaultLayout()")
    if not upc:
      return S_ERROR("Failed to get UserProfile client")
    if not name:
      return S_ERROR("Profile name should be a valid string")
    if not user:
      return S_ERROR("Owner name should be a valid string")
    if not group:
      return S_ERROR("Group name should be a valid string")
    value = {"name":name,"owner":user,"group":group}
    result = upc.storeVar("ZGVmYXVsdA==",value)
    if not result["OK"]:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
    gLogger.info("+ End of setDefaultLayout(): %s" % value)
    return S_OK(value)
################################################################################
  def __setLastDefaultLayout(self,upc=None,user=None,group=None):
    """
    Check for available profiles for given user and group. If there are some, takes the last
    profile name and set it as default
    Return a dict of profile name and owner 
    """
    gLogger.info("* Start setLastDefaultLayout()")
    if not upc:
      return S_ERROR("Failed to get UserProfile client")
    if not group:
      return S_ERROR("Owner group should be a valid string")
    if not user:
      return S_ERROR("Owner name should be a valid string")    
    result = self.__returnListLayouts('with_owners',"All")
    if not result["OK"]:
      return S_ERROR(result["Message"])
    available = result["Value"]
    candidats = []
    for i in available:
      if i["group"] == group and i["owner"] == user:
        gLogger.info("MATCH!")
        candidats.append(i["name"])
    if not len(candidats) > 0:
      return S_ERROR("User \"%s\" with group \"%s\" have not layouts to be set as default" % (user,group))
    name = candidats.pop()
    result = self.__setDefaultLayout(upc,name,user,group)
    if not result["OK"]:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
    value = result["Value"]
    gLogger.info("+ End of setLastDefaultLayout(): %s" % value)
    return S_OK(value)
################################################################################
  def __getValueFromRequest(self):
    gLogger.info("* Start getValueFromRequest()")
    value = dict()
    for i in request.params:
      if len(request.params[i]) > 0:
        if not i.find("value",0,5) == -1:
          name = i[5:len(i)-1] # remove unwanted [] characters
          name = name.replace("[","")
          value[name] = request.params[i]
    if not len(value) > 0:
      return S_ERROR("The value keywords are absent in the request")
    gLogger.info("+ End of getValueFromRequest(): %s" % value) 
    return S_OK(value)
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
################################################################################
  def __preRequest(self):
    """
    Parse the HTTP request and returns an UP dict with UP client, username and group
    """
    if request.params.has_key("page") and len(request.params["page"]) > 0:
      try:
        profileName = str(request.params["page"]).lower()
      except Exception, x:
        gLogger.error(x)
        return S_ERROR(x)
    else:
      gLogger.error("Failed to get profile name from the request")
      return S_ERROR("Failed to get profile name from the request")
    upc = UserProfileClient( profileName, getRPCClient )
    if not upc:
      gLogger.error("Failed to initialise User Profile client")
      return S_ERROR("Failed to initialise User Profile client, please ask your DIRAC administrator for details")
    group = str(getSelectedGroup())
    user = str(getUsername())
    if request.params.has_key("user") and len(request.params["user"]) > 0:
      try:
        user = str(request.params["user"])
      except Exception, x:
        gLogger.error(x)
        return S_ERROR(x)
    return S_OK({"UPC":upc,"User":user,"Group":group})
################################################################################
  def __returnListLayouts(self,kind,user_override=None):
    """
    Returns a list of layouts depending of the kind variable.
    Kind could be:
      with_owners - List of layouts with owners included
      no_owners - Just a list of layouts
      just_owners - List of owners of layouts
    user_override is replacing the current user in the request.
    Used to show layouts which belongs to different user
    """
    gLogger.info("* Start returnListLayouts()")
    if not kind in ["with_owners","no_owners","just_owners"]:
      gLogger.error("Parameter \"%s\" is not supported" % str(kind))
      return S_ERROR("Parameter \"%s\" is not supported" % str(kind))
    result = self.__preRequest()
    if not result["OK"]:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
    else:
      upc = result["Value"]["UPC"]
      user = result["Value"]["User"]
    if user_override:
      user = user_override
    result = upc.listAvailableVars()
    if result["OK"]:
      gLogger.info("returnListLayouts() parameter user: %s" % user)
      gLogger.info("returnListLayouts() parameter kind: %s" % kind)
      result = result["Value"]
      resultList = []
      if user == "All":
        try:
          for i in result:
            if i[3] != "ZGVmYXVsdA==":
              if kind == "no_owners":
                resultList.append(i[3])
              elif kind == "with_owners":
                resultList.append({"name":i[3],"owner":i[0],"group":i[1],"vo":i[2]})
              elif kind == "just_owners":
                resultList.append(i[0])
        except Exception, x:
          gLogger.error(x)
          return S_ERROR(x)
        if kind == "just_owners":
          resultList = uniqueElements(resultList)
          resultList.sort()
          resultList.insert(0,"All")
          resultList = [{"name":i} for i in resultList]
      else:
        try:
          for i in result:
            if i[0] == user:
              if i[3] != "ZGVmYXVsdA==":
                if kind == "no_owners":
                  resultList.append(i[3])
                elif kind == "with_owners":
                  resultList.append({"name":i[3],"owner":i[0],"group":i[1],"vo":i[2]})
        except Exception, x:
          gLogger.error(x)
          return S_ERROR(x)
        if kind == "just_owners":
          resultList.append({"name":user})
      if not len(resultList) > 0:
        gLogger.error("There are no layouts corresponding your criteria")
        return S_ERROR("There are no layouts corresponding your criteria")
      gLogger.info("+ End of returnListLayouts(): %s" % resultList)
      return S_OK(resultList)
    else:
      gLogger.error(result["Message"])
      return S_ERROR(result["Message"])
