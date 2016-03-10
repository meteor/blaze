Package.describe({
  summary: "Allows templates to be defined in .html files",
  version: '1.1.6-beta.11'
});

// Today, this package is closely intertwined with Handlebars, meaning
// that other templating systems will need to duplicate this logic. In
// the future, perhaps we should have the concept of a template system
// registry and a default templating system, ideally per-package.

Package.onUse(function (api) {
  api.imply('templating-compiler');
  api.imply('templating-runtime');
});
