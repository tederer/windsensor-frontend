#!/bin/bash

scriptDir=$(cd $(dirname $0) && pwd)
cd $scriptDir
projectName=$(echo $scriptDir | sed -E 's/(.*\/)*//')
destination=/root/$projectName

if [ "$projectName" == "" ]; then
   echo "failed to evaluate project name"
   exit 1
fi

echo "The content of $scriptDir is available in $destination"

sudo docker run -it --rm --mount type=bind,src=$scriptDir,dst=/root/$projectName -p 80:80 node:current-slim /bin/bash
