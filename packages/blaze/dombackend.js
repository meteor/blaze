const DOMBackend = {};
Blaze._DOMBackend = DOMBackend;

let $jq;
let $jqSource;

if (!$jq && typeof jQuery !== 'undefined') {
  $jq = jQuery;
  $jqSource = 'global scope';
}

if (!$jq && typeof Package !== 'undefined' && Package.jquery) {
  $jq = Package.jquery.jQuery ?? Package.jquery.$ ?? null;
  $jqSource = 'Meteor packages';
}

const _hasJQuery = !!$jq;
if (_hasJQuery && typeof console !== 'undefined') {
  const version = $jq.fn?.jquery ?? ' ';
  console.info(
    `[Blaze] jQuery ${version} detected as DOM backend. Native DOM backend is available — ` +
    'remove jquery to enable native DOM backend. jQuery support will be removed in Blaze 4.0.'
  );
  console.info(
    `[Blaze] jQuery was loaded via ${$jqSource}`
  );
}

DOMBackend._$jq = $jq; // null when absent
DOMBackend._hasJQuery = _hasJQuery;

DOMBackend.getContext = function () {
  if (DOMBackend._context) return DOMBackend._context;
  // jQuery may need the legacy check; native path always supports createHTMLDocument
  const useCreateHTMLDocument = _hasJQuery ? $jq.support.createHTMLDocument : true;
  if (useCreateHTMLDocument) {
    DOMBackend._context = document.implementation.createHTMLDocument("");
    const base = DOMBackend._context.createElement("base");
    base.href = document.location.href;
    DOMBackend._context.head.appendChild(base);
  } else {
    DOMBackend._context = document;
  }
  return DOMBackend._context;
};

DOMBackend.parseHTML = function (html) {
  if (_hasJQuery) {
    return $jq.parseHTML(html, DOMBackend.getContext()) || [];
  }
  const template = DOMBackend.getContext().createElement('template');
  template.innerHTML = html;
  return Array.from(template.content.childNodes);
};

// Native event delegation, mirroring jQuery's: one listener per element and
// event type, dispatching to every delegated handler bound there.
// elem -> Map<eventType, {listener, delegates: Array<{selector, scopedSelector, handler}>}>
const _delegateMap = new WeakMap();

// focus/blur don't bubble — use focusin/focusout for native delegation
// (jQuery does this automatically in .on() delegation)
const _delegateEventAlias = { focus: 'focusin', blur: 'focusout' };

const delegatedEventType = (type) => {
  const eventType = DOMBackend.Events.parseEventType(type);
  // Alias non-bubbling events to their bubbling equivalents
  return _delegateEventAlias[eventType] || eventType;
};

DOMBackend.Events = {
  // `selector` is non-null.  `type` is one type (but
  // may be in backend-specific form, e.g. have namespaces).
  // Order fired must be order bound.
  delegateEvents(elem, type, selector, handler) {
    if (_hasJQuery) {
      $jq(elem).on(type, selector, handler);
      return;
    }

    const eventType = delegatedEventType(type);

    if (!_delegateMap.has(elem)) {
      _delegateMap.set(elem, new Map());
    }
    const typeMap = _delegateMap.get(elem);
    let delegation = typeMap.get(eventType);
    if (!delegation) {
      delegation = { delegates: [] };
      delegation.listener = (event) => {
        dispatchDelegatedEvent(elem, delegation.delegates, event);
      };
      typeMap.set(eventType, delegation);
      elem.addEventListener(eventType, delegation.listener);
    }
    // Replace rather than mutate the array, so that binding or unbinding
    // from inside a handler doesn't change the dispatch in progress
    // (jQuery also snapshots its handler queue before running it).
    delegation.delegates = delegation.delegates.concat({
      selector,
      scopedSelector: scopeSelector(selector),
      handler,
    });
  },

  undelegateEvents(elem, type, handler) {
    if (_hasJQuery) {
      $jq(elem).off(type, '**', handler);
      return;
    }

    const typeMap = _delegateMap.get(elem);
    if (!typeMap) return;

    const eventType = delegatedEventType(type);
    const delegation = typeMap.get(eventType);
    if (!delegation) return;

    delegation.delegates = delegation.delegates.filter(
      (delegate) => delegate.handler !== handler);
    if (delegation.delegates.length === 0) {
      elem.removeEventListener(eventType, delegation.listener);
      typeMap.delete(eventType);
    }
  },

  bindEventCapturer(elem, type, selector, handler) {
    if (_hasJQuery) {
      const $elem = $jq(elem);

      const wrapper = (event) => {
        event = $jq.event.fix(event);
        event.currentTarget = event.target;
        const $target = $jq(event.currentTarget);
        if ($target.is($elem.find(selector)))
          handler.call(elem, event);
      };

      handler._meteorui_wrapper = wrapper;
    } else {
      handler._meteorui_wrapper = createWrapper(elem, type, selector, handler);
    }

    type = DOMBackend.Events.parseEventType(type);
    // add *capturing* event listener
    elem.addEventListener(type, handler._meteorui_wrapper, true);
  },

  unbindEventCapturer(elem, type, handler) {
    type = DOMBackend.Events.parseEventType(type);
    elem.removeEventListener(type, handler._meteorui_wrapper, true);
  },

  parseEventType(type) {
    // strip off namespaces
    const dotLoc = type.indexOf('.');
    if (dotLoc >= 0)
      return type.slice(0, dotLoc);
    return type;
  }
};

