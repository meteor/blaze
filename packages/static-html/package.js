Package.describe({
  name: 'static-html',
  summary: "Define static page content in .html files",
  version: '1.1.12',
  git: 'https://github.com/meteor/blaze.git'
});

Package.registerBuildPlugin({
  name: "compileStaticHtmlBatch",
  use: [
    'ecmascript',
    'underscore',
    'caching-html-compiler@1.0.6',
    'templating-tools@1.0.5'
  ],
  sources: [
    'static-html.js'
  ]
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4.1');

  api.use('isobuild:compiler-plugin@1.0.0');

  // Body attributes are compiled to code that uses Meteor.startup
  api.imply('meteor', 'client');
});
