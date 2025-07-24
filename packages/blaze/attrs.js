/**
 * Blaze Attribute Management System
 * 
 * This module provides a comprehensive system for managing HTML attributes in Blaze templates.
 * It handles different types of attributes (URLs, styles, classes, boolean attributes, etc.)
 * with specialized handlers that ensure cross-browser compatibility and security.
 */

import has from 'lodash.has';
import { OrderedDict } from 'meteor/ordered-dict';

// Global security configuration for JavaScript URLs
// By default, javascript: and vbscript: URLs are blocked for security
let jsUrlsAllowed = false;

/**
 * Enable javascript: URLs in href and other URL attributes
 * WARNING: Only call this if you trust all URL sources in your application
 */
Blaze._allowJavascriptUrls = function () {
  jsUrlsAllowed = true;
};

/**
 * Check if javascript: URLs are currently allowed
 * @returns {boolean} True if javascript: URLs are permitted
 */
Blaze._javascriptUrlsAllowed = function () {
  return jsUrlsAllowed;
};

/**
 * AttributeHandler Base Class
 * 
 * An AttributeHandler object is responsible for updating a particular attribute
 * of a particular element. AttributeHandler subclasses implement browser-specific 
 * logic for dealing with particular attributes across different browsers.
 *
 * Key Features:
 * - Manages the lifecycle of a single HTML attribute
 * - Provides extension mechanism for specialized attribute types
 * - Handles cross-browser compatibility issues
 * - Works only on materialized DOM (not during HTML rendering)
 *
 * Usage:
 * To define a new type of AttributeHandler, use:
 * `var FooHandler = AttributeHandler.extend({ update: function ... })`
 * where the `update` function takes arguments `(element, oldValue, value)`.
 * 
 * @param {string} name - The attribute name (e.g., 'class', 'href', 'style')
 * @param {string|null} value - The initial attribute value
 */
AttributeHandler = function (name, value) {
  this.name = name;   // The HTML attribute name this handler manages
  this.value = value; // Current value of the attribute
};
Blaze._AttributeHandler = AttributeHandler;

/**
 * Default update method for attributes
 * 
 * This is the standard implementation that uses setAttribute/removeAttribute.
 * Specialized handlers override this method to provide custom behavior.
 * 
 * @param {Element} element - The DOM element to update
 * @param {string|null} oldValue - The previous attribute value
 * @param {string|null} value - The new attribute value (null means remove)
 */
AttributeHandler.prototype.update = function (element, oldValue, value) {
  if (value === null) {
    // Remove the attribute if the new value is null and it previously existed
    if (oldValue !== null)
      element.removeAttribute(this.name);
  } else {
    // Set the attribute to the new value
    element.setAttribute(this.name, value);
  }
};

/**
 * Create a subclass of AttributeHandler with custom behavior
 * 
 * This is the extension mechanism used throughout Blaze to create specialized
 * handlers for different attribute types (classes, styles, URLs, etc.)
 * 
 * @param {Object} options - Methods to override in the subclass (typically 'update')
 * @returns {Function} New AttributeHandler subclass constructor
 */
AttributeHandler.extend = function (options) {
  const curType = this;
  const subType = function AttributeHandlerSubtype(/*arguments*/) {
    AttributeHandler.apply(this, arguments);
  };
  subType.prototype = new curType;
  subType.extend = curType.extend;
  if (options) {
    Object.assign(subType.prototype, options);
  }
  return subType;
};

/**
 * DiffingAttributeHandler - Advanced attribute handler for complex attributes
 * 
 * This handler is used for attributes that contain multiple sub-values that need
 * to be managed individually (like CSS classes or inline styles). Instead of 
 * replacing the entire attribute value, it diffs the old and new values and only
 * updates what has changed.
 * 
 * Key Features:
 * - Preserves external changes to the attribute (e.g., classes added by other libraries)
 * - Only updates the parts that have actually changed
 * - Maintains proper ordering of attribute values
 * 
 * Required Methods for Subclasses:
 * - getCurrentValue(element): Get current attribute value from DOM
 * - setValue(element, value): Set the complete attribute value on DOM
 * - parseValue(string): Parse attribute string into OrderedDict of components
 * - joinValues(array): Join array of values back into attribute string
 * 
 * Used by: ClassHandler, StyleHandler, SVGClassHandler
 */
