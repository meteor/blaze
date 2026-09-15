/* eslint-env meteor */
Package.describe({
  name: 'caching-html-compiler',
  summary: 'Pluggable class for compiling HTML into templates',
  version: '2.1.0-alpha.0',
  git: 'https://github.com/meteor/blaze.git',
});

Package.onUse(function(api) {
  api.use([
    'caching-compiler@2.0.0',
    'ecmascript@0.16.9',
  ]);

  api.export('CachingHtmlCompiler', 'server');

  api.use(['templating-tools@2.1.0-alpha.0']);

  api.addFiles(['caching-html-compiler.js'], 'server');
});
