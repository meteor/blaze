Package.describe({
  name: 'templating-tools',
  summary: "Tools to scan HTML and compile tags when building a templating package",
  version: '1.0.4',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use([
    'underscore',
    'ecmascript',

    // minifier-js is a weak dependency of spacebars-compiler; adding it here
    // ensures that the output is minified.  (Having it as a weak dependency means
    // that we don't ship uglify etc with built apps just because
    // boilerplate-generator uses spacebars-compiler.)
    // XXX maybe uglify should be applied by this plugin instead of via magic
    // weak dependency.
    'minifier-js'
  ]);

  api.export('TemplatingTools');

  api.use([
    'spacebars-compiler@1.0.13'
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
  api.versionsFrom('METEOR@1.4.1');

  api.use([
    'tinytest',
    'ecmascript'
  ]);

  api.use([
    'templating-tools'
  ]);

  api.addFiles([
    'html-scanner-tests.js'
  ], 'server');
});
