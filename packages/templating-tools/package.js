Package.describe({
  name: 'templating-tools',
  summary: "Tools to scan HTML and compile tags when building a templating package",
  version: '2.0.0',
  git: 'https://github.com/meteor/blaze.git'
});

Npm.depends({
  'lodash.isempty': '4.4.0'
});

Package.onUse(function(api) {
  api.use([
    'ecmascript@0.16.9'
  ]);

  api.export('TemplatingTools');

  api.use([
    'spacebars-compiler@2.0.0'
  ]);

  api.mainModule('templating-tools.js');
});

Package.onTest(function(api) {
  api.use([
    'tinytest',
    'ecmascript@0.16.9'
  ]);

  api.use([
    'templating-tools'
  ]);

  api.addFiles([
    'html-scanner-tests.js'
  ], 'server');
});
