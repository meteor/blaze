Package.describe({
  name: 'spacebars-compiler',
  summary: "Compiler for Spacebars template language",
  version: '1.1.3',
  git: 'https://github.com/meteor/blaze.git'
});

Npm.depends({
  'uglify-js': '2.7.5'
});

Package.onUse(function (api) {
  api.use([
    'ecmascript@0.5.8',
    'underscore@1.0.9',
    'htmljs@1.0.11',
    'html-tools@1.0.11',
    'blaze-tools@1.0.10',
  ]);

  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use([
    'underscore',
    'ecmascript',
    'tinytest',
    'spacebars-compiler',
    'blaze-tools'
  ]);

  api.addFiles([
    'spacebars_tests.js',
    'compile_tests.js'
  ]);
});
