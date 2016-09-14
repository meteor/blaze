Package.describe({
  name: 'blaze',
  summary: "Meteor Reactive Templating library",
  version: '2.1.9',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('jquery'); // should be a weak dep, by having multiple "DOM backends"
  api.use('tracker');
  api.use('check');
  api.use('underscore'); // only the subset in microscore.js
  api.use('observe-sequence');
  api.use('reactive-var');

  api.export([
    'Blaze',
    'UI',
    'Handlebars'
  ]);

  api.use('htmljs@1.0.11');
  api.imply('htmljs@1.0.11');

  api.addFiles([
    'preamble.js'
  ]);

  // client-only files
  api.addFiles([
    'dombackend.js',
    'domrange.js',
    'events.js',
    'attrs.js',
    'materializer.js'
  ], 'client');

  // client and server
  api.addFiles([
    'exceptions.js',
    'view.js',
    'builtins.js',
    'lookup.js',
    'template.js',
    'backcompat.js'
  ]);
});

Package.onTest(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('tinytest');
  api.use('test-helpers');
  api.use('jquery'); // strong dependency, for testing jQuery backend
  api.use('underscore');
  api.use('reactive-var');
  api.use('tracker');

  api.use('blaze');
  api.use('blaze-tools@1.0.10'); // for BlazeTools.toJS
  api.use('html-tools@1.0.11');
  api.use('templating@1.2.15');

  api.addFiles('view_tests.js');
  api.addFiles('render_tests.js', 'client');
});
