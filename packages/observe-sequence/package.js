Package.describe({
  summary: "Observe changes to various sequence types such as arrays, cursors and objects",
  version: "1.0.20"
});

Package.onUse(function (api) {
  api.use('tracker@1.3.0');
  api.use('mongo-id@1.0.8');  // for idStringify
  api.use('diff-sequence@1.1.1');
  api.use('random@1.2.0');
  api.use('ecmascript@0.13.2');
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
