Package.describe({
  name: 'templating-tools',
  summary: "Tools to scan HTML and compile tags when building a templating package",
  version: '1.2.0',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function(api) {
  api.use([
    'underscore@1.0.9',
    'ecmascript@0.14.4'
  ]);

  api.export('TemplatingTools');

  api.use([
    'spacebars-compiler@1.2.0'
  ]);

  api.mainModule('templating-tools.js')
});

Package.onTest(function(api) {
  api.use([
    'tinytest@1.0.11',
    'ecmascript@0.14.4'
  ]);

  api.use([
    'templating-tools'
  ]);

  api.addFiles([
    'html-scanner-tests.js'
  ], 'server');
});
