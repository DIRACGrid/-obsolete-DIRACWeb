#
# Note the following rules:
#   After each session modification, __addActinfo must be calles, so
#         __popActinfo save the session without explicit session.save() call
#
# 9.4.9 AZ Currently, WF size limit is 64k. So I use some tricks...
#          1) in case parameter description in instance equal to
#          parameter description in definition: set it to empty and
#          restore on edit.
#          2) the same for values (in case it is linked)
#          3) descriptions are also removed from definitions of
#             steps in case they are redundund
#          4) the same for values (in case it is linked)
#          5) for definitions, in case linked parameter name
#             equal parameter name, clean it (POTENTIALLY DANGEROUS!)
import logging

from dirac.lib.base import *
from dirac.lib.credentials import authorizeAction
from dirac.lib.diset import getRPCClient
from DIRAC.ConfigurationSystem.Client.Config import gConfig
from DIRAC import gLogger
import time
#from dirac.lib.shared import SharedData
import threading
from DIRAC.Core.Utilities.ReturnValues import S_ERROR,S_OK
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Workflow.Workflow import Workflow,fromXMLString
from DIRAC.Core.Workflow.Parameter import Parameter
from DIRAC.Core.Workflow.Module import ModuleDefinition
from DIRAC.Core.Workflow.Step import StepDefinition
import os,stat,pickle,fcntl,types
# AZ: do we have something else??
import simplejson

log = logging.getLogger(__name__)

# The following can be part of Core.Workflow (in addition to toXML)

def _AZNameFix(name):
  " AZ: My fault... I have used capital names in WFE"
  return name.capitalize().replace('_p','P').replace('_m','M').replace('_s','S')

def _ParametersToJS(spaces,par):
  ret=spaces+'parameters: [\n'
  prefix = ''
  for v in par:
    ret=ret+prefix+spaces+'  { Name:"'+v.name +'", Type:"'+str(v.type)\
        +'", LinkedModule:"'+str(v.linked_module) + '", LinkedParameter:"'+str(v.linked_parameter)\
        +'", In:"'+ str(v.typein)+ '", Out:"'+str(v.typeout)\
        +'", Description:"'+ str(v.description)\
        +'", Value:"'+str(v.getValue()).replace('"','\\"')+'" }'
    prefix=',\n'
  return ret+'\n'+spaces+']'

def _AttributeCollectionWithParametersToJS(spaces,ac):
  ret = ''
  for v in ac.keys():
    if v == 'parent':
      continue # doing nothing
    if v == 'body' or v == 'description':
      ret=ret+spaces+_AZNameFix(v)+':"'+str(ac[v]).replace('\\','\\\\').replace('\n', '\\n').replace('"','\\"')+'",\n'
    else:
      ret=ret+spaces+_AZNameFix(v)+':"'+str(ac[v])+'",\n'
  return ret+_ParametersToJS(spaces, ac.parameters)

def _ModuleDefinitionsToJS(spaces,mods):
  ret = ''
  prefix = ''
  for v in mods.keys():
    ret += prefix+spaces+'{\n'+_AttributeCollectionWithParametersToJS(spaces+'  ',mods[v])+'\n'+spaces+'}'
    prefix = ',\n'
  return ret

def _StepInstancesToJS(spaces,st):
  ret = ''
  prefix = ''
  for v in st:
    ret += prefix+spaces+'{\n'+_AttributeCollectionWithParametersToJS(spaces+'  ',v)+'\n'+spaces+'}'
    prefix = ',\n'
  return ret

def _StepDefinitionsToJS(spaces,st):
  ret = ''
  prefix = ''
  for v in st.keys():
    ret += prefix+spaces+'{\n'+_AttributeCollectionWithParametersToJS(spaces+'  ',st[v])+',\n'
    ret += spaces+'  module_instances: [\n' + _StepInstancesToJS(spaces+'    ',st[v].module_instances)
    ret += '\n'+spaces+'  ]\n'+spaces+'}'
    prefix = ',\n'
  return ret

