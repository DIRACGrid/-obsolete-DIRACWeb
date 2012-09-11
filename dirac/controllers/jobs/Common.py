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
