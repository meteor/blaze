---
title: Server Rendering
description: Render Blaze templates to HTML strings on the server for SEO, social previews, and pre-rendering.
---

# Server Rendering with Blaze

Starting from Blaze 3.1.x, compiled templates are available both on the client and on the server. This enables rendering templates to HTML strings from Node.js — useful for SEO, social link previews, and pre-rendering static or dynamic pages.

## The basics

`Blaze.toHTML()` and `Blaze.toHTMLWithData()` work on the server, returning a string of HTML:

```js
// server/main.js
import '../imports/ui/my-template.html';  // make template available server-side

const html = Blaze.toHTML(Template.myTemplate);
const html2 = Blaze.toHTMLWithData(Template.productCard, { title: 'Oak Chair', price: 149 });
```

The rendering path goes through `Blaze._expandView()`, which is DOM-free. No browser, no JSDOM required.

## Making templates available on the server

In modern Meteor with explicit imports, `.html` files must be imported from `server/main.js` (or a file it imports) to be included in the server bundle:

```js
// server/main.js
import '../imports/ui/templates.html';
```

On the client, your existing imports continue to work unchanged.

## Template restrictions

Templates rendered on the server must avoid client-only APIs and Tracker-based reactivity:

- ❌ `Session.get()`, `Session.set()`
- ❌ `Template.instance().subscribe()`
- ❌ `Template.dynamic` (it remains client-only)
- ❌ ReactiveVar, ReactiveDict reads inside helpers
- ❌ `onRendered()`, `onDestroyed()` callbacks (they don't fire server-side)
- ✅ Pure helpers that use the data context passed to the template
- ✅ `#each`, `#if`, `#unless`, `#with`, `#let` block helpers
- ✅ Sub-templates with `{{> myTemplate}}`

Server-rendered templates should be written as pure render functions against explicit data context.

## Using server rendering for SSG/SSR

The [`static-render` package](../packages/static-render) provides a higher-level API for pre-rendering routes at server startup (SSG) or at each request (SSR), integrating with `flow-router-extra` and the Meteor boilerplate pipeline.

```js
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

FlowRouter.route('/about', {
  static: 'ssg',
  template: 'about',
  staticData() {
    return { title: 'About Us' };
  },
  staticHead() {
    return '<title>About | MyShop</title>';
  },
});
```

See the [static-render package docs](../packages/static-render) for full API reference.

## Manual rendering (without static-render)

For custom integration, use `Blaze.toHTML()` directly with `server-render`'s `onPageLoad()`:

```js
import { onPageLoad } from 'meteor/server-render';

onPageLoad((sink) => {
  const html = Blaze.toHTMLWithData(Template.homepage, { title: 'Welcome' });
  sink.appendToBody(html);
  sink.appendToHead('<title>Welcome</title>');
});
```

## What's new in 3.1.x

Prior to this version, Blaze templates only compiled for the client, and the `Template` registry was not exported to the server. Server-side rendering was possible only through third-party packages (now unmaintained).

The changes are backward-compatible: existing client-side Blaze apps continue to work identically. The server-side additions are opt-in — if you don't import `.html` files from your server entry point, nothing changes.

## Known limitations

- **Rspack**: requires a small patch to `@meteorjs/rspack` to allow `.html` imports on the server. See the [rspack integration notes](../packages/rspack.md#server-side-html-imports).
- **Dynamic templates**: `{{> Template.dynamic template=content}}` is client-only. For server rendering, use direct template inclusion `{{> content}}`.
