export const Tag = function () {
};

Tag.prototype.tagName = ''; // this will be set per Tag subclass
Tag.prototype.attrs = null;
Tag.prototype.children = Object.freeze ? Object.freeze([]) : [];
Tag.htmljsType = ['Tag'];
Tag.prototype.htmljsType = Tag.htmljsType;

export function isConstructedObject(x) {
  // Figure out if `x` is "an instance of some class" or just a plain
  // object literal.  It correctly treats an object literal like
  // `{ constructor: ... }` as an object literal.  It won't detect
  // instances of classes that lack a `constructor` property (e.g.
  // if you assign to a prototype when setting up the class as in:
  // `Foo = function () { ... }; Foo.prototype = { ... }`, then
  // `(new Foo).constructor` is `Object`, not `Foo`).
  if (!x || (typeof x !== 'object')) return false;

  // Is this a plain object?
  let plain;

  if (Object.getPrototypeOf(x) === null) {
    plain = true;
  } else {
    let proto = x;

    while (Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
    }

    plain = Object.getPrototypeOf(x) === proto;
  }

  return !plain && (typeof x.constructor === 'function') && (x instanceof x.constructor);
}

// Not an HTMLjs node, but a wrapper to pass multiple attrs dictionaries
// to a tag (for the purpose of implementing dynamic attributes).
export function Attrs(...args) {
  // Work with or without `new`.  If not called with `new`,
  // perform instantiation by recursively calling this constructor.
  // We can't pass varargs, so pass no args.
  const instance = (this instanceof Attrs) ? this : new Attrs();

  instance.value = args;

  return instance;
}

// Given "p" create the function `HTML.P`.
const makeTagConstructor = function (tagName) {
  // Tag is the per-tagName constructor of an HTML.Tag subclass
  const HTMLTag = function (...args) {
    // Work with or without `new`.  If not called with `new`,
    // perform instantiation by recursively calling this constructor.
    // We can't pass varargs, so pass no args.
    const instance = (this instanceof Tag) ? this : new HTMLTag();

    let i = 0;
    const attrs = args.length && args[0];

    if (attrs && (typeof attrs === 'object')) {
      // Treat vanilla JS objects as an attributes' dictionary.
      if (!isConstructedObject(attrs)) {
        instance.attrs = attrs;
        i++;
      } else if (attrs instanceof Attrs) {
        const array = attrs.value;

        if (array.length === 1) {
          instance.attrs = array[0]; /* eslint prefer-destructuring: ["error", {VariableDeclarator: {array: true}}] */
        } else if (array.length > 1) {
          instance.attrs = array;
        }
        i++;
      }
    }

    // If no children, don't create an array at all, use the prototype's
    // (frozen, empty) array.  This way we don't create an empty array
    // every time someone creates a tag without `new` and this constructor
    // calls itself with no arguments (above).
    if (i < args.length) {
      instance.children = args.slice(i);
    }

    return instance;
  };

  HTMLTag.prototype = new Tag();
  HTMLTag.prototype.constructor = HTMLTag;
  HTMLTag.prototype.tagName = tagName;

  return HTMLTag;
};

// KNOWN ELEMENTS
export const HTMLTags = {};

export function getSymbolName(tagName) {
  // "foo-bar" -> "FOO_BAR"
  return tagName.toUpperCase().replace(/-/g, '_');
}

export function getTag(tagName) {
  const symbolName = getSymbolName(tagName);

  if (symbolName === tagName) {
    // all-caps tagName
    throw new Error(`Use the lowercase or camelCase form of "${tagName}" here`);
  }

  if (!HTMLTags[symbolName]) {
    HTMLTags[symbolName] = makeTagConstructor(tagName);
  }

  return HTMLTags[symbolName];
}

