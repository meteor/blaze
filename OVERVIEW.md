# Overview

This document provides a detailed architecture overview of Blaze and its related packages, offering a starting point for newcomers to understand how the system works.

## High-Level Architecture

Blaze is a reactive templating library that transforms HTML templates into dynamic, reactive user interfaces. The architecture consists of two major components:

1. **Template Compiler** - Compiles template files (`.html`) into JavaScript code at build time
2. **Reactive Runtime** - Manages DOM rendering and reactivity at runtime, responding to data changes automatically

The system is designed as a modular ecosystem where each package has a specific responsibility. Packages interact through well-defined interfaces, with some packages operating exclusively during the build phase, others exclusively at runtime, and some spanning both phases.

## Stages

The Blaze package ecosystem operates in two distinct stages:

### Build Stage

During the build stage, template files are processed and compiled into executable JavaScript:

1. **HTML files are scanned** (`html-tools`, `templating-tools`) - The build system reads `.html` files and tokenizes them into processable structures
2. **Templates are parsed** (`spacebars-compiler`) - Spacebars syntax (e.g., `{{#if}}`, `{{#each}}`) is parsed and analyzed
3. **Code is generated** (`spacebars-compiler`, `templating-tools`) - Templates are compiled into JavaScript functions that can render and update the DOM
4. **Compiled code is bundled** - The generated JavaScript is included in the application bundle for runtime execution

**Key packages in build stage:**
- `templating-compiler` - Build plugin that orchestrates the compilation process
- `caching-html-compiler` - Provides caching infrastructure for efficient compilation
- `templating-tools` - Utility functions for scanning and processing HTML files
- `spacebars-compiler` - Compiles Spacebars template syntax into JavaScript
- `html-tools` - Tokenizes and parses HTML with support for template extensions

### Runtime Stage

During runtime, the compiled templates execute to create and manage reactive DOM:

1. **Templates are instantiated** (`templating-runtime`, `blaze`) - Compiled template functions are called to create View objects
2. **HTMLjs structures are created** (`htmljs`) - Templates produce intermediate HTMLjs representations
3. **DOM is materialized** (`blaze`) - HTMLjs is converted into actual DOM nodes
4. **Reactivity is established** (`blaze`, `observe-sequence`) - Dependencies are tracked using Tracker, enabling automatic updates
5. **Changes trigger updates** (`blaze`) - When reactive data sources change, affected DOM regions are automatically updated

**Key packages in runtime stage:**
- `blaze` - Core reactive rendering engine that manages Views, DOM manipulation, and reactivity
- `templating-runtime` - Provides the Template API and dynamic template rendering
- `spacebars` - Runtime support for Spacebars helpers and operations
- `htmljs` - Intermediate representation for HTML structures
- `observe-sequence` - Efficiently tracks changes in arrays and cursors for reactive lists
- `ui` - Legacy compatibility layer

## Package Roles and Inter-relations

### Core Runtime Packages

#### `blaze` (Runtime)
The heart of the reactive rendering system. Blaze provides:
- **View management** - Creates and manages View objects that represent reactive DOM regions
- **DOM materialization** - Converts HTMLjs structures into actual DOM nodes
- **Reactivity integration** - Integrates with Tracker to automatically update the DOM when dependencies change
- **Event handling** - Delegates and manages DOM events
- **Reactive regions** - Maintains reactive computations for dynamic template regions

**Dependencies:** `htmljs`, `observe-sequence`, `tracker`, `reactive-var`, `jquery` (optional)
**Stage:** Runtime only

#### `htmljs` (Both Build and Runtime)
A lightweight library for expressing HTML trees with concise JavaScript syntax. HTMLjs serves as the intermediate representation between compiled templates and actual DOM.
- **Tag constructors** - Provides constructors like `HTML.DIV()`, `HTML.P()` for building HTML structures
- **Foreign objects** - Supports embedding Blaze directives (like `{{#if}}`) in the tree
- **Multiple output formats** - Can render to HTML strings or DOM nodes

**Dependencies:** None (standalone)
**Stage:** Build (used by compiler) and Runtime (used by Blaze)

#### `spacebars` (Runtime)
The runtime counterpart to `spacebars-compiler`. Provides the runtime functions and helpers needed by compiled Spacebars templates.
- **Helper execution** - Executes template helpers like `{{helper arg}}`
- **Block helpers** - Supports block helpers like `{{#each}}` and `{{#if}}`
- **Inclusion helpers** - Handles template inclusion with `{{> templateName}}`
- **Data context management** - Manages the data context stack

**Dependencies:** `htmljs`, `blaze` (implied)
**Stage:** Runtime only

#### `observe-sequence` (Runtime)
Efficiently observes changes to various sequence types (arrays, cursors, objects) and produces minimal diffs.
- **Cursor observation** - Tracks changes in Minimongo cursors
- **Array observation** - Detects additions, moves, and removals in arrays
- **Efficient diffing** - Produces minimal change sets to avoid unnecessary DOM updates

**Dependencies:** `tracker`, `mongo-id`, `diff-sequence`
**Stage:** Runtime only

#### `templating-runtime` (Runtime)
Provides the `Template` global object and APIs that developers use to define helpers, events, and lifecycle callbacks.
- **Template registry** - Maintains a registry of all defined templates
- **Template instance** - Provides the `Template` constructor and instance API
- **Dynamic template rendering** - Enables `{{> Template.dynamic}}`
- **Lifecycle hooks** - Supports `onCreated`, `onRendered`, `onDestroyed`

**Dependencies:** `blaze`, `spacebars`
**Stage:** Runtime only

### Build-Time Packages

