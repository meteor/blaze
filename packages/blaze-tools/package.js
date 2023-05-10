Package.describe({
  name: 'blaze-tools',
  summary: "Compile-time tools for Blaze",
  version: '2.0.0-alpha300.3',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.15.1');
  api.use('htmljs@1.1.1');

  api.export('BlazeTools');
  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use('tinytest');
  api.use('ecmascript');

  api.use('blaze-tools');
  api.use('html-tools@1.1.3');

  api.addFiles([
    'token_tests.js'
  ]);
});
