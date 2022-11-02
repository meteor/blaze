/* global Blaze  */
/* eslint-disable no-global-assign */

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
  const msgValue = `Warning: ${msg}`;

  if ((typeof console !== 'undefined') && console.warn) {
    console.warn(msgValue);
  }
};

const nativeBind = Function.prototype.bind;

// An implementation of _.bind which allows better optimization.
// See: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
if (nativeBind) {
  Blaze._bind = function (func, obj, ...rest) {
    if (arguments.length === 2) {
      return nativeBind.call(func, obj);
    }

    // Copy the arguments so this function can be optimized.
    const args = [obj, ...rest];

    return nativeBind.apply(func, args);
  };
} else {
  // A slower but backwards compatible version.
  Blaze._bind = function (objA, objB) {
    objA.bind(objB);
  };
}
