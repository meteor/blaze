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

// WeakMap for native event delegation: elem -> Map<handler, Array<{wrapper, eventType}>>
const _delegateMap = new WeakMap();

// focus/blur don't bubble — use focusin/focusout for native delegation
// (jQuery does this automatically in .on() delegation)
const _delegateEventAlias = { focus: 'focusin', blur: 'focusout' };

DOMBackend.Events = {
  // `selector` is non-null.  `type` is one type (but
  // may be in backend-specific form, e.g. have namespaces).
  // Order fired must be order bound.
  delegateEvents(elem, type, selector, handler) {
    if (_hasJQuery) {
      $jq(elem).on(type, selector, handler);
      return;
    }

    let eventType = DOMBackend.Events.parseEventType(type);
    // Alias non-bubbling events to their bubbling equivalents
    eventType = _delegateEventAlias[eventType] || eventType;

    const wrapper = createWrapper(elem, type, selector, handler);

    if (!_delegateMap.has(elem)) {
      _delegateMap.set(elem, new Map());
    }
    const handlerMap = _delegateMap.get(elem);
    // Store wrapper keyed by handler for later removal (eventType stored in the entry)
    const key = handler;
    if (!handlerMap.has(key)) {
      handlerMap.set(key, []);
    }
    handlerMap.get(key).push({ wrapper, eventType });

    elem.addEventListener(eventType, wrapper);
  },

  undelegateEvents(elem, type, handler) {
    if (_hasJQuery) {
      $jq(elem).off(type, '**', handler);
      return;
    }

    const handlerMap = _delegateMap.get(elem);
    if (!handlerMap) return;

    const entries = handlerMap.get(handler);
    if (!entries) return;

    for (const entry of entries) {
      elem.removeEventListener(entry.eventType, entry.wrapper);
    }
    handlerMap.delete(handler);
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

const createWrapper = (elem, type, selector, handler) => {
    return (event) => {
        // event.target can be a text node (nodeType 3) — walk to parent element first
        const origin = event.target;
        const target = origin.nodeType === 1 ? origin.closest(selector) : origin.parentElement?.closest(selector);

        // we need to manually check, if a selector left the template scope
        // which jQuery would do automatically for us.
        // for this we traverse nodes that still match the selector
        // and compare the final to see, if the event bubbled up to
        // a parent view that is out of scope
        let node = origin;
        while (node && node !== elem && node instanceof Element && node.matches(selector)) {
            node = node.parentElement;
        }

        const root = elem?.['$blaze_range']?.view?.name;
        const scope = node?.['$blaze_range']?.view?.name;

        let inScope = true;
        if (root && scope && root === scope) {
            inScope = false;
        }

        if (target && elem.contains(target) && inScope) {
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
    // for the element and its children.
    (function(removeFn) {
        HTMLElement.prototype.remove = function () {
            _executeTeardownCallbacks(this);
            for (const child of this.children) {
                _executeTeardownCallbacks(child);
            }
            return removeFn.apply(this, arguments);
        };
    })(HTMLElement.prototype.remove);

}


DOMBackend.findBySelector = function (selector, context) {
  if (_hasJQuery) return $jq(selector, context);
  return Array.from((context || document).querySelectorAll(selector));
};