def _WFDeCompress( wf ):
  """ Restore redundund information to make is editable """
  try:
    # module definitions
    for md in wf.module_definitions:
      for p in wf.module_definitions[md].parameters:
        if p.isLinked():
          if not p.getLinkedParameter():
            p.linked_parameter = p.getName()
    # module instances
    for sd in wf.step_definitions:
      for mi in wf.step_definitions[sd].module_instances:
        mdp = wf.module_definitions[mi.getType()].parameters
        for p in mi.parameters:
          dp = mdp.find(str(p.getName()))
          if dp:
            if not p.getDescription():
              p.setDescription(dp.getDescription())
            if p.isLinked():
              if not p.getValue():
                p.setValue(dp.getValue())
    # step definitions
    for sd in wf.step_definitions:
      for p in wf.step_definitions[sd].parameters:
        if not p.getDescription():
          pname = str(p.getName())
          for mi in wf.step_definitions[sd].module_instances:
            mp = mi.parameters.find(pname)
            if mp:
              p.setDescription(mp.getDescription())
              break
        if p.isLinked():
          if not p.getLinkedParameter():
            p.linked_parameter = p.getName()
    # step instances
    for si in wf.step_instances:
      sdp = wf.step_definitions[si.getType()].parameters
      for p in si.parameters:
        dp = sdp.find(str(p.getName()))
        if dp:
          if not p.getDescription():
            p.setDescription(dp.getDescription())
          if p.isLinked():
            if not p.getValue():
              p.setValue(dp.getValue())
    # with workflow itself
    for p in wf.parameters:
      if not p.getDescription():
        pname = str(p.getName())
        for si in wf.step_instances:
          sp = si.parameters.find(pname)
          if sp:
            p.setDescription(sp.getDescription())
            break
  except Exception,e:
    return S_ERROR(str(e))
  return S_OK(wf)

def _WorkflowToJS( wf ):
  _WFDeCompress(wf)
  ret  = '{\n'
  ret += _AttributeCollectionWithParametersToJS('  ',wf)+',\n'
  ret += '  module_definitions: [\n'+_ModuleDefinitionsToJS('    ',wf.module_definitions)+'\n  ],\n'
  ret += '  step_definitions: [\n'+_StepDefinitionsToJS('    ',wf.step_definitions)+'\n  ],\n'
  ret += '  step_instances: [\n'+_StepInstancesToJS('    ',wf.step_instances)+'\n  ]\n'
  ret += '\n}\n'
  return ret

def _JSToIt (js,it):
  if "Description" in js.keys():
    it.setDescription(js["Description"])
  if "DescrShort" in js.keys():
    it.setDescrShort(js["DescrShort"])
  if "Required" in js.keys():
    it.setRequired(js["Required"])
  if "Body" in js.keys():
    it.setBody(js["Body"])
  if "Origin" in js.keys():
    it.setOrigin(js["Origin"])
  if "Version" in js.keys():
    it.setVersion(js["Version"])
  for p in js["parameters"]:
    it.addParameter(Parameter(p["Name"],p["Value"],p["Type"],
                              p["LinkedModule"],p["LinkedParameter"],
                              p["In"],p["Out"],p["Description"]))

def _WFCompress( wf ):
  """ Remove redundund information to make is smaller """
  try:
    # start with workflow itself
    for p in wf.parameters:
      pname = str(p.getName())
      inherited = False
      clean = True
      for si in wf.step_instances:
        sp = si.parameters.find(pname)
        if sp:
          inherited = True
          if sp.getDescription() != p.getDescription():
            clean = False
            break
      if inherited and clean:
        p.setDescription("")
    # step instances
    for si in wf.step_instances:
      sdp = wf.step_definitions[si.getType()].parameters
      for p in si.parameters:
        dp = sdp.find(str(p.getName()))
        if dp:
          if dp.getDescription() == p.getDescription():
            p.setDescription('')
          if p.isLinked():
            if dp.getValue() == p.getValue():
              p.setValue('')
    # step definitions
    for sd in wf.step_definitions:
      for p in wf.step_definitions[sd].parameters:
        pname = str(p.getName())
        inherited = False
        clean = True
        for mi in wf.step_definitions[sd].module_instances:
          mp = mi.parameters.find(pname)
          if mp:
            inherited = True
            if mp.getDescription() != p.getDescription():
              clean = False
              break
        if inherited and clean:
          p.setDescription("")
        if p.isLinked():
          if p.getLinkedParameter() == p.getName():
            p.linked_parameter = ''
    # module instances
    for sd in wf.step_definitions:
      for mi in wf.step_definitions[sd].module_instances:
        mdp = wf.module_definitions[mi.getType()].parameters
        for p in mi.parameters:
          dp = mdp.find(str(p.getName()))
          if dp:
            if dp.getDescription() == p.getDescription():
              p.setDescription('')
            if p.isLinked():
              if dp.getValue() == p.getValue():
                p.setValue('')
    # module definitions
    for md in wf.module_definitions:
      for p in wf.module_definitions[md].parameters:
        if p.isLinked():
          if p.getLinkedParameter() == p.getName():
            p.linked_parameter = ''
  except Exception,e:
    return S_ERROR(str(e))
  return S_OK(wf)

