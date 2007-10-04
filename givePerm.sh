#!/bin/bash

basedir=`dirname $0`

find $basedir -type d -exec chmod 755 {} \;
find $basedir -type f -exec chmod 644 {} \;
find $basedir/data -type d -exec chmod 777 {} \;
find $basedir/data -type f -exec chmod 666 {} \;

chmod 755 $0
