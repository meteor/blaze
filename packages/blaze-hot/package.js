Package.describe({
  name: 'blaze-hot',
  summary: "Update files using Blaze's API with HMR",
  version: '2.0.0-alpha300.3',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null,
  debugOnly: true
});

Package.onUse(function (api) {
  api.use('modules@0.16.0');
  api.use('ecmascript@0.15.1');
  api.use('blaze@2.6.0');
  api.use('templating-runtime@1.6.0');
  api.use('hot-module-replacement@0.2.0', { weak: true });

  api.addFiles('hot.js', 'client');
  api.addFiles('update-templates.js', 'client');
});
