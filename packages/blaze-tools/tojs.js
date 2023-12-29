import { HTML } from 'meteor/htmljs';


export function EmitCode (value) {
  if (! (this instanceof EmitCode))
    // called without `new`
    return new EmitCode(value);

  if (typeof value !== 'string')
    throw new Error('EmitCode must be constructed with a string');

  this.value = value;
}

EmitCode.prototype.toJS = function (visitor) {
  return this.value;
};

// Turns any JSONable value into a JavaScript literal.
export function toJSLiteral (obj) {
  // See <http://timelessrepo.com/json-isnt-a-javascript-subset> for `\u2028\u2029`.
  // Also escape Unicode surrogates.
  return (JSON.stringify(obj)
          .replace(/[\u2028\u2029\ud800-\udfff]/g, function (c) {
            return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
          }));
}



const jsReservedWordSet = (function (set) {
  "abstract else instanceof super boolean enum int switch break export interface synchronized byte extends let this case false long throw catch final native throws char finally new transient class float null true const for package try continue function private typeof debugger goto protected var default if public void delete implements return volatile do import short while double in static with".split(' ').forEach(function (w) {
    set[w] = 1;
  });
  return set;
})({});

export function toObjectLiteralKey (k) {
  if (/^[a-zA-Z$_][a-zA-Z$0-9_]*$/.test(k) && jsReservedWordSet[k] !== 1)
    return k;
  return toJSLiteral(k);
}

const hasToJS = function (x) {
  return x.toJS && (typeof (x.toJS) === 'function');
};

export const ToJSVisitor = HTML.Visitor.extend();
ToJSVisitor.def({
  visitNull: function (nullOrUndefined) {
    return 'null';
  },
  visitPrimitive: function (stringBooleanOrNumber) {
    return toJSLiteral(stringBooleanOrNumber);
  },
  visitArray: function (array) {
    const parts = [];
    for (let i = 0; i < array.length; i++)
      parts.push(this.visit(array[i]));
    return '[' + parts.join(', ') + ']';
  },
  visitTag: function (tag) {
    return this.generateCall(tag.tagName, tag.attrs, tag.children);
  },
  visitComment: function (comment) {
    return this.generateCall('HTML.Comment', null, [comment.value]);
  },
  visitCharRef: function (charRef) {
    return this.generateCall('HTML.CharRef',
                             {html: charRef.html, str: charRef.str});
  },
  visitRaw: function (raw) {
    return this.generateCall('HTML.Raw', null, [raw.value]);
  },
  visitObject: function (x) {
    if (hasToJS(x)) {
      return x.toJS(this);
    }

    throw new Error("Unexpected object in HTMLjs in toJS: " + x);
  },
  generateCall: function (name, attrs, children) {
    let tagSymbol;
    if (name.indexOf('.') >= 0) {
      tagSymbol = name;
    } else if (HTML.isTagEnsured(name)) {
      tagSymbol = 'HTML.' + HTML.getSymbolName(name);
    } else {
      tagSymbol = 'HTML.getTag(' + toJSLiteral(name) + ')';
    }

    let attrsArray = null;
    let needsHTMLAttrs = false;
    if (attrs) {
      attrsArray = [];
      if (HTML.isArray(attrs)) {
        attrsArray = [];
        for (let i = 0; i < attrs.length; i++) {
          const a = attrs[i];
          if (hasToJS(a)) {
            attrsArray.push(a.toJS(this));
            needsHTMLAttrs = true;
          } else {
            const attrsObjStr = this.generateAttrsDictionary(attrs[i]);
            if (attrsObjStr !== null)
              attrsArray.push(attrsObjStr);
          }
        }
      } else if (hasToJS(attrs)) {
        attrsArray.push(attrs.toJS(this));
        needsHTMLAttrs = true;
      } else {
        attrsArray.push(this.generateAttrsDictionary(attrs));
      }
    }
    let attrsStr = null;
    if (attrsArray && attrsArray.length) {
      if (attrsArray.length === 1 && ! needsHTMLAttrs) {
        attrsStr = attrsArray[0];
      } else {
        attrsStr = 'HTML.Attrs(' + attrsArray.join(', ') + ')';
      }
    }

    const argStrs = [];
    if (attrsStr !== null)
      argStrs.push(attrsStr);

    if (children) {
      for (let i = 0; i < children.length; i++)
        argStrs.push(this.visit(children[i]));
    }

    return tagSymbol + '(' + argStrs.join(', ') + ')';
  },
  generateAttrsDictionary: function (attrsDict) {
    if (attrsDict.toJS && (typeof (attrsDict.toJS) === 'function')) {
      // not an attrs dictionary, but something else!  Like a template tag.
      return attrsDict.toJS(this);
    }

    const kvStrs = [];
    Object.getOwnPropertyNames(attrsDict).forEach((k) => {
      if (! HTML.isNully(attrsDict[k]))
        kvStrs.push(toObjectLiteralKey(k) + ': ' +
                    this.visit(attrsDict[k]));
    });
    if (kvStrs.length)
      return '{' + kvStrs.join(', ') + '}';
    return null;
  }
});

export function toJS (content) {
  return (new ToJSVisitor).visit(content);
}
