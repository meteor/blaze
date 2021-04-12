Package.describe({
  name: 'blaze-tools',
  summary: "Compile-time tools for Blaze",
  version: '1.1.0',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.14.4');
  api.use('htmljs@1.1.0');

  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use('tinytest@1.0.11');
  api.use('ecmascript');

  api.use('blaze-tools');
  api.use('html-tools@1.1.0');

  api.addFiles([
    'token_tests.js'
  ]);
});
