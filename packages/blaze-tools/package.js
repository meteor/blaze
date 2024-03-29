Package.describe({
  name: 'blaze-tools',
  summary: "Compile-time tools for Blaze",
  version: '1.1.4',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.15.1');
  api.use('htmljs@1.2.0');

  api.export('BlazeTools');
  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use('tinytest@1.1.0');
  api.use('ecmascript');

  api.use('blaze-tools');
  api.use('html-tools@1.1.4');

  api.addFiles([
    'token_tests.js'
  ]);
});
