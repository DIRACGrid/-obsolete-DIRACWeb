import logging

from dirac.lib.base import *
from DIRAC import S_OK, S_ERROR

log = logging.getLogger(__name__)

class MessageController(BaseController):
  
  def index(self):
   return self.retrieve()

  @jsonify
  def retrieve( self ):
    #return S_OK( { 'i' : 1 , 'content' : 'HELLO!' } )
    return S_OK()
  
  @jsonify
  def delivered( self ):
    try:
      msgId = int( request.params[ 'id' ] )
    except:
      return S_ERROR( "Missing message id" )
    return S_OK()