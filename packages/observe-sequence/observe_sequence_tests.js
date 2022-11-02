/* global runOneObserveSequenceTestCase ObserveSequence EJSON Tracker Tinytest Mongo */
/* eslint-disable no-global-assign */


// Run a function named `run` which modifies a sequence. While it
// executes, observe changes to the sequence and accumulate them in an
// array, canonicalizing as necessary. Then make sure the results are
// the same as passed in `expectedCallbacks`. In items in
// `expectedCallbacks`, allow for special values of the form {NOT:
// "foo"}, which match anything other than "foo".
//
// @param test {Object} as passed to Tinytest.add
// @param sequenceFunc {Function(): sequence type}
// @param run {Function()} modify the sequence or cause sequenceFunc
//     to be recomupted
// @param expectedCallbacks {Array}
//     elements are objects eg {addedAt: [array of arguments]}
// @param numExpectedWarnings {Number}
runOneObserveSequenceTestCase = function (test, sequenceFunc,
                                          run, expectedCallbacks,
                                          numExpectedWarnings) {
  if (numExpectedWarnings) ObserveSequence._suppressWarnings += numExpectedWarnings;

  const firedCallbacks = [];
  const handle = ObserveSequence.observe(sequenceFunc, {
    addedAt (...args) {
      firedCallbacks.push({ addedAt: args });
    },
    changedAt (...args) {
      const obj = { changedAt: args };

      // Browsers are inconsistent about the order in which 'changedAt'
      // callbacks fire. To ensure consistent behavior of these tests,
      // we can't simply push `obj` at the end of `firedCallbacks` as
      // we do for the other callbacks. Instead, we use insertion sort
      // to place `obj` in a canonical position within the chunk of
      // contiguously recently fired 'changedAt' callbacks.
      let i;
      for (i = firedCallbacks.length; i > 0; i--) {
        const compareTo = firedCallbacks[i - 1];
        if (!compareTo.changedAt) break;

        if (EJSON.stringify(compareTo, { canonical: true }) <
            EJSON.stringify(obj, { canonical: true })) break;
      }

      firedCallbacks.splice(i, 0, obj);
    },
    removedAt (...args) {
      firedCallbacks.push({ removedAt: args });
    },
    movedTo (...args) {
      firedCallbacks.push({ movedTo: args });
    },
  });

  run();
  Tracker.flush();
  handle.stop();

  test.equal(ObserveSequence._suppressWarnings, 0);
  test.equal(ObserveSequence._loggedWarnings, 0);
  ObserveSequence._loggedWarnings = 0;

  // any expected argument this is `{NOT: "foo"}`, should match any
  // corresponding value in the fired callbacks other than "foo". so,
  // assert non-equality and then replace the appropriate entries in
  // the 'firedCallbacks' array with `{NOT: "foo"}` before calling
  // `test.equal` below.
  const commonLength = Math.min(firedCallbacks.length, expectedCallbacks.length);
  for (let i = 0; i < commonLength; i++) {
    const callback = expectedCallbacks[i];
    if (Object.keys(callback).length !== 1) throw new Error('Callbacks should be objects with one key, eg `addedAt`');
    const callbackName = Object.keys(callback)[0];
    const args = Object.values(callback)[0];
    args.forEach(function (arg, argIndex) {
      if (arg && typeof arg === 'object' &&
          'NOT' in arg &&
          firedCallbacks[i][callbackName]) {
        test.notEqual(firedCallbacks[i][callbackName][argIndex],
                      arg.NOT, `Should be NOT ${arg.NOT}`);
        firedCallbacks[i][callbackName][argIndex] = arg;
      }
    });
  }

  const compress = function (str) {
    return str.replace(/\[\n\s*/gm, '[').replace(/\{\n\s*/gm, '{')
      .replace(/\n\s*\]/gm, ']').replace(/\n\s*\}/gm, '}');
  };

  test.equal(compress(EJSON.stringify(firedCallbacks, { canonical: true, indent: true })),
             compress(EJSON.stringify(expectedCallbacks, { canonical: true, indent: true })));
};

