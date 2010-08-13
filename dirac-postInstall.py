#!/usr/bin/env python
########################################################################
# $HeadURL$
# File :   dirac-postInstall.py
# Author : Ricardo Graciani
########################################################################
__RCSID__ = "$Id$"
import os
import sys
basedir = sys.path[0]
dataDir = os.path.join( basedir, 'data', 'production' )
os.makedirs( dataDir, mode = 0777 )

destDir = os.path.join( basedir, 'dirac', 'public' )
for comp in ['ext', 'yui']:
  tarName = os.path.join( basedir, 'tarballs', 'js', '%s.tar.bz2' % comp )
  if os.system( 'tar xjf %s -C %s' % ( tarName, destDir ) ):
    sys.exit( 1 )

destDir = os.path.join( basedir, 'dirac', 'public', 'images' )
tarName = os.path.join( basedir, 'tarballs', 'images', 'flags.tar.gz' )

if os.system( 'tar xzf %s -C %s' % ( tarName, destDir ) ):
  sys.exit( 1 )

