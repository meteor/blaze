Package.describe({
  name: 'htmljs',
  summary: "Small library for expressing HTML trees",
  version: '1.1.1',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.15.1');

  api.export('HTML');
  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use('ecmascript');
  api.use('tinytest@1.1.0');

  api.use('htmljs');

  api.addFiles([
    'htmljs_test.js'
  ]);
});
