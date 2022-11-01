import {
  CharRef,
  Comment,
  flattenAttributes,
  getTag,
  isArray,
  isConstructedObject,
  isVoidElement,
  Raw,
  Tag,
} from './html';


const IDENTITY = function (x) {
  return x;
};

// Escaping modes for outputting text when generating HTML.
export const TEXTMODE = {
  STRING: 1,
  RCDATA: 2,
  ATTRIBUTE: 3,
};


// _assign is like _.extend or the upcoming Object.assign.
// Copy src's own, enumerable properties onto tgt and return
// tgt.
const _assign = function (tgt, src) {
  const _tgt = tgt;
  if (src) {
    Object.getOwnPropertyNames(src).forEach((k) => {
      _tgt[k] = src[k];
    });
  }
  return _tgt;
};

export const Visitor = function (props) {
  _assign(this, props);
};

Visitor.def = function (options) {
  _assign(this.prototype, options);
};

Visitor.extend = function (options) {
  const CurType = this;
  const subType = function HTMLVisitorSubtype(...args) {
    Visitor.apply(this, args);
  };
  subType.prototype = new CurType();
  subType.extend = CurType.extend;
  subType.def = CurType.def;
  if (options) _assign(subType.prototype, options);
  return subType;
};

Visitor.def({
  visit(content, ...rest) {
    const args = [content, ...rest];

    const {
      visitComment,
      visitArray,
      visitObject,
      visitCharRef,
      visitPrimitive,
      visitNull,
      visitTag,
      visitFunction,
      visitRaw,
    } = this;

    // null or undefined.
    if (content == null) {
      return visitNull.apply(this, args);
    }

    if (typeof content === 'object') {
      if (content.htmljsType) {
        switch (content.htmljsType) {
          case Tag.htmljsType:
            return visitTag.apply(this, args);
          case CharRef.htmljsType:
            return visitCharRef.apply(this, args);
          case Comment.htmljsType:
            return visitComment.apply(this, args);
          case Raw.htmljsType:
            return visitRaw.apply(this, args);
          default:
            throw new Error(`Unknown htmljs type: ${content.htmljsType}`);
        }
      }

      if (isArray(content)) return visitArray.apply(this, args);

      return visitObject.apply(this, args);
    }
    if ((typeof content === 'string') ||
      (typeof content === 'boolean') ||
      (typeof content === 'number')) {
      return visitPrimitive.apply(this, args);
    }
    if (typeof content === 'function') {
      return visitFunction.apply(this, args);
    }

    throw new Error(`Unexpected object in htmljs: ${content}`);
  },
  visitNull(/* nullOrUndefined , ... */) {
  },
  visitPrimitive(/* stringBooleanOrNumber , ... */) {
  },
  visitArray(/* array/, ... */) {
  },
  visitComment(/* comment, ... */) {
  },
  visitCharRef(/* charRef, ... */) {
  },
  visitRaw(/* raw , ... */) {
  },
  visitTag(/* tag , ... */) {
  },
  visitObject(obj/* , ... */) {
    throw new Error(`Unexpected object in htmljs: ${obj}`);
  },
  visitFunction(fn/* , ... */) {
    throw new Error(`Unexpected function in htmljs: ${fn}`);
  },
});

export const ToTextVisitor = Visitor.extend();
ToTextVisitor.def({
  visitNull(/* nullOrUndefined */) {
    return '';
  },
  visitPrimitive(stringBooleanOrNumber) {
    const str = String(stringBooleanOrNumber);
    if (this.textMode === TEXTMODE.RCDATA) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    }
    if (this.textMode === TEXTMODE.ATTRIBUTE) {
      // escape `&` and `"` this time, not `&` and `<`
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    }
    return str;
  },
  visitArray(array) {
    const parts = [];
    for (let i = 0; i < array.length; i++) parts.push(this.visit(array[i]));
    return parts.join('');
  },
  visitComment(/* comment */) {
    throw new Error('Can\'t have a comment here');
  },
  visitCharRef(charRef) {
    if (this.textMode === TEXTMODE.RCDATA ||
      this.textMode === TEXTMODE.ATTRIBUTE) {
      return charRef.html;
    }
    return charRef.str;
  },
  visitRaw(raw) {
    return raw.value;
  },
  visitTag(tag) {
    // Really we should just disallow Tags here.  However, at the
    // moment it's useful to stringify any HTML we find.  In
    // particular, when you include a template within `{{#markdown}}`,
    // we render the template as text, and since there's currently
    // no way to make the template be *parsed* as text (e.g. `<template
    // type="text">`), we hackishly support HTML tags in markdown
    // in templates by parsing them and stringifying them.
    return this.visit(this.toHTML(tag));
  },
  visitObject(x) {
    throw new Error(`Unexpected object in htmljs in toText: ${x}`);
  },
  toHTML(node) {
    // eslint-disable-next-line no-use-before-define
    return toHTML(node);
  },
});

export function toText(content, textMode) {
  if (!textMode) throw new Error('textMode required for HTML.toText');
  if (!(textMode === TEXTMODE.STRING ||
    textMode === TEXTMODE.RCDATA ||
    textMode === TEXTMODE.ATTRIBUTE)) throw new Error(`Unknown textMode: ${textMode}`);

  const visitor = new ToTextVisitor({ textMode });
  return visitor.visit(content);
}

