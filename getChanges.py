#!/usr/bin/env python

import subprocess
import getpass
import re
import sys
import pprint

#passwd = getpass.getpass( "Your CVS password" )

versionTag = "webd\d\d\d\d\d\d\d\dr\d\d"
tagRE = re.compile( "(%s): (\d+.\d+)" % versionTag )

filenameRE = re.compile( "Working file: ([a-zA-Z0-9_./]*)" )
revRE = re.compile( "^revision (\d+.\d+)" )
commentRE = re.compile( "^(BUGFIX|NEW|FEATURE|CHANGE|DEPRECATED): *(.*)" )
authorRE = re.compile( "^date: .* author: ([a-zA-Z]+);.*" )
#date: 2009-09-15 16:06:32 +0200;  author: acasajus;  state: Exp;  commitid: vfFZeXZBsvQnxM3u;

def getLog( path ):
  subP = subprocess.Popen( "cvs log %s 2>&1" % path, stdout = subprocess.PIPE, stdin = subprocess.PIPE, shell=True )

  lines = subP.stdout.readlines()
  versions = []
  currentFile = False
  currentRev = False
  currentComment = []
  fileLog = {}
  commentMode = False
  for line in lines:
    if commentMode:
      line = line.strip()
      if line.find( "=========" ) == 0 or line.find( "----------" ) == 0:
        commentMode = False
        fileLog[ currentFile ][ 'comments' ][ currentRev ] = currentComment
        continue
      else:
        currentComment.append( line )
        continue
    #END SEARCH FOR COMMENT
    fileRes = filenameRE.search( line )
    if fileRes:
      currentFile = fileRes.groups()[0]
      if currentFile not in fileLog:
        fileLog[ currentFile ] = { "tags" : {}, "comments" : {} }
    reRes = tagRE.search( line )
    if reRes:
      if not currentFile:
        print "="*20
        print "Error! Found a version without a file!"
        print "="*20
        print "".join( lines )
        sys.exit(1)
      tag, rev = reRes.groups()
      rev = tuple( rev.split(".") )
      fileLog[ currentFile ][ 'tags' ][ tag ] = rev
    revRes = revRE.search( line )
    if revRes:
      currentRev = tuple( revRes.groups()[0].split( "." ) )
      commentMode = True
      currentComment = []
  return fileLog


fileLog = getLog( "." )
#file( "cvslog.py", "w" ).write( str( fileLog ) )
#fileLog = eval( file( "cvslog.py", "r" ).read() )

print "Got information from CVS"
print "There are %s files" % len( fileLog.keys() )
tags = []
for file in fileLog:
  for tag in fileLog[ file ][ 'tags' ]:
    if tag not in tags:
      tags.append( tag )
tags.sort()
print "Release tags are:\n\t%s" % "\n\t".join( sorted( tags ) )
if len( tags ) < 2:
  print "At least two tags are required to show comments between them"
  sys.exit(1)
currentTag = tags[-2]
nextTag = tags[-1]
print "Showing comments between %s and %s" % ( currentTag, nextTag )
commentsData = {}
for file in sorted( fileLog ):
  fileTags = fileLog[ file ][ 'tags' ]
  if currentTag not in fileTags:
    continue
  if nextTag not in fileTags:
    continue
  currentRev = fileTags[ currentTag ]
  nextRev = fileTags[ nextTag ]
  fileCom = fileLog[ file ][ 'comments' ]
  for comRev in sorted( fileCom ):
    if comRev > currentRev and comRev <= nextRev:
      author = False
      comments = []
      for line in fileCom[ comRev ]:
        authRes = authorRE.search( line )
        if authRes:
          author = authRes.groups()[0]
        comRes = commentRE.search( line )
        if comRes:
          comments.append( "%s: %s" % tuple( comRes.groups()[ : 2 ] ) )
      if comments:
        if file not in commentsData:
          commentsData[ file ] = {}
        commentsData[ file ] = { 'author' : author, 'content' : comments }

print pprint.pprint( commentsData )
