Package.describe({
  name: 'blaze',
  summary: "Meteor Reactive Templating library",
  version: '2.4.0',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('jquery@1.11.9 || 3.0.0', { weak: true }); // should be a weak dep, by having multiple "DOM backends"
  api.use('tracker@1.1.0');
  api.use('check@1.2.3');
  api.use('underscore@1.0.9');
  api.use('observe-sequence@1.0.12');
  api.use('reactive-var@1.0.10');
  api.use('ordered-dict@1.0.9');
  api.use('ecmascript@0.14.4');

  api.export([
    'Blaze',
    'UI',
    'Handlebars'
  ]);

  api.use('htmljs@1.1.0');
  api.imply('htmljs@1.1.0');

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
  api.use('ecmascript@0.14.4')
  api.use('tinytest@1.0.11');
  api.use('test-helpers@1.0.10');
  api.use('jquery@1.11.9 || 3.0.0'); // strong dependency, for testing jQuery backend
  api.use('underscore@1.0.9');
  api.use('reactive-var@1.0.10');
  api.use('tracker@1.1.0');

  api.use('blaze');
  api.use('blaze-tools@1.1.0'); // for BlazeTools.toJS
  api.use('html-tools@1.1.0');
  api.use('templating');

  api.addFiles('view_tests.js');
  api.addFiles('render_tests.js', 'client');
});
