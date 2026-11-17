# Migrations

On this page we want to provide you guidance with migrating between Blaze versions.

## 3.1.0

This is a performance release, improving bundle size, render performance and developer experience.
With this release, jQuery became optional. Blaze picks its DOM backend when it loads: if the `jquery`
package is present, Blaze keeps using jQuery exactly as before; if it is absent, Blaze uses native DOM
operations instead. Nothing changes at runtime for an app that keeps jQuery, apart from a message in the
browser console telling you that the native backend is available and that jQuery support is deprecated.
TypeScript apps have one type to adjust, see below.

### Keep jQuery

Do nothing. As long as the `jquery` package is in your app, Blaze uses it. Note that any package that
depends on `jquery` keeps it in your app, and therefore keeps Blaze on the jQuery backend.

One thing does change for TypeScript apps that use the types shipped with the `blaze` package, for
instance through `zodern:types`: `template.$(selector)` is now typed as `JQuery | HTMLElement[]`, because
what it returns depends on whether `jquery` is installed. Calling a jQuery method on the result, such as
`instance.$('input').val()`, no longer type-checks on its own. Cast the result where your app relies on
jQuery:

```ts
const $input = instance.$('input') as JQuery<HTMLInputElement>
$input.val()
```

Or narrow at runtime when the code has to work on both backends:

```ts
const result = instance.$('input')
const inputs = Array.isArray(result) ? result : result.toArray()
```

### Remove jQuery

Run `meteor remove jquery && meteor npm uninstall jquery` in your console. Blaze adapts automatically and
uses native DOM operations under the hood.

> Breaking note!

While this is a minor release, removing jQuery is breaking for code that relied on jQuery through Blaze:

- `template.$(selector)` returns an array of DOM elements instead of a jQuery object. `template.find`
  and `template.findAll` are unchanged: they always returned DOM elements.
- The `event` passed to event handlers is the native DOM event instead of a jQuery event object.
  `event.target`, `event.currentTarget`, `preventDefault()`, `stopPropagation()` and
  `stopImmediatePropagation()` work the same; jQuery-only helpers such as `isDefaultPrevented()` are
  not available, use `event.defaultPrevented` instead.
- Event properties that jQuery does not copy onto its event object, such as `dataTransfer` (drag and
  drop), `deltaY` (wheel), `clipboardData` (copy and paste), `inputType` (input events),
  `animationName`, `newState` (popover toggle) or `command` (invoker commands), were only reachable
  through `event.originalEvent`. With the native backend they are on `event` itself, and
  `event.originalEvent` is `undefined`. Code that has to run on both backends can read
  `(event.originalEvent || event).dataTransfer`.
- jQuery plugins called on `template.$(...)` no longer work, since there is no jQuery object to call
  them on.

```js
// with jQuery
const instance = this

// with jQuery, this returns a jQuery object wrapping the matched elements,
// with all the jQuery methods available
const $myComponent = instance.$('.my-component')
$myComponent.data('moo') // jQuery builtin, returning the data-moo attribute value of the element

// get the native HTMLElement
$myComponent.get(0)
```

```js
// jQuery removed
const instance = this

// without jQuery, this returns an array of HTMLElements,
// note that now you always need to use the array index
// to access the specific elements
const myComponent = instance.$('.my-component')[0]
myComponent.dataset.moo // native DOM builtin, returning the data-moo attribute value of the element
```
