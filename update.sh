#!/usr/bin/env bash
SCRIPT_PATH=`realpath $0`
SCRIPT_DIR=`dirname $SCRIPT_PATH`

cd $SCRIPT_DIR
echo $SCRIPT_DIR

echo "Please wait while we are getting the latest version from GitHub..."

git reset --hard HEAD
git clean -xffd
git pull

echo "Making Bash Scripts executable..."
chmod +x *.sh

echo "Checking NPM Dependencies..."
npm install .
