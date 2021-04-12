Package.describe({
  name: 'templating',
  summary: "Allows templates to be defined in .html files",
  version: '1.4.0',
  git: 'https://github.com/meteor/blaze.git'
});

// Today, this package is closely intertwined with Handlebars, meaning
// that other templating systems will need to duplicate this logic. In
// the future, perhaps we should have the concept of a template system
// registry and a default templating system, ideally per-package.

Package.onUse(function (api) {
  api.export('Template', 'client');

  api.use('templating-runtime@1.4.0');
  api.imply('templating-runtime');

  api.imply('templating-compiler@1.4.0');
});
