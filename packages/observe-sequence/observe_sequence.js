const isObject = (value) => {
  const type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}
const has = (obj, path) => {
  const thisPath = Array.isArray(path) ? path : [path];
  const length = thisPath.length;
  for (let i = 0; i < length; i++) {
    const key = thisPath[i];
    const _has = obj != null && Object.hasOwnProperty.call(obj, key);
    if (!_has) return false;
    obj = obj[key];
  }
  return !!length;
};

const warn = (...args) => {
  if (ObserveSequence._suppressWarnings) {
    ObserveSequence._suppressWarnings--;
  } else {
    if (typeof console !== 'undefined' && console.warn)
      console.warn(...args);

    ObserveSequence._loggedWarnings++;
  }
};

// isArray returns true for arrays of these types:
// standard arrays: instanceof Array === true, _.isArray(arr) === true
// vm generated arrays: instanceOf Array === false, _.isArray(arr) === true
// subclassed arrays: instanceof Array === true, _.isArray(arr) === false
// see specific tests
function isArray(arr) {
  return arr instanceof Array || Array.isArray(arr);
}

// isIterable returns trues for objects implementing iterable protocol,
// except strings, as {{#each 'string'}} doesn't make much sense.
// Requires ES6+ and does not work in IE (but degrades gracefully).
// Does not support the `length` + index protocol also supported by Array.from
function isIterable (object) {
  const iter = typeof Symbol != 'undefined' && Symbol.iterator;
  return iter
    && object instanceof Object // note: returns false for strings
    && typeof object[iter] == 'function'; // implements iterable protocol
}

const idStringify = MongoID.idStringify;
const idParse = MongoID.idParse;

ObserveSequence = {
  _suppressWarnings: 0,
  _loggedWarnings: 0,

  // A mechanism similar to cursor.observe which receives a reactive
  // function returning a sequence type and firing appropriate callbacks
  // when the value changes.
  //
  // @param sequenceFunc {Function} a reactive function returning a
  //     sequence type. The currently supported sequence types are:
  //     Array, Cursor, and null.
  //
  // @param callbacks {Object} similar to a specific subset of
  //     callbacks passed to `cursor.observe`
  //     (http://docs.meteor.com/#observe), with minor variations to
  //     support the fact that not all sequences contain objects with
  //     _id fields.  Specifically:
  //
  //     * addedAt(id, item, atIndex, beforeId)
  //     * changedAt(id, newItem, oldItem, atIndex)
  //     * removedAt(id, oldItem, atIndex)
  //     * movedTo(id, item, fromIndex, toIndex, beforeId)
  //
  // @returns {Object(stop: Function)} call 'stop' on the return value
  //     to stop observing this sequence function.
  //
  // We don't make any assumptions about our ability to compare sequence
  // elements (ie, we don't assume EJSON.equals works; maybe there is extra
  // state/random methods on the objects) so unlike cursor.observe, we may
  // sometimes call changedAt() when nothing actually changed.
  // XXX consider if we *can* make the stronger assumption and avoid
  //     no-op changedAt calls (in some cases?)
  //
  // XXX currently only supports the callbacks used by our
  // implementation of {{#each}}, but this can be expanded.
  //
  // XXX #each doesn't use the indices (though we'll eventually need
  // a way to get them when we support `@index`), but calling
  // `cursor.observe` causes the index to be calculated on every
  // callback using a linear scan (unless you turn it off by passing
  // `_no_indices`).  Any way to avoid calculating indices on a pure
  // cursor observe like we used to?
  observe: function (sequenceFunc, callbacks) {
    let lastSeq = null;
    let activeObserveHandle = null;

    // 'lastSeqArray' contains the previous value of the sequence
    // we're observing. It is an array of objects with '_id' and
    // 'item' fields.  'item' is the element in the array, or the
    // document in the cursor.
    //
    // '_id' is whichever of the following is relevant, unless it has
    // already appeared -- in which case it's randomly generated.
    //
    // * if 'item' is an object:
    //   * an '_id' field, if present
    //   * otherwise, the index in the array
    //
    // * if 'item' is a number or string, use that value
    //
    // XXX this can be generalized by allowing {{#each}} to accept a
    // general 'key' argument which could be a function, a dotted
    // field name, or the special @index value.
    let lastSeqArray = []; // elements are objects of form {_id, item}
    const computation = Tracker.autorun(function () {
      const seq = sequenceFunc();

      Tracker.nonreactive(function () {
        let seqArray; // same structure as `lastSeqArray` above.

        if (activeObserveHandle) {
          // If we were previously observing a cursor, replace lastSeqArray with
          // more up-to-date information.  Then stop the old observe.
          lastSeqArray = lastSeq.fetch().map((doc) => ({_id: doc._id, item: doc}));
          activeObserveHandle.stop();
          activeObserveHandle = null;
        }

        if (!seq) {
          seqArray = seqChangedToEmpty(lastSeqArray, callbacks);
        } else if (isArray(seq)) {
          seqArray = seqChangedToArray(lastSeqArray, seq, callbacks);
        } else if (isStoreCursor(seq)) {
          const result /* [seqArray, activeObserveHandle] */ =
                seqChangedToCursor(lastSeqArray, seq, callbacks);
          seqArray = result[0];
          activeObserveHandle = result[1];
        } else if (isIterable(seq)) {
          const array = Array.from(seq);
          seqArray = seqChangedToArray(lastSeqArray, array, callbacks);
        } else {
          throw badSequenceError(seq);
        }

        diffArray(lastSeqArray, seqArray, callbacks);
        lastSeq = seq;
        lastSeqArray = seqArray;
      });
    });

    return {
      stop: function () {
        computation.stop();
        if (activeObserveHandle)
          activeObserveHandle.stop();
      }
    };
  },

  // Fetch the items of `seq` into an array, where `seq` is of one of the
  // sequence types accepted by `observe`.  If `seq` is a cursor, a
  // dependency is established.
  fetch: function (seq) {
    if (!seq) {
      return [];
    } else if (isArray(seq)) {
      return seq;
    } else if (isStoreCursor(seq)) {
      return seq.fetch();
    } else if (isIterable(seq)) {
      return Array.from(seq);
    } else {
      throw badSequenceError(seq);
    }
  }
};

