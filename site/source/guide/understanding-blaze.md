---
title: Understanding Blaze
order: 6
description:
---

Although Blaze is a very intuitive rendering system, it does have some quirks and complexities that are worth knowing about when you are trying to do complex things.

<h3 id="re-rendering">Re-rendering</h3>

Blaze is intentionally opaque about re-rendering. Tracker and Blaze are designed as "eventual consistency" systems that end up fully reflecting any data change eventually, but may take a few re-runs or re-renders in getting there, depending on how they are used. This can be frustrating if you are trying to carefully control when your component is re-rendered.

The first thing to consider here is if you actually need to care about your component re-rendering. Blaze is optimized so that it typically doesn't matter if a component is re-rendered even if it strictly shouldn't. If you make sure that your helpers are cheap to run and consequently rendering is not expensive, then you probably don't need to worry about this.

The main thing to understand about how Blaze re-renders is that re-rendering happens at the level of helpers and template inclusions. Whenever the *data context* of a component changes, it necessarily must re-run *all* helpers and data accessors (as `this` within the helper is the data context and thus will have changed).

Additionally, a helper will re-run if any *reactive data source* accessed from within *that specific helper* changes.

You can often work out *why* a helper has re-run by tracing the source of the reactive invalidation:

```js
Template.myTemplate.helpers({
  helper() {
    // When this helper is scheduled to re-run, the `console.trace` will log a stack trace of where
    // the invalidation has come from (typically a `changed` message from some reactive variable).
    Tracker.onInvalidate(() => console.trace());
  }
});
```

<h3 id="controlling-re-rendering">Controlling re-rendering</h3>

If your helper or sub-component is expensive to run, and often re-runs without any visible effect, you can short circuit unnecessary re-runs by using a more subtle reactive data source. The [`peerlibrary:computed-field`](https://atmospherejs.com/peerlibrary/computed-field) package helps achieve this pattern.

<h3 id="attribute-helpers">Attribute helpers</h3>

Setting tag attributes via helpers (e.g. `<div {% raw %}{{attributes}}{% endraw %}>`) is a neat tool and has some precedence rules that make it more useful. Specifically, when you use it more than once on a given element, the attributes are composed (rather than the second set of attributes simply replacing the first). So you can use one helper to set one set of attributes and a second to set another. For instance:

```html
<template name="myTemplate">
  <div id="my-div" {{classes 'foo' 'bar'}} {{backgroundImageStyle 'my-image.jpg'}}>My div</div>
</template>
```


```js
Template.myTemplate.helpers({
  classes(names) {
    return {class: names.map(n => `my-template-${n}`)};
  },
  backgroundImageStyle(imageUrl) {
    return {
      style: {
        backgroundImage: `url(${imageUrl})`
      }
    };
  }
});
```

<h3 id="lookups">Lookup order</h3>

Another complicated topic in Blaze is name lookups. In what order does Blaze look when you write `{% raw %}{{something}}{% endraw %}`? It runs in the following order:

1. Helper defined on the current component
2. Binding (eg. from `{% raw %}{{#let}}{% endraw %}` or `{% raw %}{{#each in}}{% endraw %}`) in current scope
3. Template name
4. Global helper
5. Field on the current data context

<h3 id="build-system">Blaze and the build system</h3>

As mentioned in the [build system article](build-tool.html#blaze), the [`blaze-html-templates`](https://atmospherejs.com/meteor/blaze-html-templates) package scans your source code for `.html` files, picks out `<template name="templateName">` tags, and compiles them into a JavaScript file that defines a function that implements the component in code, attached to the `Template.templateName` symbol.

This means when you render a Blaze template, you are simply running a function on the client that corresponds to the Spacebars content you defined in the `.html` file.

<h3 id="views">What is a view?</h3>

One of the most core concepts in Blaze is the "view", which is a building block that represents a reactively rendering area of a template. The view is the machinery that works behind the scenes to track reactivity, do lookups, and re-render appropriately when data changes. The view is the unit of re-rendering in Blaze. You can even use the view tree to walk the rendered component hierarchy, but it's better to avoid this in favor of communicating between components using callbacks, template arguments, or global data stores.

You can read more about views in the [Blaze docs](http://blazejs.org/api/blaze.html#Blaze-View).