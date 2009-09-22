#!/bin/bash

basedir=`dirname $0`

mkdir -p $basedir/../data/production
chmod 777 $basedir/../data/production

for comp in ext yui
do
  echo "Installing $comp"
  tar xjf $basedir/js/$comp.tar.bz2 -C $basedir/../dirac/public/
done

tar xzf $basedir/images/flags.tar.gz -C $basedir/../dirac/public/images

