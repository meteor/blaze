Package.describe({
  name: 'blaze',
  summary: "Meteor Reactive Templating library",
  version: '2.7.1',
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
  api.use('tracker@1.3.0');
  api.use('check@1.3.1');
  api.use('observe-sequence@1.0.16');
  api.use('reactive-var@1.0.11');
  api.use('ordered-dict@1.1.0');
  api.use('ecmascript@0.15.1');

  api.export([
    'Blaze',
    'UI',
    'Handlebars'
  ]);

  api.use('htmljs@1.1.1');
  api.imply('htmljs@1.1.1');

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
  api.use('ecmascript@0.15.1');
  api.use('tinytest@1.1.0');
  api.use('test-helpers@1.2.0');
  api.use('jquery@1.11.9 || 3.0.0'); // strong dependency, for testing jQuery backend
  api.use('reactive-var@1.0.11');
  api.use('tracker@1.3.0');

  api.use('blaze');
  api.use('blaze-tools@1.1.3'); // for BlazeTools.toJS
  api.use('html-tools@1.1.3');
  api.use('templating');

  api.addFiles('view_tests.js');
  api.addFiles('render_tests.js', 'client');
});
