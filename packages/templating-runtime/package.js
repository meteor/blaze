Package.describe({
  summary: "Runtime for compiled .html files",
  version: '1.1.6-beta.11'
});

// This onUse describes the *runtime* implications of using this package.
Package.onUse(function (api) {
  // XXX would like to do the following only when the first html file
  // is encountered

  api.addFiles('templating.js', 'client');
  api.export('Template', 'client');

  api.use('underscore'); // only the subset in packages/blaze/microscore.js

  // html_scanner.js emits client code that calls Meteor.startup and
  // Blaze, so anybody using templating (eg apps) need to implicitly use
  // 'meteor' and 'blaze'.
  api.use(['blaze', 'spacebars']);
  api.imply(['meteor', 'blaze', 'spacebars'], 'client');

  // to be able to compile dynamic.html. this compiler is used
  // only inside this package and it should not be implied to not
  // conflict with other packages providing .html compilers.
  api.use('templating-compiler');
  api.addFiles(['dynamic.html', 'dynamic.js'], 'client');
});

Package.onTest(function (api) {
  api.use(['tinytest', 'templating-runtime', 'templating-compiler', 'reactive-var', 'test-helpers', 'tracker']);

  api.addFiles(['dynamic_tests.html', 'dynamic_tests.js'], 'client');
});