// ArraySubClass return an array that is a sub-class
// of Array
const extend = function(child, parent) {
  const _child = child;
  function Ctor() {
    this.constructor = _child;
  }
  Ctor.prototype = parent.prototype;
  _child.prototype = new Ctor();
  _child.__super__ = parent.prototype;
  return _child;
};
const ArraySubclass = (function (superClass) {
  // eslint-disable-next-line no-use-before-define
  extend(ArraySubclass, superClass);

  // eslint-disable-next-line no-shadow
  function ArraySubclass() {
    if (arguments.length > 0) {
      // eslint-disable-next-line prefer-rest-params
      const items = this.slice.call(arguments, 0);
      // eslint-disable-next-line prefer-spread
      this.splice.apply(this, [0, 0].concat(this.slice.call(items)));
    }
  }

  return ArraySubclass;
}(Array));


// runInVM creates returns the result of an eval in another
// context (iframe).  Used to return a 'new Array(1,2,3)' that
// is not an instanceof Array in the global context.
function runInVM(code) {
    const iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';

    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    let wEval = win.eval; const
wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }

    const res = wEval.call(win, code);

    document.body.removeChild(iframe);

    return res;
}

Tinytest.add('observe-sequence - initial data for all sequence types', function (test) {
  runOneObserveSequenceTestCase(test, function () {
    return null;
  }, function () {}, []);

  runOneObserveSequenceTestCase(test, function () {
    return [];
  }, function () {}, []);

  runOneObserveSequenceTestCase(test, function () {
    return [{ foo: 1 }, { bar: 2 }];
  }, function () {}, [
    { addedAt: [0, { foo: 1 }, 0, null] },
    { addedAt: [1, { bar: 2 }, 1, null] },
  ]);

  runOneObserveSequenceTestCase(test, function () {
    return [{ _id: '13', foo: 1 }, { _id: '37', bar: 2 }];
  }, function () {}, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
  ]);

  // sub-classed arrays
  runOneObserveSequenceTestCase(test, function () {
    return new ArraySubclass({ _id: '13', foo: 1 }, { _id: '37', bar: 2 });
  }, function () {}, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
  ]);

  // Execute in VM
  runOneObserveSequenceTestCase(test, function () {
    // eslint-disable-next-line new-cap
    return new runInVM('new Array({_id: "13", foo: 1}, {_id: "37", bar: 2})');
  }, function () {}, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
  ]);

  runOneObserveSequenceTestCase(test, function () {
    const coll = new Mongo.Collection(null);
    coll.insert({ _id: '13', foo: 1 });
    coll.insert({ _id: '37', bar: 2 });
    const cursor = coll.find({}, { sort: { _id: 1 } });
    return cursor;
  }, function () {}, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
  ]);

  // shouldn't break on array with duplicate _id's, and the ids sent
  // in the callbacks should be distinct
  runOneObserveSequenceTestCase(test, function () {
    return [
      { _id: '13', foo: 1 },
      { _id: '13', foo: 2 },
    ];
  }, function () {}, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: [{ NOT: '13' }, { _id: '13', foo: 2 }, 1, null] },
  ], /* numExpectedWarnings = */1);

  // non-array iterable (empty)
  if (typeof Map == 'function') {
 runOneObserveSequenceTestCase(test, function () {
    return new Map();
  }, function () {}, []);
}

  // non-array iterable (non-empty)
  if (typeof Set == 'function') {
 runOneObserveSequenceTestCase(test, function () {
    return new Set([{ foo: 1 }, { bar: 2 }]);
  }, function () {}, [
    { addedAt: [0, { foo: 1 }, 0, null] },
    { addedAt: [1, { bar: 2 }, 1, null] },
  ]);
}
});

Tinytest.add('observe-sequence - array to other array', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ _id: '13', foo: 1 }, { _id: '37', bar: 2 }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = [{ _id: '13', foo: 1 }, { _id: '38', bar: 2 }];
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
    { removedAt: ['37', { _id: '37', bar: 2 }, 1] },
    { addedAt: ['38', { _id: '38', bar: 2 }, 1, null] },
    { changedAt: ['13', { _id: '13', foo: 1 }, { _id: '13', foo: 1 }, 0] },
  ]);
});

Tinytest.add('observe-sequence - array to other array, strings', function (test) {
  const dep = new Tracker.Dependency();
  let seq = ['A', 'B'];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = ['B', 'C'];
    dep.changed();
  }, [
    { addedAt: ['-A', 'A', 0, null] },
    { addedAt: ['-B', 'B', 1, null] },
    { removedAt: ['-A', 'A', 0] },
    { addedAt: ['-C', 'C', 1, null] },
  ]);
});

Tinytest.add('observe-sequence - bug #7850 array with null values', function (test) {
  runOneObserveSequenceTestCase(test, function () {
    return [1, null];
  }, function () {}, [
    { addedAt: [1, 1, 0, null] },
    { addedAt: [null, null, 1, null] },
  ]);
});

