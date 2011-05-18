#!/usr/bin/env python
########################################################################
# $HeadURL$
# File :   dirac-postInstall.py
# Author : Ricardo Graciani
########################################################################
__RCSID__ = "$Id$"
import os
import sys
import urllib2
import zipfile

basedir = sys.path[0]
dataDir = os.path.join( basedir, 'data', 'production' )
if not os.path.isdir( dataDir ):
  os.makedirs( dataDir, mode = 0777 )

publicDir = os.path.join( basedir, 'dirac', 'public' )

jsTarballsDir = os.path.join( basedir, 'tarballs', 'js' )
for comp in ['ext', 'yui']:
  print "Deploying %s" % comp
  tarName = os.path.join( jsTarballsDir, '%s.tar.bz2' % comp )
  if not os.path.isdir( os.path.join( publicDir, comp ) ):
    if os.system( 'tar xjf %s -C %s' % ( tarName, publicDir ) ):
      sys.exit( 1 )

tarName = os.path.join( basedir, 'tarballs', 'images', 'flags.tar.gz' )
if os.system( 'tar xzf %s -C %s' % ( tarName, os.path.join( publicDir, 'images' ) ) ):
  sys.exit( 1 )

downDir = os.path.join( basedir, "tarballs", "down" )
if not os.path.isdir( downDir ):
  os.makedirs( downDir )

#Get Ext 4.0
extFilePath = os.path.join( downDir, "ext-4.0.0-gpl.zip" )
if not os.path.isfile( extFilePath ):
  print "Downloading ExtJS4..."
  try:
    remFile = urllib2.urlopen( "http://extjs.cachefly.net/ext-4.0.0-gpl.zip", "rb" )
  except Exception, excp:
    print "Cannot download extjs 4!", excp
    sys.exit( 1 )
  locFile = open( extFilePath, "wb" )
  remData = remFile.read( 1024 * 1024 )
  spinner = "|/-=-\\"
  count = 0
  while remData:
    print "%s\r" % spinner[count % len( spinner )],
    sys.stdout.flush()
    locFile.write( remData )
    remData = remFile.read( 1024 * 1024 )
    count += 1
  locFile.close()
  remFile.close()

print "Installing ExtJS 4"
zFile = zipfile.ZipFile( extFilePath )
zFile.extractall( publicDir )


