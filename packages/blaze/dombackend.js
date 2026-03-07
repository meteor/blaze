const DOMBackend = {};
Blaze._DOMBackend = DOMBackend;

const $jq = (typeof jQuery !== 'undefined' ? jQuery :
           (typeof Package !== 'undefined' && Package.jquery ?
            (Package.jquery.jQuery || Package.jquery.$) : null));

const _hasJQuery = !!$jq;

if (_hasJQuery && typeof console !== 'undefined') {
  console.info(
    '[Blaze] jQuery detected as DOM backend. Native DOM backend is available — ' +
    'remove the jquery package to enable it. jQuery support will be removed in Blaze 4.0.'
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
  const template = document.createElement('template');
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

    const wrapper = (event) => {
      // event.target can be a text node (nodeType 3) — walk to parent element first
      const origin = event.target;
      const target = origin.nodeType === 1 ? origin.closest(selector) : origin.parentElement?.closest(selector);
      if (target && elem.contains(target)) {
        // Mimic jQuery's delegated event behavior
        Object.defineProperty(event, 'currentTarget', {
          value: target,
          configurable: true,
        });
        handler.call(target, event);
      }
    };

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
      const wrapper = (event) => {
        // event.target can be a text node — walk to parent element first
        const origin = event.target;
        const matched = origin.nodeType === 1 ? origin.closest(selector) : origin.parentElement?.closest(selector);
        if (matched && elem.contains(matched)) {
          Object.defineProperty(event, 'currentTarget', {
            value: matched,
            configurable: true,
          });
          handler.call(elem, event);
        }
      };

      handler._meteorui_wrapper = wrapper;
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


///// Removal detection and interoperability.

const NOOP = function () {};

// Circular doubly-linked list
const TeardownCallback = function (func) {
  this.next = this;
  this.prev = this;
  this.func = func;
};

// Insert newElt before oldElt in the circular list
TeardownCallback.prototype.linkBefore = function (oldElt) {
  this.prev = oldElt.prev;
  this.next = oldElt;
  oldElt.prev.next = this;
  oldElt.prev = this;
};

TeardownCallback.prototype.unlink = function () {
  this.prev.next = this.next;
  this.next.prev = this.prev;
};

TeardownCallback.prototype.go = function () {
  const func = this.func;
  func && func();
};

TeardownCallback.prototype.stop = TeardownCallback.prototype.unlink;

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
}


DOMBackend.findBySelector = function (selector, context) {
  if (_hasJQuery) return $jq(selector, context);
  return Array.from((context || document).querySelectorAll(selector));
};
