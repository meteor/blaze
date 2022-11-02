/* global Blaze Meteor */
/* eslint-disable import/no-unresolved, class-methods-use-this */

import has from 'lodash.has';
import { OrderedDict } from 'meteor/ordered-dict';

let jsUrlsAllowed = false;
Blaze._allowJavascriptUrls = function () {
  jsUrlsAllowed = true;
};
Blaze._javascriptUrlsAllowed = function () {
  return jsUrlsAllowed;
};

// An AttributeHandler object is responsible for updating a particular attribute
// of a particular element.  AttributeHandler subclasses implement
// browser-specific logic for dealing with particular attributes across
// different browsers.
//
// To define a new type of AttributeHandler, use
// `var FooHandler = AttributeHandler.extend({ update: function ... })`
// where the `update` function takes arguments `(element, oldValue, value)`.
// The `element` argument is always the same between calls to `update` on
// the same instance.  `oldValue` and `value` are each either `null` or
// a Unicode string of the type that might be passed to the value argument
// of `setAttribute` (i.e. not an HTML string with character references).
// When an AttributeHandler is installed, an initial call to `update` is
// always made with `oldValue = null`.  The `update` method can access
// `this.name` if the AttributeHandler class is a generic one that applies
// to multiple attribute names.
//
// AttributeHandlers can store custom properties on `this`, as long as they
// don't use the names `element`, `name`, `value`, and `oldValue`.
//
// AttributeHandlers can't influence how attributes appear in rendered HTML,
// only how they are updated after materialization as DOM.
class AttributeHandler {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  update(element, oldValue, value) {
    if (value === null) {
      if (oldValue !== null) element.removeAttribute(this.name);
    } else {
      element.setAttribute(this.name, value);
    }
  }
}


Blaze._AttributeHandler = AttributeHandler;

// Apply the diff between the attributes of "oldValue" and "value" to "element."
//
// Each subclass must implement a parseValue method which takes a string
// as an input and returns an ordered dict of attributes. The keys of the dict
// are unique identifiers (i.e. css properties in the case of styles), and the
// values are the entire attribute which will be injected into the element.
//
// Extended below to support classes, SVG elements and styles.
class _DiffingAttributeHandler extends AttributeHandler {
  update(element, oldValue, value) {
    if (!this.getCurrentValue || !this.setValue || !this.parseValue || !this.joinValues) throw new Error("Missing methods in subclass of 'DiffingAttributeHandler'");

    const oldAttrsMap = oldValue ? this.parseValue(oldValue) : new OrderedDict();
    const attrsMap = value ? this.parseValue(value) : new OrderedDict();

    // the current attributes on the element, which we will mutate.

    const currentAttrString = this.getCurrentValue(element);
    const currentAttrsMap = currentAttrString ? this.parseValue(currentAttrString) : new OrderedDict();

    // Any outside changes to attributes we add at the end.
    currentAttrsMap.forEach(function (attr, key) {
      // If the key already exists, we do not use the current value, but the new value.
      if (attrsMap.has(key)) {
        return;
      }

      // Key does not already exist, but it existed before. Which means it was explicitly
      // removed, so we do not add it.
      if (oldAttrsMap.has(key)) {
        return;
      }

      attrsMap.append(key, attr);
    });

    const values = [];

    attrsMap.forEach(function (attr) {
      values.push(attr);
    });

    this.setValue(element, this.joinValues(values));
  }
}

Blaze._DiffingAttributeHandler = _DiffingAttributeHandler;

class ClassHandler extends _DiffingAttributeHandler {
  getCurrentValue(element) {
    return element.className;
  }

  setValue(element, className) {
    const theElement = element;
    theElement.className = className;
  }

  parseValue(attrString) {
    const tokens = new OrderedDict();

    attrString.split(' ').forEach(function (token) {
      if (token) {
        // Ordered dict requires unique keys.
        if (!tokens.has(token)) {
          tokens.append(token, token);
        }
      }
    });
    return tokens;
  }

  joinValues(values) {
    return values.join(' ');
  }
}

class SVGClassHandler extends ClassHandler {
  getCurrentValue(element) {
    return element.className.baseVal;
  }

