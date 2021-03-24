<p align="center">
  <img src="https://cdn.rawgit.com/meteor/blaze/master/images/logo.svg" width="260" />
</p>
<p align="center">
  <a href="http://slack.blazejs.org" target="_blank">
  	<img src="http://slack.blazejs.org/badge.svg">
  </a>
  <a href="https://circleci.com/gh/meteor/blaze" target="_blank">
  	<img src="https://circleci.com/gh/meteor/blaze.svg?style=shield">
  </a>
  <a href="#backers">
  	<img src="https://opencollective.com/blaze/backers/badge.svg">
  </a>
  <a href="#sponsors">
  	<img src="https://opencollective.com/blaze/sponsors/badge.svg">
  </a>
</p>

## What is Blaze?

Blaze is a powerful library for creating user interfaces by writing reactive HTML templates.  Compared to using a combination of traditional templates and jQuery, Blaze eliminates the need for all the "update logic" in your app that listens for data changes and manipulates the DOM.  Instead, familiar template directives like ``{{#if}}`` and ``{{#each}}`` integrate with [Tracker's](https://github.com/meteor/meteor/tree/master/packages/tracker) "transparent reactivity" and [Minimongo's](https://meteor.com/mini-databases) database cursors so that the DOM updates automatically.

### Blaze has two major parts:

* A template compiler that compiles template files into JavaScript code that runs against the Blaze runtime library.  Moreover, Blaze provides a compiler toolchain (think LLVM) that can be used to support arbitrary template syntaxes.  The flagship template syntax is Spacebars, a variant of Handlebars, but a community alternative based on Jade is already in use by many apps.

* A reactive DOM engine that builds and manages the DOM at runtime, invoked via templates or directly from the app, which features reactively updating regions, lists, and attributes; event delegation; and many callbacks and hooks to aid the app developer.

Check our [Overview](OVERVIEW.md) to learn more.

## Quick Start

Blaze is a [Meteor](http://meteor.com/)-only package for now. Soon we will have Blaze on npm so you can use it in your stack.

Each new Meteor project you create has Blaze included (the `blaze-html-templates` package).

## Get involved

We'd love for you to help us build Blaze. If you'd like to be a contributor,
check out our [contributing guide](/CONTRIBUTING.md).

Also, to stay up-to-date on all Blaze related news and the community you should
definitely [join us on Slack](http://slack.blazejs.org).

See [open issues](https://github.com/meteor/blaze/issues) and consider helping with any of the tasks. Those [labeled "contributions welcome"](https://github.com/meteor/blaze/issues?q=is%3Aopen+is%3Aissue+label%3A%22contributions+welcome%22) are probably a good start. We have issues [organized into GitHub projects](https://github.com/meteor/blaze/projects) for a better overview as well. And the current [roadmap](https://github.com/meteor/blaze/milestones) shows the issues we need help with for the next release.

## Backers

Support us with a monthly donation and help us continue our activities. [Become a backer](https://opencollective.com/blaze#backer).

<a href="https://opencollective.com/blaze/backer/0/website" target="_blank"><img src="https://opencollective.com/blaze/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/1/website" target="_blank"><img src="https://opencollective.com/blaze/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/2/website" target="_blank"><img src="https://opencollective.com/blaze/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/3/website" target="_blank"><img src="https://opencollective.com/blaze/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/4/website" target="_blank"><img src="https://opencollective.com/blaze/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/5/website" target="_blank"><img src="https://opencollective.com/blaze/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/6/website" target="_blank"><img src="https://opencollective.com/blaze/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/7/website" target="_blank"><img src="https://opencollective.com/blaze/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/8/website" target="_blank"><img src="https://opencollective.com/blaze/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/9/website" target="_blank"><img src="https://opencollective.com/blaze/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/10/website" target="_blank"><img src="https://opencollective.com/blaze/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/11/website" target="_blank"><img src="https://opencollective.com/blaze/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/12/website" target="_blank"><img src="https://opencollective.com/blaze/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/13/website" target="_blank"><img src="https://opencollective.com/blaze/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/14/website" target="_blank"><img src="https://opencollective.com/blaze/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/15/website" target="_blank"><img src="https://opencollective.com/blaze/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/16/website" target="_blank"><img src="https://opencollective.com/blaze/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/17/website" target="_blank"><img src="https://opencollective.com/blaze/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/18/website" target="_blank"><img src="https://opencollective.com/blaze/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/19/website" target="_blank"><img src="https://opencollective.com/blaze/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/20/website" target="_blank"><img src="https://opencollective.com/blaze/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/21/website" target="_blank"><img src="https://opencollective.com/blaze/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/22/website" target="_blank"><img src="https://opencollective.com/blaze/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/23/website" target="_blank"><img src="https://opencollective.com/blaze/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/24/website" target="_blank"><img src="https://opencollective.com/blaze/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/25/website" target="_blank"><img src="https://opencollective.com/blaze/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/26/website" target="_blank"><img src="https://opencollective.com/blaze/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/27/website" target="_blank"><img src="https://opencollective.com/blaze/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/28/website" target="_blank"><img src="https://opencollective.com/blaze/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/blaze/backer/29/website" target="_blank"><img src="https://opencollective.com/blaze/backer/29/avatar.svg"></a>


## Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site. [Become a sponsor](https://opencollective.com/blaze#sponsor).

<a href="https://opencollective.com/blaze/sponsor/0/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/1/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/2/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/3/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/4/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/5/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/6/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/7/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/8/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/9/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/10/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/11/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/12/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/13/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/14/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/15/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/16/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/17/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/18/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/19/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/20/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/21/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/22/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/23/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/24/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/25/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/26/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/27/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/28/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/blaze/sponsor/29/website" target="_blank"><img src="https://opencollective.com/blaze/sponsor/29/avatar.svg"></a>

## License

Blaze is available under the MIT license.
