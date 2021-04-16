Package.describe({
  name: 'spacebars-compiler',
  summary: "Compiler for Spacebars template language",
  version: '1.2.1',
  git: 'https://github.com/meteor/blaze.git'
});

Npm.depends({
  'uglify-js': '2.7.5'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.14.4');
  api.use('underscore@1.0.9');

  api.use('htmljs@1.1.0');
  api.use('html-tools@1.1.0');
  api.use('blaze-tools@1.1.0');

  api.export('SpacebarsCompiler');

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
    'compile_tests.js',
  ]);
});
