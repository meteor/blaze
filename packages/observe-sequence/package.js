Package.describe({
  summary: "Observe changes to various sequence types such as arrays, cursors and objects",
  version: '2.0.0-alpha300.5',
});

Package.onUse(function (api) {
  api.use('tracker');
  api.use('mongo-id');  // for idStringify
  api.use('diff-sequence');
  api.use('random');
  api.use('ecmascript');
  api.export('ObserveSequence');
  api.addFiles(['observe_sequence.js']);
});

Package.onTest(function (api) {
  api.use([
    'tinytest',
    'observe-sequence',
    'ejson',
    'tracker',
    'mongo'
  ]);

  api.addFiles(['observe_sequence_tests.js'], 'client');
});
