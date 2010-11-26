"""Routes configuration

The more specific and detailed routes should be defined first so they
may take precedent over the more generic routes. For more information
refer to the routes manual at http://routes.groovie.org/docs/
"""
import types
import os
import re
from pylons import config
from routes import Mapper

def controller_scan( directory = None ):
  """Scan a directory for python files and use them as controllers"""
  if directory is None:
    return []

  def find_controllers( dirname, prefix = '' ):
    """Locate controllers in a directory"""
    controllers = []
    if type( dirname ) not in ( types.ListType, types.TupleType ):
      dirs = [ dirname ]
    else:
      dirs = dirname
    for dirname in dirs:
      for fname in os.listdir( dirname ):
        filename = os.path.join( dirname, fname )
        if os.path.isfile( filename ) and \
          re.match( '^[^_]{1,1}.*\.py$', fname ):
          controllers.append( prefix + fname[:-3] )
        elif os.path.isdir( filename ):
          controllers.extend( find_controllers( filename,
                                                prefix = prefix + fname + '/' ) )
    return controllers

  controllers = sorted( find_controllers( directory ) )
  return controllers

def make_map():

  """Create, configure and return the routes Mapper"""
  map = Mapper( controller_scan = controller_scan,
               directory = config['pylons.paths']['controllers'],
               always_scan = config['debug'],
               explicit = False )
  map.minimization = False

  # The ErrorController route (handles 404/500 error pages); it should
  # likely stay at the top, ensuring it can always be resolved
  map.connect( 'error/{action}', controller = 'error' )
  map.connect( 'error/{action}/{id}', controller = 'error' )

  # CUSTOM ROUTES HERE
  import dirac.lib.credentials as credentials
  condDict = { 'function' : credentials.checkURL }
  reqs = { 'controller' : R"(\w+(?:/\w+)?)?" }

  map.connect( '/', controller = 'info/External', action = 'display' )
#  map.connect( '/', controller = 'info/general', action = "diracOverview" )
  map.connect( '/{dsetup}/{dgroup}/{controller}/{action}', conditions = condDict, requirements = reqs )
  map.connect( '/{dsetup}/{dgroup}/{controller}', action = 'index', conditions = condDict, requirements = reqs )
  map.connect( '/{dsetup}/{dgroup}/{controller}/{action}/{id}', conditions = condDict, requirements = reqs )
  map.connect( '/{controller}/{action}', dsetup = 'unknown', dgroup = 'unknown', conditions = condDict, requirements = reqs )
  map.connect( '/{controller}/{action}/{id}', dsetup = 'unknown', dgroup = 'unknown', conditions = condDict, requirements = reqs )
  map.connect( '/{controller}', action = 'index', dsetup = 'unknown', dgroup = 'unknown', conditions = condDict, requirements = reqs )

  map.connect( '*url', controller = 'template', action = 'view' )

  return map
