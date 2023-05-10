Package.describe({
  name: 'templating-runtime',
  summary: "Runtime for compiled .html files",
  version: '2.0.0-alpha300.5',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null
});

Npm.depends({
  'lodash.has': '4.5.2'
});

Package.onUse(function (api) {

  // XXX would like to do the following only when the first html file
  // is encountered

  api.export('Template', 'client');

  api.addFiles('templating.js', 'client');

  // html_scanner.js emits client code that calls Meteor.startup and
  // Blaze, so anybody using templating (eg apps) need to implicitly use
  // 'meteor' and 'blaze'.
  api.use([
    'blaze@3.0.0-alpha300.5',
    'spacebars@2.0.0-alpha300.5',
    'ecmascript@1.0.0-alpha300.5'
  ]);
  api.imply([
    'meteor',
    'blaze@3.0.0-alpha300.5',
    'spacebars@2.0.0-alpha300.5'
  ], 'client');

  // to be able to compile dynamic.html. this compiler is used
  // only inside this package and it should not be implied to not
  // conflict with other packages providing .html compilers.
  api.use('templating-compiler@2.0.0-alpha300.5');

  api.addFiles([
    'dynamic.html',
    'dynamic.js'
  ], 'client');
});

Package.onTest(function (api) {
  api.use([
    'tinytest',
    'reactive-var',
    'tracker'
  ]);

  api.use([
    'templating-runtime',
    'templating-compiler@2.0.0-alpha300.5'
  ]);

  api.addFiles([
    'dynamic_tests.html',
    'dynamic_tests.js'
  ], 'client');
});
