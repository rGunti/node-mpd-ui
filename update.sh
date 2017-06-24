#!/usr/bin/env bash

echo "Please wait while we are getting the latest version from GitHub..."

git reset --hard HEAD
git clean -xffd
git pull
