Package.describe({
  name: 'spacebars-compiler',
  summary: "Compiler for Spacebars template language",
  version: '1.0.12',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('underscore');
  // The templating plugin will pull in minifier-js, so that generated code will
  // be beautified. But it's a weak dependency so that eg boilerplate-generator
  // doesn't pull in the minifier.
  api.use('minifier-js', ['server'], { weak: true });

  api.export('SpacebarsCompiler');

  api.use('htmljs@1.0.10');
  api.use('html-tools@1.0.10');
  api.use('blaze-tools@1.0.9');

  api.addFiles([
    'templatetag.js',
    'optimizer.js',
    'react.js',
    'codegen.js',
    'compiler.js'
  ]);
});

Package.onTest(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use([
    'underscore',
    'tinytest',
    'coffeescript'
  ]);

  api.use([
    'spacebars-compiler',
    'blaze-tools@1.0.9',
    'spacebars@1.0.12',
    'blaze@2.1.8'
  ]);

  api.addFiles([
    'spacebars_tests.js',
    'compile_tests.js',
    'compiler_output_tests.coffee'
  ]);
});
