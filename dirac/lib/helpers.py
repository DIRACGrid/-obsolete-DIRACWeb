"""Helper functions

Consists of functions to typically be used within templates, but also
available to Controllers. This module is available to both as 'h'.
"""
from webhelpers import *
from webhelpers.html import tags
from routes import url_for
from pylons import request

def javascript_link( *urls, **attrs ):
  sN = request.environ[ 'SCRIPT_NAME' ]
  if sN:
    if sN[0] == "/":
      sN = sN[1:]
    nUrls = []
    for url in urls:
      if url[0] == "/":
        url = "/%s%s" % ( sN, url )
      nUrls.append( url )
  return tags.javascript_link( *nUrls, **attrs )

def stylesheet_link( *urls, **attrs ):
  sN = request.environ[ 'SCRIPT_NAME' ]
  if sN:
    if sN[0] == "/":
      sN = sN[1:]
    nUrls = []
    for url in urls:
      if url[0] == "/":
        url = "/%s%s" % ( sN, url )
      nUrls.append( url )
  return tags.stylesheet_link( *nUrls, **attrs )
      