def _JSToWorkflow ( js ):
  try:
    o = simplejson.loads(js)
    wf = Workflow(name=o["Name"])
    wf.setType(o["Type"]);
    _JSToIt(o,wf)
    moddefs = {}
    for m in o["module_definitions"]:
      moddefs[m["Type"]] = ModuleDefinition(m["Type"])
      _JSToIt(m,moddefs[m["Type"]])
      wf.addModule(moddefs[m["Type"]])
    stepdefs = {}
    for s in o["step_definitions"]:
      step = StepDefinition(s["Type"])
      _JSToIt(s,step)
      for m in s["module_instances"]:
        if m["Type"] not in step.module_definitions:
          step.addModule(moddefs[m["Type"]])
        mod = step.createModuleInstance(m["Type"],m["Name"])
        _JSToIt(m,mod)
      stepdefs[s["Type"]] = step
    for s in o["step_instances"]:
      if s["Type"] not in wf.step_definitions:
        wf.addStep(stepdefs[s["Type"]])
      step = wf.createStepInstance(s["Type"],s["Name"])
      _JSToIt(s,step)
  except Exception,msg:
    return S_ERROR(msg);
  return _WFCompress(wf)
#  return S_OK(wf)

class ProductionworkflowController(BaseController):
  
    # Minimal time to redownload workflow relatet info from server (seconds)
    __update_timeout = 600
  
    def __init__(self):
      BaseController.__init__(self)
  
    def index(self):
        # Return a rendered template
        #   return render('/some/template.mako')
        # or, Return a response
        return 'Workflow v0.7'

    def __authError(self):
      c.error = "You are not authorized to do this. sorry."
      c.link=(h.url_for( controller="/systems/workflows",action="overview" ),\
          "Back to Workflow Management")
      return "/error.mako"

    def __servError(self,result):
      if not result['OK']:
        c.error = result['Message']
        c.link=(h.url_for(controller="/systems/workflows",action="overview"),\
          "Back to Workflow Management")
        return True
      return False

    def __notImplemented(self,where,title):
      c.error = "This feature is not yet implemented. Please try in several years :)"
      c.link  = (where,"Back to %s" % title)
      return render("/error.mako")
 
    
    def __cnFromCred(self,cred):
      for field in cred.split('/'):
        if field.startswith('CN='):
          return field[3:]
      return cred
    
    def __beautifyWfList(self,wflist):
      """ Make the content user friendly (if possible)
      Extract CN from credential and use it as user name
      """
      result = []
      for wf in wflist:
         wf['Author'] = self.__cnFromCred(wf['AuthorDN']) + '@' + wf['AuthorGroup']
         result.append( wf )
      return result

    def __getWorkflow(self,name):
        RPC = getRPCClient("ProductionManagement/ProductionManager")
        return RPC.getWorkflow(str(name))
      
    def overview(self):
      return render("/production/WorkFlowOverview.mako")

    
    def __loadWorkflows(self,force):
      if force:
        if 'workflows' in session:
          del session['workflows']
      if not 'workflows' in session:
        RPC = getRPCClient("ProductionManagement/ProductionManager")
        result = RPC.getListWorkflows()
        if not result['OK']:
          return result
        session['workflows'] = self.__beautifyWfList(result['Value'])
        session.save()
      return S_OK(session['workflows'])
    
    @jsonify
    def getWFList(self):
      if not authorizeAction():
        return S_ERROR("You are not authorised to get workflows list")
      return self.__loadWorkflows('force' in request.params)

    @jsonify
    def getWF(self,id):
      if not authorizeAction():
        return S_ERROR("You are not authorised to get workflows")
      result = self.__getWorkflow(id)
      if not result["OK"]:
        return result;
      return S_OK(_WorkflowToJS(fromXMLString(result['Value'])))
    
    def wfeView(self,id):
      if not authorizeAction():
        return S_ERROR("You are not authorised to view workflows")
      result = self.__getWorkflow(id)
      if self.__servError(result):
        return render("/error.mako")
      c.mode = ""
      c.wf = _WorkflowToJS(fromXMLString(result['Value']))
      return render("/systems/workflows/wfe.mako")
    
    def wfeEdit(self,id):
      if not authorizeAction():
        return S_ERROR("You are not authorised to edit workflows")
      result = self.__getWorkflow(id)
      if self.__servError(result):
        return render("/error.mako")
      c.mode = "expert"
      c.wf = _WorkflowToJS(fromXMLString(result['Value']))
      return render("/production/WorkFlowEditor.mako")

    @jsonify
    def saveWFIntoDB(self):
      if not authorizeAction():
        return S_ERROR("You are not authorised to save workflows")
      wf = request.params.get('JSONStr','')
      result = _JSToWorkflow(wf)
      if not result['OK']:
        return result
      try:
        wfxml = result['Value'].toXML()
        RPC = getRPCClient("ProductionManagement/ProductionManager")
        result = RPC.publishWorkflow(str(wfxml),True)
      except Exception,msg:
        return S_ERROR(msg)
      if not result['OK']:
        return result
      return S_OK("Saved")

    @jsonify
    def uploadWF(self):
      if not authorizeAction():
        return S_ERROR("You are not authorised to upload workflows")
      try:
        wfxmlf = request.POST['UploadWFFile']
        Name   = request.params.get('UploadWFName','')
        wf = fromXMLString(str(wfxmlf.value))
        if Name:
          wf.setName(Name)
        wfxml = wf.toXML()
        RPC = getRPCClient("ProductionManagement/ProductionManager")
        result = RPC.publishWorkflow(str(wfxml),True)
      except Exception,msg:
        return S_ERROR(msg)
      if not result['OK']:
        return result
      return S_OK("Uploaded")

    @jsonify
    def newWF(self):
      if not authorizeAction():
        return S_ERROR("You are not authorised to create workflows")
      Name = request.params.get('name','')
      Type = request.params.get('type','')
      if not Name:
        return S_ERROR("You have to specify valid unique workflow name");
      try:
        wf = Workflow(name=Name)
        wf.setType(Type)
        wfxml = wf.toXML()
        RPC = getRPCClient("ProductionManagement/ProductionManager")
        result = RPC.publishWorkflow(str(wfxml),False)
      except Exception,msg:
        return S_ERROR(msg)
      if not result['OK']:
        return result
      return S_OK("Created")

    @jsonify
    def delWF(self):
      if not authorizeAction():
        return S_ERROR("You are not authorised to delete workflows")
      Name = request.params.get('name','')
      try:
        RPC = getRPCClient("ProductionManagement/ProductionManager")
        result = RPC.deleteWorkflow(str(Name))
      except Exception,msg:
        return S_ERROR(msg)
      if not result['OK']:
        return result
      return S_OK("Deleted")

    def saveWFLocal(self,id):
      if not authorizeAction():
        return self.__authError()
      wf = request.params.get('JSONStr','')
      if wf != '':
        result = _JSToWorkflow(wf)
        if self.__servError(result):
          return render("/error.mako")
        response.headers['Content-type'] = "application/workflow"
        return result['Value'].toXML()
      else:
        result = self.__getWorkflow(id)
        if self.__servError(result):
          return render("/error.mako")
        response.headers['Content-type'] = "application/workflow"
        return result['Value'];
      
    @jsonify
    def moveWF(self):
      if not authorizeAction():
        return S_ERROR("You are not authorised to move workflows")
      reqjs = request.params.get('JSONStr','')
      try:
        req = simplejson.loads(reqjs)
        name = req["Name"]
        new_name = req["NewName"]
        path = req["Path"]
      except Exception,msg:
        return S_ERROR(msg)
      result = self.__getWorkflow(name)
      if not result["OK"]:
        return result
      wf = fromXMLString(result['Value'])
      wf.setName(new_name)
      wf.setType(path)
      try:
        wfxml = wf.toXML()
        RPC = getRPCClient("ProductionManagement/ProductionManager")
        result = RPC.publishWorkflow(str(wfxml),True)
        if name != new_name and result["OK"]:
          result = RPC.deleteWorkflow(str(name))
      except Exception,msg:
        return S_ERROR(msg)
      if not result['OK']:
        return result
      return S_OK("Moved")

    @jsonify
    def copyWF(self):
      if not authorizeAction():
        return S_ERROR("You are not authorised to copy workflows")
      reqjs = request.params.get('JSONStr','')
      try:
        req = simplejson.loads(reqjs)
        name = req["Name"]
        new_name = req["NewName"]
        path = req["Path"]
      except Exception,msg:
        return S_ERROR(msg)
      if name == new_name:
        return S_ERROR("You can't use the same workflow name")
      result = self.__getWorkflow(name)
      if not result["OK"]:
        return result
      wf = fromXMLString(result['Value'])
      wf.setName(new_name)
      wf.setType(path)
      try:
        wfxml = wf.toXML()
        RPC = getRPCClient("ProductionManagement/ProductionManager")
        result = RPC.publishWorkflow(str(wfxml),True)
      except Exception,msg:
        return S_ERROR(msg)
      if not result['OK']:
        return result
      return S_OK("Moved")
