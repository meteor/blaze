## vNEXT

## v2.3.4, 2019-Dec-13

* jquery 3 support
  [#299](https://github.com/meteor/blaze/pull/299)
  
## v2.3.2, 2017-Mar-21

* Made beautification of compiled spacebars code happen only on the server.
  [#244](https://github.com/meteor/blaze/issues/244)

## v2.3.1, 2017-Mar-16

* Removed [minifier-js](https://github.com/meteor/meteor/tree/devel/packages/minifier-js) dependency from [templating-tools](https://github.com/meteor/blaze/tree/master/packages/templating-tools) package. If you need your template output to be minified, you must add the package to your app manually, by running `meteor add standard-minifier-js`. The package is included in a standard meteor app.
  [#236](https://github.com/meteor/blaze/pull/236)
* Switched to use a [uglify-js](https://github.com/mishoo/UglifyJS) NPM package directly in [spacebars-compiler](https://github.com/meteor/blaze/tree/master/packages/spacebars-compiler) for beautification instead of [minifier-js](https://github.com/meteor/meteor/tree/devel/packages/minifier-js) package.
  [#234](https://github.com/meteor/blaze/pull/234)

## v2.3.0, 2017-Jan-12

* Support for chaining block helpers syntax sugar ([#39](https://github.com/meteor/blaze/issues/39)).
  Now you can use `{{#if foo}}...{{else if bar}}..{{else}}..{{/if}}`
  instead of manually nesting block helpers. It works with any block helper, not just `if`.
  It uses [Handlebars syntax](http://handlebarsjs.com/block_helpers.html#conditionals).
  Based on [#50](https://github.com/meteor/blaze/pull/50).
* Prevent unnecessary materialization of DOM.
  Based on [#103](https://github.com/meteor/blaze/pull/103).
* Bugfix: [#228](https://github.com/meteor/blaze/issues/228)

## v2.2.1, 2016-Dec-31

* Reactive inline `style` attribute now preserves the internal order. Similarly for `class`.
  External changes are appended to the end.
  [#141](https://github.com/meteor/blaze/issues/141) [#159](https://github.com/meteor/blaze/issues/159)
* Reverted [#102](https://github.com/meteor/blaze/pull/102) and made a different fix for removing attributes
  for `false` values in dynamic attributes ([#52](https://github.com/meteor/blaze/issues/52)).
  Fixes regression reported in [#151](https://github.com/meteor/blaze/issues/151).

## v2.2.0, 2016-Nov-01

* Allow nested `template.autorun` calls.
  [#148](https://github.com/meteor/blaze/issues/148)
* Potential speedup by using a specialized `_.bind` function.
* Better support for HTML5 boolean attributes (`disabled`, `required`, `hidden`, ...) to be removed when a falsy value is set, just like `checked` property.
  [#52](https://github.com/meteor/blaze/issues/52) [#102](https://github.com/meteor/blaze/pull/102)

## v2.1.9, 2016-Sep-13

* Moved documentation to: http://blazejs.org/
* Started `HISTORY.md` file with the list of all changes.
* Moved development to the new repository: https://github.com/meteor/blaze
* Split `templating` package into `templating-compiler` and `templating-runtime`.
  [#10](https://github.com/meteor/blaze/pull/10)

## v2.1.8, 2016-Jun-10

* History up to and including this version available as part of
  [Meteor's history](https://github.com/meteor/meteor/blob/devel/History.md).
