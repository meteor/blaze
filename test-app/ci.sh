#!/usr/bin/env bash

ln -sfn ../packages ./packages
meteor npm install

export URL='http://localhost:4096/'

exec 3< <(meteor test-packages --driver-package test-in-console -p 4096 --exclude ${TEST_PACKAGES_EXCLUDE:-''})
EXEC_PID=$!

sed '/test-in-console listening$/q' <&3

meteor node puppeteerRunner.js

STATUS=$?

pkill -TERM -P $EXEC_PID
exit $STATUS