  setValue(element, className) {
    element.setAttribute('class', className);
  }
}

class StyleHandler extends _DiffingAttributeHandler {
  getCurrentValue(element) {
    return element.getAttribute('style');
  }

  setValue(element, style) {
    if (style === '') {
      element.removeAttribute('style');
    } else {
      element.setAttribute('style', style);
    }
  }

  // Parse a string to produce a map from property to attribute string.
  //
  // Example:
  // "color:red; foo:12px" produces a token {color: "color:red", foo:"foo:12px"}
  parseValue(attrString) {
    const tokens = new OrderedDict();

    // Regex for parsing a css attribute declaration, taken from css-parse:
    // https://github.com/reworkcss/css-parse/blob/7cef3658d0bba872cde05a85339034b187cb3397/index.js#L219
    const regex = /(\*?[-#/*\\\w]+(?:\[[0-9a-z_-]+])?)\s*:\s*(?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+[;\s]*/g;
    let match = regex.exec(attrString);
    while (match) {
      // match[0] = entire matching string
      // match[1] = css property
      // Prefix the token to prevent conflicts with existing properties.

      // We use the last value for the same key.
      if (tokens.has(match[1])) {
        tokens.remove(match[1]);
      }

      tokens.append(match[1], match[0].trim());

      match = regex.exec(attrString);
    }

    return tokens;
  }

  joinValues(values) {
    // TODO: Assure that there is always ; between values. But what is an example where it breaks?
    return values.join(' ');
  }
}

class BooleanHandler extends AttributeHandler {
  update(element, oldValue, value) {
    const { name } = this;
    const theElement = element;

    if (value == null) {
      if (oldValue != null) theElement[name] = false;
    } else {
      theElement[name] = true;
    }
  }
}

class DOMPropertyHandler extends AttributeHandler {
  update(element, oldValue, value) {
    const theElement = element;

    const { name } = this;
    if (value !== theElement[name]) theElement[name] = value;
  }
}

// attributes of the type 'xlink:something' should be set using
// the correct namespace in order to work
class XlinkHandler extends AttributeHandler {
  update(element, oldValue, value) {
    const NS = 'http://www.w3.org/1999/xlink';
    if (value === null) {
      if (oldValue !== null) element.removeAttributeNS(NS, this.name);
    } else {
      element.setAttributeNS(NS, this.name, this.value);
    }
  }
}

// cross-browser version of `instanceof SVGElement`
const isSVGElement = function (elem) {
  return 'ownerSVGElement' in elem;
};

const isUrlAttribute = function (tagName, attrName) {
  // Compiled from http://www.w3.org/TR/REC-html40/index/attributes.html
  // and
  // http://www.w3.org/html/wg/drafts/html/master/index.html#attributes-1
  const urlAttrs = {
    FORM: ['action'],
    BODY: ['background'],
    BLOCKQUOTE: ['cite'],
    Q: ['cite'],
    DEL: ['cite'],
    INS: ['cite'],
    OBJECT: ['classid', 'codebase', 'data', 'usemap'],
    APPLET: ['codebase'],
    A: ['href'],
    AREA: ['href'],
    LINK: ['href'],
    IMG: ['longdesc', 'src', 'usemap'],
    FRAME: ['longdesc', 'src'],
    IFRAME: ['longdesc', 'src'],
    HEAD: ['profile'],
    SCRIPT: ['src'],
    INPUT: ['src', 'usemap', 'formaction'],
    BUTTON: ['formaction'],
    BASE: ['href'],
    MENUITEM: ['icon'],
    HTML: ['manifest'],
    VIDEO: ['poster'],
  };

  if (attrName === 'itemid') {
    return true;
  }

  const urlAttrNames = urlAttrs[tagName] || [];
  return urlAttrNames.includes(attrName);
};

// To get the protocol for a URL, we let the browser normalize it for
// us, by setting it as the href for an anchor tag and then reading out
// the 'protocol' property.
let anchorForNormalization;
if (Meteor.isClient) {
  anchorForNormalization = document.createElement('A');
}

const getUrlProtocol = function (url) {
  if (Meteor.isClient) {
    anchorForNormalization.href = url;
    return (anchorForNormalization.protocol || '').toLowerCase();
  }
  throw new Error('getUrlProtocol not implemented on the server');
};

// UrlHandler is an attribute handler for all HTML attributes that take
// URL values. It disallows javascript: URLs, unless
// Blaze._allowJavascriptUrls() has been called. To detect javascript:
// urls, we set the attribute on a dummy anchor element and then read
// out the 'protocol' property of the attribute.
const origUpdate = AttributeHandler.prototype.update;

class UrlHandler extends AttributeHandler {
  update(element, oldValue, value) {
    const self = this;

    const args = [element, oldValue, value];

    if (Blaze._javascriptUrlsAllowed()) {
      origUpdate.apply(self, args);
    } else {
      // eslint-disable-next-line no-script-url
      const isJavascriptProtocol = (getUrlProtocol(value) === 'javascript:');
      const isVBScriptProtocol = (getUrlProtocol(value) === 'vbscript:');
      if (isJavascriptProtocol || isVBScriptProtocol) {
        Blaze._warn("URLs that use the 'javascript:' or 'vbscript:' protocol are not " +
          'allowed in URL attribute values. ' +
          'Call Blaze._allowJavascriptUrls() ' +
          'to enable them.');
        origUpdate.apply(self, [element, oldValue, null]);
      } else {
        origUpdate.apply(self, args);
      }
    }
  }
}

// XXX make it possible for users to register attribute handlers!
Blaze._makeAttributeHandler = function (elem, name, value) {
  // generally, use setAttribute but certain attributes need to be set
  // by directly setting a JavaScript property on the DOM element.
  if (name === 'class') {
    if (isSVGElement(elem)) {
      return new SVGClassHandler(name, value);
    }
    return new ClassHandler(name, value);
  }
  if (name === 'style') {
    return new StyleHandler(name, value);
  }
  if ((elem.tagName === 'OPTION' && name === 'selected') ||
    (elem.tagName === 'INPUT' && name === 'checked') ||
    (elem.tagName === 'VIDEO' && name === 'muted')) {
    return new BooleanHandler(name, value);
  }
  if ((elem.tagName === 'TEXTAREA' || elem.tagName === 'INPUT')
    && name === 'value') {
    // internally, TEXTAREAs tracks their value in the 'value'
    // attribute just like INPUTs.
    return new DOMPropertyHandler(name, value);
  }
  if (name.substring(0, 6) === 'xlink:') {
    return new XlinkHandler(name.substring(6), value);
  }
  if (isUrlAttribute(elem.tagName, name)) {
    return new UrlHandler(name, value);
  }
  return new AttributeHandler(name, value);


  // XXX will need one for 'style' on IE, though modern browsers
  // seem to handle setAttribute ok.
};

class ElementAttributesUpdater {
  constructor(elem) {
    this.elem = elem;
    this.handlers = {};
  }

// Update attributes on `elem` to the dictionary `attrs`, whose
// values are strings.
  update = function (newAttrs) {
    const { elem } = this;
    const { handlers } = this;

    Object.getOwnPropertyNames(handlers).forEach((k) => {
      if (!has(newAttrs, k)) {
        // remove attributes (and handlers) for attribute names
        // that don't exist as keys of `newAttrs` and so won't
        // be visited when traversing it.  (Attributes that
        // exist in the `newAttrs` object but are `null`
        // are handled later.)
        const handler = handlers[k];
        const oldValue = handler.value;
        handler.value = null;
        handler.update(elem, oldValue, null);
        delete handlers[k];
      }
    });

    Object.getOwnPropertyNames(newAttrs).forEach((k) => {
      let handler = null;
      let oldValue = null;
      const value = newAttrs[k];
      if (!has(handlers, k)) {
        if (value !== null) {
          // make new handler
          handler = Blaze._makeAttributeHandler(elem, k, value);
          handlers[k] = handler;
        }
      } else {
        handler = handlers[k];
        oldValue = handler.value;
      }
      if (oldValue !== value) {
        handler.value = value;
        handler.update(elem, oldValue, value);
        if (value === null) delete handlers[k];
      }
    });
  }
}

Blaze.ElementAttributesUpdater = ElementAttributesUpdater;
