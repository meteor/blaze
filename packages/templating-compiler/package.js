Package.describe({
  summary: "Compile templates in .html files",
  version: '1.1.6-beta.11'
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
    'caching-html-compiler',
    'ecmascript',
    'templating-tools'
  ],
  sources: [
    'compile-templates.js'
  ]
});

Package.onUse(function (api) {
  api.use('isobuild:compiler-plugin@1.0.0');
});
