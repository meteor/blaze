---
title: Writing smart components with Blaze
order: 4
description: 
---

Some of your components will need to access state outside of their data context---for instance, data from the server via subscriptions or the contents of client-side store. As discussed in the [data loading](https://guide.meteor.com/data-loading.html#patterns) and [UI](https://guide.meteor.com/ui-ux.html#smart-components) articles, you should be careful and considered in how use such smart components.

All of the suggestions about reusable components apply to smart components. In addition:

## Subscribe from `onCreated`

You should subscribe to publications from the server from an `onCreated` callback (within an `autorun` block if you have reactively changing arguments). In the Todos example app, in the `Lists_show_page` template we subscribe to the `todos.inList` publication based on the current `_id` FlowRouter param:

```js
Template.Lists_show_page.onCreated(function() {
  this.getListId = () => FlowRouter.getParam('_id');

  this.autorun(() => {
    this.subscribe('todos.inList', this.getListId());
  });
});
```

We use `this.subscribe()` as opposed to `Meteor.subscribe()` so that the component automatically keeps track of when the subscriptions are ready. We can use this information in our HTML template with the built-in `{% raw %}{{Template.subscriptionsReady}}{% endraw %}` helper or within helpers using `instance.subscriptionsReady()`.

Notice that in this component we are also accessing the global client-side state store `FlowRouter`, which we wrap in a instance method called `getListId()`. This instance method is called both from the `autorun` in `onCreated`, and from the `listIdArray` helper:

```js
Template.Lists_show_page.helpers({
  // We use #each on an array of one item so that the "list" template is
  // removed and a new copy is added when changing lists, which is
  // important for animation purposes.
  listIdArray() {
    const instance = Template.instance();
    const listId = instance.getListId();
    return Lists.findOne(listId) ? [listId] : [];
  },
});
```

## Fetch in helpers

As described in the [UI/UX article](https://guide.meteor.com/ui-ux.html#smart-components), you should fetch data in the same component where you subscribed to that data. In a Blaze smart component, it's usually simplest to fetch the data in a helper, which you can then use to pass data into a reusable child component. For example, in the `Lists_show_page`:

```html
{{> Lists_show (listArgs listId)}}
```

The `listArgs` helper fetches the data that we've subscribed to above:

```js
Template.Lists_show_page.helpers({
  listArgs(listId) {
    const instance = Template.instance();
    return {
      todosReady: instance.subscriptionsReady(),
      // We pass `list` (which contains the full list, with all fields, as a function
      // because we want to control reactivity. When you check a todo item, the
      // `list.incompleteCount` changes. If we didn't do this the entire list would
      // re-render whenever you checked an item. By isolating the reactiviy on the list
      // to the area that cares about it, we stop it from happening.
      list() {
        return Lists.findOne(listId);
      },
      // By finding the list with only the `_id` field set, we don't create a dependency on the
      // `list.incompleteCount`, and avoid re-rendering the todos when it changes
      todos: Lists.findOne(listId, {fields: {_id: true}}).todos()
    };
  }
});

```