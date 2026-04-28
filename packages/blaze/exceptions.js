let debugFunc;

let _exceptionLogLevel = 'log';

// We call into user code in many places, and it's nice to catch exceptions
// propagated from user code immediately so that the whole system doesn't just
// break.  Catching exceptions is easy; reporting them is hard.  This helper
// reports exceptions.
//
// Usage:
//
// ```
// try {
//   // ... someStuff ...
// } catch (e) {
//   reportUIException(e);
// }
// ```
//
// An optional second argument overrides the default message.

// Set this to `true` to cause `reportException` to throw
// the next exception rather than reporting it.  This is
// useful in unit tests that test error messages.
Blaze._throwNextException = false;

// Configure the console method used when reporting template exceptions.
// Defaults to 'log' for backward compatibility.
// Set to 'error' or 'warn' to make exceptions appear in the appropriate console channel,
// which integrates properly with error trackers like Sentry.
//
// Example: Blaze.setExceptionLogLevel('error');
Blaze.setExceptionLogLevel = function (level) {
  if (['log', 'warn', 'error'].indexOf(level) === -1) {
    throw new Error('Invalid log level: ' + level + '. Allowed: log, warn, error.');
  }
  _exceptionLogLevel = level;
  debugFunc = null; // reset so it picks up new level on next call
};

Blaze._reportException = function (e, msg) {
  if (Blaze._throwNextException) {
    Blaze._throwNextException = false;
    throw e;
  }

  if (! debugFunc)
    // adapted from Tracker
    debugFunc = function () {
      var level = _exceptionLogLevel;
      if (typeof Meteor !== "undefined" && Meteor._debug) {
        return Meteor._debug;
      }
      var consoleMethod = (typeof console !== "undefined") && (console[level] || console.log);
      return consoleMethod || function () {};
    };

  // In Chrome, `e.stack` is a multiline string that starts with the message
  // and contains a stack trace.  Furthermore, `console.log` makes it clickable.
  // `console.log` supplies the space between the two arguments.
  // When using `console.error` or `console.warn`, the console still displays
  // the full stack trace — it simply marks it as a higher-severity level,
  // which is the correct semantic for exceptions.
  debugFunc()(msg || 'Exception caught in template:', e.stack || e.message || e);
};

// It's meant to be used in `Promise` chains to report the error while not
// "swallowing" it (i.e., the chain will still reject).
Blaze._reportExceptionAndThrow = function (error) {
  Blaze._reportException(error);
  throw error;
};

// Wrap a function so that any exceptions thrown inside it are caught and reported
// using the configured exception log level (see `setExceptionLogLevel`).
// If `where` is provided, it is included in the report to identify the call site.
Blaze._wrapCatchingExceptions = function (f, where) {
  if (typeof f !== 'function')
    return f;

  return function (...args) {
    try {
      return f.apply(this, args);
    } catch (e) {
      Blaze._reportException(e, 'Exception in ' + where + ':');
    }
  };
};
