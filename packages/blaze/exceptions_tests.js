// Blaze.setExceptionLogLevel must apply inside a Meteor app, where `Meteor` is
// always defined, while keeping `Meteor._debug` as the default path and
// `Meteor._suppress_log` working. See meteor/blaze#314.
Tinytest.add("blaze - exceptions - setExceptionLogLevel picks the console method", function (test) {
  const debugMessages = [];
  const errorCalls = [];
  const originalDebug = Meteor._debug;
  const originalConsoleError = console.error;
  console.error = (...args) => errorCalls.push(args);

  try {
    // Default level: through Meteor._debug, so tools that hook it see it.
    Meteor._debug = (message) => debugMessages.push(message);
    Blaze._reportException(new Error('first'), 'Exception in first:');

    // 'error': straight to console.error, although Meteor is defined, with
    // the error object so that error trackers record it as an exception.
    Blaze.setExceptionLogLevel('error');
    Blaze._reportException(new Error('second'), 'Exception in second:');

    // A pending Meteor._suppress_log still silences the report.
    Meteor._debug = originalDebug;
    Meteor._suppress_log(1);
    Blaze._reportException(new Error('third'), 'Exception in third:');
    test.isFalse(Meteor._suppressed_log_expected());
  } finally {
    Meteor._debug = originalDebug;
    console.error = originalConsoleError;
    Blaze.setExceptionLogLevel('log');
  }

  test.equal(debugMessages, ['Exception in first:']);
  test.equal(errorCalls.length, 1);
  test.equal(errorCalls[0][0], 'Exception in second:');
  test.isTrue(errorCalls[0][1] instanceof Error);
  test.equal(errorCalls[0][1].message, 'second');
  test.throws(() => Blaze.setExceptionLogLevel('info'), /Invalid log level/);
});
