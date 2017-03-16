Package.describe({
  name: 'templating-compiler',
  summary: "Compile templates in .html files",
  version: '1.3.0_1',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null
});

Package.registerBuildPlugin({
  name: "compileTemplatesBatch",
  // minifier-js is a weak dependency of spacebars-compiler; adding it here
  // ensures that the output is minified.  (Having it as a weak dependency means
  // that we don't ship uglify etc with built apps just because
  // boilerplate-generator uses spacebars-compiler.)
  // XXX maybe uglify should be applied by this plugin instead of via magic
  // weak dependency.
  use: [
    'ecmascript@0.5.8',
    'caching-html-compiler@1.1.0',
    'templating-tools@1.1.0'
  ],
  sources: [
    'compile-templates.js'
  ]
});

Package.onUse(function (api) {
  api.use('isobuild:compiler-plugin@1.0.0');
});
