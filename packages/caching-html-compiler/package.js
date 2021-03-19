Package.describe({
  name: 'caching-html-compiler',
  summary: "Pluggable class for compiling HTML into templates",
  version: '1.1.3',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function(api) {
  api.use([
    'underscore@1.0.9',
    'caching-compiler@1.1.7',
    'ecmascript@0.5.8'
  ]);

  api.export('CachingHtmlCompiler', 'server');

  api.use([
    'templating-tools@1.1.2'
  ]);

  api.addFiles([
    'caching-html-compiler.js'
  ], 'server');
});
