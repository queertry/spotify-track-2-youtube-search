#!/usr/bin/env bash

version="$1"

if test -z "$version"; then
  echo "usage: build.sh <version>" >&2
  exit 1
fi

mkdir -p "build/$version"

zip -r "build/$version/st2ys@queertry.com.xpi" src/
echo "Successfully built version $version"
exit 0