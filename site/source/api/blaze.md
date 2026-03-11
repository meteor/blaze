<a name="Blaze"></a>

## Blaze : <code>Object</code>
Blaze is the package that makes reactive templates possible.
You can use the Blaze API directly in order to render templates programmatically
and manipulate "Views," the building blocks of reactive templates.

**Kind**: global variable  

* [Blaze](#Blaze) : <code>Object</code>
    * [.Template](#Blaze.Template)
        * [new Blaze.Template([viewName], renderFunction)](#new_Blaze.Template_new)
        * [.viewName](#Blaze.Template+viewName) : <code>String</code>
        * [.renderFunction](#Blaze.Template+renderFunction) : <code>function</code>
    * [.TemplateInstance](#Blaze.TemplateInstance)
        * [new Blaze.TemplateInstance(view)](#new_Blaze.TemplateInstance_new)
        * [.data](#Blaze.TemplateInstance+data)
        * [.view](#Blaze.TemplateInstance+view) : [<code>View</code>](#Blaze.View)
        * [.firstNode](#Blaze.TemplateInstance+firstNode) : <code>DOMNode</code>
        * [.lastNode](#Blaze.TemplateInstance+lastNode) : <code>DOMNode</code>
        * [.$(selector)](#Blaze.TemplateInstance+$) ⇒ <code>Array.&lt;DOMNode&gt;</code>
        * [.findAll(selector)](#Blaze.TemplateInstance+findAll) ⇒ <code>Array.&lt;DOMElement&gt;</code>
        * [.find(selector)](#Blaze.TemplateInstance+find) ⇒ <code>DOMElement</code>
        * [.autorun(runFunc)](#Blaze.TemplateInstance+autorun)
        * [.subscribe(name, [options])](#Blaze.TemplateInstance+subscribe) ⇒ <code>SubscriptionHandle</code>
        * [.subscriptionsReady()](#Blaze.TemplateInstance+subscriptionsReady) ⇒ <code>Boolean</code>
    * [.View](#Blaze.View)
        * [new Blaze.View([name], renderFunction)](#new_Blaze.View_new)
        * [.name](#Blaze.View+name) : <code>String</code>
        * [.isCreated](#Blaze.View+isCreated) : <code>boolean</code>
        * [.isRendered](#Blaze.View+isRendered) : <code>boolean</code>
        * [.isDestroyed](#Blaze.View+isDestroyed) : <code>boolean</code>
        * [.parentView](#Blaze.View+parentView) : [<code>View</code>](#Blaze.View)
        * [._scopeBindings](#Blaze.View+_scopeBindings) : <code>Record.&lt;string, ReactiveVar.&lt;Binding&gt;&gt;</code>
        * [.renderCount](#Blaze.View+renderCount) : <code>number</code>
        * [.onViewCreated(cb)](#Blaze.View+onViewCreated)
        * [.onViewReady(cb)](#Blaze.View+onViewReady)
        * [.autorun(f, _inViewScope, displayName)](#Blaze.View+autorun) ⇒ <code>\*</code>
        * [.subscribe(...args, [options])](#Blaze.View+subscribe) ⇒ <code>SubscriptionHandle</code>
        * [.firstNode()](#Blaze.View+firstNode) ⇒ <code>\*</code>
        * [.lastNode()](#Blaze.View+lastNode) ⇒ <code>\*</code>
    * [.currentView](#Blaze.currentView) : [<code>View</code>](#Blaze.View)
    * [._allowJavascriptUrls()](#Blaze._allowJavascriptUrls)
    * [._javascriptUrlsAllowed()](#Blaze._javascriptUrlsAllowed) ⇒ <code>boolean</code>
    * [._clearProtocolCache()](#Blaze._clearProtocolCache)
    * [._makeAttributeHandler(elem, name, value)](#Blaze._makeAttributeHandler) ⇒ <code>AttributeHandler</code>
    * [.With(data, contentFunc)](#Blaze.With)
    * [._attachBindingsToView(bindings, view)](#Blaze._attachBindingsToView)
    * [.Let(bindings, contentFunc)](#Blaze.Let)
    * [.If(conditionFunc, contentFunc, [elseFunc])](#Blaze.If)
    * [.Unless(conditionFunc, contentFunc, [elseFunc])](#Blaze.Unless)
    * [.Each(argFunc, contentFunc, [elseFunc])](#Blaze.Each)
    * [._Await(value)](#Blaze._Await) ⇒ [<code>View</code>](#Blaze.View)
    * [.isTemplate(value)](#Blaze.isTemplate)
    * [._withCurrentView(view, func)](#Blaze._withCurrentView) ⇒ <code>T</code>
    * [.render(templateOrView, parentNode, [nextNode], [parentView])](#Blaze.render)
    * [.renderWithData(templateOrView, data, parentNode, [nextNode], [parentView])](#Blaze.renderWithData)
    * [.remove(renderedView)](#Blaze.remove)
    * [.toHTML(templateOrView)](#Blaze.toHTML)
    * [.toHTMLWithData(templateOrView, data)](#Blaze.toHTMLWithData)
    * [.getData([elementOrView])](#Blaze.getData)
    * [.getView([element])](#Blaze.getView)

<a name="Blaze.Template"></a>

### Blaze.Template
Constructor for a Template, which is used to construct Views with particular name and content.
Templates defined by the template compiler, such as `Template.myTemplate`,
are objects of type `Blaze.Template` (aliased as `Template`).

In addition to methods like `events` and `helpers`, documented as part of
the [Template API](../api/templates.html), the following fields and methods are
present on template objects:

**Kind**: static class of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  

* [.Template](#Blaze.Template)
    * [new Blaze.Template([viewName], renderFunction)](#new_Blaze.Template_new)
    * [.viewName](#Blaze.Template+viewName) : <code>String</code>
    * [.renderFunction](#Blaze.Template+renderFunction) : <code>function</code>

<a name="new_Blaze.Template_new"></a>

#### new Blaze.Template([viewName], renderFunction)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[viewName]</td><td><code>String</code></td><td><p>Optional.  A name for Views constructed by this Template.  See <a href="#view_name"><code>view.name</code></a>.</p>
</td>
    </tr><tr>
    <td>renderFunction</td><td><code>function</code></td><td><p>A function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.  This function is used as the <code>renderFunction</code> for Views constructed by this Template.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.Template+viewName"></a>

#### template.viewName : <code>String</code>
Same as the constructor argument.

**Kind**: instance property of [<code>Template</code>](#Blaze.Template)  
<a name="Blaze.Template+renderFunction"></a>

#### template.renderFunction : <code>function</code>
Same as the constructor argument.

**Kind**: instance property of [<code>Template</code>](#Blaze.Template)  
<a name="Blaze.TemplateInstance"></a>

### Blaze.TemplateInstance
**Kind**: static class of [<code>Blaze</code>](#Blaze)  
**Summary**: The class for template instances  
**Instancename**: template  

* [.TemplateInstance](#Blaze.TemplateInstance)
    * [new Blaze.TemplateInstance(view)](#new_Blaze.TemplateInstance_new)
    * [.data](#Blaze.TemplateInstance+data)
    * [.view](#Blaze.TemplateInstance+view) : [<code>View</code>](#Blaze.View)
    * [.firstNode](#Blaze.TemplateInstance+firstNode) : <code>DOMNode</code>
    * [.lastNode](#Blaze.TemplateInstance+lastNode) : <code>DOMNode</code>
    * [.$(selector)](#Blaze.TemplateInstance+$) ⇒ <code>Array.&lt;DOMNode&gt;</code>
    * [.findAll(selector)](#Blaze.TemplateInstance+findAll) ⇒ <code>Array.&lt;DOMElement&gt;</code>
    * [.find(selector)](#Blaze.TemplateInstance+find) ⇒ <code>DOMElement</code>
    * [.autorun(runFunc)](#Blaze.TemplateInstance+autorun)
    * [.subscribe(name, [options])](#Blaze.TemplateInstance+subscribe) ⇒ <code>SubscriptionHandle</code>
    * [.subscriptionsReady()](#Blaze.TemplateInstance+subscriptionsReady) ⇒ <code>Boolean</code>

<a name="new_Blaze.TemplateInstance_new"></a>

#### new Blaze.TemplateInstance(view)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>view</td><td><code><a href="#Blaze.View">View</a></code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+data"></a>

#### templateInstance.data
**Kind**: instance property of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: The data context of this instance's latest invocation.  
**Locus**: Client  
<a name="Blaze.TemplateInstance+view"></a>

#### templateInstance.view : [<code>View</code>](#Blaze.View)
**Kind**: instance property of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: The [View](../api/blaze.html#Blaze-View) object for this invocation of the template.  
**Locus**: Client  
<a name="Blaze.TemplateInstance+firstNode"></a>

#### templateInstance.firstNode : <code>DOMNode</code>
**Kind**: instance property of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: The first top-level DOM node in this template instance.  
**Locus**: Client  
<a name="Blaze.TemplateInstance+lastNode"></a>

#### templateInstance.lastNode : <code>DOMNode</code>
**Kind**: instance property of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: The last top-level DOM node in this template instance.  
**Locus**: Client  
<a name="Blaze.TemplateInstance+$"></a>

#### templateInstance.$(selector) ⇒ <code>Array.&lt;DOMNode&gt;</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: Find all elements matching `selector` in this template instance, and return them as a JQuery object.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>selector</td><td><code>String</code></td><td><p>The CSS selector to match, scoped to the template contents.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+findAll"></a>

#### templateInstance.findAll(selector) ⇒ <code>Array.&lt;DOMElement&gt;</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: Find all elements matching `selector` in this template instance.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>selector</td><td><code>String</code></td><td><p>The CSS selector to match, scoped to the template contents.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+find"></a>

#### templateInstance.find(selector) ⇒ <code>DOMElement</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: Find one element matching `selector` in this template instance.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>selector</td><td><code>String</code></td><td><p>The CSS selector to match, scoped to the template contents.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+autorun"></a>

#### templateInstance.autorun(runFunc)
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: A version of [Tracker.autorun](https://docs.meteor.com/api/tracker.html#Tracker-autorun) that is stopped when the template is destroyed.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>runFunc</td><td><code>function</code></td><td><p>The function to run. It receives one argument: a Tracker.Computation object.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+subscribe"></a>

#### templateInstance.subscribe(name, [options]) ⇒ <code>SubscriptionHandle</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: A version of [Meteor.subscribe](https://docs.meteor.com/api/pubsub.html#Meteor-subscribe) that is stopped
when the template is destroyed.  
**Returns**: <code>SubscriptionHandle</code> - The subscription handle to the newly made
subscription. Call `handle.stop()` to manually stop the subscription, or
`handle.ready()` to find out if this particular subscription has loaded all
of its inital data.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>name</td><td><code>String</code></td><td><p>Name of the subscription.  Matches the name of the
server&#39;s <code>publish()</code> call.</p>
</td>
    </tr><tr>
    <td>[arg1,arg2...]</td><td><code>Any</code></td><td><p>Optional arguments passed to publisher function
on server.</p>
</td>
    </tr><tr>
    <td>[options]</td><td><code>function</code> | <code>Object</code></td><td><p>If a function is passed instead of an
object, it is interpreted as an <code>onReady</code> callback.</p>
</td>
    </tr><tr>
    <td>[options.onReady]</td><td><code>function</code></td><td><p>Passed to <a href="https://docs.meteor.com/api/pubsub.html#Meteor-subscribe"><code>Meteor.subscribe</code></a>.</p>
</td>
    </tr><tr>
    <td>[options.onStop]</td><td><code>function</code></td><td><p>Passed to <a href="https://docs.meteor.com/api/pubsub.html#Meteor-subscribe"><code>Meteor.subscribe</code></a>.</p>
</td>
    </tr><tr>
    <td>[options.connection]</td><td><code>DDP.Connection</code></td><td><p>The connection on which to make the
subscription.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+subscriptionsReady"></a>

#### templateInstance.subscriptionsReady() ⇒ <code>Boolean</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: A reactive function that returns true when all of the subscriptions
called with [this.subscribe](#TemplateInstance-subscribe) are ready.  
**Returns**: <code>Boolean</code> - True if all subscriptions on this template instance are
ready.  
<a name="Blaze.View"></a>

### Blaze.View
Constructor for a View, which represents a reactive region of DOM.
Behind every template or part of a template &mdash; a template tag, say, like <code v-pre>{{foo}}</code> or <code v-pre>{{#if}}</code> &mdash; is
a View object, which is a reactively updating region of DOM.

Most applications do not need to be aware of these Views, but they offer a
way to understand and customize Meteor's rendering behavior for more
advanced applications and packages.

You can obtain a View object by calling [`Blaze.render`](#Blaze-render) on a
template, or by accessing [`template.view`](../api/templates.html#Blaze-TemplateInstance-view) on a template
instance.

At the heart of a View is an [autorun](https://docs.meteor.com/api/tracker.html#Tracker-autorun) that calls the View's
`renderFunction`, uses the result to create DOM nodes, and replaces the
contents of the View with these new DOM nodes.  A View's content may consist
of any number of consecutive DOM nodes (though if it is zero, a placeholder
node such as a comment or an empty text node is automatically supplied).  Any
reactive dependency established by `renderFunction` causes a full recalculation
of the View's contents when the dependency is invalidated.  Templates, however,
are compiled in such a way that they do not have top-level dependencies and so
will only ever render once, while their parts may re-render many times.

When a `Blaze.View` is constructed by calling the constructor, no hooks
are fired and no rendering is performed.  In particular, the View is
not yet considered to be "created."  Only when the View is actually
used, by a call to `Blaze.render` or `Blaze.toHTML` or by inclusion in
another View, is it "created," right before it is rendered for the
first time.  When a View is created, its `.parentView` is set if
appropriate, and then the `onViewCreated` hook is fired.  The term
"unrendered View" means a newly constructed View that has not been
"created" or rendered.

The "current View" is kept in [`Blaze.currentView`](#Blaze-currentView) and
is set during View rendering, callbacks, autoruns, and template event
handlers.  It affects calls such as [`Template.currentData()`](../api/templates.html#Template-currentData).

**Kind**: static class of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  

* [.View](#Blaze.View)
    * [new Blaze.View([name], renderFunction)](#new_Blaze.View_new)
    * [.name](#Blaze.View+name) : <code>String</code>
    * [.isCreated](#Blaze.View+isCreated) : <code>boolean</code>
    * [.isRendered](#Blaze.View+isRendered) : <code>boolean</code>
    * [.isDestroyed](#Blaze.View+isDestroyed) : <code>boolean</code>
    * [.parentView](#Blaze.View+parentView) : [<code>View</code>](#Blaze.View)
    * [._scopeBindings](#Blaze.View+_scopeBindings) : <code>Record.&lt;string, ReactiveVar.&lt;Binding&gt;&gt;</code>
    * [.renderCount](#Blaze.View+renderCount) : <code>number</code>
    * [.onViewCreated(cb)](#Blaze.View+onViewCreated)
    * [.onViewReady(cb)](#Blaze.View+onViewReady)
    * [.autorun(f, _inViewScope, displayName)](#Blaze.View+autorun) ⇒ <code>\*</code>
    * [.subscribe(...args, [options])](#Blaze.View+subscribe) ⇒ <code>SubscriptionHandle</code>
    * [.firstNode()](#Blaze.View+firstNode) ⇒ <code>\*</code>
    * [.lastNode()](#Blaze.View+lastNode) ⇒ <code>\*</code>

<a name="new_Blaze.View_new"></a>

#### new Blaze.View([name], renderFunction)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[name]</td><td><code>String</code></td><td><p>Optional.  A name for this type of View.  See <a href="#view_name"><code>view.name</code></a>.</p>
</td>
    </tr><tr>
    <td>renderFunction</td><td><code>function</code></td><td><p>A function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.  In this function, <code>this</code> is bound to the View.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+name"></a>

#### view.name : <code>String</code>
The name of this type of View.  View names may be used to identify
particular kinds of Views in code, but more often they simply aid in
debugging and comprehensibility of the View tree.  Views generated
by Meteor have names like "Template.foo" and "if".

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+isCreated"></a>

#### view.isCreated : <code>boolean</code>
True if this View has been called on to be rendered by `Blaze.render`
  or `Blaze.toHTML` or another View.  Once it becomes true, never
  becomes false again.  A "created" View's `.parentView` has been
  set to its final value.  `isCreated` is set to true before
  `onViewCreated` hooks are called.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+isRendered"></a>

#### view.isRendered : <code>boolean</code>
True if this View has been rendered to DOM by `Blaze.render` or
  by the rendering of an enclosing View.  Conversion to HTML by
  `Blaze.toHTML` doesn't count.  Once true, never becomes false.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+isDestroyed"></a>

#### view.isDestroyed : <code>boolean</code>
True if this View has been destroyed, such as by `Blaze.remove()` or
  by a reactive update that removes it.  A destroyed View's autoruns
  have been stopped, and its DOM nodes have generally been cleaned
  of all Meteor reactivity and possibly dismantled.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+parentView"></a>

#### view.parentView : [<code>View</code>](#Blaze.View)
The enclosing View that caused this View to be rendered, if any.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+_scopeBindings"></a>

#### view.\_scopeBindings : <code>Record.&lt;string, ReactiveVar.&lt;Binding&gt;&gt;</code>
**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+renderCount"></a>

#### view.renderCount : <code>number</code>
The number of times the View has been rendered, including the
  current time if the View is in the process of being rendered
  or re-rendered.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+onViewCreated"></a>

#### view.onViewCreated(cb)
If the View hasn't been created yet, calls `func` when the View
  is created.  In `func`, the View is bound to `this`.

  This hook is the basis for the [`created`](../api/templates.html#Template-onCreated)
  template callback.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>cb</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+onViewReady"></a>

#### view.onViewReady(cb)
Calls `func` when the View is rendered and inserted into the DOM,
  after waiting for the end of
  [flush time](https://docs.meteor.com/api/tracker.html#Tracker-afterFlush).  Does not fire if the View
  is destroyed at any point before it would fire.
  May fire multiple times (if the View re-renders).
  In `func`, the View is bound to `this`.

  This hook is the basis for the [`rendered`](../api/templates.html#Template-onRendered)
  template callback.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>cb</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+autorun"></a>

#### view.autorun(f, _inViewScope, displayName) ⇒ <code>\*</code>
Sets up a Tracker autorun that is "scoped" to this View in two
important ways: 1) Blaze.currentView is automatically set
on every re-run, and 2) the autorun is stopped when the
View is destroyed.  As with Tracker.autorun, the first run of
the function is immediate, and a Computation object that can
be used to stop the autorun is returned.

View#autorun is meant to be called from View callbacks like
onViewCreated, or from outside the rendering process.  It may not
be called before the onViewCreated callbacks are fired (too early),
or from a render() method (too confusing).

Typically, autoruns that update the state
of the View (as in Blaze.With) should be started from an onViewCreated
callback.  Autoruns that update the DOM should be started
from either onViewCreated (guarded against the absence of
view._domrange), or onViewReady.

  Like [`Tracker.autorun`](https://docs.meteor.com/api/tracker.html#Tracker-autorun), except that the autorun is
  automatically stopped when the View is destroyed, and the
  [current View](#Blaze-currentView) is always set when running `runFunc`.
  There is no relationship to the View's internal autorun or render
  cycle.  In `runFunc`, the View is bound to `this`.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>f</td>
    </tr><tr>
    <td>_inViewScope</td>
    </tr><tr>
    <td>displayName</td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+subscribe"></a>

#### view.subscribe(...args, [options]) ⇒ <code>SubscriptionHandle</code>
**Kind**: instance method of [<code>View</code>](#Blaze.View)  
**Summary**: Just like Blaze.View#autorun, but with Meteor.subscribe instead of
Tracker.autorun. Stop the subscription when the view is destroyed.  
**Returns**: <code>SubscriptionHandle</code> - A handle to the subscription so that you can
see if it is ready, or stop it manually  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>...args</td><td><code>*</code></td>
    </tr><tr>
    <td>[options]</td><td><code>object</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+firstNode"></a>

#### view.firstNode() ⇒ <code>\*</code>
The first node of the View's rendered content.  Note that this may
be a text node.  Requires that the View be rendered.
If the View rendered to zero DOM nodes, it may be a placeholder
node (comment or text node).  The DOM extent of a View consists
of the nodes between `view.firstNode()` and `view.lastNode()`,
inclusive.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+lastNode"></a>

#### view.lastNode() ⇒ <code>\*</code>
For Views created by invoking templates, the original Template
object.  For example, `Blaze.render(Template.foo).template === Template.foo`.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<a name="Blaze.currentView"></a>

### Blaze.currentView : [<code>View</code>](#Blaze.View)
The View corresponding to the current template helper, event handler, callback, or autorun.  If there isn't one, `null`.
The "current view" is used by [`Template.currentData()`](../api/templates.html#Template-currentData) and
[`Template.instance()`](../api/templates.html#Template-instance) to determine
the contextually relevant data context and template instance.

**Kind**: static property of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<a name="Blaze._allowJavascriptUrls"></a>

### Blaze.\_allowJavascriptUrls()
Enable javascript: URLs in href and other URL attributes
WARNING: Only call this if you trust all URL sources in your application

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<a name="Blaze._javascriptUrlsAllowed"></a>

### Blaze.\_javascriptUrlsAllowed() ⇒ <code>boolean</code>
Check if javascript: URLs are currently allowed

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Returns**: <code>boolean</code> - True if javascript: URLs are permitted  
<a name="Blaze._clearProtocolCache"></a>

### Blaze.\_clearProtocolCache()
Clear the protocol cache.
Useful for testing or when URL resolution context changes.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<a name="Blaze._makeAttributeHandler"></a>

### Blaze.\_makeAttributeHandler(elem, name, value) ⇒ <code>AttributeHandler</code>
Attribute Handler Factory

This is the main factory function that determines which type of AttributeHandler
to use for a given element/attribute combination. It analyzes the element type
and attribute name to choose the most appropriate handler.

Handler Selection Logic:
1. Class attributes -> ClassHandler (or SVGClassHandler for SVG)
2. Style attributes -> StyleHandler  
3. Boolean attributes -> BooleanHandler
4. Form value attributes -> DOMPropertyHandler
5. XLink attributes -> XlinkHandler
6. URL attributes -> UrlHandler
7. Everything else -> basic AttributeHandler

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Returns**: <code>AttributeHandler</code> - Appropriate handler instance for this attribute  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>elem</td><td><code>Element</code></td><td><p>The DOM element that will have this attribute</p>
</td>
    </tr><tr>
    <td>name</td><td><code>string</code></td><td><p>The attribute name (e.g., &#39;class&#39;, &#39;href&#39;)</p>
</td>
    </tr><tr>
    <td>value</td><td><code>string</code> | <code>null</code></td><td><p>The initial attribute value</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.With"></a>

### Blaze.With(data, contentFunc)
Constructs a View that renders content with a data context.
Returns an unrendered View object you can pass to `Blaze.render`.

Unlike <code v-pre>{{#with}}</code> (as used in templates), `Blaze.With` has no "else" case, and
a falsy value for the data context will not prevent the content from
rendering.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>data</td><td><code>Object</code> | <code>function</code></td><td><p>An object to use as the data context, or a function returning such an object.  If a
  function is provided, it will be reactively re-run.</p>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze._attachBindingsToView"></a>

### Blaze.\_attachBindingsToView(bindings, view)
Attaches bindings to the instantiated view.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>bindings</td><td><code>Object</code></td><td><p>A dictionary of bindings, each binding name
corresponds to a value or a function that will be reactively re-run.</p>
</td>
    </tr><tr>
    <td>view</td><td><code><a href="#Blaze.View">View</a></code></td><td><p>The target.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.Let"></a>

### Blaze.Let(bindings, contentFunc)
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Summary**: Constructs a View setting the local lexical scope in the block.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>bindings</td><td><code>function</code></td><td><p>Dictionary mapping names of bindings to
values or computations to reactively re-run.</p>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.If"></a>

### Blaze.If(conditionFunc, contentFunc, [elseFunc])
Constructs a View that renders content conditionally.
Returns an unrendered View object you can pass to `Blaze.render`.
Matches the behavior of <code v-pre>{{#if}}</code> in templates.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>conditionFunc</td><td><code>function</code></td><td><p>A function to reactively re-run.  Whether the result is truthy or falsy determines
  whether <code>contentFunc</code> or <code>elseFunc</code> is shown.  An empty array is considered falsy.</p>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.</p>
</td>
    </tr><tr>
    <td>[elseFunc]</td><td><code>function</code></td><td><p>Optional.  A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.  If no
  <code>elseFunc</code> is supplied, no content is shown in the &quot;else&quot; case.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.Unless"></a>

### Blaze.Unless(conditionFunc, contentFunc, [elseFunc])
An inverted [`Blaze.If`](#Blaze-If).
Returns an unrendered View object you can pass to `Blaze.render`.
Matches the behavior of <code v-pre>{{#unless}}</code> in templates.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>conditionFunc</td><td><code>function</code></td><td><p>A function to reactively re-run.  If the result is falsy, <code>contentFunc</code> is shown,
  otherwise <code>elseFunc</code> is shown.  An empty array is considered falsy.</p>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.</p>
</td>
    </tr><tr>
    <td>[elseFunc]</td><td><code>function</code></td><td><p>Optional.  A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.  If no
  <code>elseFunc</code> is supplied, no content is shown in the &quot;else&quot; case.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.Each"></a>

### Blaze.Each(argFunc, contentFunc, [elseFunc])
Constructs a View that renders `contentFunc` for each item in a sequence.
Returns an unrendered View object you can pass to `Blaze.render`.
Matches the behavior of <code v-pre>{{#each}}</code> in templates.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>argFunc</td><td><code>function</code></td><td><p>A function to reactively re-run. The function can
return one of two options:</p>
<ol>
<li><p>An object with two fields: &#39;_variable&#39; and &#39;_sequence&#39;. Each iterates over
  &#39;_sequence&#39;, it may be a Cursor, an array, null, or undefined. Inside the
  Each body you will be able to get the current item from the sequence using
  the name specified in the &#39;_variable&#39; field.</p>
</li>
<li><p>Just a sequence (Cursor, array, null, or undefined) not wrapped into an
  object. Inside the Each body, the current item will be set as the data
  context.</p>
</li>
</ol>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns  <a href="#Renderable-Content"><em>renderable
content</em></a>.</p>
</td>
    </tr><tr>
    <td>[elseFunc]</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable
content</em></a> to display in the case when there are no items
in the sequence.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze._Await"></a>

### Blaze.\_Await(value) ⇒ [<code>View</code>](#Blaze.View)
Create a new `Blaze.Let` view that unwraps the given value.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>value</td><td><code>unknown</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.isTemplate"></a>

### Blaze.isTemplate(value)
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Summary**: Returns true if `value` is a template object like `Template.myTemplate`.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>value</td><td><code>Any</code></td><td><p>The value to test.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze._withCurrentView"></a>

### Blaze.\_withCurrentView(view, func) ⇒ <code>T</code>
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>view</td><td><code><a href="#Blaze.View">View</a></code></td>
    </tr><tr>
    <td>func</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.render"></a>

### Blaze.render(templateOrView, parentNode, [nextNode], [parentView])
Renders a template or View to DOM nodes and inserts it into the DOM, returning a rendered [View](#Blaze-View) which can be passed to [`Blaze.remove`](#Blaze-remove).

When you render a template, the callbacks added with
[`onCreated`](./templates#Template-onCreated) are invoked immediately, before evaluating
the content of the template.  The callbacks added with
[`onRendered`](../api/templates.html#Template-onRendered) are invoked after the View is rendered and
inserted into the DOM.

The rendered template
will update reactively in response to data changes until the View is
removed using [`Blaze.remove`](#Blaze-remove) or the View's
parent element is removed by Meteor or jQuery.

> If the View is removed by some other mechanism
besides Meteor or jQuery (which Meteor integrates with by default),
the View may continue to update indefinitely.  Most users will not need to
manually render templates and insert them into the DOM, but if you do,
be mindful to always call [`Blaze.remove`](#Blaze-remove) when the View is
no longer needed.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>templateOrView</td><td><code>Template</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>The template (e.g. <code>Template.myTemplate</code>) or View object to render.  If a template, a View object is <a href="#template_constructview">constructed</a>.  If a View, it must be an unrendered View, which becomes a rendered View and is returned.</p>
</td>
    </tr><tr>
    <td>parentNode</td><td><code>DOMNode</code></td><td><p>The node that will be the parent of the rendered template.  It must be an Element node.</p>
</td>
    </tr><tr>
    <td>[nextNode]</td><td><code>DOMNode</code></td><td><p>Optional. If provided, must be a child of <em>parentNode</em>; the template will be inserted before this node. If not provided, the template will be inserted as the last child of parentNode.</p>
</td>
    </tr><tr>
    <td>[parentView]</td><td><code><a href="#Blaze.View">View</a></code></td><td><p>Optional. If provided, it will be set as the rendered View&#39;s <a href="#view_parentview"><code>parentView</code></a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.renderWithData"></a>

### Blaze.renderWithData(templateOrView, data, parentNode, [nextNode], [parentView])
Renders a template or View to DOM nodes with a data context.  Otherwise identical to `Blaze.render`.
`Blaze.renderWithData(Template.myTemplate, data)` is essentially the same as
`Blaze.render(Blaze.With(data, function () { return Template.myTemplate; }))`.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>templateOrView</td><td><code>Template</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>The template (e.g. <code>Template.myTemplate</code>) or View object to render.</p>
</td>
    </tr><tr>
    <td>data</td><td><code>Object</code> | <code>function</code></td><td><p>The data context to use, or a function returning a data context.  If a function is provided, it will be reactively re-run.</p>
</td>
    </tr><tr>
    <td>parentNode</td><td><code>DOMNode</code></td><td><p>The node that will be the parent of the rendered template.  It must be an Element node.</p>
</td>
    </tr><tr>
    <td>[nextNode]</td><td><code>DOMNode</code></td><td><p>Optional. If provided, must be a child of <em>parentNode</em>; the template will be inserted before this node. If not provided, the template will be inserted as the last child of parentNode.</p>
</td>
    </tr><tr>
    <td>[parentView]</td><td><code><a href="#Blaze.View">View</a></code></td><td><p>Optional. If provided, it will be set as the rendered View&#39;s <a href="#view_parentview"><code>parentView</code></a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.remove"></a>

### Blaze.remove(renderedView)
Removes a rendered View from the DOM, stopping all reactive updates and event listeners on it. Also destroys the Blaze.Template instance associated with the view.


Use `Blaze.remove` to remove a template or View previously inserted with
`Blaze.render`, in such a way that any behaviors attached to the DOM by
Meteor are cleaned up.  The rendered template or View is now considered
["destroyed"](../api/templates.html#Template-onDestroyed), along with all nested templates and
Views.  In addition, any data assigned via
jQuery to the DOM nodes is removed, as if the nodes were passed to
jQuery's `$(...).remove()`.

As mentioned in [`Blaze.render`](#Blaze-render), it is important to "remove"
all content rendered via `Blaze.render` using `Blaze.remove`, unless the
parent node of `renderedView` is removed by a Meteor reactive
update or with jQuery.

`Blaze.remove` can be used even if the DOM nodes in question have already
been removed from the document, to tell Blaze to stop tracking and
updating these nodes.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>renderedView</td><td><code><a href="#Blaze.View">View</a></code></td><td><p>The return value from <code>Blaze.render</code> or <code>Blaze.renderWithData</code>, or the <code>view</code> property of a Blaze.Template instance. Calling <code>Blaze.remove(Template.instance().view)</code> from within a template event handler will destroy the view as well as that template and trigger the template&#39;s <code>onDestroyed</code> handlers.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.toHTML"></a>

### Blaze.toHTML(templateOrView)
Renders a template or View to a string of HTML.
Rendering a template to HTML loses all fine-grained reactivity.  The
normal way to render a template is to either include it from another
template (<code v-pre>{{> myTemplate}}</code>) or render and insert it
programmatically using `Blaze.render`.  Only occasionally
is generating HTML useful.

Because `Blaze.toHTML` returns a string, it is not able to update the DOM
in response to reactive data changes.  Instead, any reactive data
changes will invalidate the current Computation if there is one
(for example, an autorun that is the caller of `Blaze.toHTML`).

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>templateOrView</td><td><code>Template</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>The template (e.g. <code>Template.myTemplate</code>) or View object from which to generate HTML.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.toHTMLWithData"></a>

### Blaze.toHTMLWithData(templateOrView, data)
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Summary**: Renders a template or View to HTML with a data context.  Otherwise identical to `Blaze.toHTML`.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>templateOrView</td><td><code>Template</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>The template (e.g. <code>Template.myTemplate</code>) or View object from which to generate HTML.</p>
</td>
    </tr><tr>
    <td>data</td><td><code>Object</code> | <code>function</code></td><td><p>The data context to use, or a function returning a data context.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.getData"></a>

### Blaze.getData([elementOrView])
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Summary**: Returns the current data context, or the data context that was used when rendering a particular DOM element or View from a Meteor template.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[elementOrView]</td><td><code>DOMElement</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>Optional.  An element that was rendered by a Meteor, or a View.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.getView"></a>

### Blaze.getView([element])
Gets either the current View, or the View enclosing the given DOM element.
If you don't specify an `element`, there must be a current View or an
error will be thrown.  This is in contrast to
[`Blaze.currentView`](#Blaze-currentView).

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[element]</td><td><code>DOMElement</code></td><td><p>Optional.  If specified, the View enclosing <code>element</code> is returned.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze"></a>

## Blaze : <code>object</code>
**Kind**: global namespace  

* [Blaze](#Blaze) : <code>object</code>
    * [.Template](#Blaze.Template)
        * [new Blaze.Template([viewName], renderFunction)](#new_Blaze.Template_new)
        * [.viewName](#Blaze.Template+viewName) : <code>String</code>
        * [.renderFunction](#Blaze.Template+renderFunction) : <code>function</code>
    * [.TemplateInstance](#Blaze.TemplateInstance)
        * [new Blaze.TemplateInstance(view)](#new_Blaze.TemplateInstance_new)
        * [.data](#Blaze.TemplateInstance+data)
        * [.view](#Blaze.TemplateInstance+view) : [<code>View</code>](#Blaze.View)
        * [.firstNode](#Blaze.TemplateInstance+firstNode) : <code>DOMNode</code>
        * [.lastNode](#Blaze.TemplateInstance+lastNode) : <code>DOMNode</code>
        * [.$(selector)](#Blaze.TemplateInstance+$) ⇒ <code>Array.&lt;DOMNode&gt;</code>
        * [.findAll(selector)](#Blaze.TemplateInstance+findAll) ⇒ <code>Array.&lt;DOMElement&gt;</code>
        * [.find(selector)](#Blaze.TemplateInstance+find) ⇒ <code>DOMElement</code>
        * [.autorun(runFunc)](#Blaze.TemplateInstance+autorun)
        * [.subscribe(name, [options])](#Blaze.TemplateInstance+subscribe) ⇒ <code>SubscriptionHandle</code>
        * [.subscriptionsReady()](#Blaze.TemplateInstance+subscriptionsReady) ⇒ <code>Boolean</code>
    * [.View](#Blaze.View)
        * [new Blaze.View([name], renderFunction)](#new_Blaze.View_new)
        * [.name](#Blaze.View+name) : <code>String</code>
        * [.isCreated](#Blaze.View+isCreated) : <code>boolean</code>
        * [.isRendered](#Blaze.View+isRendered) : <code>boolean</code>
        * [.isDestroyed](#Blaze.View+isDestroyed) : <code>boolean</code>
        * [.parentView](#Blaze.View+parentView) : [<code>View</code>](#Blaze.View)
        * [._scopeBindings](#Blaze.View+_scopeBindings) : <code>Record.&lt;string, ReactiveVar.&lt;Binding&gt;&gt;</code>
        * [.renderCount](#Blaze.View+renderCount) : <code>number</code>
        * [.onViewCreated(cb)](#Blaze.View+onViewCreated)
        * [.onViewReady(cb)](#Blaze.View+onViewReady)
        * [.autorun(f, _inViewScope, displayName)](#Blaze.View+autorun) ⇒ <code>\*</code>
        * [.subscribe(...args, [options])](#Blaze.View+subscribe) ⇒ <code>SubscriptionHandle</code>
        * [.firstNode()](#Blaze.View+firstNode) ⇒ <code>\*</code>
        * [.lastNode()](#Blaze.View+lastNode) ⇒ <code>\*</code>
    * [.currentView](#Blaze.currentView) : [<code>View</code>](#Blaze.View)
    * [._allowJavascriptUrls()](#Blaze._allowJavascriptUrls)
    * [._javascriptUrlsAllowed()](#Blaze._javascriptUrlsAllowed) ⇒ <code>boolean</code>
    * [._clearProtocolCache()](#Blaze._clearProtocolCache)
    * [._makeAttributeHandler(elem, name, value)](#Blaze._makeAttributeHandler) ⇒ <code>AttributeHandler</code>
    * [.With(data, contentFunc)](#Blaze.With)
    * [._attachBindingsToView(bindings, view)](#Blaze._attachBindingsToView)
    * [.Let(bindings, contentFunc)](#Blaze.Let)
    * [.If(conditionFunc, contentFunc, [elseFunc])](#Blaze.If)
    * [.Unless(conditionFunc, contentFunc, [elseFunc])](#Blaze.Unless)
    * [.Each(argFunc, contentFunc, [elseFunc])](#Blaze.Each)
    * [._Await(value)](#Blaze._Await) ⇒ [<code>View</code>](#Blaze.View)
    * [.isTemplate(value)](#Blaze.isTemplate)
    * [._withCurrentView(view, func)](#Blaze._withCurrentView) ⇒ <code>T</code>
    * [.render(templateOrView, parentNode, [nextNode], [parentView])](#Blaze.render)
    * [.renderWithData(templateOrView, data, parentNode, [nextNode], [parentView])](#Blaze.renderWithData)
    * [.remove(renderedView)](#Blaze.remove)
    * [.toHTML(templateOrView)](#Blaze.toHTML)
    * [.toHTMLWithData(templateOrView, data)](#Blaze.toHTMLWithData)
    * [.getData([elementOrView])](#Blaze.getData)
    * [.getView([element])](#Blaze.getView)

<a name="Blaze.Template"></a>

### Blaze.Template
Constructor for a Template, which is used to construct Views with particular name and content.
Templates defined by the template compiler, such as `Template.myTemplate`,
are objects of type `Blaze.Template` (aliased as `Template`).

In addition to methods like `events` and `helpers`, documented as part of
the [Template API](../api/templates.html), the following fields and methods are
present on template objects:

**Kind**: static class of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  

* [.Template](#Blaze.Template)
    * [new Blaze.Template([viewName], renderFunction)](#new_Blaze.Template_new)
    * [.viewName](#Blaze.Template+viewName) : <code>String</code>
    * [.renderFunction](#Blaze.Template+renderFunction) : <code>function</code>

<a name="new_Blaze.Template_new"></a>

#### new Blaze.Template([viewName], renderFunction)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[viewName]</td><td><code>String</code></td><td><p>Optional.  A name for Views constructed by this Template.  See <a href="#view_name"><code>view.name</code></a>.</p>
</td>
    </tr><tr>
    <td>renderFunction</td><td><code>function</code></td><td><p>A function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.  This function is used as the <code>renderFunction</code> for Views constructed by this Template.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.Template+viewName"></a>

#### template.viewName : <code>String</code>
Same as the constructor argument.

**Kind**: instance property of [<code>Template</code>](#Blaze.Template)  
<a name="Blaze.Template+renderFunction"></a>

#### template.renderFunction : <code>function</code>
Same as the constructor argument.

**Kind**: instance property of [<code>Template</code>](#Blaze.Template)  
<a name="Blaze.TemplateInstance"></a>

### Blaze.TemplateInstance
**Kind**: static class of [<code>Blaze</code>](#Blaze)  
**Summary**: The class for template instances  
**Instancename**: template  

* [.TemplateInstance](#Blaze.TemplateInstance)
    * [new Blaze.TemplateInstance(view)](#new_Blaze.TemplateInstance_new)
    * [.data](#Blaze.TemplateInstance+data)
    * [.view](#Blaze.TemplateInstance+view) : [<code>View</code>](#Blaze.View)
    * [.firstNode](#Blaze.TemplateInstance+firstNode) : <code>DOMNode</code>
    * [.lastNode](#Blaze.TemplateInstance+lastNode) : <code>DOMNode</code>
    * [.$(selector)](#Blaze.TemplateInstance+$) ⇒ <code>Array.&lt;DOMNode&gt;</code>
    * [.findAll(selector)](#Blaze.TemplateInstance+findAll) ⇒ <code>Array.&lt;DOMElement&gt;</code>
    * [.find(selector)](#Blaze.TemplateInstance+find) ⇒ <code>DOMElement</code>
    * [.autorun(runFunc)](#Blaze.TemplateInstance+autorun)
    * [.subscribe(name, [options])](#Blaze.TemplateInstance+subscribe) ⇒ <code>SubscriptionHandle</code>
    * [.subscriptionsReady()](#Blaze.TemplateInstance+subscriptionsReady) ⇒ <code>Boolean</code>

<a name="new_Blaze.TemplateInstance_new"></a>

#### new Blaze.TemplateInstance(view)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>view</td><td><code><a href="#Blaze.View">View</a></code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+data"></a>

#### templateInstance.data
**Kind**: instance property of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: The data context of this instance's latest invocation.  
**Locus**: Client  
<a name="Blaze.TemplateInstance+view"></a>

#### templateInstance.view : [<code>View</code>](#Blaze.View)
**Kind**: instance property of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: The [View](../api/blaze.html#Blaze-View) object for this invocation of the template.  
**Locus**: Client  
<a name="Blaze.TemplateInstance+firstNode"></a>

#### templateInstance.firstNode : <code>DOMNode</code>
**Kind**: instance property of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: The first top-level DOM node in this template instance.  
**Locus**: Client  
<a name="Blaze.TemplateInstance+lastNode"></a>

#### templateInstance.lastNode : <code>DOMNode</code>
**Kind**: instance property of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: The last top-level DOM node in this template instance.  
**Locus**: Client  
<a name="Blaze.TemplateInstance+$"></a>

#### templateInstance.$(selector) ⇒ <code>Array.&lt;DOMNode&gt;</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: Find all elements matching `selector` in this template instance, and return them as a JQuery object.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>selector</td><td><code>String</code></td><td><p>The CSS selector to match, scoped to the template contents.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+findAll"></a>

#### templateInstance.findAll(selector) ⇒ <code>Array.&lt;DOMElement&gt;</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: Find all elements matching `selector` in this template instance.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>selector</td><td><code>String</code></td><td><p>The CSS selector to match, scoped to the template contents.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+find"></a>

#### templateInstance.find(selector) ⇒ <code>DOMElement</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: Find one element matching `selector` in this template instance.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>selector</td><td><code>String</code></td><td><p>The CSS selector to match, scoped to the template contents.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+autorun"></a>

#### templateInstance.autorun(runFunc)
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: A version of [Tracker.autorun](https://docs.meteor.com/api/tracker.html#Tracker-autorun) that is stopped when the template is destroyed.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>runFunc</td><td><code>function</code></td><td><p>The function to run. It receives one argument: a Tracker.Computation object.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+subscribe"></a>

#### templateInstance.subscribe(name, [options]) ⇒ <code>SubscriptionHandle</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: A version of [Meteor.subscribe](https://docs.meteor.com/api/pubsub.html#Meteor-subscribe) that is stopped
when the template is destroyed.  
**Returns**: <code>SubscriptionHandle</code> - The subscription handle to the newly made
subscription. Call `handle.stop()` to manually stop the subscription, or
`handle.ready()` to find out if this particular subscription has loaded all
of its inital data.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>name</td><td><code>String</code></td><td><p>Name of the subscription.  Matches the name of the
server&#39;s <code>publish()</code> call.</p>
</td>
    </tr><tr>
    <td>[arg1,arg2...]</td><td><code>Any</code></td><td><p>Optional arguments passed to publisher function
on server.</p>
</td>
    </tr><tr>
    <td>[options]</td><td><code>function</code> | <code>Object</code></td><td><p>If a function is passed instead of an
object, it is interpreted as an <code>onReady</code> callback.</p>
</td>
    </tr><tr>
    <td>[options.onReady]</td><td><code>function</code></td><td><p>Passed to <a href="https://docs.meteor.com/api/pubsub.html#Meteor-subscribe"><code>Meteor.subscribe</code></a>.</p>
</td>
    </tr><tr>
    <td>[options.onStop]</td><td><code>function</code></td><td><p>Passed to <a href="https://docs.meteor.com/api/pubsub.html#Meteor-subscribe"><code>Meteor.subscribe</code></a>.</p>
</td>
    </tr><tr>
    <td>[options.connection]</td><td><code>DDP.Connection</code></td><td><p>The connection on which to make the
subscription.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.TemplateInstance+subscriptionsReady"></a>

#### templateInstance.subscriptionsReady() ⇒ <code>Boolean</code>
**Kind**: instance method of [<code>TemplateInstance</code>](#Blaze.TemplateInstance)  
**Summary**: A reactive function that returns true when all of the subscriptions
called with [this.subscribe](#TemplateInstance-subscribe) are ready.  
**Returns**: <code>Boolean</code> - True if all subscriptions on this template instance are
ready.  
<a name="Blaze.View"></a>

### Blaze.View
Constructor for a View, which represents a reactive region of DOM.
Behind every template or part of a template &mdash; a template tag, say, like <code v-pre>{{foo}}</code> or <code v-pre>{{#if}}</code> &mdash; is
a View object, which is a reactively updating region of DOM.

Most applications do not need to be aware of these Views, but they offer a
way to understand and customize Meteor's rendering behavior for more
advanced applications and packages.

You can obtain a View object by calling [`Blaze.render`](#Blaze-render) on a
template, or by accessing [`template.view`](../api/templates.html#Blaze-TemplateInstance-view) on a template
instance.

At the heart of a View is an [autorun](https://docs.meteor.com/api/tracker.html#Tracker-autorun) that calls the View's
`renderFunction`, uses the result to create DOM nodes, and replaces the
contents of the View with these new DOM nodes.  A View's content may consist
of any number of consecutive DOM nodes (though if it is zero, a placeholder
node such as a comment or an empty text node is automatically supplied).  Any
reactive dependency established by `renderFunction` causes a full recalculation
of the View's contents when the dependency is invalidated.  Templates, however,
are compiled in such a way that they do not have top-level dependencies and so
will only ever render once, while their parts may re-render many times.

When a `Blaze.View` is constructed by calling the constructor, no hooks
are fired and no rendering is performed.  In particular, the View is
not yet considered to be "created."  Only when the View is actually
used, by a call to `Blaze.render` or `Blaze.toHTML` or by inclusion in
another View, is it "created," right before it is rendered for the
first time.  When a View is created, its `.parentView` is set if
appropriate, and then the `onViewCreated` hook is fired.  The term
"unrendered View" means a newly constructed View that has not been
"created" or rendered.

The "current View" is kept in [`Blaze.currentView`](#Blaze-currentView) and
is set during View rendering, callbacks, autoruns, and template event
handlers.  It affects calls such as [`Template.currentData()`](../api/templates.html#Template-currentData).

**Kind**: static class of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  

* [.View](#Blaze.View)
    * [new Blaze.View([name], renderFunction)](#new_Blaze.View_new)
    * [.name](#Blaze.View+name) : <code>String</code>
    * [.isCreated](#Blaze.View+isCreated) : <code>boolean</code>
    * [.isRendered](#Blaze.View+isRendered) : <code>boolean</code>
    * [.isDestroyed](#Blaze.View+isDestroyed) : <code>boolean</code>
    * [.parentView](#Blaze.View+parentView) : [<code>View</code>](#Blaze.View)
    * [._scopeBindings](#Blaze.View+_scopeBindings) : <code>Record.&lt;string, ReactiveVar.&lt;Binding&gt;&gt;</code>
    * [.renderCount](#Blaze.View+renderCount) : <code>number</code>
    * [.onViewCreated(cb)](#Blaze.View+onViewCreated)
    * [.onViewReady(cb)](#Blaze.View+onViewReady)
    * [.autorun(f, _inViewScope, displayName)](#Blaze.View+autorun) ⇒ <code>\*</code>
    * [.subscribe(...args, [options])](#Blaze.View+subscribe) ⇒ <code>SubscriptionHandle</code>
    * [.firstNode()](#Blaze.View+firstNode) ⇒ <code>\*</code>
    * [.lastNode()](#Blaze.View+lastNode) ⇒ <code>\*</code>

<a name="new_Blaze.View_new"></a>

#### new Blaze.View([name], renderFunction)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[name]</td><td><code>String</code></td><td><p>Optional.  A name for this type of View.  See <a href="#view_name"><code>view.name</code></a>.</p>
</td>
    </tr><tr>
    <td>renderFunction</td><td><code>function</code></td><td><p>A function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.  In this function, <code>this</code> is bound to the View.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+name"></a>

#### view.name : <code>String</code>
The name of this type of View.  View names may be used to identify
particular kinds of Views in code, but more often they simply aid in
debugging and comprehensibility of the View tree.  Views generated
by Meteor have names like "Template.foo" and "if".

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+isCreated"></a>

#### view.isCreated : <code>boolean</code>
True if this View has been called on to be rendered by `Blaze.render`
  or `Blaze.toHTML` or another View.  Once it becomes true, never
  becomes false again.  A "created" View's `.parentView` has been
  set to its final value.  `isCreated` is set to true before
  `onViewCreated` hooks are called.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+isRendered"></a>

#### view.isRendered : <code>boolean</code>
True if this View has been rendered to DOM by `Blaze.render` or
  by the rendering of an enclosing View.  Conversion to HTML by
  `Blaze.toHTML` doesn't count.  Once true, never becomes false.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+isDestroyed"></a>

#### view.isDestroyed : <code>boolean</code>
True if this View has been destroyed, such as by `Blaze.remove()` or
  by a reactive update that removes it.  A destroyed View's autoruns
  have been stopped, and its DOM nodes have generally been cleaned
  of all Meteor reactivity and possibly dismantled.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+parentView"></a>

#### view.parentView : [<code>View</code>](#Blaze.View)
The enclosing View that caused this View to be rendered, if any.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+_scopeBindings"></a>

#### view.\_scopeBindings : <code>Record.&lt;string, ReactiveVar.&lt;Binding&gt;&gt;</code>
**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+renderCount"></a>

#### view.renderCount : <code>number</code>
The number of times the View has been rendered, including the
  current time if the View is in the process of being rendered
  or re-rendered.

**Kind**: instance property of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+onViewCreated"></a>

#### view.onViewCreated(cb)
If the View hasn't been created yet, calls `func` when the View
  is created.  In `func`, the View is bound to `this`.

  This hook is the basis for the [`created`](../api/templates.html#Template-onCreated)
  template callback.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>cb</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+onViewReady"></a>

#### view.onViewReady(cb)
Calls `func` when the View is rendered and inserted into the DOM,
  after waiting for the end of
  [flush time](https://docs.meteor.com/api/tracker.html#Tracker-afterFlush).  Does not fire if the View
  is destroyed at any point before it would fire.
  May fire multiple times (if the View re-renders).
  In `func`, the View is bound to `this`.

  This hook is the basis for the [`rendered`](../api/templates.html#Template-onRendered)
  template callback.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>cb</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+autorun"></a>

#### view.autorun(f, _inViewScope, displayName) ⇒ <code>\*</code>
Sets up a Tracker autorun that is "scoped" to this View in two
important ways: 1) Blaze.currentView is automatically set
on every re-run, and 2) the autorun is stopped when the
View is destroyed.  As with Tracker.autorun, the first run of
the function is immediate, and a Computation object that can
be used to stop the autorun is returned.

View#autorun is meant to be called from View callbacks like
onViewCreated, or from outside the rendering process.  It may not
be called before the onViewCreated callbacks are fired (too early),
or from a render() method (too confusing).

Typically, autoruns that update the state
of the View (as in Blaze.With) should be started from an onViewCreated
callback.  Autoruns that update the DOM should be started
from either onViewCreated (guarded against the absence of
view._domrange), or onViewReady.

  Like [`Tracker.autorun`](https://docs.meteor.com/api/tracker.html#Tracker-autorun), except that the autorun is
  automatically stopped when the View is destroyed, and the
  [current View](#Blaze-currentView) is always set when running `runFunc`.
  There is no relationship to the View's internal autorun or render
  cycle.  In `runFunc`, the View is bound to `this`.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>f</td>
    </tr><tr>
    <td>_inViewScope</td>
    </tr><tr>
    <td>displayName</td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+subscribe"></a>

#### view.subscribe(...args, [options]) ⇒ <code>SubscriptionHandle</code>
**Kind**: instance method of [<code>View</code>](#Blaze.View)  
**Summary**: Just like Blaze.View#autorun, but with Meteor.subscribe instead of
Tracker.autorun. Stop the subscription when the view is destroyed.  
**Returns**: <code>SubscriptionHandle</code> - A handle to the subscription so that you can
see if it is ready, or stop it manually  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>...args</td><td><code>*</code></td>
    </tr><tr>
    <td>[options]</td><td><code>object</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.View+firstNode"></a>

#### view.firstNode() ⇒ <code>\*</code>
The first node of the View's rendered content.  Note that this may
be a text node.  Requires that the View be rendered.
If the View rendered to zero DOM nodes, it may be a placeholder
node (comment or text node).  The DOM extent of a View consists
of the nodes between `view.firstNode()` and `view.lastNode()`,
inclusive.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<a name="Blaze.View+lastNode"></a>

#### view.lastNode() ⇒ <code>\*</code>
For Views created by invoking templates, the original Template
object.  For example, `Blaze.render(Template.foo).template === Template.foo`.

**Kind**: instance method of [<code>View</code>](#Blaze.View)  
<a name="Blaze.currentView"></a>

### Blaze.currentView : [<code>View</code>](#Blaze.View)
The View corresponding to the current template helper, event handler, callback, or autorun.  If there isn't one, `null`.
The "current view" is used by [`Template.currentData()`](../api/templates.html#Template-currentData) and
[`Template.instance()`](../api/templates.html#Template-instance) to determine
the contextually relevant data context and template instance.

**Kind**: static property of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<a name="Blaze._allowJavascriptUrls"></a>

### Blaze.\_allowJavascriptUrls()
Enable javascript: URLs in href and other URL attributes
WARNING: Only call this if you trust all URL sources in your application

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<a name="Blaze._javascriptUrlsAllowed"></a>

### Blaze.\_javascriptUrlsAllowed() ⇒ <code>boolean</code>
Check if javascript: URLs are currently allowed

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Returns**: <code>boolean</code> - True if javascript: URLs are permitted  
<a name="Blaze._clearProtocolCache"></a>

### Blaze.\_clearProtocolCache()
Clear the protocol cache.
Useful for testing or when URL resolution context changes.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<a name="Blaze._makeAttributeHandler"></a>

### Blaze.\_makeAttributeHandler(elem, name, value) ⇒ <code>AttributeHandler</code>
Attribute Handler Factory

This is the main factory function that determines which type of AttributeHandler
to use for a given element/attribute combination. It analyzes the element type
and attribute name to choose the most appropriate handler.

Handler Selection Logic:
1. Class attributes -> ClassHandler (or SVGClassHandler for SVG)
2. Style attributes -> StyleHandler  
3. Boolean attributes -> BooleanHandler
4. Form value attributes -> DOMPropertyHandler
5. XLink attributes -> XlinkHandler
6. URL attributes -> UrlHandler
7. Everything else -> basic AttributeHandler

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Returns**: <code>AttributeHandler</code> - Appropriate handler instance for this attribute  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>elem</td><td><code>Element</code></td><td><p>The DOM element that will have this attribute</p>
</td>
    </tr><tr>
    <td>name</td><td><code>string</code></td><td><p>The attribute name (e.g., &#39;class&#39;, &#39;href&#39;)</p>
</td>
    </tr><tr>
    <td>value</td><td><code>string</code> | <code>null</code></td><td><p>The initial attribute value</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.With"></a>

### Blaze.With(data, contentFunc)
Constructs a View that renders content with a data context.
Returns an unrendered View object you can pass to `Blaze.render`.

Unlike <code v-pre>{{#with}}</code> (as used in templates), `Blaze.With` has no "else" case, and
a falsy value for the data context will not prevent the content from
rendering.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>data</td><td><code>Object</code> | <code>function</code></td><td><p>An object to use as the data context, or a function returning such an object.  If a
  function is provided, it will be reactively re-run.</p>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze._attachBindingsToView"></a>

### Blaze.\_attachBindingsToView(bindings, view)
Attaches bindings to the instantiated view.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>bindings</td><td><code>Object</code></td><td><p>A dictionary of bindings, each binding name
corresponds to a value or a function that will be reactively re-run.</p>
</td>
    </tr><tr>
    <td>view</td><td><code><a href="#Blaze.View">View</a></code></td><td><p>The target.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.Let"></a>

### Blaze.Let(bindings, contentFunc)
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Summary**: Constructs a View setting the local lexical scope in the block.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>bindings</td><td><code>function</code></td><td><p>Dictionary mapping names of bindings to
values or computations to reactively re-run.</p>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.If"></a>

### Blaze.If(conditionFunc, contentFunc, [elseFunc])
Constructs a View that renders content conditionally.
Returns an unrendered View object you can pass to `Blaze.render`.
Matches the behavior of <code v-pre>{{#if}}</code> in templates.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>conditionFunc</td><td><code>function</code></td><td><p>A function to reactively re-run.  Whether the result is truthy or falsy determines
  whether <code>contentFunc</code> or <code>elseFunc</code> is shown.  An empty array is considered falsy.</p>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.</p>
</td>
    </tr><tr>
    <td>[elseFunc]</td><td><code>function</code></td><td><p>Optional.  A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.  If no
  <code>elseFunc</code> is supplied, no content is shown in the &quot;else&quot; case.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.Unless"></a>

### Blaze.Unless(conditionFunc, contentFunc, [elseFunc])
An inverted [`Blaze.If`](#Blaze-If).
Returns an unrendered View object you can pass to `Blaze.render`.
Matches the behavior of <code v-pre>{{#unless}}</code> in templates.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>conditionFunc</td><td><code>function</code></td><td><p>A function to reactively re-run.  If the result is falsy, <code>contentFunc</code> is shown,
  otherwise <code>elseFunc</code> is shown.  An empty array is considered falsy.</p>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.</p>
</td>
    </tr><tr>
    <td>[elseFunc]</td><td><code>function</code></td><td><p>Optional.  A Function that returns <a href="#Renderable-Content"><em>renderable content</em></a>.  If no
  <code>elseFunc</code> is supplied, no content is shown in the &quot;else&quot; case.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.Each"></a>

### Blaze.Each(argFunc, contentFunc, [elseFunc])
Constructs a View that renders `contentFunc` for each item in a sequence.
Returns an unrendered View object you can pass to `Blaze.render`.
Matches the behavior of <code v-pre>{{#each}}</code> in templates.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>argFunc</td><td><code>function</code></td><td><p>A function to reactively re-run. The function can
return one of two options:</p>
<ol>
<li><p>An object with two fields: &#39;_variable&#39; and &#39;_sequence&#39;. Each iterates over
  &#39;_sequence&#39;, it may be a Cursor, an array, null, or undefined. Inside the
  Each body you will be able to get the current item from the sequence using
  the name specified in the &#39;_variable&#39; field.</p>
</li>
<li><p>Just a sequence (Cursor, array, null, or undefined) not wrapped into an
  object. Inside the Each body, the current item will be set as the data
  context.</p>
</li>
</ol>
</td>
    </tr><tr>
    <td>contentFunc</td><td><code>function</code></td><td><p>A Function that returns  <a href="#Renderable-Content"><em>renderable
content</em></a>.</p>
</td>
    </tr><tr>
    <td>[elseFunc]</td><td><code>function</code></td><td><p>A Function that returns <a href="#Renderable-Content"><em>renderable
content</em></a> to display in the case when there are no items
in the sequence.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze._Await"></a>

### Blaze.\_Await(value) ⇒ [<code>View</code>](#Blaze.View)
Create a new `Blaze.Let` view that unwraps the given value.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>value</td><td><code>unknown</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.isTemplate"></a>

### Blaze.isTemplate(value)
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Summary**: Returns true if `value` is a template object like `Template.myTemplate`.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>value</td><td><code>Any</code></td><td><p>The value to test.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze._withCurrentView"></a>

### Blaze.\_withCurrentView(view, func) ⇒ <code>T</code>
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>view</td><td><code><a href="#Blaze.View">View</a></code></td>
    </tr><tr>
    <td>func</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Blaze.render"></a>

### Blaze.render(templateOrView, parentNode, [nextNode], [parentView])
Renders a template or View to DOM nodes and inserts it into the DOM, returning a rendered [View](#Blaze-View) which can be passed to [`Blaze.remove`](#Blaze-remove).

When you render a template, the callbacks added with
[`onCreated`](./templates#Template-onCreated) are invoked immediately, before evaluating
the content of the template.  The callbacks added with
[`onRendered`](../api/templates.html#Template-onRendered) are invoked after the View is rendered and
inserted into the DOM.

The rendered template
will update reactively in response to data changes until the View is
removed using [`Blaze.remove`](#Blaze-remove) or the View's
parent element is removed by Meteor or jQuery.

> If the View is removed by some other mechanism
besides Meteor or jQuery (which Meteor integrates with by default),
the View may continue to update indefinitely.  Most users will not need to
manually render templates and insert them into the DOM, but if you do,
be mindful to always call [`Blaze.remove`](#Blaze-remove) when the View is
no longer needed.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>templateOrView</td><td><code>Template</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>The template (e.g. <code>Template.myTemplate</code>) or View object to render.  If a template, a View object is <a href="#template_constructview">constructed</a>.  If a View, it must be an unrendered View, which becomes a rendered View and is returned.</p>
</td>
    </tr><tr>
    <td>parentNode</td><td><code>DOMNode</code></td><td><p>The node that will be the parent of the rendered template.  It must be an Element node.</p>
</td>
    </tr><tr>
    <td>[nextNode]</td><td><code>DOMNode</code></td><td><p>Optional. If provided, must be a child of <em>parentNode</em>; the template will be inserted before this node. If not provided, the template will be inserted as the last child of parentNode.</p>
</td>
    </tr><tr>
    <td>[parentView]</td><td><code><a href="#Blaze.View">View</a></code></td><td><p>Optional. If provided, it will be set as the rendered View&#39;s <a href="#view_parentview"><code>parentView</code></a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.renderWithData"></a>

### Blaze.renderWithData(templateOrView, data, parentNode, [nextNode], [parentView])
Renders a template or View to DOM nodes with a data context.  Otherwise identical to `Blaze.render`.
`Blaze.renderWithData(Template.myTemplate, data)` is essentially the same as
`Blaze.render(Blaze.With(data, function () { return Template.myTemplate; }))`.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>templateOrView</td><td><code>Template</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>The template (e.g. <code>Template.myTemplate</code>) or View object to render.</p>
</td>
    </tr><tr>
    <td>data</td><td><code>Object</code> | <code>function</code></td><td><p>The data context to use, or a function returning a data context.  If a function is provided, it will be reactively re-run.</p>
</td>
    </tr><tr>
    <td>parentNode</td><td><code>DOMNode</code></td><td><p>The node that will be the parent of the rendered template.  It must be an Element node.</p>
</td>
    </tr><tr>
    <td>[nextNode]</td><td><code>DOMNode</code></td><td><p>Optional. If provided, must be a child of <em>parentNode</em>; the template will be inserted before this node. If not provided, the template will be inserted as the last child of parentNode.</p>
</td>
    </tr><tr>
    <td>[parentView]</td><td><code><a href="#Blaze.View">View</a></code></td><td><p>Optional. If provided, it will be set as the rendered View&#39;s <a href="#view_parentview"><code>parentView</code></a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.remove"></a>

### Blaze.remove(renderedView)
Removes a rendered View from the DOM, stopping all reactive updates and event listeners on it. Also destroys the Blaze.Template instance associated with the view.


Use `Blaze.remove` to remove a template or View previously inserted with
`Blaze.render`, in such a way that any behaviors attached to the DOM by
Meteor are cleaned up.  The rendered template or View is now considered
["destroyed"](../api/templates.html#Template-onDestroyed), along with all nested templates and
Views.  In addition, any data assigned via
jQuery to the DOM nodes is removed, as if the nodes were passed to
jQuery's `$(...).remove()`.

As mentioned in [`Blaze.render`](#Blaze-render), it is important to "remove"
all content rendered via `Blaze.render` using `Blaze.remove`, unless the
parent node of `renderedView` is removed by a Meteor reactive
update or with jQuery.

`Blaze.remove` can be used even if the DOM nodes in question have already
been removed from the document, to tell Blaze to stop tracking and
updating these nodes.

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>renderedView</td><td><code><a href="#Blaze.View">View</a></code></td><td><p>The return value from <code>Blaze.render</code> or <code>Blaze.renderWithData</code>, or the <code>view</code> property of a Blaze.Template instance. Calling <code>Blaze.remove(Template.instance().view)</code> from within a template event handler will destroy the view as well as that template and trigger the template&#39;s <code>onDestroyed</code> handlers.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.toHTML"></a>

### Blaze.toHTML(templateOrView)
Renders a template or View to a string of HTML.
Rendering a template to HTML loses all fine-grained reactivity.  The
normal way to render a template is to either include it from another
template (<code v-pre>{{> myTemplate}}</code>) or render and insert it
programmatically using `Blaze.render`.  Only occasionally
is generating HTML useful.

Because `Blaze.toHTML` returns a string, it is not able to update the DOM
in response to reactive data changes.  Instead, any reactive data
changes will invalidate the current Computation if there is one
(for example, an autorun that is the caller of `Blaze.toHTML`).

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>templateOrView</td><td><code>Template</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>The template (e.g. <code>Template.myTemplate</code>) or View object from which to generate HTML.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.toHTMLWithData"></a>

### Blaze.toHTMLWithData(templateOrView, data)
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Summary**: Renders a template or View to HTML with a data context.  Otherwise identical to `Blaze.toHTML`.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>templateOrView</td><td><code>Template</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>The template (e.g. <code>Template.myTemplate</code>) or View object from which to generate HTML.</p>
</td>
    </tr><tr>
    <td>data</td><td><code>Object</code> | <code>function</code></td><td><p>The data context to use, or a function returning a data context.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.getData"></a>

### Blaze.getData([elementOrView])
**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Summary**: Returns the current data context, or the data context that was used when rendering a particular DOM element or View from a Meteor template.  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[elementOrView]</td><td><code>DOMElement</code> | <code><a href="#Blaze.View">View</a></code></td><td><p>Optional.  An element that was rendered by a Meteor, or a View.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Blaze.getView"></a>

### Blaze.getView([element])
Gets either the current View, or the View enclosing the given DOM element.
If you don't specify an `element`, there must be a current View or an
error will be thrown.  This is in contrast to
[`Blaze.currentView`](#Blaze-currentView).

**Kind**: static method of [<code>Blaze</code>](#Blaze)  
**Locus**: Client  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[element]</td><td><code>DOMElement</code></td><td><p>Optional.  If specified, the View enclosing <code>element</code> is returned.</p>
</td>
    </tr>  </tbody>
</table>

