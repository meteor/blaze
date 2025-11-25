/**
 * @namespace Blaze
 * @summary The namespace for all Blaze-related methods and classes.
 */
Blaze = {};

// Utility to HTML-escape a string.  Included for legacy reasons.
// TODO: Should be replaced with _.escape once underscore is upgraded to a newer
//       version which escapes ` (backtick) as well. Underscore 1.5.2 does not.
Blaze._escape = (function() {
  const escape_map = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;", /* IE allows backtick-delimited attributes?? */
    "&": "&amp;"
  };
  const escape_one = function(c) {
    return escape_map[c];
  };

  return function (x) {
    return x.replace(/[&<>"'`]/g, escape_one);
  };
})();

Blaze._warn = function (msg) {
  msg = 'Warning: ' + msg;

  if ((typeof console !== 'undefined') && console.warn) {
    console.warn(msg);
  }
};

/**
 * Creates an error placeholder template that renders inline error information
 * instead of crashing the entire page. This enables graceful degradation when
 * a template is missing - the rest of the page continues to render while the
 * error is clearly indicated at the location where the missing template was
 * expected to appear.
 * 
 * The placeholder includes:
 * - A warning icon for visual identification
 * - The name of the missing template
 * - A tooltip with the full error stack trace
 * 
 * This is an internal API used by the template lookup system.
 * 
 * @param {string} name - The name of the missing template/component
 * @param {Error} error - The error that occurred during lookup
 * @returns {Blaze.Template} A template that renders an error placeholder
 * @private
 */
Blaze._errorPlaceholder = function (name, error) {
  var templateName = 'Template._errorPlaceholder_' + name;
  
  return new Blaze.Template(templateName, function() {
    return HTML.DIV({
      'class': 'blaze-error-placeholder',
      'role': 'alert',
      'aria-live': 'polite',
      'style': [
        'background-color: #fee2e2',
        'border: 1px solid #fca5a5',
        'border-radius: 4px',
        'padding: 8px 12px',
        'margin: 4px 0',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'font-size: 13px',
        'color: #991b1b'
      ].join('; '),
      'title': error.stack || error.message
    }, [
      HTML.SPAN({ 'style': 'margin-right: 6px;', 'aria-hidden': 'true' }, '\u26A0\uFE0F'),
      HTML.STRONG({}, 'Missing template: '),
      HTML.CODE({
        'style': 'background-color: #fecaca; padding: 2px 6px; border-radius: 3px; font-size: 12px;'
      }, name)
    ]);
  });
};

const nativeBind = Function.prototype.bind;

// An implementation of _.bind which allows better optimization.
// See: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
if (nativeBind) {
  Blaze._bind = function (func, obj, ...rest) {
    if (arguments.length === 2) {
      return nativeBind.call(func, obj);
    }

    const args = [obj, ...rest];

    return nativeBind.apply(func, args);
  };
}
else {
  // A slower but backwards compatible version.
  Blaze._bind = function(objA, objB) {
    objA.bind(objB);
  };
}
