Package.describe({
  summary: "Observe changes to various sequence types such as arrays, cursors and objects",
  version: '2.0.0-alpha300.6',
});

Package.onUse(function (api) {
  api.use('tracker@2.0.0-alpha300.6');
  api.use('mongo-id@2.0.0-alpha300.6');  // for idStringify
  api.use('diff-sequence@2.0.0-alpha300.6');
  api.use('random@2.0.0-alpha300.6');
  api.use('ecmascript@1.0.0-alpha300.6');
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
