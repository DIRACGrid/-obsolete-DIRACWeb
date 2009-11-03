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

def controller_scan(directory=None):
    """Scan a directory for python files and use them as controllers"""
    if directory is None:
        return []
    
    def find_controllers(dirname, prefix=''):
        """Locate controllers in a directory"""
        controllers = []
        if type( dirname ) not in ( types.ListType, types.TupleType ):
          dirs = [ dirname ]
        else:
          dirs = dirname 
        for dirname in dirs:
          for fname in os.listdir(dirname):
              filename = os.path.join(dirname, fname)
              if os.path.isfile(filename) and \
                  re.match('^[^_]{1,1}.*\.py$', fname):
                  controllers.append(prefix + fname[:-3])
              elif os.path.isdir(filename):
                  controllers.extend(find_controllers(filename, 
                                                      prefix=prefix+fname+'/'))
        return controllers
    def longest_first(fst, lst):
        """Compare the length of one string to another, shortest goes first"""
        return cmp(len(lst), len(fst))
    controllers = find_controllers(directory)
    controllers.sort(longest_first)
    return controllers

def make_map():
    """Create, configure and return the routes Mapper"""
    map = Mapper(controller_scan=controller_scan,
                 directory=config['pylons.paths']['controllers'],
                 always_scan=config['debug'])

    # The ErrorController route (handles 404/500 error pages); it should
    # likely stay at the top, ensuring it can always be resolved
    map.connect('error/:action/:id', controller='error')

    # CUSTOM ROUTES HERE
    import dirac.lib.credentials as credentials
    condDict = dict(function=credentials.checkURL)

    map.connect(':dsetup/:dgroup/:controller/:action/:id', conditions=condDict )
    map.connect(':dsetup/:controller/:action/:id',         dgroup='unknown', conditions=condDict )
    map.connect(':controller/:action/:id',                 dsetup='unknown', dgroup='unknown', conditions=condDict )
    map.connect(':dsetup/:dgroup/:controller/:action', id=None, conditions=condDict )
    map.connect(':dsetup/:controller/:action',         id=None, dgroup='unknown', conditions=condDict )
    map.connect(':controller/:action',                 id=None, dsetup='unknown', dgroup='unknown', conditions=condDict )
    map.connect(':dsetup/:dgroup/:controller', action='index', id=None, conditions=condDict )
    map.connect(':dsetup/:controller',         action='index', id=None, dgroup='unknown', conditions=condDict )
    map.connect(':controller',                 action='index', id=None, dsetup='unknown', dgroup='unknown', conditions=condDict )

    map.connect('*url', controller='template', action='view')

    return map
