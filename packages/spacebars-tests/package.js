Package.describe({
  name: 'spacebars-tests',
  summary: "Additional tests for Spacebars",
  version: '1.2.0',
  git: 'https://github.com/meteor/blaze.git'
});

// These tests are in a separate package to avoid a circular dependency
// between the `spacebars` and `templating` packages.
Package.onTest(function (api) {
  api.use([
    'es5-shim@4.6.14',
    'underscore@1.0.9',
    'tinytest@1.0.11',
    'jquery@1.11.9 || 3.0.0',
    'test-helpers@1.0.10',
    'reactive-var@1.0.10',
    'markdown@1.0.10',
    'minimongo@1.0.17',
    'tracker@1.1.0',
    'mongo@1.1.11',
    'random@1.0.10',
    'session@1.1.6'
  ]);

  api.use([
    'spacebars@1.1.0',
    'blaze@2.4.0'
  ]);
  api.use('templating@1.4.0', 'client');

  api.addFiles([
    'template_tests.html',
    'template_tests.js',
    'templating_tests.html',
    'templating_tests.js',

    'old_templates.js', // backcompat for packages built with old Blaze APIs.
    'old_templates_tests.js'
  ], 'client');

  api.addFiles('template_tests_server.js', 'server');

  api.addAssets([
    'assets/markdown_basic.html',
    'assets/markdown_if1.html',
    'assets/markdown_if2.html',
    'assets/markdown_each1.html',
    'assets/markdown_each2.html'
  ], 'server');
});
