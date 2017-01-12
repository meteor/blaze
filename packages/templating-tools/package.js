Package.describe({
  name: 'templating-tools',
  summary: "Tools to scan HTML and compile tags when building a templating package",
  version: '1.1.0',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function(api) {
  api.use([
    'underscore@1.0.9',
    'ecmascript@0.5.8',

    // minifier-js is a weak dependency of spacebars-compiler; adding it here
    // ensures that the output is minified.  (Having it as a weak dependency means
    // that we don't ship uglify etc with built apps just because
    // boilerplate-generator uses spacebars-compiler.)
    // XXX maybe uglify should be applied by this plugin instead of via magic
    // weak dependency.
    'minifier-js@1.2.14'
  ]);

  api.export('TemplatingTools');

  api.use([
    'spacebars-compiler@1.1.0'
  ]);

  api.addFiles([
    'templating-tools.js',
    'html-scanner.js',
    'compile-tags-with-spacebars.js',
    'throw-compile-error.js',
    'code-generation.js'
  ]);
});

Package.onTest(function(api) {
  api.use([
    'tinytest@1.0.11',
    'ecmascript@0.5.8'
  ]);

  api.use([
    'templating-tools'
  ]);

  api.addFiles([
    'html-scanner-tests.js'
  ], 'server');
});
