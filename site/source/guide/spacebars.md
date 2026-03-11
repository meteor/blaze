# Templates

Blaze uses a Handlebars-inspired templating language for its HTML content, named **Spacebars**.
It's built on the concept of rendering a reactively changing *data context*.
Spacebars templates look like simple HTML with special "mustache" tags delimited by curly braces:
<code v-pre>{{ }}</code>.

As an example, consider the `Todos_item` template from the Todos example app:

```handlebars
<template name="Todos_item">
    <div class="list-item {{checkedClass todo}} {{editingClass editing}}">
        <label class="checkbox">
            <input type="checkbox" checked={{todo.checked}} name="checked">
            <span class="checkbox-custom"></code>
        </label>

        <input type="text" value="{{todo.text}}" placeholder="Task name">
        <a class="js-delete-item delete-item" href="#">
            <span class="icon-trash"></code>
        </a>
    </div>
</template>
```

This template expects to be rendered with an object with key `todo` as data context (
see [reusable components](./reusable-components) how to enforce that).
We access the properties of the `todo` using the mustache tag, such as <code v-pre>{{todo.text}}</code>.
The default behavior is to render that property as a string; however for some attributes (such as
<code v-pre>checked={{todo.checked}}</code>) it can be resolved as a boolean value.



Note that simple string interpolations like this will always escape any HTML for you, so you don't need to perform
safety checks for XSS.

Additionally, we can see an example of a *template helper* - <code v-pre>{{checkedClass todo}}</code> calls out to a
`checkedClass` helper defined in a separate JavaScript file. The HTML template and JavaScript file together define the
`Todos_item` component:

```js
Template.Todos_item.helpers({
    checkedClass(todo) {
        return todo.checked && 'checked';
    }
});
```

In the context of a Blaze helper, `this` is scoped to the current *data context* at the point the helper was used. This
can be hard to reason about, so it's often a good idea to instead pass the required data into the helper as an
argument (as we do here).

Apart from simple interpolation, mustache tags can be used for control flow in the template. For instance, in the
`Lists_show` template, we render a list of todos like this:

```handlebars
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

- The <code v-pre>{{#each .. in}}</code> block helper which repeats a block of HTML for each element in an array or
  cursor, or renders the contents of the <code v-pre>{{else}}</code> block if no items exist.
- The template inclusion tag, <code v-pre>{{> Todos_item (todoArgs todo)}}</code> which renders the `Todos_item`
  component with the data context returned from the `todosArg` helper.

You can read about the full syntax [in the Spacebars](../api/spacebars). In this section we'll attempt to cover
some of the important details beyond just the syntax.

## Data contexts and lookup

We've seen that <code v-pre>{{todo.title}}</code> accesses the `title` property of the `todo` item on the current
data context. Additionally, `..` accesses the parent data context (rarely a good idea), `list.todos.[0]` accesses the
first element of the `todos` array on `list`.

Note that Spacebars is very forgiving of `null` values. It will not complain if you try to access a property on a `null`
value (for instance `foo.bar` if `foo` is not defined), but instead simply treats it also as null. However, there are
exceptions to this - trying to call a `null` function, or doing the same *within* a helper will lead to exceptions.

## Calling helpers with arguments

You can provide arguments to a helper like `checkedClass` by simply placing the argument after the helper call, as in:
<code v-pre>{{checkedClass todo true 'checked'}}</code>. You can also provide a list of named keyword arguments to a
helper with <code v-pre>{{checkedClass todo noClass=true classname='checked'}}</code>. When you pass keyword
arguments, you need to read them off of the `hash` property of the final argument. Here's how it would look for the
example we just saw:

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

Note that using keyword arguments to helpers is a little awkward, so in general it's usually easier to avoid them. This
feature was included for historical reasons to match the way keyword arguments work in Handlebars.

You can also pass the output of a helper to a template inclusion or other helper. To do so, use parentheses to show
precedence:

```handlebars
{{> Todos_item (todoArgs todo)}}
```

Here the `todo` is passed as argument to the `todoArgs` helper, then the output is passed into the `Todos_item`
template.

## Template inclusion

You "include" a sub-component with the <code v-pre>{{> }}</code> syntax. By default, the sub-component will gain the
data context of the caller, although it's usually a good idea to be explicit. You can provide a single object which will
become the entire data context (as we did with the object returned by the `todoArgs` helper above), or provide a list of
keyword arguments which will be put together into one object, like so:

```handlebars
{{> subComponent arg1="value-of-arg1" arg2=helperThatReturnsValueOfArg2}}
```

In this case, the `subComponent` component can expect a data context of the form:

```js
{
    arg1: ...
,
    arg2: ...
}
```

## Attribute Helpers

We saw above that using a helper (or data context lookup) in the form <code v-pre>checked={{todo.checked}}</code>
will add the checked property to the HTML tag if `todo.checked` evaluates to true. Also, you can directly include an
object in the attribute list of an HTML element to set multiple attributes at once:

```handlebars
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

