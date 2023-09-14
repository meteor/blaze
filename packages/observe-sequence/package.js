Package.describe({
  summary: "Observe changes to various sequence types such as arrays, cursors and objects",
  version: '2.0.0-alpha300.10',
});

Package.onUse(function (api) {
  api.use('tracker@2.0.0-alpha300.10');
  api.use('mongo-id@2.0.0-alpha300.10');  // for idStringify
  api.use('diff-sequence@2.0.0-alpha300.10');
  api.use('random@2.0.0-alpha300.10');
  api.use('ecmascript@0.16.8-alpha300.11');
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
