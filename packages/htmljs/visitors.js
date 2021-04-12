import {
  Tag,
  CharRef,
  Comment,
  Raw,
  isArray,
  getTag,
  isConstructedObject,
  flattenAttributes,
  isVoidElement,
} from './html';


var IDENTITY = function (x) { return x; };

// _assign is like _.extend or the upcoming Object.assign.
// Copy src's own, enumerable properties onto tgt and return
// tgt.
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _assign = function (tgt, src) {
  for (var k in src) {
    if (_hasOwnProperty.call(src, k))
      tgt[k] = src[k];
  }
  return tgt;
};

export const Visitor = function (props) {
  _assign(this, props);
};

Visitor.def = function (options) {
  _assign(this.prototype, options);
};

Visitor.extend = function (options) {
  var curType = this;
  var subType = function HTMLVisitorSubtype(/*arguments*/) {
    Visitor.apply(this, arguments);
  };
  subType.prototype = new curType;
  subType.extend = curType.extend;
  subType.def = curType.def;
  if (options)
    _assign(subType.prototype, options);
  return subType;
};

Visitor.def({
  visit: function (content/*, ...*/) {
    if (content == null)
      // null or undefined.
      return this.visitNull.apply(this, arguments);

    if (typeof content === 'object') {
      if (content.htmljsType) {
        switch (content.htmljsType) {
        case Tag.htmljsType:
          return this.visitTag.apply(this, arguments);
        case CharRef.htmljsType:
          return this.visitCharRef.apply(this, arguments);
        case Comment.htmljsType:
          return this.visitComment.apply(this, arguments);
        case Raw.htmljsType:
          return this.visitRaw.apply(this, arguments);
        default:
          throw new Error("Unknown htmljs type: " + content.htmljsType);
        }
      }

      if (isArray(content))
        return this.visitArray.apply(this, arguments);

      return this.visitObject.apply(this, arguments);

    } else if ((typeof content === 'string') ||
               (typeof content === 'boolean') ||
               (typeof content === 'number')) {
      return this.visitPrimitive.apply(this, arguments);

    } else if (typeof content === 'function') {
      return this.visitFunction.apply(this, arguments);
    }

    throw new Error("Unexpected object in htmljs: " + content);

  },
  visitNull: function (nullOrUndefined/*, ...*/) {},
  visitPrimitive: function (stringBooleanOrNumber/*, ...*/) {},
  visitArray: function (array/*, ...*/) {},
  visitComment: function (comment/*, ...*/) {},
  visitCharRef: function (charRef/*, ...*/) {},
  visitRaw: function (raw/*, ...*/) {},
  visitTag: function (tag/*, ...*/) {},
  visitObject: function (obj/*, ...*/) {
    throw new Error("Unexpected object in htmljs: " + obj);
  },
  visitFunction: function (fn/*, ...*/) {
    throw new Error("Unexpected function in htmljs: " + fn);
  }
});

export const TransformingVisitor = Visitor.extend();
TransformingVisitor.def({
  visitNull: IDENTITY,
  visitPrimitive: IDENTITY,
  visitArray: function (array, ...args) {
    var result = array;
    for (var i = 0; i < array.length; i++) {
      var oldItem = array[i];
      var newItem = this.visit(oldItem, ...args);
      if (newItem !== oldItem) {
        // copy `array` on write
        if (result === array)
          result = array.slice();
        result[i] = newItem;
      }
    }
    return result;
  },
  visitComment: IDENTITY,
  visitCharRef: IDENTITY,
  visitRaw: IDENTITY,
  visitObject: function(obj, ...args){
    // Don't parse Markdown & RCData as HTML
    if (obj.textMode != null){
      return obj;
    }
    if ('content' in obj) {
      obj.content = this.visit(obj.content, ...args);
    }
    if ('elseContent' in obj){
      obj.elseContent = this.visit(obj.elseContent, ...args);
    }
    return obj;
  },
  visitFunction: IDENTITY,
  visitTag: function (tag, ...args) {
    var oldChildren = tag.children;
    var newChildren = this.visitChildren(oldChildren, ...args);

    var oldAttrs = tag.attrs;
    var newAttrs = this.visitAttributes(oldAttrs, ...args);

    if (newAttrs === oldAttrs && newChildren === oldChildren)
      return tag;

    var newTag = getTag(tag.tagName).apply(null, newChildren);
    newTag.attrs = newAttrs;
    return newTag;
  },
  visitChildren: function (children, ...args) {
    return this.visitArray(children, ...args);
  },
  // Transform the `.attrs` property of a tag, which may be a dictionary,
  // an array, or in some uses, a foreign object (such as
  // a template tag).
  visitAttributes: function (attrs, ...args) {
    if (isArray(attrs)) {
      var result = attrs;
      for (var i = 0; i < attrs.length; i++) {
        var oldItem = attrs[i];
        var newItem = this.visitAttributes(oldItem, ...args);
        if (newItem !== oldItem) {
          // copy on write
          if (result === attrs)
            result = attrs.slice();
          result[i] = newItem;
        }
      }
      return result;
    }

    if (attrs && isConstructedObject(attrs)) {
      throw new Error("The basic TransformingVisitor does not support " +
                      "foreign objects in attributes.  Define a custom " +
                      "visitAttributes for this case.");
    }

    var oldAttrs = attrs;
    var newAttrs = oldAttrs;
    if (oldAttrs) {
      var attrArgs = [null, null];
      attrArgs.push.apply(attrArgs, arguments);
      for (var k in oldAttrs) {
        var oldValue = oldAttrs[k];
        attrArgs[0] = k;
        attrArgs[1] = oldValue;
        var newValue = this.visitAttribute.apply(this, attrArgs);
        if (newValue !== oldValue) {
          // copy on write
          if (newAttrs === oldAttrs)
            newAttrs = _assign({}, oldAttrs);
          newAttrs[k] = newValue;
        }
      }
    }

    return newAttrs;
  },
  // Transform the value of one attribute name/value in an
  // attributes dictionary.
  visitAttribute: function (name, value, tag, ...args) {
    return this.visit(value, ...args);
  }
});


