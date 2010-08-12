#!/usr/bin/env python
########################################################################
# $HeadURL: svn+ssh://svn.cern.ch/reps/dirac/LHCbDIRAC/trunk/LHCbDIRAC/Core/scripts/lhcb-proxy-init.py $
# File :   dirac-postInstall.py
# Author : Ricardo Graciani
########################################################################
__RCSID__ = "$Id: lhcb-proxy-init.py 18858 2009-12-02 12:13:33Z atsareg $"
import os
import sys
basedir = sys.path[0]
dataDir = os.path.join( basedir, 'data', 'production' )
os.makedirs( dataDir, mode = 0777 )

destDir = os.path.join( basedir, 'dirac', 'public' )
for comp in ['ext', 'yui']:
  tarName = os.path.join( basedir, 'tarballs', 'js', '%s.tar.bz' % comp )
  if os.system( 'tar xjf %s -C %s' ( tarName, destDir ) ):
    sys.exit( 1 )

destDir = os.path.join( basedir, 'dirac', 'public', 'images' )
tarName = os.path.join( basedir, 'tarballs', 'images', 'flogs.tar.gz' )

if os.system( 'tar xjf %s -C %s' ( tarName, destDir ) ):
  sys.exit( 1 )

