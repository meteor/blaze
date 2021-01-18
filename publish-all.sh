#!/bin/bash

for package in htmljs html-tools blaze-tools spacebars-compiler templating-tools caching-html-compiler static-html blaze blaze-hot spacebars templating-compiler templating-runtime templating spacebars-tests blaze-html-templates ; do
  echo "Publishing $package"
  (cd packages/$package && meteor publish)
done
