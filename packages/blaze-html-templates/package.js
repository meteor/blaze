Package.describe({
  name: 'blaze-html-templates',
  summary: "Compile HTML templates into reactive UI with Meteor Blaze",
  version: '2.0.0',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function(api) {
  api.imply([
    // A library for reactive user interfaces
    'blaze@2.5.0',

    // Compile .html files into Blaze reactive views
    'templating@1.4.1'
  ]);
});
