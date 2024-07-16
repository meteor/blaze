Package.describe({
  summary: "Observe changes to various sequence types such as arrays, cursors and objects",
  version: '2.0.0',
});

Package.onUse(function (api) {
  api.use('tracker@1.3.2');
  api.use('mongo-id@1.0.8');  // for idStringify
  api.use('diff-sequence@1.1.2');
  api.use('random@1.2.1');
  api.use('ecmascript@0.16.9');
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
