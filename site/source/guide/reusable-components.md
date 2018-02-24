---
title: Reusable components in Blaze
description:
---

In the [UI/UX article](https://guide.meteor.com/ui-ux.html#smart-components) we discussed the merits of creating reusable components that interact with their environment in clear and minimal ways.

Although Blaze, which is a simple template-based rendering engine, doesn't enforce a lot of these principles (unlike other frameworks like React and Angular) you can enjoy most of the same benefits by following some conventions when writing your Blaze components. This section will outline some of these "best practices" for writing reusable Blaze components.

Examples below will reference the `Lists_show` component from the Todos example app.

## Validate data context

In order to ensure your component always gets the data you expect, you should validate the data context provided to it. This is just like validating the arguments to any Meteor Method or publication, and lets you write your validation code in one place and then assume that the data is correct.

You can do this in a Blaze component's `onCreated()` callback, like so:

```js
Template.Lists_show.onCreated(function() {
  this.autorun(() => {
    new SimpleSchema({
      list: {type: Function},
      todosReady: {type: Boolean},
      todos: {type: Mongo.Cursor}
    }).validate(Template.currentData());
  });
});
```

We use an `autorun()` here to ensure that the data context is re-validated whenever it changes.

## Name data contexts to template inclusions

It's tempting to just provide the object you're interested in as the entire data context of the template (like `{% raw %}{{> Todos_item todo}}{% endraw %}`). It's better to explicitly give it a name (`{% raw %}{{> Todos_item todo=todo}}{% endraw %}`). There are two primary reasons for this:

1. When using the data in the sub-component, it's a lot clearer what you are accessing; `{% raw %}{{todo.title}}{% endraw %}` is clearer than `{% raw %}{{title}}{% endraw %}`.
2. It's more flexible, in case you need to give the component more arguments in the future.

For instance, in the case of the `Todos_item` sub-component, we need to provide two extra arguments to control the editing state of the item, which would have been a hassle to add if the item was used with a single `todo` argument.

Additionally, for better clarity, always explicitly provide a data context to an inclusion rather than letting it inherit the context of the template where it was rendered:

```html
<!-- bad: inherits data context, who knows what is in there! -->
{{> myTemplate}}

<!-- explicitly passes empty data context -->
{{> myTemplate ""}}
```

## Prefer `{% raw %}{{#each .. in}}{% endraw %}`

For similar reasons to the above, it's better to use `{% raw %}{{#each todo in todos}}{% endraw %}` rather than the older `{% raw %}{{#each todos}}{% endraw %}`. The second sets the entire data context of its children to a single `todo` object, and makes it difficult to access any context from outside of the block.

The only reason not to use `{% raw %}{{#each .. in}}{% endraw %}` would be because it makes it difficult to access the `todo` symbol inside event handlers. Typically the solution to this is to use a sub-component to render the inside of the loop:

```html
{{#each todo in todos}}
  {{> Todos_item todo=todo}}
{{/each}}
```

Now you can access `this.todo` inside `Todos_item` event handlers and helpers.

## Pass data into helpers

Rather than accessing data in helpers via `this`, it's better to pass the arguments in directly from the template. So our `checkedClass` helper takes the `todo` as an argument and inspects it directly, rather than implicitly using `this.todo`. We do this for similar reasons to why we always pass arguments to template inclusions, and because "template variables" (such as the iteratee of the `{% raw %}{{#each .. in}}{% endraw %}` helper) are not available on `this`.

## Use the template instance

Although Blaze's simple API doesn't necessarily encourage a componentized approach, you can use the *template instance* as a convenient place to store internal functionality and state. The template instance can be accessed via `this` inside Blaze's lifecycle callbacks and as `Template.instance()` in event handlers and helpers. It's also passed as the second argument to event handlers.

We suggest a convention of naming it `instance` in these contexts and assigning it at the top of every relevant helper. For instance:

```js
Template.Lists_show.helpers({
  todoArgs(todo) {
    const instance = Template.instance();
    return {
      todo,
      editing: instance.state.equals('editingTodo', todo._id),
      onEditingChange(editing) {
        instance.state.set('editingTodo', editing ? todo._id : false);
      }
    };
  }
});

Template.Lists_show.events({
  'click .js-cancel'(event, instance) {
    instance.state.set('editingTodo', false);
  }
});
```

## Use a reactive dict for state

The [`reactive-dict`](https://atmospherejs.com/meteor/reactive-dict) package lets you define a simple reactive key-value dictionary. It's a convenient way to attach internal state to a component. We create the `state` dictionary in the `onCreated` callback, and attach it to the template instance:

```js
Template.Lists_show.onCreated(function() {
  this.state = new ReactiveDict();
  this.state.setDefault({
    editing: false,
    editingTodo: false
  });
});
```

Once the state dictionary has been created we can access it from helpers and modify it in event handlers (see the code snippet above).

## Attach functions to the instance

If you have common functionality for a template instance that needs to be abstracted or called from multiple event handlers, it's sensible to attach it as functions directly to the template instance in the `onCreated()` callback:

```js
import {
  updateName,
} from '../../api/lists/methods.js';

Template.Lists_show.onCreated(function() {
  this.saveList = () => {
    this.state.set('editing', false);

    updateName.call({
      listId: this.data.list._id,
      newName: this.$('[name=name]').val()
    }, (err) => {
      err && alert(err.error);
    });
  };
});
```

Then you can call that function from within an event handler:

```js
Template.Lists_show.events({
  'submit .js-edit-form'(event, instance) {
    event.preventDefault();
    instance.saveList();
  }
});
```

## Scope DOM lookups to the template instance

It's a bad idea to look up things directly in the DOM with jQuery's global `$()`. It's easy to select some element on the page that has nothing to do with the current component. Also, it limits your options on rendering *outside* of the main document (see testing section below).

Instead, Blaze gives you a way to scope a lookup to within the current template instance. Typically you use this either from a `onRendered()` callback to setup jQuery plugins (called via `Template.instance().$()` or `this.$()`), or from event handlers to call DOM functions directly (called via `Template.instance().$()` or using the event handler's second argument like `instance.$()`). For instance, when the user clicks the add todo button, we want to focus the `<input>` element:

```js
Template.Lists_show.events({
  'click .js-todo-add'(event, instance) {
    instance.$('.js-todo-new input').focus();
  }
});
```

## Use `.js-` selectors for event maps

When you are setting up event maps in your JS files, you need to 'select' the element in the template that the event attaches to. Rather than using the same CSS class names that are used to style the elements, it's better practice to use classnames that are specifically added for those event maps. A reasonable convention is a class starting with `js-` to indicate it is used by the JavaScript. For instance `.js-todo-add` above.

## Passing HTML content as a template argument

If you need to pass in content to a sub-component (for instance the content of a modal dialog), you can use the [custom block helper](../guide/spacebars.html#Block-Helpers) to provide a block of content. If you need more flexibility, typically just providing the component name as an argument is the way to go. The sub-component can then just render that component with:

```html
{{> Template.dynamic templateName dataContext}}
```

This is more or less the way that the [`kadira:blaze-layout`](https://atmospherejs.com/kadira/blaze-layout) package works.

## Pass callbacks

If you need to communicate *up* the component hierarchy, it's best to pass a *callback* for the sub-component to call.

For instance, only one todo item can be in the editing state at a time, so the `Lists_show` component manages the state of which is edited. When you focus on an item, that item needs to tell the list's component to make it the "edited" one. To do that, we pass a callback into the `Todos_item` component, and the child calls it whenever the state needs to be updated in the parent:

```html
{{> Todos_item (todoArgs todo)}}
```

```js
Template.Lists_show.helpers({
  todoArgs(todo) {
    const instance = Template.instance();
    return {
      todo,
      editing: instance.state.equals('editingTodo', todo._id),
      onEditingChange(editing) {
        instance.state.set('editingTodo', editing ? todo._id : false);
      }
    };
  }
});

Template.Todos_item.events({
  'focus input[type=text]'() {
    this.onEditingChange(true);
  }
});
```

## Use `onRendered()` for 3rd party libraries

As we mentioned above, the `onRendered()` callback is typically the right spot to call out to third party libraries that expect a pre-rendered DOM (such as jQuery plugins). The `onRendered()` callback is triggered *once* after the component has rendered and attached to the DOM for the first time.

Occasionally, you may need to wait for data to become ready before it's time to attach the plugin (although typically it's a better idea to use a sub-component in this use case). To do so, you can setup an `autorun` in the `onRendered()` callback. For instance, in the `Lists_show_page` component, we want to wait until the subscription for the list is ready (i.e. the todos have rendered) before we hide the launch screen:

```js
Template.Lists_show_page.onRendered(function() {
  this.autorun(() => {
    if (this.subscriptionsReady()) {
      // Handle for launch screen defined in app-body.js
      AppLaunchScreen.listRender.release();
    }
  });
});
```