Tinytest.add('observe-sequence - array to other array, objects without ids', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ foo: 1 }, { bar: 2 }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = [{ foo: 2 }];
    dep.changed();
  }, [
    { addedAt: [0, { foo: 1 }, 0, null] },
    { addedAt: [1, { bar: 2 }, 1, null] },
    { removedAt: [1, { bar: 2 }, 1] },
    { changedAt: [0, { foo: 2 }, { foo: 1 }, 0] },
  ]);
});

Tinytest.add('observe-sequence - array to other array, changes', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ _id: '13', foo: 1 }, { _id: '37', bar: 2 }, { _id: '42', baz: 42 }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = [{ _id: '13', foo: 1 }, { _id: '38', bar: 2 }, { _id: '42', baz: 43 }];
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
    { addedAt: ['42', { _id: '42', baz: 42 }, 2, null] },
    { removedAt: ['37', { _id: '37', bar: 2 }, 1] },
    { addedAt: ['38', { _id: '38', bar: 2 }, 1, '42'] },
    // change fires for all elements, because we don't diff the actual
    // objects.
    { changedAt: ['13', { _id: '13', foo: 1 }, { _id: '13', foo: 1 }, 0] },
    { changedAt: ['42', { _id: '42', baz: 43 }, { _id: '42', baz: 42 }, 2] },
  ]);
});

Tinytest.add('observe-sequence - array to other array, movedTo', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ _id: '13', foo: 1 }, { _id: '37', bar: 2 }, { _id: '42', baz: 42 }, { _id: '43', baz: 43 }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = [{ _id: '43', baz: 43 }, { _id: '37', bar: 2 }, { _id: '42', baz: 42 }, { _id: '13', foo: 1 }];
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
    { addedAt: ['42', { _id: '42', baz: 42 }, 2, null] },
    { addedAt: ['43', { _id: '43', baz: 43 }, 3, null] },

    { movedTo: ['43', { _id: '43', baz: 43 }, 3, 1, '37'] },
    { movedTo: ['13', { _id: '13', foo: 1 }, 0, 3, null] },

    { changedAt: ['13', { _id: '13', foo: 1 }, { _id: '13', foo: 1 }, 3] },
    { changedAt: ['37', { _id: '37', bar: 2 }, { _id: '37', bar: 2 }, 1] },
    { changedAt: ['42', { _id: '42', baz: 42 }, { _id: '42', baz: 42 }, 2] },
    { changedAt: ['43', { _id: '43', baz: 43 }, { _id: '43', baz: 43 }, 0] },
  ]);
});

Tinytest.add('observe-sequence - array to other array, movedTo the end', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ _id: '0' }, { _id: '1' }, { _id: '2' }, { _id: '3' }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = [{ _id: '0' }, { _id: '2' }, { _id: '3' }, { _id: '1' }];
    dep.changed();
  }, [
    { addedAt: ['0', { _id: '0' }, 0, null] },
    { addedAt: ['1', { _id: '1' }, 1, null] },
    { addedAt: ['2', { _id: '2' }, 2, null] },
    { addedAt: ['3', { _id: '3' }, 3, null] },

    { movedTo: ['1', { _id: '1' }, 1, 3, null] },
    { changedAt: ['0', { _id: '0' }, { _id: '0' }, 0] },
    { changedAt: ['1', { _id: '1' }, { _id: '1' }, 3] },
    { changedAt: ['2', { _id: '2' }, { _id: '2' }, 1] },
    { changedAt: ['3', { _id: '3' }, { _id: '3' }, 2] },
  ]);
});

Tinytest.add('observe-sequence - array to other array, movedTo later position but not the latest #2845', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ _id: '0' }, { _id: '1' }, { _id: '2' }, { _id: '3' }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = [{ _id: '1' }, { _id: '2' }, { _id: '0' }, { _id: '3' }];
    dep.changed();
  }, [
    { addedAt: ['0', { _id: '0' }, 0, null] },
    { addedAt: ['1', { _id: '1' }, 1, null] },
    { addedAt: ['2', { _id: '2' }, 2, null] },
    { addedAt: ['3', { _id: '3' }, 3, null] },

    { movedTo: ['0', { _id: '0' }, 0, 2, '3'] },

    { changedAt: ['0', { _id: '0' }, { _id: '0' }, 2] },
    { changedAt: ['1', { _id: '1' }, { _id: '1' }, 0] },
    { changedAt: ['2', { _id: '2' }, { _id: '2' }, 1] },
    { changedAt: ['3', { _id: '3' }, { _id: '3' }, 3] },
  ]);
});

