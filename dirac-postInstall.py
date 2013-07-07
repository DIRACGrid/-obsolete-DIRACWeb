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
import shutil

basedir = sys.path[0]
dataDir = os.path.join( basedir, 'data', 'production' )
if not os.path.isdir( dataDir ):
  os.makedirs( dataDir, mode = 0777 )

rootPath = os.path.dirname( os.path.dirname( os.path.realpath( __file__ ) ) )

master = os.path.join( rootPath , "etc" , "web.cfg" )
release = os.path.join( basedir , "dirac" , "web.cfg" )
if not os.path.exists( master ):
  try:
    shutil.copy( release , master )
  except Exception, x:
    print "Exception while copying the web.cfg to etc/"
    print str(x)
    pass

tarName = os.path.join( basedir, 'tarballs', 'html', 'welcomePage.tar.gz' )
targetDir = os.path.join( rootPath , "webRoot" , 'www' )
print "Deploying web site files to %s" % targetDir
os.system( 'tar xzkf %s -C %s' % ( tarName , targetDir ) )
# keep-file option is always throwing an error

html = [ "footer" , "header" , "conditions" , "form" , "done" ]
for name in html:
  fname = "reg_%s.html" % name
  tpath = os.path.join( rootPath , "webRoot" , "www" , "templates" , fname )
  lpath = os.path.join( basedir , "dirac" , "templates" , fname )
  if ( os.path.exists( tpath ) ) and not ( os.path.exists( lpath ) ):
    print "Creating link: %s %s" % ( tpath , lpath )
    os.symlink( tpath , lpath )

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
extVersion="4.0.2a"
extFilePath = os.path.join( downDir, "ext-%s-gpl.zip" % extVersion )
if not os.path.isfile( extFilePath ):
  print "Downloading ExtJS4..."
  try:
    remFile = urllib2.urlopen( "http://extjs.cachefly.net/ext-%s-gpl.zip" % extVersion , "rb" )
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
spinner = ".:|\-=-/|:"
count = 0
biggest = 40
for entryName in zFile.namelist():
  biggest = max( biggest, len( entryName ) )
  print " %s %s\r" % ( spinner[count%len(spinner)], entryName.ljust( biggest, " " ) ),
  count += 1
  entryDir = os.path.join( publicDir, os.path.dirname( entryName ) )
  if not os.path.isdir( entryDir ):
    os.makedirs( entryDir )
  entryPath = os.path.join( publicDir, entryName )
  if os.path.isdir( entryPath ):
    continue
  localFile = open( entryPath, "w" )
  localFile.write( zFile.read( entryName ) )
  localFile.close()
locationPath = os.path.join( publicDir, "ext4" )
if os.path.isdir( locationPath ):
  shutil.rmtree( locationPath )
os.rename( os.path.join( publicDir, "ext-%s" % extVersion ), locationPath )


