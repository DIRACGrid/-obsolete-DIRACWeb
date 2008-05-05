import logging

import simplejson
from dirac.lib.base import *
from dirac.lib.diset import getRPCClient, getTransferClient

from DIRAC import S_OK, S_ERROR

log = logging.getLogger(__name__)

class AccountingController(BaseController):

  def __getUniqueKeyValues( self, typeName ):
    rpcClient = getRPCClient( "Accounting/ReportGenerator" )
    retVal = rpcClient.listUniqueKeyValues( typeName )
    if not retVal[ 'OK' ]:
      return retVal
    rawValuesDict = retVal[ 'Value' ]
    valuesDict = {}
    for keyName in rawValuesDict:
      valuesDict[ keyName ] = [ tup[0] for tup in rawValuesDict[ keyName ] ]
    return S_OK( valuesDict )

  def index(self):
    # Return a rendered template
    #   return render('/some/template.mako')
    # or, Return a response
    return redirect_to( url_for( "/systems/accounting/dataOperation" ) )

  def dataOperation(self):
    #This can be cached
    retVal = self.__getUniqueKeyValues( "DataOperation" )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render ( "/error.mako" )
    c.selectionValues = simplejson.dumps( retVal[ 'Value' ] )
    print c.selectionValues
    return render ("/systems/accounting/dataOperation.mako")

  @jsonify
  def ajaxCall(self):
    return True