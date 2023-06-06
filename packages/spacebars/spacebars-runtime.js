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

/***
 * @summary Executes `fn` with the resolved value of `promise` while preserving
 * the context, i.e., `Blaze.currentView` and `Tracker.currentComputation`.
 * @template T
 * @template U
 * @param {Promise<T>} promise
 * @param {(x: T) => U} fn
 * @returns {Promise<U>}
 */
function _thenWithContext(promise, fn) {
  const computation = Tracker.currentComputation;
  const view = Blaze.currentView;
  return promise.then(value =>
    Blaze._withCurrentView(view, () =>
      Tracker.withComputation(computation, () =>
        fn(value)
      )
    )
  );
}

// If `value` is a function, evaluate its `args` (by calling them, if they
// are functions), and then call it on them. Otherwise, return `value`.
//
// If any of the arguments is a `Promise` or a function returning one, then the
// `value` will be called once all of the arguments resolve. If any of them
// rejects, so will the call.
//
// If `value` is not a function and is not null, then this method will assert
// that there are no args. We check for null before asserting because a user
// may write a template like {{user.fullNameWithPrefix 'Mr.'}}, where the
// function will be null until data is ready.
Spacebars.call = function (value/*, args*/) {
  if (typeof value === 'function') {
    // Evaluate arguments by calling them if they are functions.
    var newArgs = [];
    let anyIsPromise = false;
    for (var i = 1; i < arguments.length; i++) {
      var arg = arguments[i];
      newArgs[i-1] = (typeof arg === 'function' ? arg() : arg);
      anyIsPromise = anyIsPromise || isPromiseLike(newArgs[i-1]);
    }

    if (anyIsPromise) {
      return _thenWithContext(Promise.all(newArgs), newArgs => value.apply(null, newArgs));
    }

    return value.apply(null, newArgs);
  } else {
    if (value != null && arguments.length > 1) {
      throw new Error("Can't call non-function: " + value);
    }
    return value;
  }
};

const isPromiseLike = x => typeof x?.then === 'function';

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
 * `Spacebars.dot(foo, "bar", "baz")` performs a special kind
 * of `foo.bar.baz` that allows safe indexing of `null` and
 * indexing of functions (which calls the function).  If the
 * result is a function, it is always a bound function (e.g.
 * a wrapped version of `baz` that always uses `foo.bar` as
 * `this`).
 *
 * If any of the intermediate values is a `Promise`, the result will be one as
 * well, i.e., accessing a field of a `Promise` results in a `Promise` of the
 * accessed field. Rejections are passed-through.
 *
 * In `Spacebars.dot(foo, "bar")`, `foo` is assumed to be either
 * a non-function value or a "fully-bound" function wrapping a value,
 * where fully-bound means it takes no arguments and ignores `this`.
 *
 * `Spacebars.dot(foo, "bar")` performs the following steps:
 *
 * * If `foo` is falsy, return `foo`.
 *
 * * If `foo` is a function, call it (set `foo` to `foo()`).
 *
 * * If `foo` is falsy now, return `foo`.
 *
 * * Return `foo.bar`, binding it to `foo` if it's a function.
 *
 *
 * @param currentObject                 - the current object we're probing for the next property
 * @param ...steps                      - the dotted path elements like in cupboard4.drawer1a.subsection4.secretPentagonPapers,
 *                                        but split into separate strings as sequential parameters, eg.
 *                                        "cupboard4", "drawer1a", "subsection4", "secretPentagonPapers"
 *
 * @returns {null|string|Raw|Promise}   - can return either stuff / string-ish things by themselves or a promise for the same stuff.
 */
Spacebars.dot = function (currentObject, ...steps) {
  /**
   * Implementation strategy:
   *
   * Whenever we reach a new stage of information for "object" (eg. a value, a function, a promise) which isn't a value,
   * we immediately recursively call ourselves again to continue working with the result of the computation, as soon as we have it.
   *
   * This way all different combinations of functions returning promises returning promises returning functions
   * will be handled automatically.
   *
   * Once we have a value & not a callable, we'll move on to the next step in the steps chain.
   */

  // Call functions
  if ('function' === typeof currentObject) {
    currentObject = currentObject();
    return Spacebars.dot(currentObject, ...steps);
  }

  /**
   * If we receive a promise from one of the sub-evaluation-calls, we'll return a new promise ourselves which will complete once the sub-call has been completed (?)
   * -> Or could we just pass these promises through? No, I think we'll have to wait for them in turn in order to wait until we're finished with all promises...?
   */
  if (isPromiseLike(currentObject)) {
    return _thenWithContext(currentObject, currentObject => Spacebars.dot(currentObject, ...steps));
  }

  /**
   * As soon as we have a real value, not a promise or function, we can try to
   * resolve the next step of the path, if there are any left:
   */
  if (steps.length) {
    // Pick next step & remove it from the steps array.
    const nextStep = steps.shift();

    // continue drilling down.the.path
    currentObject = currentObject && currentObject[nextStep];
    return Spacebars.dot(currentObject, ...steps);
  }

  // If we only got a value thing by now, we can finally just return it! :D
  return currentObject;
}


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
