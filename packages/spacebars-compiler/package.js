Package.describe({
  name: 'spacebars-compiler',
  summary: "Compiler for Spacebars template language",
  version: '1.1.0',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('underscore@1.0.9');

  api.export('SpacebarsCompiler');

  api.use('htmljs@1.0.11');
  api.use('html-tools@1.0.11');
  api.use('blaze-tools@1.0.10');

  api.addFiles([
    'templatetag.js',
    'optimizer.js',
    'react.js',
    'codegen.js',
    'compiler.js'
  ]);

  // Pull in uglify-js from NPM
  Npm.depends({
    'uglify-js': '2.7.5'
  });
});

Package.onTest(function (api) {
  api.use([
    'underscore@1.0.9',
    'tinytest@1.0.11',
    'coffeescript@1.2.4'
  ]);

  api.use([
    'spacebars-compiler',
    'blaze-tools@1.0.10',
    'spacebars@1.0.13',
    'blaze@2.1.9'
  ]);

  api.addFiles([
    'spacebars_tests.js',
    'compile_tests.js',
    'compiler_output_tests.coffee'
  ]);

  Npm.depends({
    'uglify-js': '2.7.5'
  })
});
