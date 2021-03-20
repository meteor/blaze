Package.describe({
  name: 'htmljs',
  summary: "Small library for expressing HTML trees",
  version: '1.1.0-beta.2',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('tracker@1.1.0');

  api.export('HTML');

  api.addFiles([
    'preamble.js',
    'visitors.js',
    'html.js'
  ]);
});

Package.onTest(function (api) {
  api.use('tinytest@1.0.11');
  api.use('underscore@1.0.9');

  api.use('htmljs');
  api.use('html-tools@1.1.0-beta.2');

  api.addFiles([
    'htmljs_test.js'
  ]);
});
