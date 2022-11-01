import { HTMLTools } from 'meteor/html-tools';
import { HTML } from 'meteor/htmljs';

// Optimize parts of an HTMLjs tree into raw HTML strings when they don't
// contain template tags.

const constant = function (value) {
  return function () { return value; };
};

const OPTIMIZABLE = {
  NONE: 0,
  PARTS: 1,
  FULL: 2,
};

// We can only turn content into an HTML string if it contains no template
// tags and no "tricky" HTML tags.  If we can optimize the entire content
// into a string, we return OPTIMIZABLE.FULL.  If the we are given an
// unoptimizable node, we return OPTIMIZABLE.NONE.  If we are given a tree
// that contains an unoptimizable node somewhere, we return OPTIMIZABLE.PARTS.
//
// For example, we always create SVG elements programmatically, since SVG
// doesn't have innerHTML.  If we are given an SVG element, we return NONE.
// However, if we are given a big tree that contains SVG somewhere, we
// return PARTS so that the optimizer can descend into the tree and optimize
// other parts of it.
const CanOptimizeVisitor = HTML.Visitor.extend();
CanOptimizeVisitor.def({
  visitNull: constant(OPTIMIZABLE.FULL),
  visitPrimitive: constant(OPTIMIZABLE.FULL),
  visitComment: constant(OPTIMIZABLE.FULL),
  visitCharRef: constant(OPTIMIZABLE.FULL),
  visitRaw: constant(OPTIMIZABLE.FULL),
  visitObject: constant(OPTIMIZABLE.NONE),
  visitFunction: constant(OPTIMIZABLE.NONE),
  visitArray (x) {
    for (let i = 0; i < x.length; i++) if (this.visit(x[i]) !== OPTIMIZABLE.FULL) return OPTIMIZABLE.PARTS;
    return OPTIMIZABLE.FULL;
  },
  visitTag (tag) {
    const { tagName } = tag;
    if (tagName === 'textarea') {
      // optimizing into a TEXTAREA's RCDATA would require being a little
      // more clever.
      return OPTIMIZABLE.NONE;
    } if (tagName === 'script') {
      // script tags don't work when rendered from strings
      return OPTIMIZABLE.NONE;
    } if (!(HTML.isKnownElement(tagName) &&
                  !HTML.isKnownSVGElement(tagName))) {
      // foreign elements like SVG can't be stringified for innerHTML.
      return OPTIMIZABLE.NONE;
    } if (tagName === 'table') {
      // Avoid ever producing HTML containing `<table><tr>...`, because the
      // browser will insert a TBODY.  If we just `createElement("table")` and
      // `createElement("tr")`, on the other hand, no TBODY is necessary
      // (assuming IE 8+).
      return OPTIMIZABLE.PARTS;
    } if (tagName === 'tr') {
      return OPTIMIZABLE.PARTS;
    }

    const { children } = tag;
    for (let i = 0; i < children.length; i++) if (this.visit(children[i]) !== OPTIMIZABLE.FULL) return OPTIMIZABLE.PARTS;

    if (this.visitAttributes(tag.attrs) !== OPTIMIZABLE.FULL) return OPTIMIZABLE.PARTS;

    return OPTIMIZABLE.FULL;
  },
  visitAttributes (attrs) {
    if (attrs) {
      const isArray = HTML.isArray(attrs);
      for (let i = 0; i < (isArray ? attrs.length : 1); i++) {
        const a = (isArray ? attrs[i] : attrs);
        if ((typeof a !== 'object') || (a instanceof HTMLTools.TemplateTag)) return OPTIMIZABLE.PARTS;

        if (Object.getOwnPropertyNames(a).find((k) => this.visit(a[k]) !== OPTIMIZABLE.FULL)) return OPTIMIZABLE.PARTS;

        // for (const k in a) if (this.visit(a[k]) !== OPTIMIZABLE.FULL) return OPTIMIZABLE.PARTS;
      }
    }
    return OPTIMIZABLE.FULL;
  },
});

const getOptimizability = function (content) {
  return (new CanOptimizeVisitor()).visit(content);
};

export function toRaw(x) {
  return HTML.Raw(HTML.toHTML(x));
}

export const TreeTransformer = HTML.TransformingVisitor.extend();
TreeTransformer.def({
  visitAttributes (attrs, ...rest) {
    // pass template tags through by default
    if (attrs instanceof HTMLTools.TemplateTag) return attrs;

    return HTML.TransformingVisitor.prototype.visitAttributes.apply(
      this, [attrs, ...rest]);
  },
});

// Replace parts of the HTMLjs tree that have no template tags (or
// tricky HTML tags) with HTML.Raw objects containing raw HTML.
const OptimizingVisitor = TreeTransformer.extend();
OptimizingVisitor.def({
  visitNull: toRaw,
  visitPrimitive: toRaw,
  visitComment: toRaw,
  visitCharRef: toRaw,
  visitArray (array) {
    const optimizability = getOptimizability(array);
    if (optimizability === OPTIMIZABLE.FULL) {
      return toRaw(array);
    } if (optimizability === OPTIMIZABLE.PARTS) {
      return TreeTransformer.prototype.visitArray.call(this, array);
    }
      return array;
  },
  visitTag (tag) {
    const optimizability = getOptimizability(tag);
    if (optimizability === OPTIMIZABLE.FULL) {
      return toRaw(tag);
    } if (optimizability === OPTIMIZABLE.PARTS) {
      return TreeTransformer.prototype.visitTag.call(this, tag);
    }
      return tag;
  },
  visitChildren (children) {
    // don't optimize the children array into a Raw object!
    return TreeTransformer.prototype.visitArray.call(this, children);
  },
  visitAttributes (attrs) {
    return attrs;
  },
});

// Combine consecutive HTML.Raws.  Remove empty ones.
const RawCompactingVisitor = TreeTransformer.extend();
RawCompactingVisitor.def({
  visitArray (array) {
    const result = [];
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if ((item instanceof HTML.Raw) &&
          ((!item.value) ||
           (result.length &&
            (result[result.length - 1] instanceof HTML.Raw)))) {
        // two cases: item is an empty Raw, or previous item is
        // a Raw as well.  In the latter case, replace the previous
        // Raw with a longer one that includes the new Raw.
        if (item.value) {
          result[result.length - 1] = HTML.Raw(
            result[result.length - 1].value + item.value);
        }
      } else {
        result.push(this.visit(item));
      }
    }
    return result;
  },
});

// Replace pointless Raws like `HTMl.Raw('foo')` that contain no special
// characters with simple strings.
const RawReplacingVisitor = TreeTransformer.extend();
RawReplacingVisitor.def({
  visitRaw (raw) {
    const html = raw.value;
    if (html.indexOf('&') < 0 && html.indexOf('<') < 0) {
      return html;
    }
      return raw;
  },
});

export function optimize (tree) {
  let _tree = tree;
  _tree = (new OptimizingVisitor()).visit(_tree);
  _tree = (new RawCompactingVisitor()).visit(_tree);
  _tree = (new RawReplacingVisitor()).visit(_tree);
  return _tree;
}
