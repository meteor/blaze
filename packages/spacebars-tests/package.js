/* global Package */

Package.describe({
  name: 'spacebars-tests',
  summary: 'Additional tests for Spacebars',
  version: '1.4.0',
  git: 'https://github.com/meteor/blaze.git',
});

// These tests are in a separate package to avoid a circular dependency
// between the `spacebars` and `templating` packages.
Package.onTest(function (api) {
  api.use([
    'es5-shim@4.8.0',
    'tinytest@1.1.0',
    'jquery@1.11.9 || 3.0.0',
    'test-helpers@1.2.0',
    'reactive-var@1.0.11',
    'markdown@1.0.14 || 2.0.0',
    'minimongo@1.6.2',
    'tracker@1.2.0',
    'mongo@1.11.1',
    'random@1.2.0',
    'session@1.2.0',
  ]);

  api.use([
    'spacebars@1.2.0',
    'blaze@2.5.0',
  ]);
  api.use('templating@1.4.1', 'client');

  api.addFiles([
    'template_tests.html',
    'template_tests.js',
    'templating_tests.html',
    'templating_tests.js',

    'old_templates.js', // backcompat for packages built with old Blaze APIs.
    'old_templates_tests.js',
  ], 'client');

  api.addFiles('template_tests_server.js', 'server');

  api.addAssets([
    'assets/markdown_basic.html',
    'assets/markdown_if1.html',
    'assets/markdown_if2.html',
    'assets/markdown_each1.html',
    'assets/markdown_each2.html',
  ], 'server');
});
