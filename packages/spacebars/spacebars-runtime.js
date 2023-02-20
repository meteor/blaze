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

// Executes `{{foo bar baz}}` when called on `(foo, bar, baz)`.
// If `bar` and `baz` are functions, they are called before
// `foo` is called on them.
//
// This is the shared part of Spacebars.mustache and
// Spacebars.attrMustache, which differ in how they post-process the
// result.
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

Spacebars.mustache = function (value/*, args*/) {
  var result = Spacebars.mustacheImpl.apply(null, arguments);

  if (result instanceof Spacebars.SafeString)
    return HTML.Raw(result.toString());
  else
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

// If `value` is a function, evaluate its `args` (by calling them, if they
// are functions), and then call it on them. Otherwise, return `value`.
//
// If `value` is not a function and is not null, then this method will assert
// that there are no args. We check for null before asserting because a user
// may write a template like {{user.fullNameWithPrefix 'Mr.'}}, where the
// function will be null until data is ready.
Spacebars.call = function (value/*, args*/) {
  if (typeof value === 'function') {
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
 * @param hadToWaitForPromiseYet      - whether we had a promise wait in the call chain so far.
 * @param object                      - the current object we're probing for the next property
 * @param ...steps                    - the dotted path elements like in cupboard4.drawer1a.subsection4.secretPentagonPapers,
 *                                      but split into separate strings as sequential parameters, eg.
 *                                      "cupboard4", "drawer1a", "subsection4", "secretPentagonPapers"
 */
Spacebars._asyncDot = function (currentView = undefined, hadToWaitForPromiseYet = false, object, ...steps) {
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
  if ('function' === typeof object) {
    object = object()
    return Spacebars._asyncDot(currentView, hadToWaitForPromiseYet, object, ...steps)
  }

  // We'll have to put a break in the cool results flow to wait for the promise to return because unfortunately fibers are fxxxed now
  // and promises are gonna leech into everything now.
  if (object instanceof Promise) {
      object.then((result) => {
        let object = result

        // let's set hadToWaitForPromiseYet to true & continue with processing the paths with this cool recursive function of ours.
        Spacebars._asyncDot(currentView, true, object, ...steps)
      })

      // We have to return something now, so we will return nothing until we have something.
      // The last call with no steps left will then have to trigger a rerun of the current views' render function.
      return null
  }

  if (steps.length) {
    object = object && object[steps[0]]
    // loose first part of steps array, it's handled now
    steps.shift()
    return Spacebars._asyncDot(currentView, hadToWaitForPromiseYet, object, ...steps)
  }
  if (hadToWaitForPromiseYet) {
    // We found the last unicorn, we can / need to set it up for the next render & trigger a re-render of the view now.
    const originalRenderFunc = currentView._render
    currentView._render = () => {
      currentView._render = originalRenderFunc
      console.log({object})
      return object
    }
    currentView.computation.invalidate()
  }
  return object
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
// * Return `foo.bar`, binding it to `foo` if it's a function.
Spacebars.dot = function (object, ...steps) {
  return Spacebars._asyncDot(undefined, false, object, ...steps)

  /**
   * We start from the first object provided.
   *
   * For each additional "step" (String which is interpreted as a property name) we'll try to check the property of the
   * previous part of the chain & to find its value.
   *
   * - If the property is a function, we call it
   * - if the result is a value we'll continue with it
   * - if it is the last part of the chain we'll return it
   * - if it is null / undefined / falsey we'll return it
   *
   * Now it gets tricky:
   * - If it's a function and it _returns a promise_ then we'll want to wait for it to resolve before we continue with the
   *   result of the promises' execution.
   * - in order for things not to get too janky, we'll return null until we have resolved all the promises.
   *
   * IF there has been one or more promises down the chain, THEN we'll have to retrigger the view after all promises have completed - ONCE.
   * And we DON'T want all helpers / reactive functions to retrigger again & create new promises etc... because that could actually change the result.
   * So IF there are promises down the chain somewhere, we'll retrigger a rerender ONCE and just return the final result of our evaluation.
   *
   * FUUUUU!!! :D
   */
  console.log('Spacebars.dot', {object, steps})

  const view = Blaze.currentView

  let currentObject = object

  for (let z0 = 0; z0 < steps.length; z0++) {
    const currentStep = steps[z0]

    console.log('Spacebars.dot in loop, before func call', {z0, currentObject, currentStep})

    // if it's a function, we execute it
    if (typeof currentObject === 'function') {
      currentObject = currentObject()
    }
    console.log('Spacebars.dot in loop, after func call', {z0, currentObject, currentStep})
    // The problem with a promise is, of course... that we have to wait for the promise to be resolved until we can
    // progress with our evaluation of the dot path. So we do... ??
    if (currentObject instanceof Promise) {
      currentObject.then((result) => {
        let currentObject = result

        console.log('Spacebars.dot in promise result, before func call', {z0, currentObject, currentStep})

        if (typeof currentObject === 'function') {
          currentObject = currentObject()
        }

        console.log('Spacebars.dot in promise result, after func call', {z0, currentObject, currentStep})

        if (z0 < steps.length) {
          // We'll have to evaluate further path parts now before we can trigger the re-rendering
          currentObject = Spacebars.dot(currentObject, steps.splice(z0))
        } else {
          // We found the last unicorn, we can / need to set it up for the next render & trigger a re-render of the view now.
          const originalRenderFunc = view._render
          view._render = () => {
            view._render = originalRenderFunc
            console.log({currentObject})
            return currentObject
          }
          view.computation.invalidate()
        }
      })
      // we /have/ to return something now, so we return nothing.
      return null
    }

    // Let's load the next step.
    // If we can't find the property, we can return now, we don't need to check any further steps.
    currentObject = currentObject && currentObject[currentStep]
  }

  console.log('returning', {currentObject})

  return currentObject

  _.find(parts, (part, idx) => {
    if (_.isNil(currentObject)) {
      result = undefined
      // if the last part of the chain is actually a null,
      // let the user actually have it
      if (idx === (parts.length - 1)) {
        result = currentObject
      }
      return true
    }

    let value = currentObject[part]
    if (_.isFunction(value)) {
      value = value.call(currentObject)
    }

    currentObject = value
    result = value
  })
  return result


  return

  if (arguments.length > 2) {
    // Note: doing this recursively is probably less efficient than
    // doing it in an iterative loop.
    var argsForRecurse = [];
    argsForRecurse.push(Spacebars.dot(value, id1));
    argsForRecurse.push.apply(argsForRecurse,
                              Array.prototype.slice.call(arguments, 2));
    return Spacebars.dot.apply(null, argsForRecurse);
  }

  if (typeof value === 'function')
    value = value();

  if (! value)
    return value; // falsy, don't index, pass through

  result = value[id1];
  if (typeof result !== 'function')
    return result;
  // `value[id1]` (or `value()[id1]`) is a function.
  // Bind it so that when called, `value` will be placed in `this`.
  return function (/*arguments*/) {
    return result.apply(value, arguments);
  };
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
