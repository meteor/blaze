Package.describe({
  name: 'blaze',
  summary: "Meteor Reactive Templating library",
  version: '3.0.0-alpha300.14',
  git: 'https://github.com/meteor/blaze.git'
});

Npm.depends({
  'lodash.has': '4.5.2',
  'lodash.isfunction': '3.0.9',
  'lodash.isempty': '4.4.0',
  'lodash.isobject': '3.0.2'
});

Package.onUse(function (api) {
  api.use('jquery@1.11.9 || 3.0.0', { weak: true }); // should be a weak dep, by having multiple "DOM backends"
  api.use('tracker@1.3.2');
  api.use('check@1.0.12');
  api.use('observe-sequence@2.0.0-alpha300.14');
  api.use('reactive-var@1.0.12');
  api.use('ordered-dict@1.2.0-alpha300.14');
  api.use('ecmascript@0.16.8-alpha300.14');

  api.export([
    'Blaze',
    'UI',
    'Handlebars'
  ]);

  api.use('htmljs@2.0.0-alpha300.10');
  api.imply('htmljs@2.0.0-alpha300.10');

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
  // Maybe in order to work properly user will need to have Jquery typedefs
  api.addAssets('blaze.d.ts', 'server');
});

Package.onTest(function (api) {
  api.use('ecmascript@0.16.8-alpha300.14');
  api.use('tinytest');
  api.use('test-helpers');
  api.use('jquery@1.11.9 || 3.0.0'); // strong dependency, for testing jQuery backend

  api.use('reactive-var@1.0.12');
  api.use('tracker@1.3.2');

  api.use('blaze');
  api.use('blaze-tools@2.0.0-alpha300.10'); // for BlazeTools.toJS
  api.use('html-tools@2.0.0-alpha300.10');
  api.use('templating');

  api.addFiles('view_tests.js');
  api.addFiles('render_tests.js', 'client');
});