Blaze._DiffingAttributeHandler = AttributeHandler.extend({
  /**
   * Update the attribute by diffing old vs new values
   * This preserves any external changes while applying our updates
   */
  update: function (element, oldValue, value) {
    // Ensure all required methods are implemented by subclass
    if (!this.getCurrentValue || !this.setValue || !this.parseValue || !this.joinValues)
      throw new Error("Missing methods in subclass of 'DiffingAttributeHandler'");

    // Parse old and new values into component maps
    const oldAttrsMap = oldValue ? this.parseValue(oldValue) : new OrderedDict();
    const attrsMap = value ? this.parseValue(value) : new OrderedDict();

    // Get the current state from the DOM (may include external changes)
    const currentAttrString = this.getCurrentValue(element);
    const currentAttrsMap = currentAttrString ? this.parseValue(currentAttrString) : new OrderedDict();

    // Preserve any external changes by adding them to our new attribute map
    currentAttrsMap.forEach(function (value, key, i) {
      // If we're setting this key ourselves, use our value instead
      if (attrsMap.has(key)) {
        return;
      }

      // If this key existed in the old value but not the new value,
      // it was explicitly removed, so don't preserve it
      if (oldAttrsMap.has(key)) {
        return;
      }

      // This is an external change - preserve it
      attrsMap.append(key, value);
    });

    // Convert the final attribute map back to an array of values
    const values = [];
    attrsMap.forEach(function (value, key, i) {
      values.push(value);
    });

    // Apply the final result to the DOM element
    this.setValue(element, this.joinValues(values));
  }
});

/**
 * ClassHandler - Manages CSS class attributes
 * 
 * Handles the 'class' attribute by treating it as a space-separated list of 
 * individual class names. This allows for intelligent merging where:
 * - Classes can be added/removed individually
 * - External class changes (from other libraries) are preserved
 * - Duplicate classes are automatically handled
 * 
 * Example: If template sets "foo bar" and external code adds "baz",
 * the final result will be "foo bar baz"
 */
const ClassHandler = Blaze._DiffingAttributeHandler.extend({
  /**
   * Get current class attribute value from the DOM element
   * @param {Element} element - The DOM element
   * @returns {string} Current className property value
   */
  getCurrentValue: function (element) {
    return element.className;
  },
  
  /**
   * Set the complete class attribute on the DOM element
   * @param {Element} element - The DOM element
   * @param {string} className - Complete class string to set
   */
  setValue: function (element, className) {
    element.className = className;
  },
  
  /**
   * Parse a class string into individual class names
   * @param {string} attrString - Space-separated class names
   * @returns {OrderedDict} Map of class names (both key and value are the class name)
   */
  parseValue: function (attrString) {
    const tokens = new OrderedDict();

    attrString.split(' ').forEach(function (token) {
      if (token) {
        // Only add each class once (OrderedDict prevents duplicates)
        if (! tokens.has(token)) {
          tokens.append(token, token);
        }
      }
    });
    return tokens;
  },
  
  /**
   * Join individual class names back into a space-separated string
   * @param {Array} values - Array of class names
   * @returns {string} Space-separated class string
   */
  joinValues: function (values) {
    return values.join(' ');
  }
});

/**
 * SVGClassHandler - Manages class attributes for SVG elements
 * 
 * SVG elements handle classes differently than regular HTML elements.
 * The className property is an object with a baseVal property for SVG elements.
 * This handler ensures proper SVG class attribute management.
 */
const SVGClassHandler = ClassHandler.extend({
  /**
   * Get current class value from SVG element
   * SVG className is an object, we need the baseVal property
   */
  getCurrentValue: function (element) {
    return element.className.baseVal;
  },
  
  /**
   * Set class attribute on SVG element using setAttribute
   * SVG elements require setAttribute rather than className assignment
   */
  setValue: function (element, className) {
    element.setAttribute('class', className);
  }
});

/**
 * StyleHandler - Manages inline CSS style attributes
 * 
 * Handles the 'style' attribute by treating it as individual CSS properties.
 * This allows for intelligent merging where:
 * - Individual CSS properties can be managed separately
 * - External style changes are preserved
 * - Property conflicts are resolved (later values win)
 * 
 * Example: If template sets "color: red; font-size: 14px" and external code 
 * adds "background: blue", the result will include all three properties.
 */