// HTML + SVG element names
export const knownHTMLElementNames = 'a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup command data datagrid datalist dd del details dfn dir div dl dt em embed eventsource fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins isindex kbd keygen label legend li link main map mark menu meta meter nav noframes noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup table tbody td textarea tfoot th thead time title tr track tt u ul var video wbr'.split(' ');
// We add the SVG one's below
export const knownSVGElementNames = 'altGlyph altGlyphDef altGlyphItem animate animateColor animateMotion animateTransform circle clipPath color-profile cursor defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter font font-face font-face-format font-face-name font-face-src font-face-uri foreignObject g glyph glyphRef hkern image line linearGradient marker mask metadata missing-glyph path pattern polygon polyline radialGradient rect set stop style svg switch symbol text textPath title tref tspan use view vkern'.split(' ');
// Append SVG element names to list of known element names
export const knownElementNames = knownHTMLElementNames.concat(knownSVGElementNames);

// VOID element names
export const voidElementNames = 'area base br col command embed hr img input keygen link meta param source track wbr'.split(' ');

const knownElementSet = new Set(knownElementNames);
const knownSVGElementSet = new Set(knownSVGElementNames);
const voidElementSet = new Set(voidElementNames);

export function isKnownElement(tagName) {
  return knownElementSet.has(tagName);
}

export function isKnownSVGElement(tagName) {
  return knownSVGElementSet.has(tagName);
}

export function isVoidElement(tagName) {
  return voidElementSet.has(tagName);
}

export function isTagEnsured(tagName) {
  return isKnownElement(tagName);
}

export function ensureTag(tagName) {
  getTag(tagName); // don't return it
}

// Ensure tags for all known elements
knownElementNames.forEach(ensureTag);

export function CharRef(attrs) {
  if (!(this instanceof CharRef)) {
    // called without `new`
    return new CharRef(attrs);
  }

  if (!(attrs && attrs.html && attrs.str)) {
    throw new Error('HTML.CharRef must be constructed with ({html:..., str:...})');
  }

  this.html = attrs.html;
  this.str = attrs.str;
}

CharRef.htmljsType = ['CharRef'];
CharRef.prototype.htmljsType = CharRef.htmljsType;

export function Comment(value) {
  if (!(this instanceof Comment)) {
    // called without `new`
    return new Comment(value);
  }

  if (typeof value !== 'string') {
    throw new Error('HTML.Comment must be constructed with a string');
  }

  this.value = value;

  // Kill illegal hyphens in comment value (no way to escape them in HTML)
  this.sanitizedValue = value.replace(/^-|--+|-$/g, '');
}

Comment.htmljsType = ['Comment'];
Comment.prototype.htmljsType = Comment.htmljsType;

export function Raw(value) {
  if (!(this instanceof Raw)) {
    // called without `new`
    return new Raw(value);
  }

  if (typeof value !== 'string') {
    throw new Error('HTML.Raw must be constructed with a string');
  }

  this.value = value;
}

Raw.htmljsType = ['Raw'];
Raw.prototype.htmljsType = Raw.htmljsType;

export function isArray(x) {
  return x instanceof Array || Array.isArray(x);
}

export function isNully(node) {
  if (node == null) {
    // null or undefined
    return true;
  }

  return isArray(node) && node.every(isNully);
}

export function isValidAttributeName(name) {
  return /^[:_A-Za-z][:_A-Za-z\d.-]*/.test(name);
}

// If `attrs` is an array of attributes dictionaries, combines them
// into one. Remove attributes that are "nully."
export function flattenAttributes(attrs) {
  if (!attrs) {
    return attrs;
  }

  const isList = isArray(attrs);

  if (isList && attrs.length === 0) {
    return null;
  }

  const result = {};
  const n = (isList ? attrs.length : 1);

  for (let i = 0; i < n; i++) {
    const oneAttrs = (isList ? attrs[i] : attrs);

    if ((typeof oneAttrs !== 'object') || isConstructedObject(oneAttrs)) {
      throw new Error(`Expected plain JS object as attrs, found: ${oneAttrs}`);
    }

    for (const name in oneAttrs) {
      if (!isValidAttributeName(name)) {
        throw new Error(`Illegal HTML attribute name: ${name}`);
      }

      const value = oneAttrs[name];

      if (!isNully(value)) {
        result[name] = value;
      }
    }
  }

  return result;
}