Tinytest.add('observe-sequence - array to other array, movedTo earlier position but not the first', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ _id: '0' }, { _id: '1' }, { _id: '2' }, { _id: '3' }, { _id: '4' }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = [{ _id: '0' }, { _id: '4' }, { _id: '1' }, { _id: '2' }, { _id: '3' }];
    dep.changed();
  }, [
    { addedAt: ['0', { _id: '0' }, 0, null] },
    { addedAt: ['1', { _id: '1' }, 1, null] },
    { addedAt: ['2', { _id: '2' }, 2, null] },
    { addedAt: ['3', { _id: '3' }, 3, null] },
    { addedAt: ['4', { _id: '4' }, 4, null] },

    { movedTo: ['4', { _id: '4' }, 4, 1, '1'] },

    { changedAt: ['0', { _id: '0' }, { _id: '0' }, 0] },
    { changedAt: ['1', { _id: '1' }, { _id: '1' }, 2] },
    { changedAt: ['2', { _id: '2' }, { _id: '2' }, 3] },
    { changedAt: ['3', { _id: '3' }, { _id: '3' }, 4] },
    { changedAt: ['4', { _id: '4' }, { _id: '4' }, 1] },
  ]);
});

Tinytest.add('observe-sequence - array to null', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ _id: '13', foo: 1 }, { _id: '37', bar: 2 }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = null;
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
    { removedAt: ['13', { _id: '13', foo: 1 }, 0] },
    { removedAt: ['37', { _id: '37', bar: 2 }, 0] },
  ]);
});

Tinytest.add('observe-sequence - array to cursor', function (test) {
  const dep = new Tracker.Dependency();
  let seq = [{ _id: '13', foo: 1 }, { _id: '37', bar: 2 }];

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    const coll = new Mongo.Collection(null);
    coll.insert({ _id: '13', foo: 1 });
    coll.insert({ _id: '38', bar: 2 });
    const cursor = coll.find({}, { sort: { _id: 1 } });
    seq = cursor;
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
    { removedAt: ['37', { _id: '37', bar: 2 }, 1] },
    { addedAt: ['38', { _id: '38', bar: 2 }, 1, null] },
    { changedAt: ['13', { _id: '13', foo: 1 }, { _id: '13', foo: 1 }, 0] },
  ]);
});


Tinytest.add('observe-sequence - cursor to null', function (test) {
  const dep = new Tracker.Dependency();
  const coll = new Mongo.Collection(null);
  coll.insert({ _id: '13', foo: 1 });
  coll.insert({ _id: '37', bar: 2 });
  const cursor = coll.find({}, { sort: { _id: 1 } });
  let seq = cursor;

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = null;
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
    { removedAt: ['13', { _id: '13', foo: 1 }, 0] },
    { removedAt: ['37', { _id: '37', bar: 2 }, 0] },
  ]);
});

Tinytest.add('observe-sequence - cursor to array', function (test) {
  const dep = new Tracker.Dependency();
  const coll = new Mongo.Collection(null);
  coll.insert({ _id: '13', foo: 1 });
  const cursor = coll.find({}, { sort: { _id: 1 } });
  let seq = cursor;

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    coll.insert({ _id: '37', bar: 2 });
    seq = [{ _id: '13', foo: 1 }, { _id: '38', bar: 2 }];
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
    { removedAt: ['37', { _id: '37', bar: 2 }, 1] },
    { addedAt: ['38', { _id: '38', bar: 2 }, 1, null] },
    { changedAt: ['13', { _id: '13', foo: 1 }, { _id: '13', foo: 1 }, 0] },
  ]);
});

