Package.describe({
  name: 'htmljs',
  summary: "Small library for expressing HTML trees",
  version: '1.0.11',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('deps');

  api.export('HTML');

  api.addFiles([
    'preamble.js',
    'visitors.js',
    'html.js'
  ]);
});

Package.onTest(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('tinytest');
  api.use('underscore');

  api.use('htmljs');
  api.use('html-tools@1.0.11');

  api.addFiles([
    'htmljs_test.js'
  ]);
});
