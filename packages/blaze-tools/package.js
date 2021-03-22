Package.describe({
  name: 'blaze-tools',
  summary: "Compile-time tools for Blaze",
  version: '1.1.0-beta.2',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript');
  api.use('htmljs@1.1.0-beta.2');

  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use('tinytest@1.0.11');
  api.use('ecmascript');

  api.use('blaze-tools');
  api.use('html-tools@1.1.0-beta.2');

  api.addFiles([
    'token_tests.js'
  ]);
});
