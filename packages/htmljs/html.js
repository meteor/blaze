
export const Tag = function () {};
Tag.prototype.tagName = ''; // this will be set per Tag subclass
Tag.prototype.attrs = null;
Tag.prototype.children = Object.freeze ? Object.freeze([]) : [];
Tag.prototype.htmljsType = Tag.htmljsType = ['Tag'];

// Given "p" create the function `HTML.P`.
var makeTagConstructor = function (tagName) {
  // Tag is the per-tagName constructor of a HTML.Tag subclass
  var HTMLTag = function (...args) {
    // Work with or without `new`.  If not called with `new`,
    // perform instantiation by recursively calling this constructor.
    // We can't pass varargs, so pass no args.
    var instance = (this instanceof Tag) ? this : new HTMLTag;

    var i = 0;
    var attrs = args.length && args[0];
    if (attrs && (typeof attrs === 'object')) {
      // Treat vanilla JS object as an attributes dictionary.
      if (! isConstructedObject(attrs)) {
        instance.attrs = attrs;
        i++;
      } else if (attrs instanceof Attrs) {
        var array = attrs.value;
        if (array.length === 1) {
          instance.attrs = array[0];
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
    if (i < args.length)
      instance.children = args.slice(i);

    return instance;
  };
  HTMLTag.prototype = new Tag;
  HTMLTag.prototype.constructor = HTMLTag;
  HTMLTag.prototype.tagName = tagName;

  return HTMLTag;
};

// Not an HTMLjs node, but a wrapper to pass multiple attrs dictionaries
// to a tag (for the purpose of implementing dynamic attributes).
export function Attrs(...args) {
  // Work with or without `new`.  If not called with `new`,
  // perform instantiation by recursively calling this constructor.
  // We can't pass varargs, so pass no args.
  var instance = (this instanceof Attrs) ? this : new Attrs;

  instance.value = args;

  return instance;
}

////////////////////////////// KNOWN ELEMENTS
export const HTMLTags = {};

export function getTag (tagName) {
  var symbolName = getSymbolName(tagName);
  if (symbolName === tagName) // all-caps tagName
    throw new Error("Use the lowercase or camelCase form of '" + tagName + "' here");

  if (! HTMLTags[symbolName])
    HTMLTags[symbolName] = makeTagConstructor(tagName);

  return HTMLTags[symbolName];
}

export function ensureTag(tagName) {
  getTag(tagName); // don't return it
}

export function isTagEnsured (tagName) {
  return isKnownElement(tagName);
}

export function getSymbolName (tagName) {
  // "foo-bar" -> "FOO_BAR"
  return tagName.toUpperCase().replace(/-/g, '_');
}

export const knownHTMLElementNames = 'a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup command data datagrid datalist dd del details dfn dir div dl dt em embed eventsource fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins isindex kbd keygen label legend li link main map mark menu meta meter nav noframes noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup table tbody td textarea tfoot th thead time title tr track tt u ul var video wbr'.split(' ');
// (we add the SVG ones below)

export const knownSVGElementNames = 'altGlyph altGlyphDef altGlyphItem animate animateColor animateMotion animateTransform circle clipPath color-profile cursor defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter font font-face font-face-format font-face-name font-face-src font-face-uri foreignObject g glyph glyphRef hkern image line linearGradient marker mask metadata missing-glyph path pattern polygon polyline radialGradient rect set stop style svg switch symbol text textPath title tref tspan use view vkern'.split(' ');
// Append SVG element names to list of known element names
export const knownElementNames = knownHTMLElementNames.concat(knownSVGElementNames);

export const voidElementNames = 'area base br col command embed hr img input keygen link meta param source track wbr'.split(' ');


var voidElementSet = new Set(voidElementNames);
var knownElementSet = new Set(knownElementNames);
var knownSVGElementSet = new Set(knownSVGElementNames);

export function isKnownElement(tagName) {
  return knownElementSet.has(tagName);
}

export function isKnownSVGElement(tagName) {
  return knownSVGElementSet.has(tagName);
}

export function isVoidElement(tagName) {
  return voidElementSet.has(tagName);
}


// Ensure tags for all known elements
knownElementNames.forEach(ensureTag);


export function CharRef(attrs) {
  if (! (this instanceof CharRef))
    // called without `new`
    return new CharRef(attrs);

  if (! (attrs && attrs.html && attrs.str))
    throw new Error(
      "HTML.CharRef must be constructed with ({html:..., str:...})");

  this.html = attrs.html;
  this.str = attrs.str;
}
CharRef.prototype.htmljsType = CharRef.htmljsType = ['CharRef'];

export function Comment(value) {
  if (! (this instanceof Comment))
    // called without `new`
    return new Comment(value);

  if (typeof value !== 'string')
    throw new Error('HTML.Comment must be constructed with a string');

  this.value = value;
  // Kill illegal hyphens in comment value (no way to escape them in HTML)
  this.sanitizedValue = value.replace(/^-|--+|-$/g, '');
}
Comment.prototype.htmljsType = Comment.htmljsType = ['Comment'];

export function Raw(value) {
  if (! (this instanceof Raw))
    // called without `new`
    return new Raw(value);

  if (typeof value !== 'string')
    throw new Error('HTML.Raw must be constructed with a string');

  this.value = value;
}
Raw.prototype.htmljsType = Raw.htmljsType = ['Raw'];


export function isArray (x) {
  return x instanceof Array || Array.isArray(x);
}

export function isConstructedObject (x) {
  // Figure out if `x` is "an instance of some class" or just a plain
  // object literal.  It correctly treats an object literal like
  // `{ constructor: ... }` as an object literal.  It won't detect
  // instances of classes that lack a `constructor` property (e.g.
  // if you assign to a prototype when setting up the class as in:
  // `Foo = function () { ... }; Foo.prototype = { ... }`, then
  // `(new Foo).constructor` is `Object`, not `Foo`).
  if(!x || (typeof x !== 'object')) return false;
  // Is this a plain object?
  let plain = false;
  if(Object.getPrototypeOf(x) === null) {
    plain = true;
  } else {
    let proto = x;
    while(Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
    }
    plain = Object.getPrototypeOf(x) === proto;
  }

  return !plain &&
    (typeof x.constructor === 'function') &&
    (x instanceof x.constructor);
}

export function isNully (node) {
  if (node == null)
    // null or undefined
    return true;

  if (isArray(node)) {
    // is it an empty array or an array of all nully items?
    for (var i = 0; i < node.length; i++)
      if (! isNully(node[i]))
        return false;
    return true;
  }

  return false;
}

export function isValidAttributeName (name) {
  return /^[:_A-Za-z][:_A-Za-z0-9.\-]*/.test(name);
}

// If `attrs` is an array of attributes dictionaries, combines them
// into one.  Removes attributes that are "nully."
export function flattenAttributes (attrs) {
  if (! attrs)
    return attrs;

  var isList = isArray(attrs);
  if (isList && attrs.length === 0)
    return null;

  var result = {};
  for (var i = 0, N = (isList ? attrs.length : 1); i < N; i++) {
    var oneAttrs = (isList ? attrs[i] : attrs);
    if ((typeof oneAttrs !== 'object') ||
        isConstructedObject(oneAttrs))
      throw new Error("Expected plain JS object as attrs, found: " + oneAttrs);
    for (var name in oneAttrs) {
      if (! isValidAttributeName(name))
        throw new Error("Illegal HTML attribute name: " + name);
      var value = oneAttrs[name];
      if (! isNully(value))
        result[name] = value;
    }
  }

  return result;
}
