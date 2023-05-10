Package.describe({
  name: 'spacebars-compiler',
  summary: "Compiler for Spacebars template language",
  version: '2.0.0-alpha300.5',
  git: 'https://github.com/meteor/blaze.git'
});

Npm.depends({
  'uglify-js': '3.16.1'
});

Package.onUse(function (api) {
  api.use('ecmascript@1.0.0-alpha300.5');

  api.use('htmljs@2.0.0-alpha300.5');
  api.use('html-tools@2.0.0-alpha300.5');
  api.use('blaze-tools@2.0.0-alpha300.5');

  api.export('SpacebarsCompiler');

  api.mainModule('preamble.js');
});

Package.onTest(function (api) {
  api.use([
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
