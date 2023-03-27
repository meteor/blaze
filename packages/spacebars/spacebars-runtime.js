Spacebars = {};

var tripleEquals = function (a, b) { return a === b; };

Spacebars.include = function (templateOrFunction, contentFunc, elseFunc) {
  if (! templateOrFunction)
    return null;

  if (typeof templateOrFunction !== 'function') {
    var template = templateOrFunction;
    if (! Blaze.isTemplate(template))
      throw new Error("Expected template or null, found: " + template);
    var view = templateOrFunction.constructView(contentFunc, elseFunc);
    view.__startsNewLexicalScope = true;
    return view;
  }

  var templateVar = Blaze.ReactiveVar(null, tripleEquals);
  var view = Blaze.View('Spacebars.include', function () {
    var template = templateVar.get();
    if (template === null)
      return null;

    if (! Blaze.isTemplate(template))
      throw new Error("Expected template or null, found: " + template);

    return template.constructView(contentFunc, elseFunc);
  });
  view.__templateVar = templateVar;
  view.onViewCreated(function () {
    this.autorun(function () {
      templateVar.set(templateOrFunction());
    });
  });
  view.__startsNewLexicalScope = true;

  return view;
};

/**
 * Executes `{{foo bar baz}}` when called on `(foo, bar, baz)`.
 * If `bar` and `baz` are functions, they are called before
 * `foo` is called on them.
 *
 * This is the shared part of Spacebars.mustache and
 * Spacebars.attrMustache, which differ in how they post-process the
 * result.
 *
 * AYSYNC-ACTION: We also might have to take into account that either of the functions might return a promise, so in that
 * case we'd have to await the results, return nothing / an intermediate value until we got the final results, then invalidate the
 * current view once we are sure that we have collected and awaited all the data.
 *
 * @param value         - a thing which should be or provide some content
 * @param ...args       - additional arguments to be used as params for the call to value() if there are any. *
 *
 * @returns {null|string|Raw|Promise}   - can return either stuff / string-ish things or a promise for that stuff. */
Spacebars.mustacheImpl = function (value/*, args*/) {

  var args = arguments;
  // if we have any arguments (pos or kw), add an options argument
  // if there isn't one.
  if (args.length > 1) {
    var kw = args[args.length - 1];
    if (! (kw instanceof Spacebars.kw)) {
      kw = Spacebars.kw();
      // clone arguments into an actual array, then push
      // the empty kw object.
      args = Array.prototype.slice.call(arguments);
      args.push(kw);
    } else {
      // For each keyword arg, call it if it's a function
      var newHash = {};
      for (var k in kw.hash) {
        var v = kw.hash[k];
        newHash[k] = (typeof v === 'function' ? v() : v);
      }
      args[args.length - 1] = Spacebars.kw(newHash);
    }
  }

  return Spacebars.call.apply(null, args);
};

/**
 * Executes `{{foo bar baz}}` when called on `(foo, bar, baz)`.
 * If `bar` and `baz` are functions, they are called before
 * `foo` is called on them.
 *
 * Most of the lookup work is done in the Spacebars.mustacheImpl function above.
 *
 * @param value         - a thing which should be or provide some content
 * @param ...args       - additional arguments to be used as params for the call to value() if there are any.
 *
 * @returns {null|string|Raw|Promise}   - can return either stuff / string-ish things or a promise for that stuff.
 */
Spacebars.mustache = function (value/*, args*/) {
  var result = Spacebars.mustacheImpl.apply(null, arguments);

  /**
   * We can just pass promises through (I think?)
   *
   * NO: Actually we have to treat them similarly to what this funky func did before!
   *
   * But yeah, basically... :D
   */



  if (result instanceof Promise) {
    return result
  }

  if (result instanceof Spacebars.SafeString) {
    return HTML.Raw(result.toString());
  }

  // map `null`, `undefined`, and `false` to null, which is important
  // so that attributes with nully values are considered absent.
  // stringify anything else (e.g. strings, booleans, numbers including 0).
  return (result == null || result === false) ? null : String(result);
};

Spacebars.attrMustache = function (value/*, args*/) {
  var result = Spacebars.mustacheImpl.apply(null, arguments);

  if (result == null || result === '') {
    return null;
  } else if (typeof result === 'object') {
    return result;
  } else if (typeof result === 'string' && HTML.isValidAttributeName(result)) {
    var obj = {};
    obj[result] = '';
    return obj;
  } else {
    throw new Error("Expected valid attribute name, '', null, or object");
  }
};

Spacebars.dataMustache = function (value/*, args*/) {
  var result = Spacebars.mustacheImpl.apply(null, arguments);

  return result;
};

