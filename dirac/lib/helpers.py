"""Helper functions

Consists of functions to typically be used within templates, but also
available to Controllers. This module is available to both as 'h'.
"""
from webhelpers import *
from webhelpers.html.tags import *
from routes import url_for
from pylons import request

def jsTag( uri ):
  sN = request.environ[ 'SCRIPT_NAME' ]
  if sN:
    if sN[0] == "/":
      sN = sN[1:]
    uri = "/%s/%s" % ( sN, uri )
  return '<script src="%s" type="text/javascript"></script>' % uri

def cssTag( uri ):
  sN = request.environ[ 'SCRIPT_NAME' ]
  if sN:
    if sN[0] == "/":
      sN = sN[1:]
    uri = "/%s/%s" % ( sN, uri )
  return '<link href="%s" media="screen" rel="stylesheet" type="text/css" />' % uri
      