"""Pylons environment configuration"""
import os
import sys

from pylons import config

import dirac.lib.app_globals as app_globals
import dirac.lib.helpers
from dirac.config.routing import make_map

def load_environment(global_conf, app_conf):
    """Configure the Pylons environment via the ``pylons.config``
    object
    """
    # Pylons paths
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    diracConfig = initDIRAC( root )
    paths = dict( root = root,
                  controllers = diracConfig[ 'controllers' ],
                  static_files = diracConfig[ 'public' ],
                  templates = diracConfig[ 'templates' ] )

    # Initialize config with the basic options
    config.init_app(global_conf, app_conf, package='dirac',
                    template_engine='mako', paths=paths)
    #Add dirac configs
    for k in diracConfig[ 'webConfig' ]:
      config[ k ] = diracConfig[ 'webConfig' ][ k ]
    

    config['routes.map'] = make_map()
    config['pylons.g'] = app_globals.Globals()
    config['pylons.h'] = dirac.lib.helpers

    # Customize templating options via this variable
    tmpl_options = config['buffet.template_options']


def initDIRAC( root ):
    # CONFIGURATION OPTIONS HERE (note: all config options will override
    # any Pylons config options)
    configDict = { 'webConfig' : {} }
    configDict[ 'webConfig' ]['dirac.webroot'] = root
    diracRootPath = os.path.realpath( os.path.dirname( os.path.dirname( root ) ) )
    configDict[ 'webConfig' ]['dirac.root'] = diracRootPath
    if diracRootPath not in sys.path:
      sys.path.append( diracRootPath )
    from DIRAC.FrameworkSystem.Client.Logger import gLogger
    gLogger.registerBackends( [ 'stderr' ] )
    from DIRAC.Core.Base import Script
    Script.registerSwitch( "r", "reload", "Reload for pylons" )
    Script.localCfg.addCFGFile( "%s/web.cfg" % root )
    Script.localCfg.addDefaultEntry( "/DIRAC/Security/UseServerCertificate", "yes" )
    Script.parseCommandLine( script = "Website", ignoreErrors = True, initializeMonitor = False )
    gLogger._systemName = "Framework"
    gLogger.initialize( "Web", "/Website" )

    from DIRAC import gMonitor, gConfig
    gMonitor.setComponentType( gMonitor.COMPONENT_WEB )
    gMonitor.initialize()
    gMonitor.registerActivity( "pagesServed", "Pages served", "Framework", "pages", gMonitor.OP_SUM )

    gLogger.info( "DIRAC Initialized" )
    
    extModules = [ '%sDIRAC' % module for module in gConfig.getValue( "/DIRAC/Extensions", [] ) ]
    #Load web.cfg of modules
    for extModule in extModules:
      webCFGPath = os.path.join( diracRootPath, extModule, "Web", "web.cfg" )
      if os.path.isfile( webCFGPath ):
        gLogger.info( "Adding web.cfg for %s extension" % extModule )
        gConfig.loadFile( webCFGPath )
    #Define the controllers, templates and public directories
    for type in ( 'controllers', 'templates', 'public' ):
      configDict[ type ] = []
      for extModule in extModules:
        typePath = os.path.join( diracRootPath, extModule, "Web", type)
        if os.path.isdir( typePath ):
          gLogger.info( "Adding %s path for module %s" % ( type, extModule ) )
          configDict[ type ].append( typePath )
      #End of extensions
      configDict[ type ].append( os.path.join(root,  type ) )
      
    gLogger.info( "Extension modules loaded" )
    
    return configDict
    
    
