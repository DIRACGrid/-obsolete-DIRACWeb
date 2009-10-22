import logging
import cgi
import time
import simplejson

from dirac.lib.base import *
from pylons.controllers.util import redirect_to
import dirac.lib.helpers as helpers

from dirac.lib.diset import getRPCClient
import dirac.lib.credentials as credentials

from DIRAC.FrameworkSystem.Client.NotificationClient import NotificationClient
from DIRAC import gLogger, S_OK, S_ERROR

from dirac.lib.webBase import defaultRedirect

log = logging.getLogger(__name__)

class NotificationsCache:
  
  __cacheTime = 300
  
  def __init__(self):
    self.__userTimestamp = {}
    self.__stats = {}
    self.__notifications = {}
    
  def getNtfClient( self ):
    return NotificationClient( getRPCClient )
    
  def getStatsForUser( self, forceRefresh = False ):
    userName = credentials.getUsername()
    if userName == 'anonymous':
      return { 'totalNots' : 0 }
    gLogger.info( "Connecting to retrieve notification stats for user %s" % userName )
    if not forceRefresh and  userName in self.__userTimestamp:
      if time.time() - self.__userTimestamp[ userName ] > self.__cacheTime:
        return self.__stats[ userName ]
    ntf = self.getNtfClient()
    result = ntf.getNotifications( {}, [], 0, 0 )
    if not result[ 'OK' ]:
      gLogger.error( "Could not retrieve notifications", "for user %s: %s" % ( userName, result[ 'Message' ] ) )
      return { 'totalNots' : 0 }
    nots = result[ 'Value' ]
    self.__notifications[ userName ] = nots
    total = len( nots[ 'Records' ] )
    new = []
    records = []
    if total:
      for row in nots[ 'Records' ]:
        rD = {}
        for i in range( len( nots[ 'ParameterNames' ] ) ):
          param = nots[ 'ParameterNames' ][i]
          if param == 'timestamp':
            rD[ param ] = row[i].strftime( "%Y/%m/%d %H:%M:%S UTC" )
          else:
            rD[ param ] = row[i]
        records.append( rD ) 
      new = []
      for record in records:
        if not record[ 'seen' ]:
          new.append( record[ 'id' ] )
      new.sort()
    stats = { 'totalNots' : total, 'newNots' : new }
    gLogger.info( "user %s has %s/%s notifications" % ( userName, total, len( new )  ) )
    self.__stats[ userName ] = stats
    self.__userTimestamp[ userName ] = time.time()
    self.__notifications[ userName ] = records
    return stats
  
  def getNotificationsForUser( self ):
    userName = credentials.getUsername()
    if userName in self.__notifications:
      return self.__notifications[ userName ]
    return {}
  
  def markNotificationsAsSeen( self, seen, notifsIds ):
    userName = credentials.getUsername()
    if userName == 'anonymous':
      return S_OK()
    ntfCli = self.getNtfClient()
    if seen:
      result = ntfCli.markNotificationsAsRead( userName, notifsIds )
    else:
      result = ntfCli.markNotificationsAsNotRead( userName, notifsIds )
    if not result[ 'OK' ]:
      return S_ERROR( result[ 'Message' ] )
    self.getStatsForUser( forceRefresh = True )
    return S_OK()
  
  def deleteNotifications( self, notifsIds ):
    userName = credentials.getUsername()
    if userName == 'anonymous':
      return S_OK()
    ntfCli = self.getNtfClient()
    result = ntfCli.removeNotificationsForUser( userName, notifsIds )
    if not result[ 'OK' ]:
      return S_ERROR( result[ 'Message' ] )
    self.getStatsForUser( forceRefresh = True )
    return S_OK()
    
gNotCache = NotificationsCache()

class NotificationsController(BaseController):

  def index(self):
    return defaultRedirect()
  
  @jsonify
  def getUserStats( self ):
    return S_OK( gNotCache.getStatsForUser() )
  
  @jsonify
  def retrieveNotifications( self ):
    return { 'notifications' : gNotCache.getNotificationsForUser() }
  
  @jsonify
  def markNotificationsRead( self ):
    try:
      notifs = simplejson.loads( request.params[ 'notifsIds' ] )
      notifs = [ int( id ) for id in notifs ]
    except Exception, e:
      return S_ERROR( "Error getting notifications: %s" % str(e) )
    return gNotCache.markNotificationsAsSeen( True, notifs )
  
  @jsonify
  def markNotificationsUnread( self ):
    try:
      notifs = simplejson.loads( request.params[ 'notifsIds' ] )
      notifs = [ int( id ) for id in notifs ]
    except Exception, e:
      return S_ERROR( "Error getting notifications: %s" % str(e) )
    return gNotCache.markNotificationsAsSeen( False, notifs )

  @jsonify
  def deleteNotifications( self ):
    try:
      notifs = simplejson.loads( request.params[ 'notifsIds' ] )
      notifs = [ int( id ) for id in notifs ]
    except Exception, e:
      return S_ERROR( "Error getting notifications: %s" % str(e) )
    return gNotCache.deleteNotifications( notifs )
    
    