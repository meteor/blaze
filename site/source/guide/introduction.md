---
title: Introduction
description: How to use Blaze, Meteor's frontend rendering system, to build usable and maintainable user interfaces.
---

# Getting started with Blaze

Blaze is Meteor's built-in reactive rendering library. Usually, templates are written
in [Spacebars](../guide/spacebars), a variant of [Handlebars](http://handlebarsjs.com) designed to take advantage
of [Tracker](https://github.com/meteor/meteor/tree/devel/packages/tracker), Meteor's reactivity system. These templates
are compiled into JavaScript UI components that are rendered by the Blaze library.

Blaze is not required to build applications in Meteor - you can also easily
use [React](http://react-in-meteor.readthedocs.org/en/latest/) or [Angular](http://www.angular-meteor.com) to develop
your UI. However, this particular article will take you through best practices in building an application in Blaze,
which is used as the UI engine in all of the other articles.

## About this guide

After reading this guide, you'll know:

1. How to use the Spacebars language to define templates rendered by the Blaze engine.
2. Best practices for writing reusable components in Blaze.
3. How the Blaze rendering engine works under the hood and some advanced techniques for using it.
4. How to test Blaze templates.

## Installation

### New Meteor Projects

This is the easiest way to install Blaze by creating a new Meteor project via

```shell
meteor create --blaze my-new-project
```

The Meteor installer makes sure everything is in place.

### Existing Projects

This will vary, depending on which frontend you currently use.
Most definitely, you will have to remove `static-html` from your Meteor packages and replace it
with `templating`:

```shell
meteor remove static-html jquery
meteor add blaze-html-templates reactive-dict hot-module-replacement blaze-hot
```

Also, make sure you remove any **Meteor and NPM package**, that was used with your prior frontend.

Then, make sure you create a `client/main.js` and `client/main.html` file with the following content:

*client/main.html*

```handlebars

<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="initial-scale=1, maximum-scale=5, minimum-scale=-5"/>
    <title>Blaze example</title>
</head>

<body>
{{> example }}
</body>

<template name="example">
    You clicked {{count}} times.
    <button class="btn">click me</button>
</template>
```

*client/main.js*

```js
import {Template} from 'meteor/templating'
import {ReactiveDict} from 'meteor/reactive-dict'
import './main.html'

Template.example.onCreated(function () {
    const instance = this
    instance.state = new ReactiveDict({count: 0})
})

Template.example.helpers({
    count() {
        return Template.instance().state.get('count')
    }
})

Template.example.events({
    'click .btn'(event, templateInstance) {
        event.preventDefault()
        templateInstance.state.set({
            count: templateInstance.state.get('count') + 1
        })
    }
})
```

