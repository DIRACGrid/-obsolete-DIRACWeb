import cgi
import urllib
import types

try:
  from urlparse import parse_qsl
except:
  from cgi import parse_qsl

from paste.util.multidict import MultiDict

def sanitizeUnknownVar( uVar ):
  varType = type( uVar )
  if varType in ( types.StringType, types.UnicodeType ):
    return cgi.escape( uVar )
  elif varType in ( types.ListType, types.TupleType ):
    sanitized = []
    for v in uVar:
      try:
        sanitized.append( sanitizeUnknownVar( v ) )
      except Exception, e:
        print "FIXFIX! EXCEPTION while sanitizing vars:", e
    return sanitized
  elif varType in ( types.IntType, types.LongType, types.FloatType ):
    return uVar
  elif varType in ( types.InstanceType, ):
    if uVar.__class__.__name__ == 'FieldStorage':
      uVar.filename = cgi.escape( uVar.filename )
      return uVar
  else:
    print "UNKNOWN TYPE while sanitizing vars:", varType, uVar

def sanitizeGETVars( environ ):
  sourceQuery = environ.get( 'QUERY_STRING', '' )
  parsed = parse_qsl( sourceQuery, keep_blank_values = True, strict_parsing = False )
  sanitizedData = [ ( n, cgi.escape( v ) ) for n, v in parsed ]
  sanitizedSource = urllib.urlencode( sanitizedData )
  environ[ 'QUERY_STRING' ] = sanitizedSource
  return
  #Just in cast the replacement didn't work
  environ[ 'paste.parsed_querystring' ] = ( sanitizedData, sourceQuery )
  mD = MultiDict( sanitizedData )
  environ[ 'paste.parsed_dict_querystring' ] = ( mD, sourceQuery )
  environ[ 'webob._parsed_query_vars' ] = ( mD, sourceQuery )

def sanitizePOSTVars( environ ):
  method = environ.get( 'REQUEST_METHOD', '' )
  if method not in ( 'POST', 'PUT' ):
    return
  contentType = environ.get( 'CONTENT_TYPE', '' )
  if ';' in contentType:
    contentType = contentType.split(';', 1)[0]
  if method == 'PUT' and not contentType:
    return
  if contentType not in ('', 'application/x-www-form-urlencoded', 'multipart/form-data'):
    # Not an HTML form submission
    return
  if 'webob._parsed_post_vars' not in environ:
    return
  mD, bodyFile = environ[ 'webob._parsed_post_vars' ]
  for key in mD:
    untrustedList = mD.getall( key )
    sanitizedList = sanitizeUnknownVar( untrustedList )
    del( mD[ key ] )
    for v in sanitizedList:
      mD.add( key, v )
  environ[ 'webob._parsed_post_vars' ] = ( mD, bodyFile )

def sanitizeAllWebInputs( environ ):
  sanitizeGETVars( environ )
  sanitizePOSTVars( environ )
  pass
