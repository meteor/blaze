/* global Blaze Handlebars ReactiveVar */
/* eslint-disable no-global-assign */

Blaze.ReactiveVar = ReactiveVar;

Handlebars = {};
Handlebars.registerHelper = Blaze.registerHelper;

Handlebars._escape = Blaze._escape;

// Return these from {{...}} helpers to achieve the same as returning
// strings from {{{...}}} helpers
class SafeString {
  constructor(string) {
    this.string = string;
  }

  toString = function () {
    return this.string.toString();
  };
}

Handlebars.SafeString = SafeString;
