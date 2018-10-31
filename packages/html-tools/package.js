Package.describe({
  name: 'html-tools',
  summary: "Standards-compliant HTML tools",
  version: '1.0.11',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function (api) {
  api.use([
    'ecmascript@0.5.8',
    'htmljs@1.0.11'
  ]);
  api.imply('htmljs@1.0.11');

  api.mainModule('main.js');
});

Package.onTest(function (api) {
  api.use([
    'tinytest',
    'ecmascript',
    'html-tools',
    'htmljs',
    'blaze-tools' // for `toJS`
  ]);

  api.addFiles([
    'charref_tests.js',
    'tokenize_tests.js',
    'parse_tests.js'
  ]);
});
