import logging, datetime, tempfile
from time import time, gmtime, strftime

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.List import sortList
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials
from DIRAC.Interfaces.API.Dirac import Dirac
from DIRAC.FrameworkSystem.Client.PlottingClient  import PlottingClient

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
