"""Helper functions

Consists of functions to typically be used within templates, but also
available to Controllers. This module is available to both as 'h'.
"""
from webhelpers import *
from webhelpers.html import tags
from routes import url_for
from pylons import request

def javascript_link( *urls, **attrs ):
  return _modTag( urls, attrs, tags.javascript_link )

def stylesheet_link( *urls, **attrs ):
  return _modTag( urls, attrs, tags.stylesheet_link )

def _modTag( urls, attrs, functor ):
  nUrls = urls
  sN = request.environ[ 'SCRIPT_NAME' ]
  if sN:
    if sN[0] == "/":
      sN = sN[1:]
    nUrls = []
    for url in urls:
      if url.find( "http" ) == 0:
        nUrls.append( url )
      else:
        if url[0] == "/":
          url = "/%s%s" % ( sN, url )
        nUrls.append( url )
  return functor( *nUrls, **attrs )

def logo_wrap( fn ):
  def wrap( self = None ):
    return "<html><body><img src='/images/logos/logo.png'/><br><br><br><br>" + fn( self ) + "</body></html>"
  return wrap
