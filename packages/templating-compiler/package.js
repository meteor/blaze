Package.describe({
  name: 'templating-compiler',
  summary: "Compile templates in .html files",
  version: '1.4.0',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null
});

Package.registerBuildPlugin({
  name: "compileTemplatesBatch",
  use: [
    'ecmascript@0.14.4',
    'caching-html-compiler@1.2.0',
    'templating-tools@1.2.0'
  ],
  sources: [
    'compile-templates.js'
  ]
});

Package.onUse(function (api) {
  api.use('isobuild:compiler-plugin@1.0.0');
});
