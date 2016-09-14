Package.describe({
  name: 'templating-runtime',
  summary: "Runtime for compiled .html files",
  version: '1.2.14',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('underscore'); // only the subset in packages/blaze/microscore.js

  // XXX would like to do the following only when the first html file
  // is encountered

  api.export('Template', 'client');

  api.addFiles('templating.js', 'client');

  // html_scanner.js emits client code that calls Meteor.startup and
  // Blaze, so anybody using templating (eg apps) need to implicitly use
  // 'meteor' and 'blaze'.
  api.use([
    'blaze@2.1.9',
    'spacebars@1.0.12'
  ]);
  api.imply([
    'meteor',
    'blaze@2.1.9',
    'spacebars@1.0.12'
  ], 'client');

  // to be able to compile dynamic.html. this compiler is used
  // only inside this package and it should not be implied to not
  // conflict with other packages providing .html compilers.
  api.use('templating-compiler@1.2.14');

  api.addFiles([
    'dynamic.html',
    'dynamic.js'
  ], 'client');
});

Package.onTest(function (api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use([
    'tinytest',
    'test-helpers',
    'reactive-var',
    'tracker'
  ]);

  api.use([
    'templating-runtime',
    'templating-compiler@1.2.14'
  ]);

  api.addFiles([
    'dynamic_tests.html',
    'dynamic_tests.js'
  ], 'client');
});
