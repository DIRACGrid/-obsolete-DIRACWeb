#!/usr/bin/env python

import sys

if len( sys.argv ) < 2:
  print "Musy specify wich .cfg file to indent!"
  sys.exit(1)

try:
  fd = file( sys.argv[1], "r" )
except Exception, e:
  print "Can't open file %s : %s" % ( sys.argv[1], e )
  sys.exit(1)

lines = fd.readlines()
fd.close()

tab = "  "
indent = 0
for line in lines:
  line = line.strip()
  #print "[%s]" % line
  newLine = tab*indent
  while line:
    if line[0] == "{":
      if newLine.strip():
        print newLine
      print "%s{" % ( tab*indent )
      indent += 1
      newLine = tab*indent
      line = line[2:]
    elif line[0] == "}":
      indent -= 1
      if newLine.strip():
        print newLine
      print "%s}" % ( tab*indent )
      newLine = tab*indent
      line = line[2:]
    else:
      newLine += line[0]
      line = line[1:]
  if newLine.strip():
    print newLine
