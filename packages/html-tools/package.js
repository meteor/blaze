Package.describe({
  name: 'html-tools',
  summary: "Standards-compliant HTML tools",
  version: '1.1.0-beta.1',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.export('HTMLTools');

  api.use('htmljs@1.1.0-beta.1');
  api.imply('htmljs@1.1.0-beta.1');

  api.addFiles([
    'utils.js',
    'scanner.js',
    'charref.js',
    'tokenize.js',
    'templatetag.js',
    'parse.js'
  ]);
});

Package.onTest(function (api) {
  api.use('tinytest@1.0.11');
  api.use('underscore@1.0.9');

  api.use('html-tools');
  api.use('htmljs@1.1.0-beta.1');
  api.use('blaze-tools'); // for `toJS`

  api.addFiles([
    'charref_tests.js',
    'tokenize_tests.js',
    'parse_tests.js'
  ]);
});
