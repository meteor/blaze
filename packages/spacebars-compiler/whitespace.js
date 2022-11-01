import { HTML } from 'meteor/htmljs';
import { toRaw, TreeTransformer } from './optimizer';

function compactRaw(array) {
  const result = [];

  array.filter((item) => {
    if (item instanceof HTML.Raw) {
      if (!item.value) {
        return false;
      }
      if (result.length &&
        (result[result.length - 1] instanceof HTML.Raw)) {
        result[result.length - 1] = HTML.Raw(
          result[result.length - 1].value + item.value);
        return false;
      }
    }
    return true;
  }).forEach((item) => {
    result.push(item);
  });

  return result;
}

function replaceIfContainsNewline(match) {
  if (match.indexOf('\n') >= 0) {
    return '';
  }
  return match;
}

function stripWhitespace(array) {
  const result = [];

  array
    .filter((item) => {
      if (item instanceof HTML.Raw) {
        // remove nodes that contain only whitespace & a newline
        if (item.value.indexOf('\n') !== -1 && !/\S/.test(item.value)) {
          return false;
        }
      }
      return true;
    })
    .forEach((item) => {
      const _item = item;
      if (_item instanceof HTML.Raw) {
        // Trim any preceding whitespace, if it contains a newline
        let newStr = _item.value;
        newStr = newStr.replace(/^\s+/, replaceIfContainsNewline);
        newStr = newStr.replace(/\s+$/, replaceIfContainsNewline);
        _item.value = newStr;
      }
      result.push(_item);
    });

  return result;
}

const WhitespaceRemovingVisitor = TreeTransformer.extend();
WhitespaceRemovingVisitor.def({
  visitNull: toRaw,
  visitPrimitive: toRaw,
  visitCharRef: toRaw,
  visitArray(array) {
    // this.super(array)
    let result = TreeTransformer.prototype.visitArray.call(this, array);
    result = compactRaw(result);
    result = stripWhitespace(result);
    return result;
  },
  visitTag(tag) {
    const { tagName } = tag;
    // TODO - List tags that we don't want to strip whitespace for.
    if (tagName === 'textarea' || tagName === 'script' || tagName === 'pre'
      || !HTML.isKnownElement(tagName) || HTML.isKnownSVGElement(tagName)) {
      return tag;
    }
    return TreeTransformer.prototype.visitTag.call(this, tag);
  },
  visitAttributes(attrs) {
    return attrs;
  },
});


export function removeWhitespace(tree) {
  return (new WhitespaceRemovingVisitor()).visit(tree);
}
