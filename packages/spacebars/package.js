Package.describe({
  name: 'spacebars',
  summary: "Handlebars-like template language for Meteor",
  version: '1.3.0',
  git: 'https://github.com/meteor/blaze.git'
});

// For more, see package `spacebars-compiler`, which is used by
// the build plugin and not shipped to the client unless you
// ask for it by name.
//
// The Spacebars build plugin is in package `templating`.
//
// Additional tests are in `spacebars-tests`.

Package.onUse(function (api) {
  api.use('observe-sequence@1.0.16');
  api.use('tracker@1.2.0');

  api.export('Spacebars');

  api.use('htmljs@1.1.1');
  api.use('blaze@2.5.0');

  api.addFiles([
    'spacebars-runtime.js'
  ]);
});

Package.onTest(function (api) {
  api.use([
    'tinytest@1.1.0'
  ]);

  api.use([
    'spacebars'
  ]);

  api.addFiles([
    'spacebars_tests.js'
  ]);
});
