Package.describe({
  name: 'templating-compiler',
  summary: "Compile templates in .html files",
  version: '1.3.1',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null
});

Package.registerBuildPlugin({
  name: "compileTemplatesBatch",
  use: [
    'ecmascript@0.5.8',
    'caching-html-compiler@1.1.1',
    'templating-tools@1.1.1'
  ],
  sources: [
    'compile-templates.js'
  ]
});

Package.onUse(function (api) {
  api.use('isobuild:compiler-plugin@1.0.0');
});
