Package.describe({
  name: 'blaze-html-templates',
  summary: "Compile HTML templates into reactive UI with Meteor Blaze",
  version: '3.0.0-alpha300.5',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function(api) {
  api.imply([
    // A library for reactive user interfaces
    'blaze@3.0.0-alpha300.5',

    // Compile .html files into Blaze reactive views
    'templating@2.0.0-alpha300.5'
  ]);
});
