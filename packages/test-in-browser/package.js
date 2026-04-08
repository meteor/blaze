Package.describe({
  summary: "Run tests interactively in the browser",
  version: '1.5.0',
  documentation: null
});

Npm.depends({
  'bootstrap': '5.3.8',
  'diff': '8.0.2'
});

Package.onUse(function (api) {
  api.use('ecmascript');
  // XXX this should go away, and there should be a clean interface
  // that tinytest and the driver both implement?

  if (process.env.TESTS_USE_JQUERY) {
    api.use('jquery@3.0.0', 'client');
  }
  api.use('tinytest');
  api.use('session');
  api.use('reload');
  api.use([
    'webapp',
    'blaze',
    'templating',
    'spacebars',
    'ddp',
    'tracker',
  ], 'client');

  api.addFiles([
    'driver.html',
    'driver.js',
    'driver.css',
  ], "client");

  api.use("random", "server");
  api.mainModule("server.js", "server");

  api.export('runTests');
});