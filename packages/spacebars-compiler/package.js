Package.describe({
  name: 'spacebars-compiler',
  summary: "Compiler for Spacebars template language",
  version: '1.1.0',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('underscore@1.0.9');
  // The templating plugin will pull in minifier-js, so that generated code will
  // be beautified. But it's a weak dependency so that eg boilerplate-generator
  // doesn't pull in the minifier.
  api.use('minifier-js@=1.2.17', ['server'], { weak: true });

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
});
