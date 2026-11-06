# Migrations

On this page we want to provide you guidance with migrating between Blaze versions.

## 3.1.0

This is a performance release, improving bundle size, render performance and developer experience.
With this release, we removed jQuery, which has implications for existing Blaze apps that used jQuery and
intend to opt-out now.

### Remove jQuery

In order to remove jQuery, simply run `meteor remove jquery && meteor npm uninstall jquery` in your console.
Blaze will adapt automatically to use native DOM operations under the hood.

> Breaking note!

While this is a minor release, removing jQuery will be breaking if you remove it AND rely on
template-level selectors:

```js
// with jQuery
const instance = this

// with jQuery, this returns a list of jQuery objects,
// each capable of builtin jQuery interactions
const $myComponent = instance.$('.my-component')
$myComponent.data('moo') //jQuery builtin, returning data-moo attribute value of the element

// get native HTMLElement
$myComponent.get(0)
```

```js
// jQuery removed
const instance = this

// without jQuery, this returns a list of HTMLElements,
// note that now you always need to use the array index
// to access the specific elememnts
const $myComponent = instance.$('.my-component')[0]
$myComponent.dataset.moo //native DOM builtin, returning data-moo attribute value of the element
```
