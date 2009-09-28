import logging

from dirac.lib.base import *
from DIRAC import S_OK, S_ERROR

log = logging.getLogger(__name__)

class MessageController(BaseController):
  
  def index(self):
   return self.retrieve()

  @jsonify
  def retrieve( self ):
    return S_OK()
  
  @jsonify
  def delivered( self ):
    return S_OK()