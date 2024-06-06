/* eslint-env meteor */
Package.describe({
  name: 'caching-html-compiler',
  summary: 'Pluggable class for compiling HTML into templates',
  version: '2.0.0-rc300.2',
  git: 'https://github.com/meteor/blaze.git',
});

Npm.depends({
  'lodash.isempty': '4.4.0',
});

Package.onUse(function(api) {
  api.use([
    'caching-compiler@2.0.0-rc300.2',
    'ecmascript@0.16.9-rc300.2',
  ]);

  api.export('CachingHtmlCompiler', 'server');

  api.use(['templating-tools@2.0.0-rc300.2']);

  api.addFiles(['caching-html-compiler.js'], 'server');
});
