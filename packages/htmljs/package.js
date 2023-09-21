Package.describe({
  name: 'htmljs',
  summary: "Small library for expressing HTML trees",
  version: '2.0.0-alpha300.15',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.16.8-alpha300.15');

  api.export('HTML');
  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use('ecmascript');
  api.use('tinytest');

  api.use('htmljs');

  api.addFiles([
    'htmljs_test.js'
  ]);
});
