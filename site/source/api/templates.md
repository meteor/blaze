---
title: Templates
description: Documentation of Meteor's template API.
---

# Template API

When you write a template as `<template name="foo"> ... </template>` in an HTML file in your app, Meteor generates a
"template object" named `Template.foo`. Note that template name cannot
contain hyphens and other special characters.

The same template may occur many times on a page, and these
occurrences are called template instances.  Template instances have a
life cycle of being created, put into the document, and later taken
out of the document and destroyed.  Meteor manages these stages for
you, including determining when a template instance has been removed
or replaced and should be cleaned up.  You can associate data with a
template instance, and you can access its DOM nodes when it is in the
document.

Read more about templates and how to use them in the [Spacebars](./spacebars) and [Blaze](../guide/introduction) article in the Guide.

## Template Declarations {#Template-Declarations}

### Template.myTemplate.events(eventMap) {#Template-events}

Specify event handlers for this template.

- `eventMap` (EventMap): event handlers to associate with this template.

Declare event handlers for instances of this template. Multiple calls add
new event handlers in addition to the existing ones.

See [Event Maps](#Event-Maps) for a detailed description of the event
map format and how event handling works in Meteor.

### Template.myTemplate.helpers(helpers) {#Template-helpers}

Specify template helpers available to this template.

- `helpers` (Object): dictionary of helper functions by name.

Each template has a local dictionary of helpers that are made available to it,
and this call specifies helpers to add to the template's dictionary.

Example:

```js
Template.myTemplate.helpers({
  foo() {
    return Session.get("foo");
  }
});
```

Now you can invoke this helper with <code v-pre>{{foo}}</code> in the template defined
with `<template name="myTemplate">`.

Helpers can accept positional and keyword arguments:

```js
Template.myTemplate.helpers({
  displayName(firstName, lastName, keyword) {
    var prefix = keyword.hash.title ? keyword.hash.title + " " : "";
    return prefix + firstName + " " + lastName;
  }
});
```

Then you can call this helper from template like this:

```handlebars
{{displayName "John" "Doe" title="President"}}
```

You can learn more about arguments to helpers in [Spacebars](../api/spacebars.html).

Under the hood, each helper starts a new
[`Tracker.autorun`](http://docs.meteor.com/api/tracker.html#Tracker-autorun).  When its reactive
dependencies change, the helper is rerun. Helpers depend on their data
context, passed arguments and other reactive data sources accessed during
execution.

To create a helper that can be used in any template, use
[`Template.registerHelper`](#Template-registerHelper).


### Template.myTemplate.onRendered(callback) {#Template-onRendered}

Register a function to be called when an instance of this template is inserted into the DOM.

- `callback` (Function): a function to be added as a callback.

Callbacks added with this method are called once when an instance of
Template.*myTemplate* is rendered into DOM nodes and put into the document for
the first time.

In the body of a callback, `this` is a [template instance](#Template-instances)
object that is unique to this occurrence of the template and persists across
re-renderings. Use the `onCreated` and `onDestroyed` callbacks to perform
initialization or clean-up on the object.

Because your template has been rendered, you can use functions like
[`this.findAll`](#Blaze-TemplateInstance-findAll) which look at its DOM nodes.

This can be a good place to apply any DOM manipulations you want, after the
template is rendered for the first time.

```handlebars
<template name="myPictures">
  <div class="container">
    {{#each pictures}}
      <img class="item" src="/{{.}}"/>
    {{/each}}
  </div>
</template>
```

```js
Template.myPictures.onRendered(function () {
  // Use the Packery jQuery plugin (requires the jquery package)
  this.$('.container').packery({
    itemSelector: '.item',
    gutter: 10
  });
});
```

### Template.myTemplate.onCreated(callback) {#Template-onCreated}

Register a function to be called when an instance of this template is created.

- `callback` (Function): a function to be added as a callback.

Callbacks added with this method are called before your template's logic is
evaluated for the first time. Inside a callback, `this` is the new [template
instance](#Template-instances) object. Properties you set on this object will be
visible from the callbacks added with `onRendered` and `onDestroyed` methods and
from event handlers.

These callbacks fire once and are the first group of callbacks to fire.
Handling the `created` event is a useful way to set up values on template
instance that are read from template helpers using `Template.instance()`.

```js
Template.myPictures.onCreated(function () {
  // set up local reactive variables
  this.highlightedPicture = new ReactiveVar(null);
  
  // register this template within some central store
  GalleryTemplates.push(this);
});
```

### Template.myTemplate.onDestroyed(callback) {#Template-onDestroyed}

Register a function to be called when an instance of this template is removed from the DOM and destroyed.

- `callback` (Function): a function to be added as a callback.

These callbacks are called when an occurrence of a template is taken off
the page for any reason and not replaced with a re-rendering.  Inside
a callback, `this` is the [template instance](#Template-instances) object
being destroyed.

This group of callbacks is most useful for cleaning up or undoing any external
effects of `created` or `rendered` groups. This group fires once and is the last
callback to fire.

```js
Template.myPictures.onDestroyed(function () {
  // deregister from some central store
  GalleryTemplates = _.without(GalleryTemplates, this);
});
```


## Template instances {#Template-instances}

A template instance object represents an occurrence of a template in
the document.  It can be used to access the DOM and it can be
assigned properties that persist as the template is reactively updated.

Template instance objects are found as the value of `this` in the
`onCreated`, `onRendered`, and `onDestroyed` template callbacks, and as an
argument to event handlers.  You can access the current template instance
from helpers using [`Template.instance()`](#Template-instance).

In addition to the properties and functions described below, you can assign
additional properties of your choice to the object. Use the
[`onCreated`](#Template-onCreated) and [`onDestroyed`](#Template-onDestroyed)
methods to add callbacks performing initialization or clean-up on the object.

You can only access `findAll`, `find`, `firstNode`, and `lastNode` from the
`onRendered` callback and event handlers, not from `onCreated` and
`onDestroyed`, because they require the template instance to be in the DOM.

Template instance objects are `instanceof Blaze.TemplateInstance`.

### template.findAll(selector) {#Blaze-TemplateInstance-findAll}

Find all elements matching `selector` in this template instance.

- `selector` (String): the CSS selector to match, scoped to the template contents.

`template.findAll` returns an array of DOM elements matching `selector`.

### template.$(selector) {#Blaze-TemplateInstance-dollar}

Find all elements matching `selector` in this template instance. Returns a jQuery object when the `jquery` package is installed, and an array of DOM elements otherwise.

- `selector` (String): the CSS selector to match, scoped to the template contents.

When the `jquery` package is installed, `template.$` returns a
[jQuery object](http://api.jquery.com/Types/#jQuery) of those same elements.
jQuery objects are similar to arrays, with additional methods defined by the
jQuery library. Without jQuery, `template.$` returns a plain array of DOM
elements, like `template.findAll`. See the [migration guide](../migrations#_3-1-0)
for the details of running Blaze without jQuery.

The template instance serves as the document root for the selector. Only
elements inside the template and its sub-templates can match parts of
the selector.

### template.find(selector) {#Blaze-TemplateInstance-find}

Find one element matching `selector` in this template instance.

- `selector` (String): the CSS selector to match, scoped to the template contents.

Returns one DOM element matching `selector`, or `null` if there are no
such elements.

The template instance serves as the document root for the selector. Only
elements inside the template and its sub-templates can match parts of
the selector.

### template.firstNode {#Blaze-TemplateInstance-firstNode}

The first top-level DOM node in this template instance.

The two nodes `firstNode` and `lastNode` indicate the extent of the
rendered template in the DOM.  The rendered template includes these
nodes, their intervening siblings, and their descendents.  These two
nodes are siblings (they have the same parent), and `lastNode` comes
after `firstNode`, or else they are the same node.

### template.lastNode {#Blaze-TemplateInstance-lastNode}

The last top-level DOM node in this template instance.

### template.data {#Blaze-TemplateInstance-data}

The data context of this instance's latest invocation.

This property provides access to the data context at the top level of
the template.  It is updated each time the template is re-rendered.
Access is read-only and non-reactive.

### template.autorun(runFunc) {#Blaze-TemplateInstance-autorun}

A version of [`Tracker.autorun`](https://docs.meteor.com/api/tracker.html#Tracker-autorun) that is stopped when the template is destroyed.

- `runFunc` (Function): the function to run. It receives one argument: a `Tracker.Computation` object.

You can use `this.autorun` from an [`onCreated`](#Template-onCreated) or
[`onRendered`](#Template-onRendered) callback to reactively update the DOM
or the template instance.  You can use `Template.currentData()` inside
of this callback to access reactive data context of the template instance.
The Computation is automatically stopped when the template is destroyed.

Alias for `template.view.autorun`.

### template.subscribe(name, [arg1, arg2...], [options]) {#Blaze-TemplateInstance-subscribe}

A version of [`Meteor.subscribe`](https://docs.meteor.com/api/pubsub.html#Meteor-subscribe) that is stopped when the template is destroyed.

- `name` (String): name of the subscription. Matches the name of the server's `publish()` call.
- `arg1, arg2...` (Any): optional arguments passed to the publisher function on the server.
- `options` (Function or Object): if a function is passed instead of an object, it is interpreted as an `onReady` callback.
  - `options.onReady` (Function): passed to `Meteor.subscribe`.
  - `options.onStop` (Function): passed to `Meteor.subscribe`.
  - `options.connection` (DDP.Connection): the connection on which to make the subscription.

Returns the subscription handle to the newly made subscription. Call
`handle.stop()` to manually stop the subscription, or `handle.ready()` to find
out if this particular subscription has loaded all of its initial data.

You can use `this.subscribe` from an [`onCreated`](#Template-onCreated) callback
to specify which data publications this template depends on. The subscription is
automatically stopped when the template is destroyed.

There is a complementary function `Template.instance().subscriptionsReady()`
which returns true when all of the subscriptions called with `this.subscribe`
are ready.

Inside the template's HTML, you can use the built-in helper
`Template.subscriptionsReady`, which is an easy pattern for showing loading
indicators in your templates when they depend on data loaded from subscriptions.

Example:

```js
Template.notifications.onCreated(function () {
  // Use this.subscribe inside onCreated callback
  this.subscribe("notifications");
});
```

```handlebars
<template name="notifications">
  {{#if Template.subscriptionsReady}}
    <!-- This is displayed when all data is ready. -->
    {{#each notifications}}
      {{> notification}}
    {{/each}}
  {{else}}
    Loading...
  {{/if}}
</template>
```

Another example where the subscription depends on the data context:

```js
Template.comments.onCreated(function () {
  // Use this.subscribe with the data context reactively
  this.autorun(() => {
    var dataContext = Template.currentData();
    this.subscribe("comments", dataContext.postId);
  });
});
```

```handlebars
{{#with post}}
  {{> comments postId=_id}}
{{/with}}
```

Another example where you want to initialize a plugin when the subscription is
done:

```js
Template.listing.onRendered(function () {
  var template = this;
  
  template.subscribe('listOfThings', () => {
    // Wait for the data to load using the callback
    Tracker.afterFlush(() => {
      // Use Tracker.afterFlush to wait for the UI to re-render
      // then use highlight.js to highlight a code snippet
      highlightBlock(template.find('.code'));
    });
  });
});
```

### template.view {#Blaze-TemplateInstance-view}

The [View](./blaze#Blaze.View) object for this invocation of the template.

### Template.registerHelper(name, function) {#Template-registerHelper}

Defines a [helper function](#Template-helpers) which can be used from all templates.

- `name` (String): the name of the helper function you are defining.
- `function` (Function): the helper function itself.

### Template.instance() {#Template-instance}

The [template instance](#Template-instances) corresponding to the current template helper, event handler, callback, or autorun.  If there isn't one, `null`.

### Template.currentData() {#Template-currentData}

- Inside an `onCreated`, `onRendered`, or `onDestroyed` callback, returns
  the data context of the template.
- Inside an event handler, returns the data context of the template on which
  this event handler was defined.
- Inside a helper, returns the data context of the DOM node where the helper
  was used.

Establishes a reactive dependency on the result.

### Template.parentData([numLevels]) {#Template-parentData}

Accesses other data contexts that enclose the current data context.

- `numLevels` (Integer): the number of levels beyond the current data context to look. Defaults to 1.

For example, `Template.parentData(0)` is equivalent to `Template.currentData()`.  `Template.parentData(2)`
is equivalent to <code v-pre>{{../..}}</code> in a template.

### Template.body {#Template-body}

The [template object](#Template-Declarations) representing your `<body>` tag.

You can define helpers and event maps on `Template.body` just like on
any `Template.myTemplate` object.

Helpers on `Template.body` are only available in the `<body>` tags of
your app.  To register a global helper, use
[Template.registerHelper](#Template-registerHelper).
Event maps on `Template.body` don't apply to elements added to the
body via `Blaze.render`, jQuery, or the DOM API, or to the body element
itself.  To handle events on the body, window, or document, use the DOM
API, or jQuery if your app includes it.

### <code v-pre>{{> Template.dynamic template=template [data=data]}}</code> {#Template-dynamic}

Choose a template to include dynamically, by name.

- `template` (String): the name of the template to include.
- `data` (Object): optional. The data context in which to include the template.

`Template.dynamic` allows you to include a template by name, where the name
may be calculated by a helper and may change reactively.  The `data`
argument is optional, and if it is omitted, the current data context
is used. It's also possible, to use `Template.dynamic` as a block helper
(<code v-pre>{{#Template.dynamic}} ... {{/Template.dynamic}}</code>)

For example, if there is a template named "foo", <code v-pre>{{> Template.dynamic
template="foo"}}</code> is equivalent to <code v-pre>{{> foo}}</code> and
<code v-pre>{{#Template.dynamic template="foo"}} ... {{/Template.dynamic}}</code>
is equivalent to <code v-pre>{{#foo}} ... {{/foo}}</code>.

## Event Maps {#Event-Maps}

An event map is an object where
the properties specify a set of events to handle, and the values are
the handlers for those events. The property can be in one of several
forms:

- ***eventtype***: Matches the type of events, such as `'click'`, separated by a forward
  slash, like so `'touchend/mouseup/keyup'`.
- ***eventtype selector***: Matches a particular type of event, but only when it appears on
  an element that matches a certain CSS selector.
- ***event1, event2***: To handle more than one event / selector with the same function, use a
  comma-separated list.

The handler function receives two arguments: `event`, an object with
information about the event, and `template`, a [template
instance](#Template-instances) for the template where the handler is
defined.  The handler also receives some additional context data in
`this`, depending on the context of the current element handling the
event.  In a template, an element's context is the
data context where that element occurs, which is set by
block helpers such as `#with` and `#each`.

Example:

```js
{
  // Fires when any element is clicked
  'click'(event) { ... },
  
  // Fires when any element with the 'accept' class is clicked
  'click .accept'(event) { ... },
  
  // Fires when 'accept' is clicked or focused
  'click .accept, focus .accept'(event) { ... }
  'click/focus .accept'(event) { ... }
  
  // Fires when 'accept' is clicked or focused, or a key is pressed
  'click .accept, focus .accept, keypress'(event) { ... }
  'click/focus .accept, keypress'(event) { ... }
  
}
```

Most events bubble up the document tree from their originating
element.  For example, `'click p'` catches a click anywhere in a
paragraph, even if the click originated on a link, span, or some other
element inside the paragraph.  The originating element of the event
is available as the `target` property, while the element that matched
the selector and is currently handling it is called `currentTarget`.

```js
{
  'click p'(event) {
    var paragraph = event.currentTarget; // always a P
    var clickedElement = event.target; // could be the P or a child element
  }
}
```

If a selector matches multiple elements that an event bubbles to, it
will be called multiple times, for example in the case of `'click
div'` or `'click *'`.  If no selector is given, the handler
will only be called once, on the original target element.

The `event` object passed to handlers is a
[jQuery event object](https://api.jquery.com/category/events/event-object/)
when the `jquery` package is installed, and the native DOM event otherwise.
The following properties and methods are available on it in both cases:

- **type** (String): The event's type, such as "click", "blur" or "keypress".
- **target** (DOM Element): The element that originated the event.
- **currentTarget** (DOM Element): The element currently handling the event.  This is the element that
  matched the selector in the event map.  For events that bubble, it may
  be `target` or an ancestor of `target`, and its value changes as the
  event bubbles.
- **which** (Number): For mouse events, the number of the mouse button (1=left, 2=middle, 3=right).
  For key events, a character or key code.
- **stopPropagation()**: Prevent the event from propagating (bubbling) up to other elements.
  Other event handlers matching the same element are still fired, in
  this and other event maps.
- **stopImmediatePropagation()**: Prevent all additional event handlers from being run on this event,
  including other handlers in this event map, handlers reached by
  bubbling, and handlers in other event maps.
- **preventDefault()**: Prevents the action the browser would normally take in response to this
  event, such as following a link or submitting a form.  Further handlers
  are still called, but cannot reverse the effect.

The jQuery event object additionally offers `isPropagationStopped()`,
`isImmediatePropagationStopped()` and `isDefaultPrevented()`. On the native
DOM event, use `event.defaultPrevented` to find out whether `preventDefault()`
has been called.

Returning `false` from a handler is the same as calling
both `stopImmediatePropagation` and `preventDefault` on the event.

Event types and their uses include:

- **`click`**: Mouse click on any element, including a link, button, form control, or div.
  Use `preventDefault()` to prevent a clicked link from being followed.
  Some ways of activating an element from the keyboard also fire `click`.
- **`dblclick`**: Double-click.
- **`focus, blur`**: A text input field or other form control gains or loses focus.  You
  can make any element focusable by giving it a `tabindex` property.
  Browsers differ on whether links, checkboxes, and radio buttons are
  natively focusable.  These events do not bubble.
- **`change`**: A checkbox or radio button changes state.  For text fields, use
  `blur` or key events to respond to changes.
- **`mouseenter, mouseleave`**: The pointer enters or
  leaves the bounds of an element.  These events do not bubble.
- **`mousedown, mouseup`**: The mouse button is newly down or up.
- **`keydown, keypress, keyup`**: The user presses a keyboard key.  `keypress` is most useful for
  catching typing in text fields, while `keydown` and `keyup` can be
  used for arrow keys or modifier keys.

Other DOM events are available as well, but for the events above,
Meteor has taken some care to ensure that they work uniformly in all
browsers.
