# Blaze

Reactive templating library for Meteor. Spacebars templates are compiled to JavaScript at build time and kept up to date by [Tracker](https://docs.meteor.com/api/tracker.html) at runtime. Shipped as [Atmosphere packages](#packages) with no npm dependencies; apps usually depend on `blaze-html-templates`.

## Commands

All commands run from `test-app/` and need the Meteor CLI (`npx meteor@latest` installs the CLI).

```bash
meteor npm install                                  # once: test and lint dependencies
meteor npm run setup                                # once: symlink ../packages into test-app/packages
meteor npm run test:watch                           # all package tests, native DOM backend, browser UI at localhost:3000
meteor npm run test:jquery                          # same tests with jQuery as the DOM backend
meteor npm run lint:check -- ./packages/<name>      # ESLint (quave config), one package at a time
```

Headless run, the same way CI does it (`.github/workflows/blaze-tests.yml`):

```bash
meteor test-packages --driver-package test-in-console -p 4096 &   # add --extra-packages=jquery for the jQuery backend
URL=http://localhost:4096/ meteor node puppeteerRunner.js         # exits 0 when every test passed
```

Wait for `test-in-console listening` in the server output before starting the runner. `--exclude <package>` skips a package.

Docs site, from `site/`: `npm install`, then `npm run docs:dev`. `npm run docs:api` regenerates the API pages from the JSDoc comments in `packages/blaze`, `packages/spacebars` and `packages/templating-runtime`.

## Structure

```
packages/            # 17 packages, one directory each, tests next to the code (*_tests.js)
test-app/            # Bare Meteor app that runs the package tests (packages/ is a symlink to ../packages)
tests/               # Manual browser benchmarks, open the .html files directly
site/                # VitePress documentation site published at blazejs.org
HISTORY.md           # Changelog, one section per published version
```

## Packages

| Stage | Package | Role |
|-------|---------|------|
| Compile time | `html-tools` | Tokenizer and parser for template HTML, produces HTMLjs trees |
| | `htmljs` | HTMLjs tree representation (`HTML.DIV(...)`) and visitors |
| | `spacebars-compiler` | Spacebars to JavaScript: `compiler.js` (entry), `templatetag.js` (tag parsing), `codegen.js`, `optimizer.js`, `whitespace.js` |
| | `blaze-tools` | Shared compile-time utilities (`toJS`, tokens) |
| | `templating-tools` | Scans `.html` files for `<template>`, `<head>` and `<body>`; `throw-compile-error.js` builds errors with file and line |
| | `templating-compiler`, `caching-html-compiler` | Build plugin that compiles `.html` files, with caching |
| Runtime | `blaze` | Core: `view.js`, `domrange.js`, `materializer.js`, `attrs.js`, `events.js`, `dombackend.js`, `lookup.js`, `builtins.js`, `template.js`, `exceptions.js`; types in `blaze.d.ts` |
| | `spacebars` | Runtime helpers called by compiled templates (`spacebars-runtime.js`) |
| | `observe-sequence` | Diffs arrays and cursors for `{{#each}}` |
| | `templating-runtime` | `Template` registry and `Template.dynamic` |
| | `blaze-hot` | Hot module replacement for templates |
| Umbrellas | `blaze-html-templates`, `templating`, `ui` | Meta packages that apps depend on; `ui` is the legacy name of `blaze` |
| Tests only | `spacebars-tests` | Integration tests of compiled templates (`template_tests.js`, `async_tests.js`, `old_templates_tests.js`) |
| | `test-in-browser` | Local copy of Meteor's browser test driver without `jquery`, so `test:watch` really runs the native backend; not published |

## Dependencies

Meteor core packages Blaze builds on. Tracker is the reactivity backbone: views render inside Tracker computations, and most design choices follow from how computations, dependencies and `Tracker.afterFlush` work.

| Package | Used for |
|---------|----------|
| [`tracker`](https://docs.meteor.com/api/tracker.html) | Computations and dependencies behind every reactive update |
| `reactive-var`, `check`, `ordered-dict` | Reactive state, argument checks and ordered maps in the `blaze` runtime |
| `diff-sequence`, `mongo-id`, `random` | Diffing arrays and cursors in `observe-sequence` |
| `caching-compiler`, `isobuild:compiler-plugin` | Base class and registration of the `.html` build plugin |
| `jquery` | Weak dependency: used as the DOM backend only when the app includes it |

## Key entry points

| Task | Location |
|------|----------|
| Rendering, reactivity, view lifecycle | `packages/blaze/view.js`, `packages/blaze/template.js` |
| DOM backend (jQuery or native), event delegation, teardown | `packages/blaze/dombackend.js`, `packages/blaze/events.js` |
| Attribute updates | `packages/blaze/attrs.js`, `packages/blaze/materializer.js` |
| `{{#each}}`, `{{#if}}`, `{{#with}}`, `{{#let}}` | `packages/blaze/builtins.js`, `packages/observe-sequence/observe_sequence.js` |
| Helper and data context lookup | `packages/blaze/lookup.js` |
| Template syntax and compile errors | `packages/spacebars-compiler/`, `packages/templating-tools/` |
| Architecture overview | `site/source/dev/architecture.md` |

## Branches and releases

- `master` holds the latest published version. Work for the next version happens on the `release-<version>` branch: open PRs against that branch.
- Package versions in `package.js` and the `.versions` files are bumped by the core team in the release commit, not in feature or fix PRs. `DEPLOYMENT.md` describes publishing.
- User-visible changes get a line in `HISTORY.md` under the upcoming version heading: `* [#NNN](PR link) Past-tense summary ([#issue](issue link))`.

## Rules for changes

- Every change must work with and without jQuery. CI runs the whole test suite in both modes. `Blaze._DOMBackend._hasJQuery` tells which backend is active; use it to branch tests that differ (see `packages/blaze/render_tests.js`).
- Add tests, do not modify or remove existing ones. Tinytest, named `'<package> - <area> - <description>'`, `Tinytest.addAsync` for async code, `canonicalizeHtml` from `test-helpers` to compare rendered HTML. A bug fix comes with a test that fails without the fix.
- Published packages have no npm dependencies (`Npm.depends`); keep it that way. New Meteor package dependencies need a reason in the PR.
- ES2015+ only: `const` and `let`, classes, arrow functions, template literals. Contain async at the lowest level; do not make callers `async` to await a single call.
- Public API functions carry JSDoc with `@summary`, `@locus` and `@param`; the docs site is generated from them.
- One fix or feature per PR, scoped to its stated goal. Modernize only the lines you touch.
- The test app runs on Meteor 3.4 (`test-app/.meteor/release`). Before bumping it, know that from Meteor 3.5 the `test-in-console` driver depends on `jquery`, which silently turns the native run into a jQuery run.

## Writing Blaze application code

This file is about contributing to Blaze itself. For writing Blaze apps (Spacebars, async helpers, lifecycle, Rspack, PWA), use the `meteor-blaze` skill from [meteor/agent-skills](https://github.com/meteor/agent-skills) and the guide at [blazejs.org](https://www.blazejs.org/).

## Notes

- `site/` is the public documentation, not agent context, except `site/source/dev/architecture.md`.
- `CONTRIBUTING.md` explains how to run an existing app against this checkout (`METEOR_PACKAGE_DIRS`).
- Changes to the release branch naming or to the Meteor version of the test app (`test-app/.meteor/release`) imply updating the versions mentioned in this file.
