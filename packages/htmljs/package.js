Package.describe({
  name: 'htmljs',
  summary: "Small library for expressing HTML trees",
  version: '1.0.11',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.5.8');
  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use([
    'tinytest',
    'ecmascript',
    'htmljs',
    'html-tools',
  ]);

  api.addFiles([
    'htmljs_test.js'
  ]);
});
