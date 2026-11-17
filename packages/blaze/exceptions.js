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

/**
 * @summary Chooses how Blaze reports the exceptions it catches: errors thrown
 * by template helpers, and rejected promises in attributes. With the default,
 * `'log'`, they go through `Meteor._debug`, which tools such as Monti APM hook
 * into. With `'warn'` or `'error'`, they go straight to `console.warn` or
 * `console.error` along with the error object, which error trackers such as
 * Sentry record as an exception, and no longer through `Meteor._debug`.
 * Errors thrown by event handlers and lifecycle callbacks are not caught by
 * Blaze, and a rejected promise rendered as content is exposed through
 * `@rejected` instead of being reported: neither is affected. Call it on the
 * client, and on the server as well if you render templates there.
 * @locus Anywhere
 * @param {String} level `'log'`, `'warn'` or `'error'`.
 * @example Blaze.setExceptionLogLevel('error');
 */
Blaze.setExceptionLogLevel = function (level) {
  if (['log', 'warn', 'error'].indexOf(level) === -1) {
    throw new Error('Invalid log level: ' + level + '. Allowed: log, warn, error.');
  }
  _exceptionLogLevel = level;
};

Blaze._reportException = function (e, msg) {
  if (Blaze._throwNextException) {
    Blaze._throwNextException = false;
    throw e;
  }

  if (! debugFunc)
    // adapted from Tracker
    debugFunc = () => {
      return (typeof Meteor !== "undefined" ? Meteor._debug :
              ((typeof console !== "undefined") && (console.error || console.log) ? (console.error || console.log) :
               function () {}));
    };

  // A level other than 'log' reports straight to that console method, also
  // inside a Meteor app, with the error itself so that error trackers record
  // its stack. A pending `Meteor._suppress_log` still goes through
  // `Meteor._debug`, which consumes it silently.
  if (_exceptionLogLevel !== 'log' && (typeof console !== "undefined") &&
      ! (typeof Meteor !== "undefined" && Meteor._suppressed_log_expected())) {
    console[_exceptionLogLevel](msg || 'Exception caught in template:', e);
  } else {
    // In Chrome, `e.stack` is a multiline string that starts with the message
    // and contains a stack trace.  Furthermore, `console.error` (or `console.log`)
    // makes it clickable. Both provide space between the two arguments.
    debugFunc()(msg || 'Exception caught in template:', e.stack || e.message || e);
  }
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
