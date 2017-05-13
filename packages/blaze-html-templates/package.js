Package.describe({
  name: 'blaze-html-templates',
  summary: "Compile HTML templates into reactive UI with Meteor Blaze",
  version: '1.1.2',
  git: 'https://github.com/meteor/blaze.git'
});

Package.onUse(function(api) {
  api.imply([
    // A library for reactive user interfaces
    'blaze@2.3.2',

    // The following packages are basically empty shells that just exist to
    // satisfy code checking for the existence of a package. Rest assured that
    // they are not adding any bloat to your bundle.
    'ui@1.0.12', // XXX COMPAT WITH PACKAGES BUILT FOR 0.9.0.
    'spacebars@1.0.15', // XXX COMPAT WITH PACKAGES BUILT FOR 0.9.0

    // Compile .html files into Blaze reactive views
    'templating@1.3.2'
  ]);
});
