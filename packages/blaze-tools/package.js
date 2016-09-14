Package.describe({
  name: 'blaze-tools',
  summary: "Compile-time tools for Blaze",
  version: '1.0.10',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('underscore');

  api.export('BlazeTools');

  api.use('htmljs@1.0.11');

  api.addFiles([
    'preamble.js',
    'tokens.js',
    'tojs.js'
  ]);
});

Package.onTest(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('tinytest');
  api.use('underscore');

  api.use('blaze-tools');
  api.use('html-tools@1.0.10');

  api.addFiles([
    'token_tests.js'
  ]);
});