// Idempotently wrap in `HTML.Raw`.
//
// Called on the return value from `Spacebars.mustache` in case the
// template uses triple-stache (`{{{foo bar baz}}}`).
Spacebars.makeRaw = function (value) {
  if (value == null) // null or undefined
    return null;
  else if (value instanceof HTML.Raw)
    return value;
  else
    return HTML.Raw(value);
};

/**
 * If `value` is a function, evaluate its `args` (by calling them, if they
 * are functions), and then call it on them. Otherwise, return `value`.
 *
 * If the functions return promises, we'll return a promise for the result.
 *
 * If `value` is not a function and is not null, then this method will assert
 * that there are no args. We check for null before asserting because a user
 * may write a template like {{user.fullNameWithPrefix 'Mr.'}}, where the
 * function will be null until data is ready.
 *
 * @param value         - a thing which should be or provide some content
 * @param ...args       - additional arguments to be used as params for the call to value() if there are any.
 *
 * @returns {null|string|Raw|Promise}   - can return either stuff / string-ish things or a promise for that stuff.
 */
Spacebars.call = function (value/*, args*/) {
  const promises = []

  if (typeof value === 'function') {
    // We gotta wait for the promises of the params first if there are any async funcs in there.

    // Evaluate arguments by calling them if they are functions.
    var newArgs = [];
    for (var i = 1; i < arguments.length; i++) {
      var arg = arguments[i];
      newArgs[i-1] = (typeof arg === 'function' ? arg() : arg);
    }

    return value.apply(null, newArgs);
  } else {
    if (value != null && arguments.length > 1) {
      throw new Error("Can't call non-function: " + value);
    }
    return value;
  }
};

// Call this as `Spacebars.kw({ ... })`.  The return value
// is `instanceof Spacebars.kw`.
Spacebars.kw = function (hash) {
  if (! (this instanceof Spacebars.kw))
    // called without new; call with new
    return new Spacebars.kw(hash);

  this.hash = hash || {};
};

// Call this as `Spacebars.SafeString("some HTML")`.  The return value
// is `instanceof Spacebars.SafeString` (and `instanceof Handlebars.SafeString).
Spacebars.SafeString = function (html) {
  if (! (this instanceof Spacebars.SafeString))
    // called without new; call with new
    return new Spacebars.SafeString(html);

  return new Handlebars.SafeString(html);
};
Spacebars.SafeString.prototype = Handlebars.SafeString.prototype;

/**
 * This is the new "async reporting" variant of Spacebars.dot, which is basically now called immediately from the
 * Spacebars.dot function in order to keep the old interface as it was while now adding a new parameter to the front to
 * a) being able to move forward the info that an async wait had to happen until the end result was found and
 * b) to be able to rewrite the existing function with a new implementation from scratch so I can understand what's
 *    going on & add waits for promises while we're at it.
 *
 * @returns {null|string|Raw|Promise}   - can return either stuff / string-ish things or a promise for that stuff.
 *
 * @param hadToWaitForPromiseYet      - whether we had a promise wait in the call chain so far.
 * @param currentObject                      - the current object we're probing for the next property
 * @param ...steps                    - the dotted path elements like in cupboard4.drawer1a.subsection4.secretPentagonPapers,
 *                                      but split into separate strings as sequential parameters, eg.
 *                                      "cupboard4", "drawer1a", "subsection4", "secretPentagonPapers"
 *
 * @returns {null|string|Raw|Promise}   - can return either stuff / string-ish things by themselves or a promise for the same stuff.
 */
Spacebars._asyncDot = function (currentView = undefined, hadToWaitForPromiseYet = false, currentObject, ...steps) {
  // We want to store this in case of our async functions having to access the view going forward.
  if (!currentView) {
    currentView = Blaze.currentView
  }

  /**
   * We'll follow a new strategy because my mind was broken by doing it in any other way...
   * Maybe I shouldn't work so late anymore trying to beat this thing into submission :D
   *
   * The new strategy:
   * - Whenever we reach a new stage of information for "object", we immediately recursively call us again for the next step.
   *   Because I am sick of checking for a function which returns another function maybe which returns a promise which returns
   *   another function... how many *&)@% times should I check whether we're taking care of a function here? :D
   *
   *   So let's do it like this & let the computer do the work.
   */

  // ~smash~ I mean call functions
  if ('function' === typeof currentObject) {
    currentObject = currentObject()
    return Spacebars._asyncDot(currentView, hadToWaitForPromiseYet, currentObject, ...steps)
  }

  /**
   * If we receive a promise from one of the sub-evaluation-calls, we'll return a new promise ourselves which will complete once the sub-call has been completed (?)
   * -> Or could we just pass these promises through? No, I think we'll have to wait for them in turn in order to wait until we're finished with all promises...?
   */
  if (currentObject instanceof Promise) {
    // return promise & BAIL.
    return new Promise((resolve, reject) => {
      currentObject.then((newCurrentObject) => {
        // let's set hadToWaitForPromiseYet to true & continue with processing the paths with this cool recursive function of ours.
        resolve (Spacebars._asyncDot(currentView, true, newCurrentObject, ...steps))
      })
    })
  }

  // now we're at the steps resolution page...
  if (steps.length) {
    currentObject = currentObject && currentObject[steps[0]]

    // lose first step of the steps array, it has been handled now
    steps.shift()
    // continue drilling.down.the.path
    return Spacebars._asyncDot(currentView, hadToWaitForPromiseYet, currentObject, ...steps)
  }

  // If we only got a value thing at the end, we'll can return that finally! :D
  return currentObject
}