Tinytest.add('observe-sequence - cursor', function (test) {
  const coll = new Mongo.Collection(null);
  coll.insert({ _id: '13', rank: 1 });
  const cursor = coll.find({}, { sort: { rank: 1 } });
  const seq = cursor;

  runOneObserveSequenceTestCase(test, function () {
    return seq;
  }, function () {
    coll.insert({ _id: '37', rank: 2 });
    coll.insert({ _id: '77', rank: 3 });
    coll.remove({ _id: '37' }); // should fire a 'removedAt' callback
    coll.insert({ _id: '11', rank: 0 }); // should fire an 'addedAt' callback
    coll.update({ _id: '13' }, { $set: { updated: true } }); // should fire an 'changedAt' callback
    coll.update({ _id: '77' }, { $set: { rank: -1 } }); // should fire 'changedAt' and 'movedTo' callback
  }, [
    // this case must not fire spurious calls as the array to array
    // case does. otherwise, the entire power of cursors is lost in
    // blaze.
    { addedAt: ['13', { _id: '13', rank: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', rank: 2 }, 1, null] },
    { addedAt: ['77', { _id: '77', rank: 3 }, 2, null] },
    { removedAt: ['37', { _id: '37', rank: 2 }, 1] },
    { addedAt: ['11', { _id: '11', rank: 0 }, 0, '13'] },
    { changedAt: ['13', { _id: '13', rank: 1, updated: true }, { _id: '13', rank: 1 }, 1] },
    { changedAt: ['77', { _id: '77', rank: -1 }, { _id: '77', rank: 3 }, 2] },
    { movedTo: ['77', { _id: '77', rank: -1 }, 2, 0, '11'] },
  ]);
});

Tinytest.add('observe-sequence - cursor to other cursor', function (test) {
  const dep = new Tracker.Dependency();
  const coll = new Mongo.Collection(null);
  coll.insert({ _id: '13', foo: 1 });
  const cursor = coll.find({}, { sort: { _id: 1 } });
  let seq = cursor;

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    coll.insert({ _id: '37', bar: 2 });

    const newColl = new Mongo.Collection(null);
    newColl.insert({ _id: '13', foo: 1 });
    newColl.insert({ _id: '38', bar: 2 });
    const newCursor = newColl.find({}, { sort: { _id: 1 } });
    seq = newCursor;
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2 }, 1, null] },
    { removedAt: ['37', { _id: '37', bar: 2 }, 1] },
    { addedAt: ['38', { _id: '38', bar: 2 }, 1, null] },
    { changedAt: ['13', { _id: '13', foo: 1 }, { _id: '13', foo: 1 }, 0] },
  ]);
});

Tinytest.add('observe-sequence - cursor to other cursor with transform', function (test) {
  const dep = new Tracker.Dependency();
  const transform = function(doc) {
    return Object.assign({ idCopy: doc._id }, doc);
  };

  const coll = new Mongo.Collection(null, { transform });
  coll.insert({ _id: '13', foo: 1 });
  const cursor = coll.find({}, { sort: { _id: 1 } });
  let seq = cursor;

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    coll.insert({ _id: '37', bar: 2 });

    const newColl = new Mongo.Collection(null, { transform });
    newColl.insert({ _id: '13', foo: 1 });
    newColl.insert({ _id: '38', bar: 2 });
    const newCursor = newColl.find({}, { sort: { _id: 1 } });
    seq = newCursor;
    dep.changed();
  }, [
    { addedAt: ['13', { _id: '13', foo: 1, idCopy: '13' }, 0, null] },
    { addedAt: ['37', { _id: '37', bar: 2, idCopy: '37' }, 1, null] },
    { removedAt: ['37', { _id: '37', bar: 2, idCopy: '37' }, 1] },
    { addedAt: ['38', { _id: '38', bar: 2, idCopy: '38' }, 1, null] },
    { changedAt: ['13', { _id: '13', foo: 1, idCopy: '13' }, { _id: '13', foo: 1, idCopy: '13' }, 0] },
  ]);
});

Tinytest.add('observe-sequence - cursor to same cursor', function (test) {
  const coll = new Mongo.Collection(null);
  coll.insert({ _id: '13', rank: 1 });
  const cursor = coll.find({}, { sort: { rank: 1 } });
  const seq = cursor;
  const dep = new Tracker.Dependency();

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    coll.insert({ _id: '24', rank: 2 });
    dep.changed();
    Tracker.flush();
    coll.insert({ _id: '78', rank: 3 });
  }, [
    { addedAt: ['13', { _id: '13', rank: 1 }, 0, null] },
    { addedAt: ['24', { _id: '24', rank: 2 }, 1, null] },
    // even if the cursor changes to the same cursor, we do a diff,
    // which leads to these 'changedAt' events.
    { changedAt: ['13', { _id: '13', rank: 1 }, { _id: '13', rank: 1 }, 0] },
    { changedAt: ['24', { _id: '24', rank: 2 }, { _id: '24', rank: 2 }, 1] },
    { addedAt: ['78', { _id: '78', rank: 3 }, 2, null] },
  ]);
});

