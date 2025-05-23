## v3.0.2, 2025-02-04

### Highlights
* [475](https://github.com/meteor/blaze/pull/475) Enhanced error context for exceptions in helper functions.

## v3.0.1, 2024-11-14

### Highlights / Potentially breaking changes
* [471](https://github.com/meteor/blaze/pull/471) Added support for Promises in `#with`
 
## v3.0.0, 2024-07-16

### Highlights / Potentially breaking changes
* [#373](https://github.com/meteor/blaze/pull/373) Remove fibers from codebase
* [#378](https://github.com/meteor/blaze/pull/378) [spacebars-compiler] Update uglify-js to 3.16.1
* [#351](https://github.com/meteor/blaze/pull/351) Eliminate whitespace in Template.dynamic
* [#334](https://github.com/meteor/blaze/pull/334) Faster fragnent parsing by retaining a reference to the current document context
* All packages were bumped to be compatible with Meteor 3.0


## v2.9.0 2024-Mar-14

* [#460](https://github.com/meteor/blaze/pull/460) Implemented async dynamic attributes.
* [#458](https://github.com/meteor/blaze/pull/458) Blaze._expandAttributes returns empty object, if null.



## v2.8.0 2023-Dec-28

* [#431](https://github.com/meteor/blaze/pull/431) Depracate Ui package.
* [#431](https://github.com/meteor/blaze/pull/432) Bump blaze hot dependencies.
* [#428](https://github.com/meteor/blaze/pull/428) Implemented async attributes and content.
* [#426](https://github.com/meteor/blaze/pull/426) Fix observe-squence has-implementation, close to underscore.
* [#434](https://github.com/meteor/blaze/pull/434) Update templating deps.
* [#435](https://github.com/meteor/blaze/pull/435) Updating dependencies for templating-compiler package.
* [#433](https://github.com/meteor/blaze/pull/433) Update caching-html-compiler.

## v2.7.1, 2023-May-26

* [#413](https://github.com/meteor/blaze/pull/418) Fix reactivity for non-primitives.


## v2.7.0, 2023-May-23

* [#413](https://github.com/meteor/blaze/pull/413) Added support for Promises in Spacebars.call and Spacebars.dot.
* [#412](https://github.com/meteor/blaze/pull/412) Implemented async bindings in #let.
* 

## v2.6.2, 2023-April-21

* [#403](https://github.com/meteor/blaze/pull/403) Add TS types to core
* [#405](https://github.com/meteor/blaze/pull/406) Stop establishing unnecessary reactive dependencies
* [#410](https://github.com/meteor/blaze/pull/410) Fixes for legacy clients


## v2.6.1, 2022-July-25

* [#370](https://github.com/meteor/blaze/pull/370) `templating-runtime@1.6.1`, returned the `Template.__define__` with warning message
* [#366](https://github.com/meteor/blaze/pull/366) Prevent firing callbacks until members are destroyed
  * fix destroying child templates when parent is destroyed; prevents memory leak and DOMRange "not attached" error
* [#374](https://github.com/meteor/blaze/pull/374) `Blaze.remove` should destroy view before detaching
* [#376](https://github.com/meteor/blaze/pull/376) Modify 'Must be attached' error to be more descriptive
* [#377](https://github.com/meteor/blaze/pull/377) Add tests for [Blaze.remove should destroy view before detaching](https://github.com/meteor/blaze/pull/374)
* [#382](https://github.com/meteor/blaze/pull/382) Linters were added
* [#348](https://github.com/meteor/blaze/pull/348) For-in loop does not work in IE fix
* [#349](https://github.com/meteor/blaze/pull/349) fix regression: non array iterables were always treated as empty
* [#341](https://github.com/meteor/blaze/pull/341) add support for arbitrary iterables in #each templates

## v2.6.0, 2022-April-13

* [#330](https://github.com/meteor/blaze/pull/330) Removed deprecated APIs from before Meteor 1.0
  * This is potentially breaking, especially for old packages and apps.
  * `blaze-html-templates@2.0.0`
    * Dependency on `ui` and `spacebars` package has been removed
  * `spacebars@1.3.0`
    * `Spacebars.TemplateWith` has been removed, please use `Blaze._TemplateWith` if you need it.
  * `blaze@2.6.0`
    * `Blaze.InOuterTemplateScope` has been removed, if you need it, you can use `Blaze._InOuterTemplateScope`
  * `templating-runtime@1.6.0`
    * `Template.__define__` has been removed
    * `UI.body` has been removed, you should be using `Template.body`
    * `Template.__body__` has been removed, you should be using `Template.body`
    * `Template.__body__.__contentParts` has been removed, you should be using `Template.body.contentViews`
    * `Template.__body__.__instantiate` has been removed, you should be using `Template.body.renderToDocument`
* [#341](https://github.com/meteor/blaze/pull/341) Add support for arbitrary iterables in #each templates
* [#358](https://github.com/meteor/blaze/pull/358) Make Template.contentBlock consistent with/out data provided
* [#359](https://github.com/meteor/blaze/pull/359) Underscore has been removed from observe sequence
* Updated testing dependencies

## v2.5.0, 2021-June-5

* [#331](https://github.com/meteor/blaze/pull/331) Remove underscore and all of its methods in the code

* Updated dependencies

## v2.4.0, 2021-April-12

* [#313](https://github.com/meteor/blaze/pull/313) Implemented HMR for Blaze

* [#319](https://github.com/meteor/blaze/pull/319) Fixed a few situations where the template compiler wouldn't optimise it's output javascript. Should make rendering faster (if the initial optimisation reasoning holds true)

* [#321](https://github.com/meteor/blaze/pull/321) Just source code modernisation, making it easier to read. Shouldn't change any API's; except may need explicit import if other packages are using directly.

* [#324](https://github.com/meteor/blaze/pull/324) Add a whitespace="strip" option to templates, which removes any whitespace that crosses newlines.

* [#276](https://github.com/meteor/blaze/pull/276) [HTML.isArray](https://github.com/brucejo75/blaze/blob/release-2.4/packages/htmljs/README.md#htmlisarrayx) works across iFrames.  This supports running blaze in sandboxed iFrames.

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