// `Spacebars.dot(foo, "bar", "baz")` performs a special kind
// of `foo.bar.baz` that allows safe indexing of `null` and
// indexing of functions (which calls the function).  If the
// result is a function, it is always a bound function (e.g.
// a wrapped version of `baz` that always uses `foo.bar` as
// `this`).
//
// In `Spacebars.dot(foo, "bar")`, `foo` is assumed to be either
// a non-function value or a "fully-bound" function wrapping a value,
// where fully-bound means it takes no arguments and ignores `this`.
//
// `Spacebars.dot(foo, "bar")` performs the following steps:
//
// * If `foo` is falsy, return `foo`.
//
// * If `foo` is a function, call it (set `foo` to `foo()`).
//
// * If `foo` is falsy now, return `foo`.
//
// NEW/WIP: If any stage of the lookup returns a promise, we'll return a promise for the entire
//  call & /resolve it once _all promises_ occurring through the entire chain will have resolved.
//
// * Return `foo.bar`, binding it to `foo` if it's a function.
Spacebars.dot = function (object, ...steps) {
  return Spacebars._asyncDot(undefined, false, object, ...steps)
};

// Spacebars.With implements the conditional logic of rendering
// the `{{else}}` block if the argument is falsy.  It combines
// a Blaze.If with a Blaze.With (the latter only in the truthy
// case, since the else block is evaluated without entering
// a new data context).
Spacebars.With = function (argFunc, contentFunc, elseFunc) {
  var argVar = new Blaze.ReactiveVar;
  var view = Blaze.View('Spacebars_with', function () {
    return Blaze.If(function () { return argVar.get(); },
                    function () { return Blaze.With(function () {
                      return argVar.get(); }, contentFunc); },
                    elseFunc);
  });
  view.onViewCreated(function () {
    this.autorun(function () {
      argVar.set(argFunc());

      // This is a hack so that autoruns inside the body
      // of the #with get stopped sooner.  It reaches inside
      // our ReactiveVar to access its dep.

      Tracker.onInvalidate(function () {
        argVar.dep.changed();
      });

      // Take the case of `{{#with A}}{{B}}{{/with}}`.  The goal
      // is to not re-render `B` if `A` changes to become falsy
      // and `B` is simultaneously invalidated.
      //
      // A series of autoruns are involved:
      //
      // 1. This autorun (argument to Spacebars.With)
      // 2. Argument to Blaze.If
      // 3. Blaze.If view re-render
      // 4. Argument to Blaze.With
      // 5. The template tag `{{B}}`
      //
      // When (3) is invalidated, it immediately stops (4) and (5)
      // because of a Tracker.onInvalidate built into materializeView.
      // (When a View's render method is invalidated, it immediately
      // tears down all the subviews, via a Tracker.onInvalidate much
      // like this one.
      //
      // Suppose `A` changes to become falsy, and `B` changes at the
      // same time (i.e. without an intervening flush).
      // Without the code above, this happens:
      //
      // - (1) and (5) are invalidated.
      // - (1) runs, invalidating (2) and (4).
      // - (5) runs.
      // - (2) runs, invalidating (3), stopping (4) and (5).
      //
      // With the code above:
      //
      // - (1) and (5) are invalidated, invalidating (2) and (4).
      // - (1) runs.
      // - (2) runs, invalidating (3), stopping (4) and (5).
      //
      // If the re-run of (5) is originally enqueued before (1), all
      // bets are off, but typically that doesn't seem to be the
      // case.  Anyway, doing this is always better than not doing it,
      // because it might save a bunch of DOM from being updated
      // needlessly.
    });
  });

  return view;
};
