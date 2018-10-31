Package.describe({
  name: 'blaze-tools',
  summary: "Compile-time tools for Blaze",
  version: '1.0.10',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use([
    'ecmascript@0.5.8',
    'htmljs@1.0.11'
  ]);

  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use([
    'tinytest',
    'ecmascript',
    'blaze-tools',
    'html-tools',
  ]);

  api.addFiles([
    'token_tests.js'
  ]);
});
