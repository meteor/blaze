/**
 * @namespace Blaze
 */

/**
 * Blaze is the package that makes reactive templates possible.
 * You can use the Blaze API directly in order to render templates programmatically
 * and manipulate "Views," the building blocks of reactive templates.
 * @type {{}}
 */
Blaze = {};

// Utility to HTML-escape a string.  Included for legacy reasons.
// TODO: Should be replaced with _.escape once underscore is upgraded to a newer
//       version which escapes ` (backtick) as well. Underscore 1.5.2 does not.
Blaze._escape = (() => {
  const escape_map = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;", /* IE allows backtick-delimited attributes?? */
    "&": "&amp;"
  };
  const escape_one = (c) =>
    escape_map[c];

  return (x) => {
    return x.replace(/[&<>"'`]/g, escape_one);
  };
})();

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
  Blaze._bind = function (...args) {
    const [func, obj, ...rest] = args
    if (args.length === 2) {
      return nativeBind.call(func, obj);
    }

    return nativeBind.apply(func, [obj, ...rest]);
  };
}
else {
  // A slower but backwards compatible version.
  Blaze._bind = function(objA, objB) {
    objA.bind(objB);
  };
}
