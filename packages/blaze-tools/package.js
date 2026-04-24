Package.describe({
  name: 'blaze-tools',
  summary: "Compile-time tools for Blaze",
  version: '2.0.1',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.16.9');
  api.use('htmljs@2.0.2');

  api.export('BlazeTools');
  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use('tinytest');
  api.use('ecmascript');

  api.use('blaze-tools');
  api.use('html-tools@2.0.1');

  api.addFiles([
    'token_tests.js'
  ]);
});
