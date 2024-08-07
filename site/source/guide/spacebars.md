---
title: Spacebars templates
description:
---

Spacebars is a handlebars-like templating language, built on the concept of rendering a reactively changing *data context*. Spacebars templates look like simple HTML with special "mustache" tags delimited by curly braces: `{% raw %}{{ }}{% endraw %}`.

As an example, consider the `Todos_item` template from the Todos example app:

```html
<template name="Todos_item">
  <div class="list-item {{checkedClass todo}} {{editingClass editing}}">
    <label class="checkbox">
      <input type="checkbox" checked={{todo.checked}} name="checked">
      <span class="checkbox-custom"></span>
    </label>

    <input type="text" value="{{todo.text}}" placeholder="Task name">
    <a class="js-delete-item delete-item" href="#">
      <span class="icon-trash"></span>
    </a>
  </div>
</template>
```

This template expects to be rendered with an object with key `todo` as data context (we'll see [below](../guide/reusable-components.html#Validate-data-context) how to enforce that). We access the properties of the `todo` using the mustache tag, such as `{% raw %}{{todo.text}}{% endraw %}`. The default behavior is to render that property as a string; however for some attributes (such as `checked={% raw %}{{todo.checked}}{% endraw %}`) it can be resolved as a boolean value.

Note that simple string interpolations like this will always escape any HTML for you, so you don't need to perform safety checks for XSS.

Additionally we can see an example of a *template helper*---`{% raw %}{{checkedClass todo}}{% endraw %}` calls out to a `checkedClass` helper defined in a separate JavaScript file. The HTML template and JavaScript file together define the `Todos_item` component:

```js
Template.Todos_item.helpers({
  checkedClass(todo) {
    return todo.checked && 'checked';
  }
});
```

In the context of a Blaze helper, `this` is scoped to the current *data context* at the point the helper was used. This can be hard to reason about, so it's often a good idea to instead pass the required data into the helper as an argument (as we do here).

Apart from simple interpolation, mustache tags can be used for control flow in the template. For instance, in the `Lists_show` template, we render a list of todos like this:

```html
  {{#each todo in todos}}
    {{> Todos_item (todoArgs todo)}}
  {{else}}
    <div class="wrapper-message">
      <div class="title-message">No tasks here</div>
      <div class="subtitle-message">Add new tasks using the field above</div>
    </div>
  {{/each}}
```

This snippet illustrates a few things:

 - The `{% raw %}{{#each .. in}}{% endraw %}` block helper which repeats a block of HTML for each element in an array or cursor, or renders the contents of the `{% raw %}{{else}}{% endraw %}` block if no items exist.
 - The template inclusion tag, `{% raw %}{{> Todos_item (todoArgs todo)}}{% endraw %}` which renders the `Todos_item` component with the data context returned from the `todosArg` helper.

You can read about the full syntax [in the Spacebars](../api/spacebars.html). In this section we'll attempt to cover some of the important details beyond just the syntax.

## Data contexts and lookup

We've seen that `{% raw %}{{todo.title}}{% endraw %}` accesses the `title` property of the `todo` item on the current data context. Additionally, `..` accesses the parent data context (rarely a good idea), `list.todos.[0]` accesses the first element of the `todos` array on `list`.

Note that Spacebars is very forgiving of `null` values. It will not complain if you try to access a property on a `null` value (for instance `foo.bar` if `foo` is not defined), but instead simply treats it also as null. However there are exceptions to this---trying to call a `null` function, or doing the same *within* a helper will lead to exceptions.

## Calling helpers with arguments

You can provide arguments to a helper like `checkedClass` by simply placing the argument after the helper call, as in: `{% raw %}{{checkedClass todo true 'checked'}}{% endraw %}`. You can also provide a list of named keyword arguments to a helper with `{% raw %}{{checkedClass todo noClass=true classname='checked'}}{% endraw %}`. When you pass keyword arguments, you need to read them off of the `hash` property of the final argument. Here's how it would look for the example we just saw:

```js
Template.Todos_item.helpers({
  checkedClass(todo, options) {
    const classname = options.hash.classname || 'checked';
    if (todo.checked) {
      return classname;
    } else if (options.hash.noClass) {
      return `no-${classname}`;
    }
  }
});
```

Note that using keyword arguments to helpers is a little awkward, so in general it's usually easier to avoid them. This feature was included for historical reasons to match the way keyword arguments work in Handlebars.

You can also pass the output of a helper to a template inclusion or other helper. To do so, use parentheses to show precedence:

```html
{{> Todos_item (todoArgs todo)}}
```

Here the `todo` is passed as argument to the `todoArgs` helper, then the output is passed into the `Todos_item` template.

## Template inclusion

You "include" a sub-component with the `{% raw %}{{> }}{% endraw %}` syntax. By default, the sub-component will gain the data context of the caller, although it's usually a good idea to be explicit. You can provide a single object which will become the entire data context (as we did with the object returned by the `todoArgs` helper above), or provide a list of keyword arguments which will be put together into one object, like so:

```html
{{> subComponent arg1="value-of-arg1" arg2=helperThatReturnsValueOfArg2}}
```

In this case, the `subComponent` component can expect a data context of the form:

```js
{
  arg1: ...,
  arg2: ...
}
```

## Attribute Helpers

We saw above that using a helper (or data context lookup) in the form `checked={% raw %}{{todo.checked}}{% endraw %}` will add the checked property to the HTML tag if `todo.checked` evaluates to true. Also, you can directly include an object in the attribute list of an HTML element to set multiple attributes at once:

```html
<a {{attributes}}>My Link</a>
```

```js
Template.foo.helpers({
  attributes() {
    return {
      class: 'A class',
      style: {background: 'blue'}
    };
  }
});
```

## Rendering raw HTML

Although by default a mustache tag will escape HTML tags to avoid [XSS](https://en.wikipedia.org/wiki/Cross-site_scripting), you can render raw HTML with the triple-mustache: `{% raw %}{{{ }}}{% endraw %}`.

```html
{{{myHtml}}}
```

```js
Template.foo.helpers({
  myHtml() {
    return '<h1>This H1 will render</h1>';
  }
});
```

You should be extremely careful about doing this, and always ensure you aren't returning user-generated content (or escape it if you do!) from such a helper.

## Block Helpers

A block helper, called with `{% raw %}{{# }}{% endraw %}` is a helper that takes (and may render) a block of HTML. For instance, we saw the `{% raw %}{{#each .. in}}{% endraw %}` helper above which repeats a given block of HTML once per item in a list. You can also use a template as a block helper, rendering its content via the `Template.contentBlock` and `Template.elseBlock`. For instance, you could create your own `{% raw %}{{#if}}{% endraw %}` helper with:

```html
<template name="myIf">
  {{#if condition}}
    {{> Template.contentBlock}}
  {{else}}
    {{> Template.elseBlock}}
  {{/if}}
</template>

<template name="caller">
  {{#myIf condition=true}}
    <h1>I'll be rendered!</h1>
  {{else}}
    <h1>I won't be rendered</h1>
  {{/myIf}}
</template>
```

## Built-in Block Helpers

There are a few built-in block helpers that are worth knowing about:

### If / Unless

The `{% raw %}{{#if}}{% endraw %}` and `{% raw %}{{#unless}}{% endraw %}` helpers are fairly straightforward but invaluable for controlling the control flow of a template. Both operate by evaluating and checking their single argument for truthiness. In JS `null`, `undefined`, `0`, `''`, `NaN`, and `false` are considered "falsy", and all other values are "truthy".

```html
{{#if something}}
  <p>It's true</p>
{{else}}
  <p>It's false</p>
{{/if}}
```

```html
{{#if condition1}}
  <p>It's condition1 true</p>
{{else if condition2}}
  <p>It's condition2 true</p>
{{else}}
  <p>It's false</p>
{{/if}}
```

### Each-in

The `{% raw %}{{#each .. in}}{% endraw %}` helper is a convenient way to step over a list while retaining the outer data context.

```html
{{#each todo in todos}}
  {{#each tag in todo.tags}}
    <!-- in here, both todo and tag are in scope -->
  {{/each}}
{{/each}}
```

### Let

The `{% raw %}{{#let}}{% endraw %}` helper is useful to capture the output of a helper or document subproperty within a template. Think of it just like defining a variable using JavaScript `let`.

```html
{{#let name=person.bio.firstName color=generateColor}}
  <div>{{name}} gets a {{color}} card!</div>
{{/let}}
```

Note that `name` and `color` (and `todo` above) are only added to scope in the template; they *are not* added to the data context. Specifically this means that inside helpers and event handlers, you cannot access them with `this.name` or `this.color`. If you need to access them inside a helper, you should pass them in as an argument (like we do with `(todoArgs todo)` above).

### Each and With

There are also two Spacebars built-in helpers, `{% raw %}{{#each}}{% endraw %}`, and `{% raw %}{{#with}}{% endraw %}`, which we do not recommend using (see [prefer using each-in](../guide/reusable-components.html#Prefer-lt-￼16-gt)). These block helpers change the data context within a template, which can be difficult to reason about.

Like `{% raw %}{{#each .. in}}{% endraw %}`, `{% raw %}{{#each}}{% endraw %}` iterates over an array or cursor, changing the data context within its content block to be the item in the current iteration. `{% raw %}{{#with}}{% endraw %}` simply changes the data context inside itself to the provided object. In most cases it's better to use `{% raw %}{{#each .. in}}{% endraw %}` and `{% raw %}{{#let}}{% endraw %}` instead, just like it's better to declare a variable than use the JavaScript `with` keyword.

## Chaining of Block Helpers
 
You can chain block helpers:

```html
{{#input isRadio}}
  <input type="radio" />
{{else input isCheckbox}}
  <input type="checkbox" />
{{else}}
  <input type="text" />
{{/foo}}
```

This is equivalent to:

```html
{{#input isRadio}}
  <input type="radio" />
{{else}}
  {{#input isCheckbox}}
    <input type="checkbox" />
  {{else}}
    <input type="text" />
  {{/input}}
{{/input}}
```

## Strictness

Spacebars has a very strict HTML parser. For instance, you can't self-close a `div` (`<div/>`) in Spacebars, and you need to close some tags that a browser might not require you to (such as a `<p>` tag). Thankfully, the parser will warn you when it can't understand your code with an exact line number for the error.

## Escaping

To insert literal curly braces: `{% raw %}{{ }}{% endraw %}` and the like, add a pipe character, `|`, to the opening braces:

```
<!-- will render as <h1>All about {{</h1> -->
<h1>All about {{|</h1>

<!-- will render as <h1>All about {{{</h1> -->
<h1>All about {{{|</h1>
```
