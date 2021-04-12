Package.describe({
  name: 'htmljs',
  summary: "Small library for expressing HTML trees",
  version: '1.1.0',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.14.4');

  api.export('HTML');
  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use('ecmascript');
  api.use('tinytest@1.0.11');

  api.use('htmljs');

  api.addFiles([
    'htmljs_test.js'
  ]);
});
