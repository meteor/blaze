Package.describe({
  name: 'spacebars-compiler',
  summary: "Compiler for Spacebars template language",
  version: '1.3.1',
  git: 'https://github.com/meteor/blaze.git'
});

Npm.depends({
  'uglify-js': '3.16.1'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.15.1');

  api.use('htmljs@1.1.1');
  api.use('html-tools@1.1.3');
  api.use('blaze-tools@1.1.3');

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
