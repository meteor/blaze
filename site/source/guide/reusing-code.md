---
title: Reusing code in Blaze
order: 5
description: 
---

It's common to want to reuse code between two otherwise unrelated components. There are two main ways to do this in Blaze.

<h3 id="composition">Composition</h3>

If possible, it's usually best to try and abstract out the reusable part of the two components that need to share functionality into a new, smaller component. If you follow the patterns for [reusable components](#reusable-components), it should be simple to reuse this sub-component everywhere you need this functionality.

For instance, suppose you have many places in your application where you need an input to blur itself when you click the "esc" key. If you were building an autocomplete widget that also wanted this functionality, you could compose a `blurringInput` inside your `autocompleteInput`:

```html
<template name="autocompleteInput">
  {{> blurringInput name=name value=currentValue onChange=onChange}}
</template>
```

```js
Template.autocompleteInput.helpers({
  currentValue() {
    // perform complex logic to determine the auto-complete's current text value
  },
  onChange() {
    // This is the `autocompleteInput`'s template instance
    const instance = Template.instance();
    // The second argument to this function is the template instance of the `blurringInput`.
    return (event) => {
      // read the current value out of the input, potentially change the value
    };
  }
});
```

By making the `blurringInput` flexible and reusable, we can avoid re-implementing functionality in the `autocompleteInput`.

<h3 id="libraries">Libraries</h3>

It's usually best to keep your view layer as thin as possible and contain a component to whatever specific task it specifically needs to do. If there's heavy lifting involved (such as complicated data loading logic), it often makes sense to abstract it out into a library that simply deals with the logic alone and doesn't deal with the Blaze system at all.

For example, if a component requires a lot of complicated [D3](http://d3js.org) code for drawing graphs, it's likely that that code itself could live in a separate module that's called by the component. That makes it easier to abstract the code later and share it between various components that need to all draw graphs.

<h3 id="global-helpers">Global Helpers</h3>

Another way to share commonly used view code is a global Spacebars helper. You can define these with the `Template.registerHelper()` function. Typically you register helpers to do simple things (like rendering dates in a given format) which don't justify a separate sub-component. For instance, you could do:

```js
Template.registerHelper('shortDate', (date) => {
  return moment(date).format("MMM do YY");
});
```

```html
<template name="myBike">
  <dl>
   <dt>Date registered</dt>
   <dd>{{shortDate bike.registeredAt}}</dd>
 </dl>
</template>
```