// jQuery delegation evaluates the selector rooted at the delegation
// element ($(elem).find(selector)): for 'div p', both the div and the p
// must live inside `elem`. A bare closest(selector) matches against the
// whole document, letting ancestors outside `elem` satisfy the selector.
const scopeSelector = (selector) => selector
    .split(',')
    .map((part) => `:scope ${part}`)
    .join(',');

// Native counterpart of jQuery.event.dispatch for delegated handlers. Like
// jQuery, it walks from event.target up to (excluding) `elem` and, at every
// element on the way, runs each handler whose selector matches it, in the
// order the handlers were bound, with currentTarget set to that element.
// Innermost elements run first. A handler that stops propagation (or returns
// false) lets the remaining handlers at its own level run but stops the
// climb; stopImmediatePropagation stops everything.
const dispatchDelegatedEvent = (elem, delegates, event) => {
    // event.target can be a text node (nodeType 3) — walk to parent element first
    const origin = event.target.nodeType === 1 ? event.target : event.target.parentElement;

    // Build the whole queue before running any handler, as jQuery does, so
    // DOM changes made by a handler don't change which handlers run.
    const queue = [];
    const scopedMatches = new Map();
    const matchesScoped = (delegate, node) => {
        // The unscoped matches() is a cheap prefilter: anything the scoped
        // selector finds also matches the bare selector.
        if (!node.matches(delegate.selector)) return false;
        let matches = scopedMatches.get(delegate.scopedSelector);
        if (!matches) {
            matches = new Set(elem.querySelectorAll(delegate.scopedSelector));
            scopedMatches.set(delegate.scopedSelector, matches);
        }
        return matches.has(node);
    };
    // `elem` itself is excluded: delegated handlers only fire on descendants.
    for (let node = origin; node && node !== elem; node = node.parentElement) {
        const handlers = delegates
            .filter((delegate) => matchesScoped(delegate, node))
            .map((delegate) => delegate.handler);
        if (handlers.length) queue.push({ node, handlers });
    }
    if (!queue.length) return;

    // The native event only exposes stopPropagation() through cancelBubble,
    // which may already be set by another listener on `elem`, and doesn't
    // expose stopImmediatePropagation() at all. Track both calls for the
    // duration of this dispatch, the way jQuery's event object does.
    let propagationStopped = false;
    let immediatePropagationStopped = false;
    const stopPropagation = event.stopPropagation;
    const stopImmediatePropagation = event.stopImmediatePropagation;
    Object.defineProperty(event, 'stopPropagation', {
        value() {
            propagationStopped = true;
            return stopPropagation.call(event);
        },
        configurable: true,
    });
    Object.defineProperty(event, 'stopImmediatePropagation', {
        value() {
            propagationStopped = true;
            immediatePropagationStopped = true;
            return stopImmediatePropagation.call(event);
        },
        configurable: true,
    });

    try {
        for (const { node, handlers } of queue) {
            if (propagationStopped) break;
            // Mimic jQuery's delegated event behavior
            Object.defineProperty(event, 'currentTarget', {
                value: node,
                configurable: true,
            });
            for (const handler of handlers) {
                if (immediatePropagationStopped) break;
                // mimic jQuery event return false behavior
                if (handler.call(node, event) === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }
    } finally {
        delete event.stopPropagation;
        delete event.stopImmediatePropagation;
    }
};

const createWrapper = (elem, type, selector, handler) => {
    const scopedSelector = scopeSelector(selector);

    return (event) => {
        // event.target can be a text node (nodeType 3) — walk to parent element first
        const origin = event.target.nodeType === 1 ? event.target : event.target.parentElement;
        if (!origin) return;

        const matches = new Set(elem.querySelectorAll(scopedSelector));

        // closest ancestor-or-self of the target that the scoped selector
        // matches — the element jQuery would pick as currentTarget. `elem`
        // itself is excluded: delegated handlers only fire on descendants.
        let target = null;
        for (let node = origin; node && node !== elem; node = node.parentElement) {
            if (matches.has(node)) {
                target = node;
                break;
            }
        }

        if (target) {
            // Mimic jQuery's delegated event behavior
            Object.defineProperty(event, 'currentTarget', {
                value: target,
                configurable: true,
            });
            // mimic jQuery event return false behavior
            const value = handler.call(target, event);
            if (value === false) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }
        }
    };
}

///// Removal detection and interoperability.

// For an explanation of this technique, see:
// http://bugs.jquery.com/ticket/12213#comment:23 .
//
// In short, an element is considered "removed" when jQuery
// cleans up its *private* userdata on the element,
// which we can detect using a custom event with a teardown
// hook.

const NOOP = () => {};

// Circular doubly-linked list
class TeardownCallback {
  constructor(func) {
    this.next = this;
    this.prev = this;
    this.func = func;
  }

  // Insert newElt before oldElt in the circular list
  linkBefore(oldElt) {
    this.prev = oldElt.prev;
    this.next = oldElt;
    oldElt.prev.next = this;
    oldElt.prev = this;
  }

  unlink() {
    this.prev.next = this.next;
    this.next.prev = this.prev;
  }

  go() {
    const func = this.func;
    func && func();
  }

  stop() { this.unlink(); }
}

// Shared helper: execute all teardown callbacks on an element
function _executeTeardownCallbacks(elem) {
  const callbacks = elem[DOMBackend.Teardown._CB_PROP];
  if (callbacks) {
    let elt = callbacks.next;
    while (elt !== callbacks) {
      elt.go();
      elt = elt.next;
    }
    callbacks.go();
    elem[DOMBackend.Teardown._CB_PROP] = null;
  }
}

DOMBackend.Teardown = {
  _JQUERY_EVENT_NAME: 'blaze_teardown_watcher',
  _CB_PROP: '$blaze_teardown_callbacks',
  // Registers a callback function to be called when the given element or
  // one of its ancestors is removed from the DOM via the backend library.
  // The callback function is called at most once, and it receives the element
  // in question as an argument.
  onElementTeardown(elem, func) {
    const elt = new TeardownCallback(func);

    const propName = DOMBackend.Teardown._CB_PROP;
    if (!elem[propName]) {
      // create an empty node that is never unlinked
      elem[propName] = new TeardownCallback;

      // Set up the jQuery event, only the first time (only when jQuery is present).
      if (_hasJQuery) {
        $jq(elem).on(DOMBackend.Teardown._JQUERY_EVENT_NAME, NOOP);
      }
    }

    elt.linkBefore(elem[propName]);

    return elt; // so caller can call stop()
  },
  // Recursively call all teardown hooks, in the backend and registered
  // through DOMBackend.onElementTeardown.
  tearDownElement(elem) {
    const elems = [];
    const nodeList = elem.getElementsByTagName('*');
    for (let i = 0; i < nodeList.length; i++) {
      elems.push(nodeList[i]);
    }
    elems.push(elem);

    if (_hasJQuery) {
      // jQuery's cleanData triggers the special event teardown handler
      $jq.cleanData(elems);
    } else {
      // Native path: call teardown callbacks directly
      for (const el of elems) {
        _executeTeardownCallbacks(el);
      }
    }
  }
};

// Register jQuery special event only when jQuery is present
if (_hasJQuery) {
  $jq.event.special[DOMBackend.Teardown._JQUERY_EVENT_NAME] = {
    setup() {
      // This "setup" callback is important even though it is empty!
      // Without it, jQuery will call addEventListener, which is a
      // performance hit, especially with Chrome's async stack trace
      // feature enabled.
    },
    teardown() {
      _executeTeardownCallbacks(this);
    }
  };
} else {
    // in native DOM Backend we need to extend the native remove function
    // to call the TearDown callbacks, registered during materializing
    // for the element and its full descendant subtree.
    (function(removeFn) {
        HTMLElement.prototype.remove = function () {
            DOMBackend.Teardown.tearDownElement(this);
            return removeFn.apply(this, arguments);
        };
    })(HTMLElement.prototype.remove);

}


DOMBackend.findBySelector = function (selector, context) {
  if (_hasJQuery) return $jq(selector, context);
  return Array.from((context || document).querySelectorAll(selector));
};
