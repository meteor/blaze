/* eslint-env meteor */
Package.describe({
  name: 'templating-compiler',
  summary: 'Compile templates in .html files',
  version: '2.0.0-alpha300.15',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null,
});

Package.registerBuildPlugin({
  name: 'compileTemplatesBatch',
  use: [
    'ecmascript@0.16.8-alpha300.15',
    'caching-html-compiler@2.0.0-alpha300.15',
    'templating-tools@2.0.0-alpha300.15',
  ],
  sources: [
    'compile-templates.js',
  ],
});

Package.onUse(function (api) {
  api.use('isobuild:compiler-plugin@1.0.0');
});
