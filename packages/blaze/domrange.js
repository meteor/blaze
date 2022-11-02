/* global Blaze */
/* eslint-disable import/no-unresolved */

// A constant empty array (frozen if the JS engine supports it).
const _emptyArray = Object.freeze ? Object.freeze([]) : [];

// `[new] Blaze._DOMRange([nodeAndRangeArray])`
//
// A DOMRange consists of an array of consecutive nodes and DOMRanges,
// which may be replaced at any time with a new array.  If the DOMRange
// has been attached to the DOM at some location, then updating
// the array will cause the DOM to be updated at that location.
class DOMRange {
  constructor(nodeAndRangeArray) {
    const members = (nodeAndRangeArray || _emptyArray);
    if (!(members && (typeof members.length) === 'number')) throw new Error('Expected array');

    members.forEach((m) => this._memberIn(m));

    this.members = members;
    this.emptyRangePlaceholder = null;
    this.attached = false;
    this.parentElement = null;
    this.parentRange = null;
    this.attachedCallbacks = _emptyArray;
  }

  // static methods
  static _insert(rangeOrNode, parentElement, nextNode, _isMove) {
    const m = rangeOrNode;
    if (m instanceof DOMRange) {
      m.attach(parentElement, nextNode, _isMove);
    } else if (_isMove) DOMRange._moveNodeWithHooks(m, parentElement, nextNode);
    else DOMRange._insertNodeWithHooks(m, parentElement, nextNode);
  }

  static _remove(rangeOrNode) {
    const m = rangeOrNode;
    if (m instanceof DOMRange) {
      m.detach();
    } else {
      DOMRange._removeNodeWithHooks(m);
    }
  }

  static _removeNodeWithHooks(n) {
    if (!n.parentNode) return;
    if (n.nodeType === 1 &&
      n.parentNode._uihooks && n.parentNode._uihooks.removeElement) {
      n.parentNode._uihooks.removeElement(n);
    } else {
      n.parentNode.removeChild(n);
    }
  }

  static _insertNodeWithHooks(n, parent, next) {
    // `|| null` because IE throws an error if 'next' is undefined
    const theNext = next || null;
    if (n.nodeType === 1 &&
      parent._uihooks && parent._uihooks.insertElement) {
      parent._uihooks.insertElement(n, theNext);
    } else {
      parent.insertBefore(n, theNext);
    }
  }

  static _moveNodeWithHooks(n, parent, next) {
    if (n.parentNode !== parent) return;
    // `|| null` because IE throws an error if 'next' is undefined
    const theNext = next || null;
    if (n.nodeType === 1 &&
      parent._uihooks && parent._uihooks.moveElement) {
      parent._uihooks.moveElement(n, theNext);
    } else {
      parent.insertBefore(n, theNext);
    }
  }

  static forElement(elem) {
    let theElem = elem;

    if (theElem.nodeType !== 1) throw new Error(`Expected element, found: ${theElem}`);
    let range = null;
    while (theElem && !range) {
      range = (theElem.$blaze_range || null);
      if (!range) theElem = theElem.parentNode;
    }
    return range;
  }

