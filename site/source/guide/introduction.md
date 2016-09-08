---
title: Introduction
order: 1
description: How to use Blaze, Meteor's frontend rendering system, to build usable and maintainable user interfaces.
---

After reading this guide, you'll know:

1. How to use the Spacebars language to define templates rendered by the Blaze engine.
2. Best practices for writing reusable components in Blaze.
3. How the Blaze rendering engine works under the hood and some advanced techniques for using it.
4. How to test Blaze templates.

Blaze is Meteor's built-in reactive rendering library. Usually, templates are written in [Spacebars](http://blazejs.org/guide/spacebars), a variant of [Handlebars](http://handlebarsjs.com) designed to take advantage of [Tracker](https://github.com/meteor/meteor/tree/devel/packages/tracker), Meteor's reactivity system. These templates are compiled into JavaScript UI components that are rendered by the Blaze library.

Blaze is not required to build applications in Meteor---you can also easily use [React](http://react-in-meteor.readthedocs.org/en/latest/) or [Angular](http://www.angular-meteor.com) to develop your UI. However, this particular article will take you through best practices in building an application in Blaze, which is used as the UI engine in all of the other articles.