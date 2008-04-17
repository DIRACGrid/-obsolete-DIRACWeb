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
    paths = dict(root=root,
                 controllers=os.path.join(root, 'controllers'),
                 static_files=os.path.join(root, 'public'),
                 templates=[os.path.join(root, 'templates')])

    # Initialize config with the basic options
    config.init_app(global_conf, app_conf, package='dirac',
                    template_engine='mako', paths=paths)

    config['routes.map'] = make_map()
    config['pylons.g'] = app_globals.Globals()
    config['pylons.h'] = dirac.lib.helpers

    # Customize templating options via this variable
    tmpl_options = config['buffet.template_options']

    # CONFIGURATION OPTIONS HERE (note: all config options will override
    # any Pylons config options)
    config['dirac.webroot'] = root
    diracRootPath = os.path.realpath( "%s/../../../../" % root )
    config['dirac.root'] = diracRootPath
    if diracRootPath not in sys.path:
      sys.path.append( diracRootPath )
    from DIRAC.LoggingSystem.Client.Logger import gLogger
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

