Package.describe({
  name: 'spacebars',
  summary: "Handlebars-like template language for Meteor",
  version: '1.0.12',
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
  api.versionsFrom('METEOR@1.4.1');

  api.use('observe-sequence');
  api.use('underscore');
  api.use('tracker');

  api.export('Spacebars');

  api.use('htmljs@1.0.11');
  api.use('blaze@2.1.9');

  api.addFiles([
    'spacebars-runtime.js'
  ]);
});