#### `templating-compiler` (Build)
A build plugin that compiles `.html` files containing Spacebars templates.
- **Build integration** - Registers as a Meteor build plugin for `.html` files
- **Orchestration** - Coordinates the compilation pipeline
- **File processing** - Processes template files and generates JavaScript output

**Dependencies:** `caching-html-compiler`, `templating-tools`
**Stage:** Build only

#### `spacebars-compiler` (Build)
The core compiler that transforms Spacebars template syntax into JavaScript code.
- **Syntax parsing** - Parses Spacebars syntax (mustache tags, block helpers, etc.)
- **Code generation** - Generates JavaScript functions that construct HTMLjs trees
- **Optimization** - Performs optimizations like constant folding
- **Error reporting** - Provides helpful error messages for template syntax errors

**Dependencies:** `htmljs`, `html-tools`
**Stage:** Build only (though it can be used at runtime on server for dynamic compilation)

#### `html-tools` (Build)
A lightweight HTML tokenizer and parser that outputs HTMLjs structures.
- **HTML tokenization** - Breaks HTML into tokens following WHATWG spec
- **Parsing with extensions** - Supports hooks for template syntax (like `{{}}`)
- **Strict validation** - Enforces valid HTML5 (catches unclosed tags, etc.)
- **Character references** - Handles HTML entities like `&nbsp;`

**Dependencies:** `htmljs`
**Stage:** Build only (though can be used at runtime for parsing)

#### `templating-tools` (Build)
Utility functions shared between build plugins that compile templates.
- **HTML scanning** - Scans HTML files for `<template>`, `<head>`, `<body>` tags
- **Tag compilation** - Compiles scanned tags with Spacebars
- **Error handling** - Provides standardized error reporting
- **Reusable utilities** - Used by `templating-compiler` and alternative compilers

**Dependencies:** `spacebars-compiler`, `html-tools`
**Stage:** Build only

#### `caching-html-compiler` (Build)
Provides a pluggable, cacheable base class for HTML template compilers.
- **Caching infrastructure** - Automatically caches compilation results
- **Build plugin abstraction** - Simplifies creating new template compilers
- **Pluggable pipeline** - Accepts custom scanner and handler functions

**Dependencies:** None (standalone)
**Stage:** Build only

### Integration Packages

#### `templating` (Build + Runtime)
A convenience package that combines build and runtime functionality.
- **Simple integration** - Single package that provides complete templating support
- **Backward compatibility** - Maintains compatibility with older Meteor apps

**Dependencies/Exports:** `templating-runtime` (runtime), `templating-compiler` (build)
**Stage:** Both (combines build and runtime packages)

#### `blaze-html-templates` (Build + Runtime)
The top-level package that most Meteor applications include to get Blaze templating.
- **Complete solution** - Bundles everything needed for Blaze templates
- **Default setup** - The recommended way to add Blaze to a Meteor app

**Dependencies/Exports:** `blaze`, `templating`
**Stage:** Both (implies both build and runtime packages)

### Supporting Packages

#### `ui` (Runtime)
A legacy compatibility package that exports UI-related functionality.
- **Backward compatibility** - Maintains old `UI` namespace for legacy code
- **Deprecated** - Most functionality has been moved to `blaze` package

**Dependencies:** `blaze`
**Stage:** Runtime only

#### `blaze-tools` (Build + Runtime)
Developer tools for working with Blaze internals.
- **Testing utilities** - Helper functions for testing Blaze code
- **Debugging aids** - Tools like `BlazeTools.toJS()` for inspecting Blaze structures

**Dependencies:** `htmljs`, `html-tools`
**Stage:** Both

### Data Flow

**Build Time:**
```
.html file → templating-compiler
           → caching-html-compiler
           → templating-tools.scanHtmlForTags
           → html-tools (parsing)
           → spacebars-compiler (compilation)
           → JavaScript code (output)
```

**Runtime:**
```
Template function called
           → Creates Blaze.View
           → View.render() → HTMLjs structure
           → Blaze.materialize() → DOM nodes
           → Reactive dependencies tracked (Tracker)
           → Data changes → View.invalidate()
           → Selective DOM updates (observe-sequence for {{#each}})
```

## All Blaze packages and their dependencies

### Summary of Package Interactions

The Blaze architecture follows a clear separation of concerns:

1. **Build-time packages** process source files and generate code
   - `templating-compiler` orchestrates the build
   - `caching-html-compiler` provides caching infrastructure
   - `templating-tools` scans and processes HTML
   - `html-tools` tokenizes HTML
   - `spacebars-compiler` compiles Spacebars to JavaScript
   - `htmljs` provides the intermediate representation

2. **Runtime packages** execute the compiled code and manage the UI
   - `blaze` is the core rendering engine
   - `templating-runtime` provides the Template API
   - `spacebars` provides runtime helper support
   - `observe-sequence` tracks collection changes
   - `htmljs` serves as the intermediate representation

3. **Integration packages** bridge the build and runtime worlds
   - `templating` combines build + runtime
   - `blaze-html-templates` is the user-facing package

**Key Insight:** The clear separation between build and runtime allows Blaze to:
- Ship minimal code to the client (no compiler code needed at runtime)
- Optimize templates at build time
- Provide fast runtime performance with pre-compiled templates
- Support different template syntaxes through pluggable compilers

![all packages](https://raw.githubusercontent.com/jankapunkt/blaze/architecture/images/architecture_packages.svg)

## Package `templating-tools`

![package templating-tools](https://raw.githubusercontent.com/jankapunkt/blaze/architecture/images/architecture-templating-tools.svg)

## Package `static-html`

![package static-html](https://raw.githubusercontent.com/jankapunkt/blaze/architecture/images/architecture-static-html.svg)
