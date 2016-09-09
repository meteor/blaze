#!/usr/bin/env bash

INFINITY=10000

TOPDIR=$(pwd)

# Call git grep to find all js files with the appropriate comment tags,
# and only then pass it to JSDoc which will parse the JS files.
# This is a whole lot faster than calling JSDoc recursively.
git grep -al "@summary" -- .. | xargs -L ${INFINITY} -t \
    "$TOPDIR/node_modules/.bin/jsdoc" \
    -t "$TOPDIR/jsdoc/docdata-jsdoc-template" \
    -c "$TOPDIR/jsdoc/jsdoc-conf.json" \
    2>&1 | grep -v 'WARNING: JSDoc does not currently handle'
