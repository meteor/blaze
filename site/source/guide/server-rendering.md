---
title: Server Rendering
description: Render Blaze templates to HTML strings on the server for SEO, social previews, and pre-rendering.
---

# Server Rendering with Blaze

Compiled Blaze templates are available both on the client and on the server. This enables rendering templates to HTML strings from Node.js — useful for SEO, social link previews, and pre-rendering static or dynamic pages.

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

The [`static-render` package](https://v3-docs.meteor.com/packages/static-render) provides a higher-level API for pre-rendering routes at server startup (SSG) or at each request (SSR), integrating with `flow-router-extra` and the Meteor boilerplate pipeline.

**This integration requires `ostrio:flow-router-extra`.** `static-render` discovers routes from the FlowRouter route table; without that package it registers no routes and renders nothing. If you use a different router, or no router at all, see [Manual rendering](#manual-rendering-without-static-render) below — `Blaze.toHTML()` itself has no router dependency.

It offers two modes, both declared as route options and both rendering through `Blaze.toHTMLWithData()`: `static: 'ssg'` renders a route once at server startup and caches the result, for pages that change only on redeploy; `static: 'ssr'` renders on each request with fresh data, for pages backed by collections that change.

See the [static-render package docs](https://v3-docs.meteor.com/packages/static-render) for the route options, parameterized SSG routes (`staticPaths`), cache invalidation, and error handling.

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

## What's new

Previously, Blaze templates only compiled for the client, and the `Template` registry was not exported to the server. Server-side rendering was possible only through third-party packages (now unmaintained).

The changes are backward-compatible: client-side rendering behaves identically. Two things do change under the hood for every app that uses `templating`. The `blaze` and `spacebars` packages are now part of the server bundle — the `'client'` scoping that previously excluded them had to be lifted for the registry to exist server-side — and `.html` files are compiled for the server as well as the client.

What that means in practice depends on how your app loads files. With explicit imports, a template reaches the server only when you import its `.html` file from your server entry point. In an app that eager-loads — no `imports/` directory — every template is registered on the server at startup; registration populates the `Template` registry and renders nothing, but it does add to server bundle size and startup work.

Rendering itself is always opt-in: nothing is rendered on the server unless you call `Blaze.toHTML()` or `Blaze.toHTMLWithData()` yourself.

## Known limitations

- **Rspack**: server-side `.html` imports rely on the rspack config fix from [meteor#14350](https://github.com/meteor/meteor/pull/14350), which is already included in current Meteor releases. Older versions need that fix applied.
- **Dynamic templates**: `{{> Template.dynamic template=content}}` is client-only. For server rendering, use direct template inclusion `{{> content}}`.
