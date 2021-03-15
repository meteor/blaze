Package.describe({
  name: 'spacebars-compiler',
  summary: "Compiler for Spacebars template language",
  version: '1.2.0-beta.2',
  git: 'https://github.com/meteor/blaze.git'
});

Npm.depends({
  'uglify-js': '2.7.5'
});

Package.onUse(function (api) {
  api.use('underscore@1.0.9');

  api.export('SpacebarsCompiler');

  api.use('htmljs@1.1.0-beta.2');
  api.use('html-tools@1.1.0-beta.2');
  api.use('blaze-tools@1.1.0-beta.2');

  api.addFiles([
    'templatetag.js',
    'optimizer.js',
    'react.js',
    'codegen.js',
    'compiler.js'
  ]);
});

Package.onTest(function (api) {
  api.use([
    'underscore',
    'tinytest',
    'coffeescript',
    'spacebars-compiler',
    'blaze-tools'
  ]);

  api.addFiles([
    'spacebars_tests.js',
    'compile_tests.js',
    'compiler_output_tests.coffee'
  ]);
});