Although by default a mustache tag will escape HTML tags to
avoid [XSS](https://en.wikipedia.org/wiki/Cross-site_scripting), you can render raw HTML with the triple-mustache:
<code v-pre>{{{ }}}</code>.

```handlebars
{{{myHtml}}}
```

```js
Template.foo.helpers({
    myHtml() {
        return '<h1>This H1 will render</h1>';
    }
});
```

You should be extremely careful about doing this, and always ensure you aren't returning user-generated content (or
escape it if you do!) from such a helper.

## Block Helpers

A block helper, called with <code v-pre>{{# }}</code> is a helper that takes (and may render) a block of HTML. For
instance, we saw the <code v-pre>{{#each .. in}}</code> helper above which repeats a given block of HTML once per
item in a list. You can also use a template as a block helper, rendering its content via the `Template.contentBlock` and
`Template.elseBlock`. For instance, you could create your own <code v-pre>{{#if}}</code> helper with:

```handlebars

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

The <code v-pre>{{#if}}</code> and <code v-pre>{{#unless}}</code> helpers are fairly straightforward but
invaluable for controlling the control flow of a template. Both operate by evaluating and checking their single argument
for truthiness. In JS `null`, `undefined`, `0`, `''`, `NaN`, and `false` are considered "falsy", and all other values
are "truthy".

```handlebars
{{#if something}}
<p>It's true</p>
{{else}}
<p>It's false</p>
{{/if}}
```

```handlebars
{{#if condition1}}
<p>It's condition1 true</p>
{{else if condition2}}
<p>It's condition2 true</p>
{{else}}
<p>It's false</p>
{{/if}}
```

### Each-in

The <code v-pre>{{#each .. in}}</code> helper is a convenient way to step over a list while retaining the outer data
context.

```handlebars
{{#each todo in todos}}
{{#each tag in todo.tags}}
<!-- in here, both todo and tag are in scope -->
{{/each}}
{{/each}}
```

### Let

The <code v-pre>{{#let}}</code> helper is useful to capture the output of a helper or document subproperty within a
template. Think of it just like defining a variable using JavaScript `let`.

```handlebars
{{#let name=person.bio.firstName color=generateColor}}
<div>{{name}} gets a {{color}} card!</div>
{{/let}}
```

Note that `name` and `color` (and `todo` above) are only added to scope in the template; they *are not* added to the
data context. Specifically this means that inside helpers and event handlers, you cannot access them with `this.name` or
`this.color`. If you need to access them inside a helper, you should pass them in as an argument (like we do with
`(todoArgs todo)` above).

### Each and With

There are also two Spacebars built-in helpers, <code v-pre>{{#each}}</code>, and <code v-pre>{{#with}}</code>,
which we do not recommend using (see [prefer using each-in](../guide/reusable-components.html#Prefer-lt-￼16-gt)). These
block helpers change the data context within a template, which can be difficult to reason about.

Like <code v-pre>{{#each .. in}}</code>, <code v-pre>{{#each}}</code> iterates over an array or cursor, changing
the data context within its content block to be the item in the current iteration. <code v-pre>{{#with}}</code>
simply changes the data context inside itself to the provided object. In most cases it's better to use
<code v-pre>{{#each .. in}}</code> and <code v-pre>{{#let}}</code> instead, just like it's better to declare a
variable than use the JavaScript `with` keyword.

## Chaining of Block Helpers

You can chain block helpers:

```handlebars
{{#input isRadio}}
<input type="radio"/>
{{else input isCheckbox}}
<input type="checkbox"/>
{{else}}
<input type="text"/>
{{/foo}}
```

This is equivalent to:

```handlebars
{{#input isRadio}}
<input type="radio"/>
{{else}}
{{#input isCheckbox}}
<input type="checkbox"/>
{{else}}
<input type="text"/>
{{/input}}
{{/input}}
```

## Strictness

Spacebars has a very strict HTML parser. For instance, you can't self-close a `div` (`<div/>`) in Spacebars, and you
need to close some tags that a browser might not require you to (such as a `<p>` tag). Thankfully, the parser will warn
you when it can't understand your code with an exact line number for the error.

## Escaping

To insert literal curly braces: <code v-pre>{{ }}</code> and the like, add a pipe character, `|`, to the opening
braces:

```html
<!-- will render as <h1>All about {{</h1> -->
<h1>All about {{|</h1>

<!-- will render as <h1>All about {{{</h1> -->
<h1>All about {{{|</h1>
```