Tinytest.add('observe-sequence - string arrays', function (test) {
  let seq = ['A', 'B'];
  const dep = new Tracker.Dependency();

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = ['B', 'C'];
    dep.changed();
  }, [
    { addedAt: ['-A', 'A', 0, null] },
    { addedAt: ['-B', 'B', 1, null] },
    { removedAt: ['-A', 'A', 0] },
    { addedAt: ['-C', 'C', 1, null] },
  ]);
});

Tinytest.add('observe-sequence - number arrays', function (test) {
  let seq = [1, 1, 2];
  const dep = new Tracker.Dependency();

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = [1, 3, 2, 3];
    dep.changed();
  }, [
    { addedAt: [1, 1, 0, null] },
    { addedAt: [{ NOT: 1 }, 1, 1, null] },
    { addedAt: [2, 2, 2, null] },
    { removedAt: [{ NOT: 1 }, 1, 1] },
    { addedAt: [3, 3, 1, 2] },
    { addedAt: [{ NOT: 3 }, 3, 3, null] },
  ]);
});

Tinytest.add('observe-sequence - subclassed number arrays', function (test) {
  let seq = new ArraySubclass(1, 1, 2);
  const dep = new Tracker.Dependency();

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = new ArraySubclass(1, 3, 2, 3);
    dep.changed();
  }, [
    { addedAt: [1, 1, 0, null] },
    { addedAt: [{ NOT: 1 }, 1, 1, null] },
    { addedAt: [2, 2, 2, null] },
    { removedAt: [{ NOT: 1 }, 1, 1] },
    { addedAt: [3, 3, 1, 2] },
    { addedAt: [{ NOT: 3 }, 3, 3, null] },
  ]);
});

Tinytest.add('observe-sequence - vm generated number arrays', function (test) {
  let seq = runInVM('new Array(1, 1, 2)');
  const dep = new Tracker.Dependency();

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    seq = runInVM('new Array(1, 3, 2, 3)');
    dep.changed();
  }, [
    { addedAt: [1, 1, 0, null] },
    { addedAt: [{ NOT: 1 }, 1, 1, null] },
    { addedAt: [2, 2, 2, null] },
    { removedAt: [{ NOT: 1 }, 1, 1] },
    { addedAt: [3, 3, 1, 2] },
    { addedAt: [{ NOT: 3 }, 3, 3, null] },
  ]);
});

Tinytest.add('observe-sequence - number arrays, _id:0 correctly handled, no duplicate ids warning #4049', function (test) {
  let seq = [...Array(3).keys()].map(function (i) { return { _id: i }; });
  const dep = new Tracker.Dependency();

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    // There was a bug before fixing #4049 that 0 wouldn't be handled well as an
    // _id. An expression like `(item && item._id) || index` would incorrectly
    // return '2' for the last item because the _id is falsy (although it is not
    // undefined, but 0!).
    seq = [1, 2, 0].map(function (i) { return { _id: i }; });
    dep.changed();
  }, [
    { addedAt: [0, { _id: 0 }, 0, null] },
    { addedAt: [1, { _id: 1 }, 1, null] },
    { addedAt: [2, { _id: 2 }, 2, null] },
    { movedTo: [0, { _id: 0 }, 0, 2, null] },
    { changedAt: [0, { _id: 0 }, { _id: 0 }, 2] },
    { changedAt: [1, { _id: 1 }, { _id: 1 }, 0] },
    { changedAt: [2, { _id: 2 }, { _id: 2 }, 1] },
  ]);
});

Tinytest.add('observe-sequence - cursor to other cursor, same collection', function (test) {
  const dep = new Tracker.Dependency();
  const coll = new Mongo.Collection(null);
  coll.insert({ _id: '13', foo: 1 });
  coll.insert({ _id: '37', foo: 2 });
  const cursor = coll.find({ foo: 1 });
  let seq = cursor;

  runOneObserveSequenceTestCase(test, function () {
    dep.depend();
    return seq;
  }, function () {
    const newCursor = coll.find({ foo: 2 });
    seq = newCursor;
    dep.changed();
    Tracker.flush();
    coll.insert({ _id: '38', foo: 1 });
    coll.insert({ _id: '39', foo: 2 });
  }, [
    { addedAt: ['13', { _id: '13', foo: 1 }, 0, null] },
    { removedAt: ['13', { _id: '13', foo: 1 }, 0] },
    { addedAt: ['37', { _id: '37', foo: 2 }, 0, null] },
    { addedAt: ['39', { _id: '39', foo: 2 }, 1, null] },
  ]);
});
