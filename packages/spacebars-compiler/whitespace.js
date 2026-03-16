import { HTML } from 'meteor/htmljs';
import { TreeTransformer, toRaw } from './optimizer';

const compactRaw = (array) => {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (item instanceof HTML.Raw) {
      if (!item.value) {
        continue;
      }
      if (result.length &&
          (result[result.length - 1] instanceof HTML.Raw)){
        result[result.length - 1] = HTML.Raw(
          result[result.length - 1].value + item.value);
        continue
      }
    }
    result.push(item);
  }
  return result;
};

const replaceIfContainsNewline = (match) => {
  if (match.includes('\n')) {
    return ''
  }
  return match;
};

const stripWhitespace = (array) => {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (item instanceof HTML.Raw) {
      // remove nodes that contain only whitespace & a newline
      if (item.value.includes('\n') && !/\S/.test(item.value)) {
        continue;
      }
      // Trim any preceding whitespace, if it contains a newline
      let newStr = item.value;
      newStr = newStr.replace(/^\s+/, replaceIfContainsNewline);
      newStr = newStr.replace(/\s+$/, replaceIfContainsNewline);
      item.value = newStr;
    }
    result.push(item)
  }
  return result;
};

const WhitespaceRemovingVisitor = TreeTransformer.extend();
WhitespaceRemovingVisitor.def({
  visitNull: toRaw,
  visitPrimitive: toRaw,
  visitCharRef: toRaw,
  visitArray: function(array){
    // this.super(array)
    const result = TreeTransformer.prototype.visitArray.call(this, array);
    return stripWhitespace(compactRaw(result));
  },
  visitTag: function (tag) {
    const tagName = tag.tagName;
    // TODO - List tags that we don't want to strip whitespace for.
    if (tagName === 'textarea' || tagName === 'script' || tagName === 'pre'
      || !HTML.isKnownElement(tagName) || HTML.isKnownSVGElement(tagName)) {
      return tag;
    }
    return TreeTransformer.prototype.visitTag.call(this, tag)
  },
  visitAttributes: function (attrs) {
    return attrs;
  }
});


export function removeWhitespace(tree) {
  tree = (new WhitespaceRemovingVisitor).visit(tree);
  return tree;
}