const ellipsis = (longStr, maxLength = 100) => {
  if(longStr.length < maxLength) return longStr;
  return `${longStr.substring(0, maxLength - 1)}\u2026`;
};

const arrayToDebugStr = (value, maxLength) => {
  let out = '', sep = '';
  for(let i = 0; i < value.length; i++) {
    const item = value[i];
    out += sep + toDebugStr(item, maxLength);
    if(out.length > maxLength) return out;
    sep = ', ';
  }
  return out;
};

const toDebugStr = (value, maxLength = 150) => {
  const type = typeof value;
  switch(type) {
    case 'undefined':
      return type;
    case 'number':
      return value.toString();
    case 'string':
      return JSON.stringify(value); // add quotes
    case 'object':
      if(value === null) {
        return 'null';
      } else if(Array.isArray(value)) {
        return `Array [${arrayToDebugStr(value, maxLength)}]`;
      } else if(Symbol.iterator in value) { // Map and Set are not handled by JSON.stringify
        return `${value.constructor.name} [${arrayToDebugStr(Array.from(value), maxLength)}]`; // Array.from doesn't work in IE, but neither do iterators so it's unreachable
      } else { // use JSON.stringify (sometimes toString can be better but we don't know)
        return `${value.constructor.name} ${ellipsis(JSON.stringify(value), maxLength)}`;
      }
    default:
      return `${type}: ${value.toString()}`;
  }
};

const sequenceGotValue = (sequence) => {
  try {
    return ` Got ${toDebugStr(sequence)}`;
  } catch(e) {
    return ''
  }
};

const badSequenceError = (sequence) =>
  new Error(`{{#each}} currently only accepts arrays, cursors, iterables or falsey values.${sequenceGotValue(sequence)}`);

const isFunction = (func) => {
  return typeof func === "function";
}

const isStoreCursor = (cursor) =>
  cursor && isObject(cursor) &&
    isFunction(cursor.observe) && isFunction(cursor.fetch);