  static _destroy(m, _skipNodes) {
    const _m = m;

    if (_m instanceof DOMRange) {
      if (_m.view) Blaze._destroyView(_m.view, _skipNodes);
    } else if ((!_skipNodes) && _m.nodeType === 1) {
      // DOM Element
      if (_m.$blaze_range) {
        Blaze._destroyNode(_m);
        _m.$blaze_range = null;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _memberOut(m, _skipNodes) {
    DOMRange._destroy(m, _skipNodes);
  }

  attach(parentElement, nextNode, _isMove, _isReplace) {
    // This method is called to insert the DOMRange into the DOM for
    // the first time, but it's also used internally when
    // updating the DOM.
    //
    // If _isMove is true, move this attached range to a different
    // location under the same parentElement.
    if (_isMove || _isReplace) {
      if (!(this.parentElement === parentElement &&
        this.attached)) throw new Error('Can only move or replace an attached DOMRange, and only under the same parent element');
    }

    const { members } = this;
    if (members.length) {
      this.emptyRangePlaceholder = null;
      members.forEach((m) => DOMRange._insert(m, parentElement, nextNode, _isMove));
    } else {
      const placeholder = (
        DOMRange._USE_COMMENT_PLACEHOLDERS ?
          document.createComment('') :
          document.createTextNode(''));
      this.emptyRangePlaceholder = placeholder;
      parentElement.insertBefore(placeholder, nextNode || null);
    }
    this.attached = true;
    this.parentElement = parentElement;

    if (!(_isMove || _isReplace)) {
      this.attachedCallbacks.forEach((obj) => obj.attached && obj.attached(this, parentElement));
    }
  }

  setMembers(newNodeAndRangeArray) {
    const newMembers = newNodeAndRangeArray;
    if (!(newMembers && (typeof newMembers.length) === 'number')) throw new Error('Expected array');

    const oldMembers = this.members;

    oldMembers.forEach((m) => this._memberOut(m));
    newMembers.forEach((m) => this._memberIn(m));

    if (!this.attached) {
      this.members = newMembers;
    } else if (newMembers.length || oldMembers.length) {
      // don't do anything if we're going from empty to empty
      // detach the old members and insert the new members
      const nextNode = this.lastNode().nextSibling;
      const { parentElement } = this;
      // Use detach/attach, but don't fire attached/detached hooks
      this.detach(true /* _isReplace */);
      this.members = newMembers;
      this.attach(parentElement, nextNode, false, true /* _isReplace */);
    }
  }

  firstNode() {
    if (!this.attached) throw new Error('Must be attached');

    if (!this.members.length) return this.emptyRangePlaceholder;

    const m = this.members[0];
    return (m instanceof DOMRange) ? m.firstNode() : m;
  }

  lastNode() {
    if (!this.attached) throw new Error('Must be attached');

    if (!this.members.length) return this.emptyRangePlaceholder;

    const m = this.members[this.members.length - 1];
    return (m instanceof DOMRange) ? m.lastNode() : m;
  }

  detach(_isReplace) {
    if (!this.attached) throw new Error('Must be attached');

    const oldParentElement = this.parentElement;
    const { members } = this;
    if (members.length) {
      members.forEach((m) => DOMRange._remove(m));
    } else {
      const placeholder = this.emptyRangePlaceholder;
      this.parentElement.removeChild(placeholder);
      this.emptyRangePlaceholder = null;
    }

    if (!_isReplace) {
      this.attached = false;
      this.parentElement = null;

      this.attachedCallbacks.forEach((obj) => obj.detached && obj.detached(this, oldParentElement));
    }
  }

  addMember(newMember, atIndex, _isMove) {
    const { members } = this;

    if (!(atIndex >= 0 && atIndex <= members.length)) throw new Error(`Bad index in range.addMember: ${atIndex}`);

    if (!_isMove) this._memberIn(newMember);

    if (!this.attached) {
      // currently detached; just updated members
      members.splice(atIndex, 0, newMember);
    } else if (members.length === 0) {
      // empty; use the empty-to-nonempty handling of setMembers
      this.setMembers([newMember]);
    } else {
      let nextNode;
      if (atIndex === members.length) {
        // insert at end
        nextNode = this.lastNode().nextSibling;
      } else {
        const m = members[atIndex];
        nextNode = (m instanceof DOMRange) ? m.firstNode() : m;
      }
      members.splice(atIndex, 0, newMember);
      DOMRange._insert(newMember, this.parentElement, nextNode, _isMove);
    }
  }

  removeMember(atIndex, _isMove) {
    const { members } = this;

    if (!(atIndex >= 0 && atIndex < members.length)) throw new Error(`Bad index in range.removeMember: ${atIndex}`);

    if (_isMove) {
      members.splice(atIndex, 1);
    } else {
      const oldMember = members[atIndex];
      this._memberOut(oldMember);

      if (members.length === 1) {
        // becoming empty; use the logic in setMembers
        this.setMembers(_emptyArray);
      } else {
        members.splice(atIndex, 1);
        if (this.attached) DOMRange._remove(oldMember);
      }
    }
  }

  moveMember(oldIndex, newIndex) {
    const member = this.members[oldIndex];
    this.removeMember(oldIndex, true /* _isMove */);
    this.addMember(member, newIndex, true /* _isMove */);
  }

  getMember(atIndex) {
    const { members } = this;

    if (!(atIndex >= 0 && atIndex < members.length)) throw new Error(`Bad index in range.getMember: ${atIndex}`);

    return this.members[atIndex];
  }

  _memberIn(m) {
    const _m = m;

    if (_m instanceof DOMRange) _m.parentRange = this;
    else if (_m.nodeType === 1) {
      // DOM Element
      _m.$blaze_range = this;
    }
  }

// Tear down, but don't remove, the members.  Used when chunks
// of DOM are being torn down or replaced.
  destroyMembers(_skipNodes) {
    const { members } = this;
    members.forEach((m) => this._memberOut(m, _skipNodes));
  }

  destroy(_skipNodes) {
    DOMRange._destroy(this, _skipNodes);
  }

  containsElement(elem, selector, event) {
    let _elem = elem;

    const templateName = this.view?.name
      ? this.view.name.split('.')[1]
      : 'unknown template';
    if (!this.attached) {
      throw new Error(`${event} event triggerd with ${selector} on ${templateName} but associated view is not be found.
    Make sure the event doesn't destroy the view.`);
    }

    // An element is contained in this DOMRange if it's possible to
    // reach it by walking parent pointers, first through the DOM and
    // then parentRange pointers.  In other words, the element or some
    // ancestor of it is at our level of the DOM (a child of our
    // parentElement), and this element is one of our members or
    // is a member of a descendant Range.

    // First check that elem is a descendant of this.parentElement,
    // according to the DOM.
    if (!Blaze._elementContains(this.parentElement, _elem)) return false;

    // If elem is not an immediate child of this.parentElement,
    // walk up to its ancestor that is.
    while (_elem.parentNode !== this.parentElement) _elem = _elem.parentNode;

    let range = _elem.$blaze_range;
    while (range && range !== this) range = range.parentRange;

    return range === this;
  }

  containsRange(range) {
    if (!this.attached) throw new Error('Must be attached');

    if (!range.attached) return false;

    let _range = range;

    // A DOMRange is contained in this DOMRange if it's possible
    // to reach this range by following parent pointers.  If the
    // DOMRange has the same parentElement, then it should be
    // a member, or a member of a member etc.  Otherwise, we must
    // contain its parentElement.

    if (_range.parentElement !== this.parentElement) return this.containsElement(_range.parentElement);

    if (_range === this) return false; // don't contain self

    while (_range && _range !== this) _range = _range.parentRange;

    return _range === this;
  }

  onAttached(attached) {
    this.onAttachedDetached({ attached });
  }

  // callbacks are `attached(range, element)` and
  // `detached(range, element)`, and they may
  // access the `callbacks` object in `this`.
  // The arguments to `detached` are the same
  // range and element that were passed to `attached`.
  onAttachedDetached(callbacks) {
    if (this.attachedCallbacks === _emptyArray) this.attachedCallbacks = [];
    this.attachedCallbacks.push(callbacks);
  }

  $(selector) {
    const self = this;

    const parentNode = this.parentElement;
    if (!parentNode) throw new Error('Can\'t select in removed DomRange');

    // Strategy: Find all selector matches under parentNode,
    // then filter out the ones that aren't in this DomRange
    // using `DOMRange#containsElement`.  This is
    // asymptotically slow in the presence of O(N) sibling
    // content that is under parentNode but not in our range,
    // so if performance is an issue, the selector should be
    // run on a child element.

    // Since jQuery can't run selectors on a DocumentFragment,
    // we don't expect findBySelector to work.
    if (parentNode.nodeType === 11 /* DocumentFragment */) throw new Error('Can\'t use $ on an offscreen range');

    let results = Blaze._DOMBackend.findBySelector(selector, parentNode);

    // We don't assume `results` has jQuery API; a plain array
    // should do just as well.  However, if we do have a jQuery
    // array, we want to end up with one also, so we use
    // `.filter`.

    // Function that selects only elements that are actually
    // in this DomRange, rather than simply descending from
    // `parentNode`.
    const filterFunc = function (elem) {
      let _elem = elem;

      // handle jQuery's arguments to filter, where the node
      // is in `this` and the index is the first argument.
      if (typeof _elem === 'number') _elem = this;

      return self.containsElement(_elem);
    };

    if (!results.filter) {
      // not a jQuery array, and not a browser with
      // Array.prototype.filter (e.g. IE <9)
      const newResults = [];
      results.forEach((x) => {
        if (filterFunc(x)) newResults.push(x);
      });
      results = newResults;
    } else {
      // `results.filter` is either jQuery's or ECMAScript's `filter`
      results = results.filter(filterFunc);
    }

    return results;
  }
}

Blaze._DOMRange = DOMRange;

// In IE 8, don't use empty text nodes as placeholders
// in empty DOMRanges, use comment nodes instead.  Using
// empty text nodes in modern browsers is great because
// it doesn't clutter the web inspector.  In IE 8, however,
// it seems to lead in some roundabout way to the OAuth
// pop-up crashing the browser completely.  In the past,
// we didn't use empty text nodes on IE 8 because they
// don't accept JS properties, so just use the same logic
// even though we don't need to set properties on the
// placeholder anymore.
DOMRange._USE_COMMENT_PLACEHOLDERS = (function () {
  let result = false;
  const textNode = document.createTextNode('');
  try {
    textNode.someProp = true;
  } catch (e) {
    // IE 8
    result = true;
  }
  return result;
}());


// Returns true if element a contains node b and is not node b.
//
// The restriction that `a` be an element (not a document fragment,
// say) is based on what's easy to implement cross-browser.
Blaze._elementContains = function (a, b) {
  if (a.nodeType !== 1) {
    // ELEMENT
    return false;
  }
  if (a === b) return false;

  if (a.compareDocumentPosition) {
    // eslint-disable-next-line no-bitwise
    return a.compareDocumentPosition(b) & 0x10;
  }
  // Should be only old IE and maybe other old browsers here.
  // Modern Safari has both functions but seems to get contains() wrong.
  // IE can't handle b being a text node.  We work around this
  // by doing a direct parent test now.
  const _b = b.parentNode;
  if (!(_b && _b.nodeType === 1)) {
    // ELEMENT
    return false;
  }
  if (a === _b) return true;

  return a.contains(_b);
};
