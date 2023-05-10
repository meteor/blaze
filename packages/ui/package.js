Package.describe({
  name: 'ui',
  summary: "Deprecated: Use the 'blaze' package",
  version: '2.0.0-alpha300.5',
  git: 'https://github.com/meteor/blaze.git',
  deprecated: true,
});

Package.onUse(function (api) {
  api.use('blaze@3.0.0-alpha300.5');
  api.imply('blaze');

  // XXX COMPAT WITH PACKAGES BUILT FOR 0.9.0.
  //
  // (in particular, packages that have a weak dependency on this
  // package, since then exported symbols live on the
  // `Package.ui` object)
  api.export([
    'Blaze',
    'UI',
    'Handlebars'
  ]);
});
