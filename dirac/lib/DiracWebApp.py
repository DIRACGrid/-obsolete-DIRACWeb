
import os
import sys

from pylons import config
from pylons.wsgiapp import PylonsApp
from pylons.util import class_name_from_module_name

from DIRAC import rootPath, gLogger
from DIRAC.ConfigurationSystem.Client.Helpers import getCSExtensions

class DiracWebApp( PylonsApp ):

  def __init__( self, *args, **kwargs ):
    super( DiracWebApp, self ).__init__( *args, **kwargs )
    #Find base modules path
    self.__baseControllerPaths = []
    for module in getCSExtensions():
      module = "%sDIRAC" % module
      modulePath = os.path.join( rootPath, module )
      if os.path.isdir( os.path.join( modulePath, "Web", "controllers" ) ):
        self.__baseControllerPaths.append( "%s.Web.controllers" % module )
      for systemName in os.listdir( modulePath ):
        if os.path.isdir( os.path.join( modulePath, systemName, "Web", "controllers" ) ):
          self.__baseControllerPaths.append( "%s.%s.Web.controllers" % ( module, systemName ) )
    self.__baseControllerPaths.append( 'dirac.controllers' )
    self.__log = gLogger.getSubLogger( "DIRACWebApp" )
    self.__log.info( "Base modules to find controllers are:\n\t%s" % "\n\t".join ( self.__baseControllerPaths ) )


  def find_controller( self, controller ):
    # Check to see if we've cached the class instance for this name
    if controller in self.controller_classes:
      return self.controller_classes[ controller ]

    self.__log.info( "Trying to find %s controller" % controller )
    controllerModule = controller.replace( "/", "." )
    for rootModule in self.__baseControllerPaths:
      fullModuleName = "%s.%s" % ( rootModule, controllerModule )

      # Hide the traceback here if the import fails (bad syntax and such)
      __traceback_hide__ = 'before_and_this'

      try:
        __import__( fullModuleName )
      except ImportError:
        self.__log.info( "Cannot import %s" % fullModuleName )
        continue
      if hasattr( sys.modules[ fullModuleName ], '__controller__' ):
        mycontroller = getattr( sys.modules[ fullModuleName ],
                                sys.modules[ fullModuleName ].__controller__ )
      else:
        moduleName = controller.split( '/' )[-1]
        className = class_name_from_module_name( moduleName ) + 'Controller'
        self.__log.debug( "Found controller, module: '%s', class: '%s', rootModule: '%s'" % ( fullModuleName,
                                                                                              className,
                                                                                              rootModule ) )
        mycontroller = getattr( sys.modules[ fullModuleName ], className )
      self.__log.info( "Imported %s controller" % fullModuleName )
      self.controller_classes[ controller ] = mycontroller
      return mycontroller
    self.__log.error( "Could not import controller %s" % controller )
    raise Exception( "Couldn't find controller %s in root modules %s" % ( controller,
                                                                          self.__baseControllerPaths ) )
