Package.describe({
  name: 'html-tools',
  summary: "Standards-compliant HTML tools",
  version: '1.1.1',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use('ecmascript@0.14.4');
  api.use('htmljs@1.1.0');
  api.imply('htmljs@1.1.0');

  api.export('HTMLTools');
  api.mainModule('main.js');
});

Package.onTest(function (api) {
  api.use('ecmascript');
  api.use('tinytest@1.0.11');

  api.use('html-tools');
  api.use('htmljs@1.1.0');
  api.use('blaze-tools'); // for `toJS`

  api.addFiles([
    'charref_tests.js',
    'tokenize_tests.js',
    'parse_tests.js'
  ]);
});
