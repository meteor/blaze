import { HTML } from 'meteor/htmljs';
import { TreeTransformer, toRaw } from './optimizer';

function compactRaw(array){
  var result = [];
  for (var i = 0; i < array.length; i++) {
    var item = array[i];
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
}

function replaceIfContainsNewline(match) {
  if (match.indexOf('\n') >= 0) {
    return ''
  }
  return match;
}

function stripWhitespace(array){
  var result = [];
  for (var i = 0; i < array.length; i++) {
    var item = array[i];
    if (item instanceof HTML.Raw) {
      // remove nodes that contain only whitespace & a newline
      if (item.value.indexOf('\n') !== -1 && !/\S/.test(item.value)) {
        continue;
      }
      // Trim any preceding whitespace, if it contains a newline
      var newStr = item.value;
      newStr = newStr.replace(/^\s+/, replaceIfContainsNewline);
      newStr = newStr.replace(/\s+$/, replaceIfContainsNewline);
      item.value = newStr;
    }
    result.push(item)
  }
  return result;
}

var WhitespaceRemovingVisitor = TreeTransformer.extend();
WhitespaceRemovingVisitor.def({
  visitNull: toRaw,
  visitPrimitive: toRaw,
  visitCharRef: toRaw,
  visitArray: function(array){
    // this.super(array)
    var result = TreeTransformer.prototype.visitArray.call(this, array);
    result = compactRaw(result);
    result = stripWhitespace(result);
    return result;
  },
  visitTag: function (tag) {
    var tagName = tag.tagName;
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