export const ToTextVisitor = Visitor.extend();
ToTextVisitor.def({
  visitNull: function (nullOrUndefined) {
    return '';
  },
  visitPrimitive: function (stringBooleanOrNumber) {
    var str = String(stringBooleanOrNumber);
    if (this.textMode === TEXTMODE.RCDATA) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    } else if (this.textMode === TEXTMODE.ATTRIBUTE) {
      // escape `&` and `"` this time, not `&` and `<`
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    } else {
      return str;
    }
  },
  visitArray: function (array) {
    var parts = [];
    for (var i = 0; i < array.length; i++)
      parts.push(this.visit(array[i]));
    return parts.join('');
  },
  visitComment: function (comment) {
    throw new Error("Can't have a comment here");
  },
  visitCharRef: function (charRef) {
    if (this.textMode === TEXTMODE.RCDATA ||
        this.textMode === TEXTMODE.ATTRIBUTE) {
      return charRef.html;
    } else {
      return charRef.str;
    }
  },
  visitRaw: function (raw) {
    return raw.value;
  },
  visitTag: function (tag) {
    // Really we should just disallow Tags here.  However, at the
    // moment it's useful to stringify any HTML we find.  In
    // particular, when you include a template within `{{#markdown}}`,
    // we render the template as text, and since there's currently
    // no way to make the template be *parsed* as text (e.g. `<template
    // type="text">`), we hackishly support HTML tags in markdown
    // in templates by parsing them and stringifying them.
    return this.visit(this.toHTML(tag));
  },
  visitObject: function (x) {
    throw new Error("Unexpected object in htmljs in toText: " + x);
  },
  toHTML: function (node) {
    return toHTML(node);
  }
});



export const ToHTMLVisitor = Visitor.extend();
ToHTMLVisitor.def({
  visitNull: function (nullOrUndefined) {
    return '';
  },
  visitPrimitive: function (stringBooleanOrNumber) {
    var str = String(stringBooleanOrNumber);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  },
  visitArray: function (array) {
    var parts = [];
    for (var i = 0; i < array.length; i++)
      parts.push(this.visit(array[i]));
    return parts.join('');
  },
  visitComment: function (comment) {
    return '<!--' + comment.sanitizedValue + '-->';
  },
  visitCharRef: function (charRef) {
    return charRef.html;
  },
  visitRaw: function (raw) {
    return raw.value;
  },
  visitTag: function (tag) {
    var attrStrs = [];

    var tagName = tag.tagName;
    var children = tag.children;

    var attrs = tag.attrs;
    if (attrs) {
      attrs = flattenAttributes(attrs);
      for (var k in attrs) {
        if (k === 'value' && tagName === 'textarea') {
          children = [attrs[k], children];
        } else {
          var v = this.toText(attrs[k], TEXTMODE.ATTRIBUTE);
          attrStrs.push(' ' + k + '="' + v + '"');
        }
      }
    }

    var startTag = '<' + tagName + attrStrs.join('') + '>';

    var childStrs = [];
    var content;
    if (tagName === 'textarea') {

      for (var i = 0; i < children.length; i++)
        childStrs.push(this.toText(children[i], TEXTMODE.RCDATA));

      content = childStrs.join('');
      if (content.slice(0, 1) === '\n')
        // TEXTAREA will absorb a newline, so if we see one, add
        // another one.
        content = '\n' + content;

    } else {
      for (var i = 0; i < children.length; i++)
        childStrs.push(this.visit(children[i]));

      content = childStrs.join('');
    }

    var result = startTag + content;

    if (children.length || ! isVoidElement(tagName)) {
      // "Void" elements like BR are the only ones that don't get a close
      // tag in HTML5.  They shouldn't have contents, either, so we could
      // throw an error upon seeing contents here.
      result += '</' + tagName + '>';
    }

    return result;
  },
  visitObject: function (x) {
    throw new Error("Unexpected object in htmljs in toHTML: " + x);
  },
  toText: function (node, textMode) {
    return toText(node, textMode);
  }
});



////////////////////////////// TOHTML

export function toHTML(content) {
  return (new ToHTMLVisitor).visit(content);
}

// Escaping modes for outputting text when generating HTML.
export const TEXTMODE = {
  STRING: 1,
  RCDATA: 2,
  ATTRIBUTE: 3
};


export function toText(content, textMode) {
  if (! textMode)
    throw new Error("textMode required for HTML.toText");
  if (! (textMode === TEXTMODE.STRING ||
         textMode === TEXTMODE.RCDATA ||
         textMode === TEXTMODE.ATTRIBUTE))
    throw new Error("Unknown textMode: " + textMode);

  var visitor = new ToTextVisitor({textMode: textMode});
  return visitor.visit(content);
}
