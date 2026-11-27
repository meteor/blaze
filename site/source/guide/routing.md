---
title: Routing
description: Client-side routing in Blaze applications with ostrio:flow-router-extra.
---

# Routing

In a Meteor + Blaze application, client-side routing maps browser URLs to Blaze layouts and page templates without full page reloads.

When you create a new Blaze project with `meteor create --blaze` or `meteor create --full`, [`ostrio:flow-router-extra`](https://github.com/VeliovGroup/flow-router) is already installed and configured with starter routes.

To add it to an existing application, run:

```shell
meteor add ostrio:flow-router-extra
```

`ostrio:flow-router-extra` is the actively maintained router for Blaze. It includes built-in Blaze rendering (`this.render()` and <code v-pre>{{> yield}}</code>), built-in Spacebars route helpers (`pathFor`, `urlFor`, `param`, `queryParam`, `isActiveRoute`, `isActivePath`), and support for dynamic `import()` promises in `waitOn`.

## Layouts and Rendering

A typical Blaze app defines a top-level **layout template** that holds shared navigation and a <code v-pre>{{> yield}}</code> placeholder where the active page template is rendered:

```html
<!-- client/main.html -->
<head>
  <title>My Blaze App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<template name="layout">
  <nav>
    <a href="{{pathFor 'home'}}" class="{{isActiveRoute 'home'}}">Home</a>
    <a href="{{pathFor 'about'}}" class="{{isActiveRoute 'about'}}">About</a>
  </nav>

  <main>
    {{> yield}}
  </main>
</template>

<template name="home">
  <h1>Welcome to Blaze!</h1>
</template>

<template name="about">
  <h1>About</h1>
  <p>This is the about page.</p>
</template>
```

> Because `FlowRouter` renders the layout directly into `document.body` by default, you do not need a static `<body>` tag when using a layout template.

Register your routes on the client with `FlowRouter.route()` and call `this.render(layoutTemplate, pageTemplate)` inside `action()`:

```js
// client/main.js
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import './main.html';

FlowRouter.route('/', {
  name: 'home',
  action() {
    this.render('layout', 'home');
  },
});

FlowRouter.route('/about', {
  name: 'about',
  action() {
    this.render('layout', 'about');
  },
});
```

You can also pass a data context as the third argument to `this.render(layout, page, data)`:

```js
FlowRouter.route('/lists/:_id', {
  name: 'Lists.show',
  action(params) {
    this.render('layout', 'Lists_show_page', { listId: params._id });
  },
});
```

## URL Parameters and Reactive Getters

Route patterns can include named parameters prefixed with `:` (such as `/lists/:_id`), and URLs can include query strings (such as `?sort=top`).

`FlowRouter` provides reactive methods that automatically invalidate any computation (such as a template helper or `this.autorun`) when the corresponding part of the URL changes:

- `FlowRouter.getParam(paramName)` — returns a URL parameter (always a string)
- `FlowRouter.getQueryParam(key)` — returns a query string parameter
- `FlowRouter.getRouteName()` — returns the current route's `name`
- `FlowRouter.watchPathChange()` — depends on any URL change

## Subscribing to Data from a Route

As described in [Smart Components](/guide/smart-components), the recommended pattern in Blaze is to subscribe inside the page template's `onCreated` callback using `this.autorun()`:

```js
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Lists } from '/imports/api/lists/lists.js';
import './lists-show.html';

Template.Lists_show_page.onCreated(function () {
  this.getListId = () => FlowRouter.getParam('_id');

  this.autorun(() => {
    const listId = this.getListId();
    if (listId) {
      this.subscribe('todos.inList', listId);
    }
  });
});

Template.Lists_show_page.helpers({
  list() {
    return Lists.findOne(Template.instance().getListId());
  },
});
```

In your template, use the built-in <code v-pre>{{Template.subscriptionsReady}}</code> helper to show a loading indicator while the subscription is initializing:

```html
<template name="Lists_show_page">
  {{#if Template.subscriptionsReady}}
    {{#if list}}
      <h2>{{list.name}}</h2>
    {{else}}
      <p>List not found.</p>
    {{/if}}
  {{else}}
    <p>Loading...</p>
  {{/if}}
</template>
```

## Spacebars Helpers and Navigation

`ostrio:flow-router-extra` automatically registers global Spacebars helpers when Blaze is present (replacing the legacy `arillo:flow-router-helpers` and `zimme:active-route` packages):

| Helper | Description | Example |
| :--- | :--- | :--- |
| `pathFor` | Builds a relative path for a route name and params | <code v-pre>{{pathFor 'Lists.show' _id=list._id}}</code> |
| `urlFor` | Builds an absolute URL using `Meteor.absoluteUrl` | <code v-pre>{{urlFor 'Lists.show' _id=list._id}}</code> |
| `param` | Reactively reads a URL parameter | <code v-pre>{{param '_id'}}</code> |
| `queryParam` | Reactively reads a query parameter | <code v-pre>{{queryParam 'filter'}}</code> |
| `currentRouteName` | Reactively returns the active route name | <code v-pre>{{currentRouteName}}</code> |
| `isActiveRoute` | Returns `'active'` (or a custom class) when the route matches | <code v-pre>{{isActiveRoute 'Lists.show'}}</code> |
| `isActivePath` | Returns `'active'` when the current path matches a string or regex | <code v-pre>{{isActivePath regex='^/lists'}}</code> |

To navigate programmatically from an event handler, call `FlowRouter.go()`:

```js
Template.layout.events({
  async 'click .js-new-list'() {
    const listId = await Meteor.callAsync('lists.insert');
    FlowRouter.go('Lists.show', { _id: listId });
  },
});
```

## Dynamic Imports and `waitOn`

To split your client bundle by route, return a dynamic `import()` from `waitOn()`. `FlowRouter` waits for the module to load before rendering `action()`:

```js
FlowRouter.route('/admin', {
  name: 'admin',
  waitOn() {
    return import('/imports/ui/pages/admin/admin.js');
  },
  whileWaiting() {
    this.render('layout', 'loading');
  },
  action() {
    this.render('layout', 'adminPage');
  },
});
```

## Protected Routes and 404 Pages

### Enter triggers

Use `triggersEnter` on a route or a `FlowRouter.group()` to redirect unauthenticated users before the route action runs:

```js
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

const requireLogin = (context, redirect) => {
  if (!Meteor.userId() && !Meteor.loggingIn()) {
    redirect('/login');
  }
};

FlowRouter.route('/settings', {
  name: 'settings',
  triggersEnter: [requireLogin],
  action() {
    this.render('layout', 'settingsPage');
  },
});
```

### Wildcard 404 route

Register a wildcard route (`'*'`) to handle unknown URLs:

```js
FlowRouter.route('*', {
  name: 'notFound',
  action() {
    this.render('layout', 'notFoundPage');
  },
});
```

> Use `FlowRouter.route('*', ...)` rather than `FlowRouter.notFound = { ... }`, which is deprecated in `ostrio:flow-router-extra`.

## Legacy Routers

In older Meteor and Blaze codebases, you may encounter two unmaintained routers:

- **`kadira:flow-router` (and `kadira:blaze-layout`)** — The original Flow Router. Replaced by [`ostrio:flow-router-extra`](https://github.com/VeliovGroup/flow-router), which is API-compatible and integrates `BlazeLayout`, `arillo:flow-router-helpers`, and `zimme:active-route` out of the box.
- **`iron:router`** — An early Meteor router that coupled routing, subscriptions, and reactive controllers. For new and migrated Meteor 3 applications, use `ostrio:flow-router-extra` instead.
