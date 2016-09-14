Package.describe({
  name: 'caching-html-compiler',
  summary: "Pluggable class for compiling HTML into templates",
  version: '1.0.7',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use([
    'underscore',
    'caching-compiler',
    'ecmascript'
  ]);

  api.export('CachingHtmlCompiler', 'server');

  api.use([
    'templating-tools@1.0.5'
  ]);

  api.addFiles([
    'caching-html-compiler.js'
  ], 'server');
});
