Package.describe({
  name: 'spacebars',
  summary: "Handlebars-like template language for Meteor",
  version: '2.0.0-alpha300.5',
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
  api.use('observe-sequence@2.0.0-alpha300.5');
  api.use('tracker');

  api.export('Spacebars');

  api.use('htmljs@2.0.0-alpha300.5');
  api.use('blaze@3.0.0-alpha300.5');

  api.addFiles([
    'spacebars-runtime.js'
  ]);
});

Package.onTest(function (api) {
  api.use([
    'tinytest'
  ]);

  api.use([
    'spacebars'
  ]);

  api.addFiles([
    'spacebars_tests.js'
  ]);
});
