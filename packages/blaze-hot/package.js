Package.describe({
  name: 'blaze-hot',
  summary: "Update files using Blaze's API with HMR",
  version: '1.3.2',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null,
  debugOnly: true
});

Package.onUse(function (api) {
  api.use('modules');
  api.use('ecmascript');
  api.use('blaze');
  api.use('underscore');
  api.use('templating-runtime');
  api.use('hot-module-replacement', { weak: true });

  api.addFiles('hot.js', 'client');
});
