Package.describe({
  name: 'blaze-hot',
  summary: "Update files using Blaze's API with HMR",
  version: '2.0.0-alpha300.10',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null,
  debugOnly: true
});

Package.onUse(function (api) {
  api.use('modules@1.0.0-alpha300.10');
  api.use('ecmascript@0.16.8-alpha300.11');
  api.use('blaze@3.0.0-alpha300.10');
  api.use('templating-runtime@2.0.0-alpha300.10');
  api.use('hot-module-replacement@1.0.0-alpha300.10', { weak: true });

  api.addFiles('hot.js', 'client');
  api.addFiles('update-templates.js', 'client');
});
