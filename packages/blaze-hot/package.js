Package.describe({
  name: 'blaze-hot',
  summary: "Update files using Blaze's API with HMR",
  version: '1.0.0',
  git: 'https://github.com/meteor/blaze.git',
  documentation: null,
  debugOnly: true
});

Package.onUse(function (api) {
  api.use('modules@0.15.0');
  api.use('ecmascript@0.14.4');
  api.use('blaze@2.4.0');
  api.use('underscore@1.0.9');
  api.use('templating-runtime@1.4.0');
  api.use('hot-module-replacement@0.2.0', { weak: true });

  api.addFiles('hot.js', 'client');
  api.addFiles('update-templates.js', 'client');
});