// Calculates the differences between `lastSeqArray` and
// `seqArray` and calls appropriate functions from `callbacks`.
// Reuses Minimongo's diff algorithm implementation.
const diffArray = (lastSeqArray, seqArray, callbacks) => {
  const diffFn = Package['diff-sequence'].DiffSequence.diffQueryOrderedChanges;
  const oldIdObjects = [];
  const newIdObjects = [];
  const posOld = {}; // maps from idStringify'd ids
  const posNew = {}; // ditto
  const posCur = {};
  let lengthCur = lastSeqArray.length;

  seqArray.forEach((doc, i) => {
    newIdObjects.push({_id: doc._id});
    posNew[idStringify(doc._id)] = i;
  });
  lastSeqArray.forEach((doc, i) => {
    oldIdObjects.push({_id: doc._id});
    posOld[idStringify(doc._id)] = i;
    posCur[idStringify(doc._id)] = i;
  });

  // Arrays can contain arbitrary objects. We don't diff the
  // objects. Instead we always fire 'changedAt' callback on every
  // object. The consumer of `observe-sequence` should deal with
  // it appropriately.
  diffFn(oldIdObjects, newIdObjects, {
    addedBefore: function (id, doc, before) {
      const position = before ? posCur[idStringify(before)] : lengthCur;

      if (before) {
        // If not adding at the end, we need to update indexes.
        // XXX this can still be improved greatly!
        Object.entries(posCur).forEach(([id, pos]) => {
          if (pos >= position)
            posCur[id]++;
        });
      }

      lengthCur++;
      posCur[idStringify(id)] = position;

      callbacks.addedAt(
        id,
        seqArray[posNew[idStringify(id)]].item,
        position,
        before);
    },
    movedBefore: function (id, before) {
      if (id === before)
        return;

      const oldPosition = posCur[idStringify(id)];
      let newPosition = before ? posCur[idStringify(before)] : lengthCur;

      // Moving the item forward. The new element is losing one position as it
      // was removed from the old position before being inserted at the new
      // position.
      // Ex.:   0  *1*  2   3   4
      //        0   2   3  *1*  4
      // The original issued callback is "1" before "4".
      // The position of "1" is 1, the position of "4" is 4.
      // The generated move is (1) -> (3)
      if (newPosition > oldPosition) {
        newPosition--;
      }

      // Fix up the positions of elements between the old and the new positions
      // of the moved element.
      //
      // There are two cases:
      //   1. The element is moved forward. Then all the positions in between
      //   are moved back.
      //   2. The element is moved back. Then the positions in between *and* the
      //   element that is currently standing on the moved element's future
      //   position are moved forward.
      Object.entries(posCur).forEach(([id, elCurPosition]) => {
        if (oldPosition < elCurPosition && elCurPosition < newPosition)
          posCur[id]--;
        else if (newPosition <= elCurPosition && elCurPosition < oldPosition)
          posCur[id]++;
      });

      // Finally, update the position of the moved element.
      posCur[idStringify(id)] = newPosition;

      callbacks.movedTo(
        id,
        seqArray[posNew[idStringify(id)]].item,
        oldPosition,
        newPosition,
        before);
    },
    removed: function (id) {
      const prevPosition = posCur[idStringify(id)];

      Object.entries(posCur).forEach(([id, pos]) => {
        if (pos >= prevPosition)
          posCur[id]--;
      });

      delete posCur[idStringify(id)];
      lengthCur--;

      callbacks.removedAt(
        id,
        lastSeqArray[posOld[idStringify(id)]].item,
        prevPosition);
    }
  });
  
  Object.entries(posNew).forEach(([idString, pos]) => {

    const id = idParse(idString);
    
    if (has(posOld, idString)) {
      // specifically for primitive types, compare equality before
      // firing the 'changedAt' callback. otherwise, always fire it
      // because doing a deep EJSON comparison is not guaranteed to
      // work (an array can contain arbitrary objects, and 'transform'
      // can be used on cursors). also, deep diffing is not
      // necessarily the most efficient (if only a specific subfield
      // of the object is later accessed).
      const newItem = seqArray[pos].item;
      const oldItem = lastSeqArray[posOld[idString]].item;

      if (typeof newItem === 'object' || newItem !== oldItem)
          callbacks.changedAt(id, newItem, oldItem, pos);
      }
  });
};

seqChangedToEmpty = function (lastSeqArray, callbacks) {
  return [];
};

seqChangedToArray = function (lastSeqArray, array, callbacks) {
  const idsUsed = {};
  const seqArray = array.map((item, index) => {
    let id;
    if (typeof item === 'string') {
      // ensure not empty, since other layers (eg DomRange) assume this as well
      id = `-${item}`;
    } else if (typeof item === 'number' ||
               typeof item === 'boolean' ||
               item === undefined ||
               item === null) {
      id = item;
    } else if (typeof item === 'object') {
      id = (item && ('_id' in item)) ? item._id : index;
    } else {
      throw new Error(`{{#each}} doesn't support arrays with elements of type ${typeof item}`);
    }

    const idString = idStringify(id);
    if (idsUsed[idString]) {
      if (item && typeof item === 'object' && '_id' in item)
        warn(`duplicate id ${id} in`, array);
      id = Random.id();
    } else {
      idsUsed[idString] = true;
    }

    return { _id: id, item: item };
  });

  return seqArray;
};

seqChangedToCursor = function (lastSeqArray, cursor, callbacks) {
  let initial = true; // are we observing initial data from cursor?
  const seqArray = [];

  const observeHandle = cursor.observe({
    addedAt: function (document, atIndex, before) {
      if (initial) {
        // keep track of initial data so that we can diff once
        // we exit `observe`.
        if (before !== null)
          throw new Error("Expected initial data from observe in order");
        seqArray.push({ _id: document._id, item: document });
      } else {
        callbacks.addedAt(document._id, document, atIndex, before);
      }
    },
    changedAt: function (newDocument, oldDocument, atIndex) {
      callbacks.changedAt(newDocument._id, newDocument, oldDocument,
                          atIndex);
    },
    removedAt: function (oldDocument, atIndex) {
      callbacks.removedAt(oldDocument._id, oldDocument, atIndex);
    },
    movedTo: function (document, fromIndex, toIndex, before) {
      callbacks.movedTo(
        document._id, document, fromIndex, toIndex, before);
    }
  });
  initial = false;

  return [seqArray, observeHandle];
};