const StyleHandler = Blaze._DiffingAttributeHandler.extend({
  /**
   * Get current style attribute value from the DOM element
   */
  getCurrentValue: function (element) {
    return element.getAttribute('style');
  },
  
  /**
   * Set the complete style attribute on the DOM element
   * Removes the attribute entirely if style is empty
   */
  setValue: function (element, style) {
    if (style === '') {
      element.removeAttribute('style');
    } else {
      element.setAttribute('style', style);
    }
  },

  /**
   * Parse a CSS style string into individual properties
   * 
   * Uses a regex to extract individual CSS property declarations.
   * Each property becomes a key-value pair where both key and value
   * contain the complete "property: value" string.
   * 
   * Example: "color:red; font-size:14px" becomes:
   * { "color": "color:red", "font-size": "font-size:14px" }
   * 
   * @param {string} attrString - CSS style string to parse
   * @returns {OrderedDict} Map of CSS properties
   */
  parseValue: function (attrString) {
    const tokens = new OrderedDict();

    // Regex for parsing CSS property declarations, adapted from css-parse library
    // Matches: property-name: value; (with support for quoted strings and functions)
    const regex = /(\*?[-#\/\*\\\w]+(?:\[[0-9a-z_-]+\])?)\s*:\s*(?:\'(?:\\\'|.)*?\'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+[;\s]*/g;
    let match = regex.exec(attrString);
    while (match) {
      // match[0] = entire matching string (e.g., "color: red;")
      // match[1] = CSS property name (e.g., "color")

      // If this property already exists, remove the old value (last one wins)
      if (tokens.has(match[1])) {
        tokens.remove(match[1]);
      }

      // Store the complete property declaration
      tokens.append(match[1], match[0].trim());

      match = regex.exec(attrString);
    }

    return tokens;
  },

  /**
   * Join CSS property declarations back into a style string
   * @param {Array} values - Array of CSS property declarations
   * @returns {string} Complete CSS style string
   */
  joinValues: function (values) {
    // Join all CSS properties with spaces (semicolons are already included in each value)
    return values.join(' ');
  }
});

/**
 * BooleanHandler - Manages boolean HTML attributes
 * 
 * Some HTML attributes are boolean (like 'checked', 'selected', 'muted').
 * These need to be set as DOM properties rather than attributes, and their
 * value should be true/false rather than a string.
 * 
 * Used for: input[checked], option[selected], video[muted]
 */
const BooleanHandler = AttributeHandler.extend({
  /**
   * Update boolean attribute by setting DOM property
   * @param {Element} element - The DOM element
   * @param {*} oldValue - Previous value (ignored)
   * @param {*} value - New value (truthy = true, falsy = false)
   */
  update: function (element, oldValue, value) {
    const name = this.name;
    if (value == null) {
      if (oldValue != null)
        element[name] = false;
    } else {
      element[name] = true;
    }
  }
});

/**
 * DOMPropertyHandler - Manages attributes that should be set as DOM properties
 * 
 * Some attributes work better when set as DOM properties rather than HTML attributes.
 * This handler only updates the property if the value has actually changed,
 * avoiding unnecessary DOM operations.
 * 
 * Used for: textarea[value], input[value]
 */
const DOMPropertyHandler = AttributeHandler.extend({
  /**
   * Update DOM property only if value has changed
   * @param {Element} element - The DOM element
   * @param {*} oldValue - Previous value (ignored)
   * @param {*} value - New value to set
   */
  update: function (element, oldValue, value) {
    const name = this.name;
    // Only update if the value has actually changed
    if (value !== element[name])
      element[name] = value;
  }
});

/**
 * XlinkHandler - Manages XLink namespace attributes for SVG elements
 * 
 * SVG elements often use XLink attributes (like xlink:href) that require
 * special namespace handling. These must be set using setAttributeNS
 * with the proper XLink namespace URI.
 * 
 * Used for: Any attribute starting with 'xlink:' (e.g., xlink:href)
 */
const XlinkHandler = AttributeHandler.extend({
  /**
   * Update XLink attribute using proper namespace methods
   */
  update: function(element, oldValue, value) {
    const NS = 'http://www.w3.org/1999/xlink';
    if (value === null) {
      if (oldValue !== null)
        element.removeAttributeNS(NS, this.name);
    } else {
      element.setAttributeNS(NS, this.name, this.value);
    }
  }
});

/**
 * Cross-browser check for SVG elements
 * 
 * Determines if an element is an SVG element by checking for the
 * 'ownerSVGElement' property, which is present on all SVG elements.
 * 
 * @param {Element} elem - DOM element to check
 * @returns {boolean} True if element is an SVG element
 */
const isSVGElement = function (elem) {
  return 'ownerSVGElement' in elem;
};

/**
 * Determine if an attribute contains URL values
 * 
 * Checks if a given attribute on a specific HTML tag is expected to contain
 * URL values. This is used to apply URL security validation to prevent
 * javascript: and vbscript: URLs in href and similar attributes.
 * 
 * Based on HTML4 and HTML5 specifications for URL-type attributes.
 * 
 * @param {string} tagName - HTML tag name (uppercase, e.g., 'A', 'IMG')
 * @param {string} attrName - Attribute name (e.g., 'href', 'src')
 * @returns {boolean} True if this attribute typically contains URLs
 */
const isUrlAttribute = function (tagName, attrName) {
  // Map of HTML tags to their URL-containing attributes
  // Compiled from HTML4/HTML5 specifications
  const urlAttrs = {
    FORM: ['action'],                    // Form submission URL
    BODY: ['background'],                // Background image URL
    BLOCKQUOTE: ['cite'],               // Citation URL
    Q: ['cite'],                        // Citation URL for inline quotes
    DEL: ['cite'],                      // Citation for deletion
    INS: ['cite'],                      // Citation for insertion
    OBJECT: ['classid', 'codebase', 'data', 'usemap'], // Object URLs
    APPLET: ['codebase'],               // Applet code base URL
    A: ['href'],                        // Link destination
    AREA: ['href'],                     // Image map area link
    LINK: ['href'],                     // Linked resource URL
    IMG: ['longdesc', 'src', 'usemap'], // Image URLs and descriptions
    FRAME: ['longdesc', 'src'],         // Frame source and description
    IFRAME: ['longdesc', 'src'],        // IFrame source and description
    HEAD: ['profile'],                  // Profile URL
    SCRIPT: ['src'],                    // Script source URL
    INPUT: ['src', 'usemap', 'formaction'], // Input image and form action
    BUTTON: ['formaction'],             // Button form action
    BASE: ['href'],                     // Base URL for relative links
    MENUITEM: ['icon'],                 // Menu item icon URL
    HTML: ['manifest'],                 // Application manifest URL
    VIDEO: ['poster']                   // Video poster image URL
  };

  // Special case: itemid attribute (microdata) can contain URLs
  if (attrName === 'itemid') {
    return true;
  }

  // Check if this tag/attribute combination is a URL attribute
  const urlAttrNames = urlAttrs[tagName] || [];
  return urlAttrNames.includes(attrName);
};

/**
 * URL Protocol Detection System
 * 
 * These components work together to efficiently and securely detect URL protocols,
 * particularly to block dangerous protocols like javascript: and vbscript:.
 */

/**
 * Reusable anchor element for URL normalization
 * 
 * We use the browser's built-in URL parsing by setting a URL as the href
 * of an anchor element, then reading the normalized protocol property.
 * This handles edge cases and browser differences in URL parsing.
 * 
 * Only created on the client side since DOM is not available on server.
 */
let anchorForNormalization
if (Meteor.isClient) {
  anchorForNormalization = document.createElement('A');
}

/**
 * Protocol cache for performance optimization
 * 
 * Since URL protocol detection requires DOM manipulation, we cache results
 * to avoid repeated operations on the same URLs. Uses LRU-style eviction
 * to prevent memory leaks in long-running applications.
 */
const _protocolCache = new Map(); 
const MAX_CACHE_SIZE = 1000;

/**
 * Extract and normalize the protocol from a URL
 * 
 * Uses the browser's URL parsing to handle edge cases and return a normalized
 * protocol string. Results are cached for performance.
 * 
 * @param {string} url - The URL to analyze
 * @returns {string} Normalized protocol (e.g., "http:", "javascript:")
 * @throws {Error} When called on the server (not implemented)
 */
const getUrlProtocol = function (url) {
  // Check cache first for performance
  if (_protocolCache.has(url)) {
    return _protocolCache.get(url);
  }
  
  if (Meteor.isClient) {
    // Use browser's URL parsing via anchor element
    anchorForNormalization.href = url;
    const protocol = (anchorForNormalization.protocol || "").toLowerCase();
    
    // Implement simple LRU cache eviction to prevent memory leaks
    if (_protocolCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry (first key in insertion order)
      const firstKey = _protocolCache.keys().next().value;
      _protocolCache.delete(firstKey);
    }
    
    // Cache the result for future use
    _protocolCache.set(url, protocol);
    return protocol;
  } else {
    throw new Error('getUrlProtocol not implemented on the server');
  }
};

/**
 * UrlHandler - Security-aware handler for URL attributes
 * 
 * This specialized attribute handler provides security protection for attributes
 * that contain URLs (like href, src, action, etc.). It automatically blocks
 * potentially dangerous protocols like javascript: and vbscript: unless
 * explicitly allowed by calling Blaze._allowJavascriptUrls().
 * 
 * Security Features:
 * - Blocks javascript: and vbscript: protocols by default
 * - Uses browser URL parsing to handle edge cases
 * - Provides clear warning messages when URLs are blocked
 * - Can be disabled for trusted applications
 * 
 * Used for: All URL-containing attributes (href, src, action, etc.)
 */
const origUpdate = AttributeHandler.prototype.update;
const UrlHandler = AttributeHandler.extend({
  /**
   * Update URL attribute with security validation
   * 
   * @param {Element} element - The DOM element to update
   * @param {string|null} oldValue - Previous attribute value
   * @param {string|null} value - New URL value to validate and set
   */
  update: function (element, oldValue, value) {
    const self = this;
    const args = arguments;

    // If JavaScript URLs are explicitly allowed, skip validation
    if (Blaze._javascriptUrlsAllowed()) {
      origUpdate.apply(self, args);
    } else {
      // Only validate non-null values
      if (value != null) {
        // Check for dangerous protocols
        const isJavascriptProtocol = (getUrlProtocol(value) === "javascript:");
        const isVBScriptProtocol   = (getUrlProtocol(value) === "vbscript:");
        
        if (isJavascriptProtocol || isVBScriptProtocol) {
          // Block dangerous URL and show warning
          Blaze._warn("URLs that use the 'javascript:' or 'vbscript:' protocol are not " +
          "allowed in URL attribute values. " +
          "Call Blaze._allowJavascriptUrls() " +
          "to enable them.");
          // Set attribute to null instead of the dangerous URL
          origUpdate.apply(self, [element, oldValue, null]);
        } else {
          // URL is safe, proceed with normal update
          origUpdate.apply(self, args);
        }
      } else {
        // Value is null/undefined, proceed with normal update
        origUpdate.apply(self, args);
      }
    }
  }
});

/**
 * Attribute Handler Factory
 * 
 * This is the main factory function that determines which type of AttributeHandler
 * to use for a given element/attribute combination. It analyzes the element type
 * and attribute name to choose the most appropriate handler.
 * 
 * Handler Selection Logic:
 * 1. Class attributes -> ClassHandler (or SVGClassHandler for SVG)
 * 2. Style attributes -> StyleHandler  
 * 3. Boolean attributes -> BooleanHandler
 * 4. Form value attributes -> DOMPropertyHandler
 * 5. XLink attributes -> XlinkHandler
 * 6. URL attributes -> UrlHandler
 * 7. Everything else -> basic AttributeHandler
 * 
 * @param {Element} elem - The DOM element that will have this attribute
 * @param {string} name - The attribute name (e.g., 'class', 'href')
 * @param {string|null} value - The initial attribute value
 * @returns {AttributeHandler} Appropriate handler instance for this attribute
 */
Blaze._makeAttributeHandler = function (elem, name, value) {
  // Class attributes need special handling for space-separated values
  if (name === 'class') {
    if (isSVGElement(elem)) {
      return new SVGClassHandler(name, value);
    } else {
      return new ClassHandler(name, value);
    }
  } 
  // Style attributes need CSS property parsing
  else if (name === 'style') {
    return new StyleHandler(name, value);
  } 
  // Boolean attributes should be set as DOM properties, not HTML attributes
  else if ((elem.tagName === 'OPTION' && name === 'selected') ||
           (elem.tagName === 'INPUT' && name === 'checked') ||
           (elem.tagName === 'VIDEO' && name === 'muted')) {
    return new BooleanHandler(name, value);
  } 
  // Form input values work better as DOM properties
  else if ((elem.tagName === 'TEXTAREA' || elem.tagName === 'INPUT') && name === 'value') {
    // Both TEXTAREA and INPUT track their value in the DOM 'value' property
    return new DOMPropertyHandler(name, value);
  } 
  // XLink attributes need namespace handling for SVG
  else if (name.substring(0,6) === 'xlink:') {
    // Remove 'xlink:' prefix and use XLink namespace
    return new XlinkHandler(name.substring(6), value);
  } 
  // URL attributes need security validation
  else if (isUrlAttribute(elem.tagName, name)) {
    return new UrlHandler(name, value);
  } 
  // Default case: use basic attribute handler
  else {
    return new AttributeHandler(name, value);
  }
};

/**
 * ElementAttributesUpdater - Manages all attributes for a single DOM element
 * 
 * This class coordinates attribute updates for a single DOM element by:
 * 1. Maintaining a registry of AttributeHandlers for each attribute
 * 2. Efficiently updating only changed attributes
 * 3. Cleaning up removed attributes
 * 4. Optimizing performance with caching
 * 
 * Key Features:
 * - Avoids redundant DOM operations when values haven't changed
 * - Handles attribute addition, modification, and removal
 * - Works with all attribute handler types
 * - Maintains performance during frequent re-renders
 * 
 * @param {Element} elem - The DOM element to manage attributes for
 */
ElementAttributesUpdater = function (elem) {
  this.elem = elem;              // The DOM element we're managing
  this.handlers = {};            // Map of attribute names to their handlers
};

/**
 * Update all attributes on the managed element
 * 
 * Takes a dictionary of new attribute values and efficiently applies changes:
 * 1. Removes attributes that are no longer present
 * 2. Updates attributes that have changed values
 * 3. Creates new handlers for new attributes
 * 
 * @param {Object} newAttrs - Dictionary of attribute names to values (strings)
 */
ElementAttributesUpdater.prototype.update = function(newAttrs) {
  const elem = this.elem;
  const handlers = this.handlers;

  // Performance optimization: cache the last values we set
  // This prevents redundant DOM operations when re-rendering with same values
  if (!this._lastValues) this._lastValues = {};
  const lastValues = this._lastValues;

  // Phase 1: Clean up attributes that are no longer in newAttrs
  Object.getOwnPropertyNames(handlers).forEach((k) => {
    if (!has(newAttrs, k)) {
      const handler = handlers[k];
      const oldValue = handler.value;
      // Tell handler to remove the attribute
      handler.value = null;
      handler.update(elem, oldValue, null);
      // Clean up our tracking
      delete handlers[k];
      delete lastValues[k];
    }
  })

  // Phase 2: Update or create attributes that are in newAttrs
  Object.getOwnPropertyNames(newAttrs).forEach((k) => {
    let handler = null;
    let oldValue = null;
    const value = newAttrs[k];
    
    // Create new handler if this attribute doesn't exist yet
    if (!has(handlers, k)) {
      if (value !== null) {
        handler = Blaze._makeAttributeHandler(elem, k, value);
        handlers[k] = handler;
      }
    } else {
      // Reuse existing handler for this attribute
      handler = handlers[k];
      oldValue = handler.value;
    }
    
    // Performance optimization: only update if value actually changed
    // This handles edge cases with null/undefined values and type coercion
    const last = lastValues[k];
    const shouldUpdate = last !== value && 
                        !((last == null && value == null) || 
                          (typeof last === typeof value && String(last) === String(value)));
                          
    if (shouldUpdate) {
      // Update the handler's stored value and apply to DOM
      handler.value = value;
      handler.update(elem, oldValue, value);
      lastValues[k] = value;
      
      // Clean up if attribute was removed (value set to null)
      if (value === null) {
        delete handlers[k];
        delete lastValues[k];
      }
    }
  })
};
