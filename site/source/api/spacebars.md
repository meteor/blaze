<a name="Spacebars"></a>

## Spacebars : <code>Object</code>
This is the Spacebars runtime API which should not be confused with
the Spacebars compiler.

**Kind**: global variable  

* [Spacebars](#Spacebars) : <code>Object</code>
    * [.SafeString](#Spacebars.SafeString)
        * [new Spacebars.SafeString(html)](#new_Spacebars.SafeString_new)
    * [.With](#Spacebars.With)
        * [new Spacebars.With(argFunc, contentFunc, elseFunc)](#new_Spacebars.With_new)
    * [.include(templateOrFunction, contentFunc, [elseFunc])](#Spacebars.include) ⇒ <code>Blaze.View</code> \| <code>null</code>
    * [.mustacheImpl(args)](#Spacebars.mustacheImpl) ⇒ <code>Promise.&lt;\*&gt;</code> \| <code>\*</code>
    * [.mustache(args)](#Spacebars.mustache) ⇒ <code>null</code> \| <code>string</code> \| <code>\*</code> \| <code>Raw</code>
    * [.attrMustache(args)](#Spacebars.attrMustache) ⇒ <code>Object</code> \| <code>Promise.&lt;\*&gt;</code> \| <code>\*</code> \| <code>null</code>
    * [.dataMustache(args)](#Spacebars.dataMustache) ⇒ <code>Promise.&lt;\*&gt;</code> \| <code>\*</code>
    * [.makeRaw(value)](#Spacebars.makeRaw) ⇒ <code>HTML.Raw</code> \| <code>Raw</code> \| <code>null</code>
    * [.call(args)](#Spacebars.call) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
    * [.kw(hash)](#Spacebars.kw) ⇒ [<code>kw</code>](#Spacebars.kw) \| <code>\*</code>
    * [.dot(args)](#Spacebars.dot) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>

<a name="Spacebars.SafeString"></a>

### Spacebars.SafeString
**Kind**: static class of [<code>Spacebars</code>](#Spacebars)  
<a name="new_Spacebars.SafeString_new"></a>

#### new Spacebars.SafeString(html)
Call this as `Spacebars.SafeString("some HTML")`.  The return value
is `instanceof Spacebars.SafeString` (and `instanceof Handlebars.SafeString).


| Param |
| --- |
| html | 

<a name="Spacebars.With"></a>

### Spacebars.With
**Kind**: static class of [<code>Spacebars</code>](#Spacebars)  
<a name="new_Spacebars.With_new"></a>

#### new Spacebars.With(argFunc, contentFunc, elseFunc)
Spacebars.With implements the conditional logic of rendering
the <code v-pre>{{else}}</code> block if the argument is falsy.  It combines
a Blaze.If with a Blaze.With (the latter only in the truthy
case, since the else block is evaluated without entering
a new data context).


| Param |
| --- |
| argFunc | 
| contentFunc | 
| elseFunc | 

<a name="Spacebars.include"></a>

### Spacebars.include(templateOrFunction, contentFunc, [elseFunc]) ⇒ <code>Blaze.View</code> \| <code>null</code>
TODO: needs explanation

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param | Type |
| --- | --- |
| templateOrFunction | <code>Template</code> \| <code>function</code> | 
| contentFunc | <code>function</code> | 
| [elseFunc] | <code>function</code> | 

<a name="Spacebars.mustacheImpl"></a>

### Spacebars.mustacheImpl(args) ⇒ <code>Promise.&lt;\*&gt;</code> \| <code>\*</code>
Executes <code v-pre>{{foo bar baz}}</code> when called on `(foo, bar, baz)`.
If `bar` and `baz` are functions, they are called before
`foo` is called on them.

This is the shared part of Spacebars.mustache and
Spacebars.attrMustache, which differ in how they post-process the
result.

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.mustache"></a>

### Spacebars.mustache(args) ⇒ <code>null</code> \| <code>string</code> \| <code>\*</code> \| <code>Raw</code>
TODO: needs explanation

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.attrMustache"></a>

### Spacebars.attrMustache(args) ⇒ <code>Object</code> \| <code>Promise.&lt;\*&gt;</code> \| <code>\*</code> \| <code>null</code>
TODO: needs explanation

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.dataMustache"></a>

### Spacebars.dataMustache(args) ⇒ <code>Promise.&lt;\*&gt;</code> \| <code>\*</code>
**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.makeRaw"></a>

### Spacebars.makeRaw(value) ⇒ <code>HTML.Raw</code> \| <code>Raw</code> \| <code>null</code>
Idempotently wrap in `HTML.Raw`.
Called on the return value from `Spacebars.mustache` in case the
template uses triple-stache (<code v-pre>{{{foo bar baz}}}</code>).

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| value | 

<a name="Spacebars.call"></a>

### Spacebars.call(args) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
If `value` is a function, evaluate its `args` (by calling them, if they
are functions), and then call it on them. Otherwise, return `value`.

If any of the arguments is a `Promise` or a function returning one, then the
`value` will be called once all the arguments resolve. If any of them
rejects, so will the call.

If `value` is not a function and is not null, then this method will assert
that there are no args. We check for null before asserting because a user
may write a template like <code v-pre>{{user.fullNameWithPrefix 'Mr.'}}</code>, where the
function will be null until data is ready.

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.kw"></a>

### Spacebars.kw(hash) ⇒ [<code>kw</code>](#Spacebars.kw) \| <code>\*</code>
Call this as `Spacebars.kw({ ... })`.  The return value
is `instanceof Spacebars.kw`.

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| hash | 

<a name="Spacebars.dot"></a>

### Spacebars.dot(args) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
`Spacebars.dot(foo, "bar", "baz")` performs a special kind
of `foo.bar.baz` that allows safe indexing of `null` and
indexing of functions (which calls the function).  If the
result is a function, it is always a bound function (e.g.
a wrapped version of `baz` that always uses `foo.bar` as
`this`).

If any of the intermediate values is a `Promise`, the result will be one as
well, i.e., accessing a field of a `Promise` results in a `Promise` of the
accessed field. Rejections are passed-through.

In `Spacebars.dot(foo, "bar")`, `foo` is assumed to be either
a non-function value or a "fully-bound" function wrapping a value,
where fully-bound means it takes no arguments and ignores `this`.

`Spacebars.dot(foo, "bar")` performs the following steps:

* If `foo` is falsy, return `foo`.

* If `foo` is a function, call it (set `foo` to `foo()`).

* If `foo` is falsy now, return `foo`.

* Return `foo.bar`, binding it to `foo` if it's a function.

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars"></a>

## Spacebars : <code>object</code>
**Kind**: global namespace  

* [Spacebars](#Spacebars) : <code>object</code>
    * [.SafeString](#Spacebars.SafeString)
        * [new Spacebars.SafeString(html)](#new_Spacebars.SafeString_new)
    * [.With](#Spacebars.With)
        * [new Spacebars.With(argFunc, contentFunc, elseFunc)](#new_Spacebars.With_new)
    * [.include(templateOrFunction, contentFunc, [elseFunc])](#Spacebars.include) ⇒ <code>Blaze.View</code> \| <code>null</code>
    * [.mustacheImpl(args)](#Spacebars.mustacheImpl) ⇒ <code>Promise.&lt;\*&gt;</code> \| <code>\*</code>
    * [.mustache(args)](#Spacebars.mustache) ⇒ <code>null</code> \| <code>string</code> \| <code>\*</code> \| <code>Raw</code>
    * [.attrMustache(args)](#Spacebars.attrMustache) ⇒ <code>Object</code> \| <code>Promise.&lt;\*&gt;</code> \| <code>\*</code> \| <code>null</code>
    * [.dataMustache(args)](#Spacebars.dataMustache) ⇒ <code>Promise.&lt;\*&gt;</code> \| <code>\*</code>
    * [.makeRaw(value)](#Spacebars.makeRaw) ⇒ <code>HTML.Raw</code> \| <code>Raw</code> \| <code>null</code>
    * [.call(args)](#Spacebars.call) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
    * [.kw(hash)](#Spacebars.kw) ⇒ [<code>kw</code>](#Spacebars.kw) \| <code>\*</code>
    * [.dot(args)](#Spacebars.dot) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>

<a name="Spacebars.SafeString"></a>

### Spacebars.SafeString
**Kind**: static class of [<code>Spacebars</code>](#Spacebars)  
<a name="new_Spacebars.SafeString_new"></a>

#### new Spacebars.SafeString(html)
Call this as `Spacebars.SafeString("some HTML")`.  The return value
is `instanceof Spacebars.SafeString` (and `instanceof Handlebars.SafeString).


| Param |
| --- |
| html | 

<a name="Spacebars.With"></a>

### Spacebars.With
**Kind**: static class of [<code>Spacebars</code>](#Spacebars)  
<a name="new_Spacebars.With_new"></a>

#### new Spacebars.With(argFunc, contentFunc, elseFunc)
Spacebars.With implements the conditional logic of rendering
the <code v-pre>{{else}}</code> block if the argument is falsy.  It combines
a Blaze.If with a Blaze.With (the latter only in the truthy
case, since the else block is evaluated without entering
a new data context).


| Param |
| --- |
| argFunc | 
| contentFunc | 
| elseFunc | 

<a name="Spacebars.include"></a>

### Spacebars.include(templateOrFunction, contentFunc, [elseFunc]) ⇒ <code>Blaze.View</code> \| <code>null</code>
TODO: needs explanation

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param | Type |
| --- | --- |
| templateOrFunction | <code>Template</code> \| <code>function</code> | 
| contentFunc | <code>function</code> | 
| [elseFunc] | <code>function</code> | 

<a name="Spacebars.mustacheImpl"></a>

### Spacebars.mustacheImpl(args) ⇒ <code>Promise.&lt;\*&gt;</code> \| <code>\*</code>
Executes <code v-pre>{{foo bar baz}}</code> when called on `(foo, bar, baz)`.
If `bar` and `baz` are functions, they are called before
`foo` is called on them.

This is the shared part of Spacebars.mustache and
Spacebars.attrMustache, which differ in how they post-process the
result.

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.mustache"></a>

### Spacebars.mustache(args) ⇒ <code>null</code> \| <code>string</code> \| <code>\*</code> \| <code>Raw</code>
TODO: needs explanation

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.attrMustache"></a>

### Spacebars.attrMustache(args) ⇒ <code>Object</code> \| <code>Promise.&lt;\*&gt;</code> \| <code>\*</code> \| <code>null</code>
TODO: needs explanation

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.dataMustache"></a>

### Spacebars.dataMustache(args) ⇒ <code>Promise.&lt;\*&gt;</code> \| <code>\*</code>
**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.makeRaw"></a>

### Spacebars.makeRaw(value) ⇒ <code>HTML.Raw</code> \| <code>Raw</code> \| <code>null</code>
Idempotently wrap in `HTML.Raw`.
Called on the return value from `Spacebars.mustache` in case the
template uses triple-stache (<code v-pre>{{{foo bar baz}}}</code>).

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| value | 

<a name="Spacebars.call"></a>

### Spacebars.call(args) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
If `value` is a function, evaluate its `args` (by calling them, if they
are functions), and then call it on them. Otherwise, return `value`.

If any of the arguments is a `Promise` or a function returning one, then the
`value` will be called once all the arguments resolve. If any of them
rejects, so will the call.

If `value` is not a function and is not null, then this method will assert
that there are no args. We check for null before asserting because a user
may write a template like <code v-pre>{{user.fullNameWithPrefix 'Mr.'}}</code>, where the
function will be null until data is ready.

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

<a name="Spacebars.kw"></a>

### Spacebars.kw(hash) ⇒ [<code>kw</code>](#Spacebars.kw) \| <code>\*</code>
Call this as `Spacebars.kw({ ... })`.  The return value
is `instanceof Spacebars.kw`.

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| hash | 

<a name="Spacebars.dot"></a>

### Spacebars.dot(args) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
`Spacebars.dot(foo, "bar", "baz")` performs a special kind
of `foo.bar.baz` that allows safe indexing of `null` and
indexing of functions (which calls the function).  If the
result is a function, it is always a bound function (e.g.
a wrapped version of `baz` that always uses `foo.bar` as
`this`).

If any of the intermediate values is a `Promise`, the result will be one as
well, i.e., accessing a field of a `Promise` results in a `Promise` of the
accessed field. Rejections are passed-through.

In `Spacebars.dot(foo, "bar")`, `foo` is assumed to be either
a non-function value or a "fully-bound" function wrapping a value,
where fully-bound means it takes no arguments and ignores `this`.

`Spacebars.dot(foo, "bar")` performs the following steps:

* If `foo` is falsy, return `foo`.

* If `foo` is a function, call it (set `foo` to `foo()`).

* If `foo` is falsy now, return `foo`.

* Return `foo.bar`, binding it to `foo` if it's a function.

**Kind**: static method of [<code>Spacebars</code>](#Spacebars)  

| Param |
| --- |
| args | 

