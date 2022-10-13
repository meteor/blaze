/* global Blaze  */
/* eslint-disable no-global-assign, no-param-reassign */

/**
 * @namespace Blaze
 * @summary The namespace for all Blaze-related methods and classes.
 */
Blaze = {};

// Utility to HTML-escape a string.  Included for legacy reasons.
// TODO: Should be replaced with _.escape once underscore is upgraded to a newer
//       version which escapes ` (backtick) as well. Underscore 1.5.2 does not.
Blaze._escape = (function () {
  const escapeMap = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;', /* IE allows backtick-delimited attributes?? */
    '&': '&amp;',
  };
  const escapeOne = function (c) {
    return escapeMap[c];
  };

  return function (x) {
    return x.replace(/[&<>"'`]/g, escapeOne);
  };
}());

Blaze._warn = function (msg) {
  msg = `Warning: ${msg}`;

  if ((typeof console !== 'undefined') && console.warn) {
    console.warn(msg);
  }
};

const nativeBind = Function.prototype.bind;

// An implementation of _.bind which allows better optimization.
// See: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
if (nativeBind) {
  Blaze._bind = function (func, obj) {
    if (arguments.length === 2) {
      return nativeBind.call(func, obj);
    }

    // Copy the arguments so this function can be optimized.
    const args = new Array(arguments.length);
    for (let i = 0; i < args.length; i++) {
      // eslint-disable-next-line prefer-rest-params
      args[i] = arguments[i];
    }

    return nativeBind.apply(func, args.slice(1));
  };
} else {
  // A slower but backwards compatible version.
  Blaze._bind = function (objA, objB) {
    objA.bind(objB);
  };
}
