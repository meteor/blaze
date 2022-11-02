/* global Package Npm */

Package.describe({
  name: 'templating-tools',
  summary: 'Tools to scan HTML and compile tags when building a templating package',
  version: '1.3.0',
  git: 'https://github.com/meteor/blaze.git',
});

Npm.depends({
  'lodash.isempty': '4.4.0',
});

Package.onUse(function(api) {
  api.use([
    'ecmascript@0.15.1',
  ]);

  api.export('TemplatingTools');

  api.use([
    'spacebars-compiler@1.3.1',
  ]);

  api.mainModule('templating-tools.js');
});

Package.onTest(function(api) {
  api.use([
    'tinytest@1.1.0',
    'ecmascript@0.15.1',
  ]);

  api.use([
    'templating-tools',
  ]);

  api.addFiles([
    'html-scanner-tests.js',
  ], 'server');
});
