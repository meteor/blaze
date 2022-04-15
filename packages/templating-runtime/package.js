Package.describe({
  name: 'templating-runtime',
  summary: "Runtime for compiled .html files",
  version: '1.6.1',
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
    'blaze@2.6.0',
    'spacebars@1.2.1',
    'ecmascript@0.15.1'
  ]);
  api.imply([
    'meteor@1.10.0',
    'blaze@2.6.0',
    'spacebars@1.2.1'
  ], 'client');

  // to be able to compile dynamic.html. this compiler is used
  // only inside this package and it should not be implied to not
  // conflict with other packages providing .html compilers.
  api.use('templating-compiler@1.4.1');

  api.addFiles([
    'dynamic.html',
    'dynamic.js'
  ], 'client');
});

Package.onTest(function (api) {
  api.use([
    'tinytest@1.1.0',
    'test-helpers@1.2.0',
    'reactive-var@1.0.11',
    'tracker@1.2.0'
  ]);

  api.use([
    'templating-runtime',
    'templating-compiler@1.4.1'
  ]);

  api.addFiles([
    'dynamic_tests.html',
    'dynamic_tests.js'
  ], 'client');
});
