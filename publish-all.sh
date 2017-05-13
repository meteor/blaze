#!/bin/bash

for package in htmljs html-tools blaze-tools spacebars-compiler templating-tools caching-html-compiler static-html blaze spacebars templating-compiler templating-runtime templating spacebars-tests ui blaze-html-templates ; do
  echo "Publishing $package"
  (cd packages/$package && meteor publish)
done