export const ToHTMLVisitor = Visitor.extend();
ToHTMLVisitor.def({
  visitNull(/* nullOrUndefined */) {
    return '';
  },
  visitPrimitive(stringBooleanOrNumber) {
    const str = String(stringBooleanOrNumber);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  },
  visitArray(array) {
    const parts = [];
    for (let i = 0; i < array.length; i++) parts.push(this.visit(array[i]));
    return parts.join('');
  },
  visitComment(comment) {
    return `<!--${comment.sanitizedValue}-->`;
  },
  visitCharRef(charRef) {
    return charRef.html;
  },
  visitRaw(raw) {
    return raw.value;
  },
  visitTag(tag) {
    const attrStrs = [];

    const { tagName } = tag;
    let { children } = tag;

    let { attrs } = tag;
    if (attrs) {
      attrs = flattenAttributes(attrs);
      if (attrs) {
        Object.getOwnPropertyNames(attrs).forEach((k) => {
          if (k === 'value' && tagName === 'textarea') {
            children = [attrs[k], children];
          } else {
            const v = this.toText(attrs[k], TEXTMODE.ATTRIBUTE);
            attrStrs.push(` ${k}="${v}"`);
          }
        });
      }
    }

    const startTag = `<${tagName}${attrStrs.join('')}>`;

    const childStrs = [];
    let content;
    if (tagName === 'textarea') {
      for (let i = 0; i < children.length; i++) childStrs.push(this.toText(children[i], TEXTMODE.RCDATA));

      content = childStrs.join('');
      // TEXTAREA will absorb a newline, so if we see one, add
      // another one.
      if (content.slice(0, 1) === '\n') {
        content = `\n${content}`;
      }
    } else {
      for (let i = 0; i < children.length; i++) childStrs.push(this.visit(children[i]));

      content = childStrs.join('');
    }

    let result = startTag + content;

    if (children.length || !isVoidElement(tagName)) {
      // "Void" elements like BR are the only ones that don't get a close
      // tag in HTML5.  They shouldn't have contents, either, so we could
      // throw an error upon seeing contents here.
      result += `</${tagName}>`;
    }

    return result;
  },
  visitObject(x) {
    throw new Error(`Unexpected object in htmljs in toHTML: ${x}`);
  },
  toText(node, textMode) {
    return toText(node, textMode);
  },
});

export function toHTML(content) {
  return (new ToHTMLVisitor()).visit(content);
}

export const TransformingVisitor = Visitor.extend();
TransformingVisitor.def({
  visitNull: IDENTITY,
  visitPrimitive: IDENTITY,
  visitArray(array, ...args) {
    let result = array;
    for (let i = 0; i < array.length; i++) {
      const oldItem = array[i];
      const newItem = this.visit(oldItem, ...args);
      if (newItem !== oldItem) {
        // copy `array` on write
        if (result === array) result = array.slice();
        result[i] = newItem;
      }
    }
    return result;
  },
  visitComment: IDENTITY,
  visitCharRef: IDENTITY,
  visitRaw: IDENTITY,
  visitObject(obj, ...args) {
    const _obj = obj;

    // Don't parse Markdown & RCData as HTML
    if (_obj.textMode != null) {
      return _obj;
    }
    if ('content' in _obj) {
      _obj.content = this.visit(_obj.content, ...args);
    }
    if ('elseContent' in _obj) {
      _obj.elseContent = this.visit(_obj.elseContent, ...args);
    }
    return _obj;
  },
  visitFunction: IDENTITY,
  visitTag(tag, ...args) {
    const oldChildren = tag.children;
    const newChildren = this.visitChildren(oldChildren, ...args);

    const oldAttrs = tag.attrs;
    const newAttrs = this.visitAttributes(oldAttrs, ...args);

    if (newAttrs === oldAttrs && newChildren === oldChildren) return tag;

    // eslint-disable-next-line prefer-spread
    const newTag = getTag(tag.tagName).apply(null, newChildren);
    newTag.attrs = newAttrs;
    return newTag;
  },
  visitChildren(children, ...args) {
    return this.visitArray(children, ...args);
  },
  // Transform the `.attrs` property of a tag, which may be a dictionary,
  // an array, or in some uses, a foreign object (such as
  // a template tag).
  visitAttributes(attrs, ...args) {
    if (isArray(attrs)) {
      let result = attrs;
      for (let i = 0; i < attrs.length; i++) {
        const oldItem = attrs[i];
        const newItem = this.visitAttributes(oldItem, ...args);
        if (newItem !== oldItem) {
          // copy on write
          if (result === attrs) result = attrs.slice();
          result[i] = newItem;
        }
      }
      return result;
    }

    if (attrs && isConstructedObject(attrs)) {
      throw new Error('The basic TransformingVisitor does not support ' +
        'foreign objects in attributes.  Define a custom ' +
        'visitAttributes for this case.');
    }

    const oldAttrs = attrs;
    let newAttrs = oldAttrs;
    if (oldAttrs) {
      const attrArgs = [null, null];
      attrArgs.push.apply(attrArgs, [attrs, ...args]);
      if (oldAttrs) {
        Object.getOwnPropertyNames(oldAttrs).forEach((k) => {
          const oldValue = oldAttrs[k];
          attrArgs[0] = k;
          attrArgs[1] = oldValue;
          const { visitAttribute } = this;
          const newValue = visitAttribute.apply(this, attrArgs);
          if (newValue !== oldValue) {
            // copy on write
            if (newAttrs === oldAttrs) newAttrs = _assign({}, oldAttrs);
            newAttrs[k] = newValue;
          }
        });
      }
    }

    return newAttrs;
  },
  // Transform the value of one attribute name/value in an
  // attributes' dictionary.
  visitAttribute(name, value, tag, ...args) {
    return this.visit(value, ...args);
  },
});
