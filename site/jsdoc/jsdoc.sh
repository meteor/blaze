#!/usr/bin/env bash

$PACKAGES_PATH=$1
$OUT_PATH=$2

# BLAZE package
jsdoc2md "$PACKAGES_PATH/blaze/**/*.js" >> "$OUT_PATH/blaze.md"
