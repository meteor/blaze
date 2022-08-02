import { HTML } from 'meteor/htmljs';
import { Scanner } from './scanner';
import { properCaseAttributeName } from './utils';
import { getHTMLToken, isLookingAtEndTag } from './tokenize';

const pushOrAppendString = (items, string) => {
  if (items.length && typeof items[items.length - 1] === 'string') {
    items[items.length - 1] += string;
  } else {
    items.push(string);
  }

  return items;
};


// Take a numeric Unicode code point, which may be larger than 16 bits,
// and encode it as a JavaScript UTF-16 string.
//
// Adapted from
// http://stackoverflow.com/questions/7126384/expressing-utf-16-unicode-characters-in-javascript/7126661.
export function codePointToString(codePoint) {
  if (codePoint >= 0 && codePoint <= 0xD7FF || codePoint >= 0xE000 && codePoint <= 0xFFFF) {
    return String.fromCharCode(codePoint);
  }
  if (codePoint >= 0x10000 && codePoint <= 0x10FFFF) {
    // we subtract 0x10000 from codePoint to get a 20-bit number
    // in the range 0..0xFFFF
    codePoint -= 0x10000;

    // we add 0xD800 to the number formed by the first 10 bits
    // to give the first byte
    const first = ((0xffc00 & codePoint) >> 10) + 0xD800;

    // we add 0xDC00 to the number formed by the low 10 bits
    // to give the second byte
    const second = (0x3ff & codePoint) + 0xDC00;

    return String.fromCharCode(first) + String.fromCharCode(second);
  }

  return '';
}

// Input: A token like `{ t: 'CharRef', v: '&amp;', cp: [38] }`.
//
// Output: A tag like `HTML.CharRef({ html: '&amp;', str: '&' })`.
const convertCharRef = token => {
  const codePoints = token.cp;
  let str = '';

  for (const item of codePoints) str += codePointToString(item);

  return HTML.CharRef({ html: token.v, str });
};

// Input is always a dictionary (even if zero attributes) and each
// value in the dictionary is an array of `Chars`, `CharRef`,
// and maybe `TemplateTag` tokens.
//
// Output is null if there are zero attributes, and otherwise a
// dictionary, or an array of dictionaries and template tags.
// Each value in the dictionary is HTMLjs (e.g. a
// string or an array of `Chars`, `CharRef`, and `TemplateTag`
// nodes).
//
// An attribute value with no input tokens is represented as "",
// not an empty array, in order to prop open empty attributes
// with no template tags.
const parseAttrs = attrs => {
  let result = null;

  if (HTML.isArray(attrs)) {
    // first element is non-dynamic attrs, rest are template tags
    const nonDynamicAttrs = parseAttrs(attrs[0]);

    if (nonDynamicAttrs) {
      result = (result || []);
      result.push(nonDynamicAttrs);
    }

    for (let i = 1; i < attrs.length; i++) {
      const token = attrs[i];

      if (token.t !== 'TemplateTag') throw new Error('Expected TemplateTag token');

      result = (result || []);
      result.push(token.v);
    }

    return result;
  }

  for (const k in attrs) {
    if (!result) result = {};

    const inValue = attrs[k];
    let outParts = [];

    inValue.forEach(token => {
      switch (token.t) {
        case 'Chars':
          outParts = pushOrAppendString(outParts, token.v);
          break;
        case 'CharRef':
          outParts.push(convertCharRef(token));
          break;
        case 'TemplateTag':
          outParts.push(token.v);
          break;
        default:
          break;
      }
    });

    const outValue = (inValue.length === 0 ? '' : (outParts.length === 1 ? outParts[0] : outParts));
    const properKey = properCaseAttributeName(k);

    result[properKey] = outValue;
  }

  return result;
};

// Parse a "fragment" of HTML, up to the end of the input or a particular
const getRawText = (scanner, tagName, shouldStopFunc) => {
  let items = [];

  while (!scanner.isEOF()) {
    // break at appropriate end tag
    if (tagName && isLookingAtEndTag(scanner, tagName)) break;

    if (shouldStopFunc && shouldStopFunc(scanner)) break;

    const token = getHTMLToken(scanner, 'rawtext');

    /**
     * Tokenizer has not reached EOF on its own, @example e.g. while scanning
     * @example e.g. while scanning template comments like `{{! foo}}`.
     */
    if (token) {
      if (token.t === 'Chars') {
        items = pushOrAppendString(items, token.v);
      } else if (token.t === 'TemplateTag') {
        items.push(token.v);
      } else {
        // (can't happen)
        scanner.fatal(`Unknown or unexpected token type: ${token.t}`);
      }
    }
  }

  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  return items;
};

// Get RCDATA to go in the lowercase (or camel case) tagName (e.g. "textarea")
export function getRCData(scanner, tagName, shouldStopFunc) {
  let items = [];

  while (!scanner.isEOF()) {
    // break at appropriate end tag
    if (tagName && isLookingAtEndTag(scanner, tagName)) break;

    if (shouldStopFunc && shouldStopFunc(scanner)) break;

    const token = getHTMLToken(scanner, 'rcdata');

    /**
     * Tokenizer has not reached EOF on its own, @example e.g. while scanning
     * @example e.g. while scanning template comments like `{{! foo}}`.
     */
    if (token) {
      switch (token.t) {
        case 'Chars':
          items = pushOrAppendString(items, token.v);
          break;
        case 'CharRef':
          items.push(convertCharRef(token));
          break;
        case 'TemplateTag':
          items.push(token.v);
          break;
        default:
          // (can't happen)
          scanner.fatal(`Unknown or unexpected token type: ${token.t}`);
      }
    }
  }

  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  return items;
}

export function getContent(scanner, shouldStopFunc) {
  let items = [];

  while (!scanner.isEOF()) {
    if (shouldStopFunc && shouldStopFunc(scanner)) break;

    const posBefore = scanner.pos;
    const token = getHTMLToken(scanner);

    /**
     * Tokenizer has not reached EOF on its own, @example e.g. while scanning
     * @example e.g. while scanning template comments like `{{! foo}}`.
     */
    if (token) {
      if (token.t === 'Doctype') {
        scanner.fatal('Unexpected Doctype');
      } else if (token.t === 'Chars') {
        items = pushOrAppendString(items, token.v);
      } else if (token.t === 'CharRef') {
        items.push(convertCharRef(token));
      } else if (token.t === 'Comment') {
        items.push(HTML.Comment(token.v));
      } else if (token.t === 'TemplateTag') {
        items.push(token.v);
      } else if (token.t === 'Tag') {
        if (token.isEnd) {
          // Stop when we encounter an end tag at the top level.
          // Rewind; we'll re-parse the end tag later.
          scanner.pos = posBefore;
          break;
        }

        const tagName = token.n;

        // is this an element with no close tag (a BR, HR, IMG, etc.) based
        // on its name?
        const isVoid = HTML.isVoidElement(tagName);

        if (token.isSelfClosing) {
          if (!(isVoid || HTML.isKnownSVGElement(tagName) || tagName.indexOf(':') >= 0)) scanner.fatal('Only certain elements like BR, HR, IMG, etc. (and foreign elements like SVG) are allowed to self-close');
        }

        // result of parseAttrs may be null
        let attrs = parseAttrs(token.attrs);

        // arrays need to be wrapped in HTML.Attrs(...)
        // when used to construct tags
        if (HTML.isArray(attrs)) attrs = HTML.Attrs.apply(null, attrs);

        const tagFunc = HTML.getTag(tagName);

        if (isVoid || token.isSelfClosing) {
          items.push(attrs ? tagFunc(attrs) : tagFunc());
        } else {
          // parse HTML tag contents.

          // HTML treats a final `/` in a tag as part of an attribute, as in `<a href=/foo/>`, but the template author who writes `<circle r={{r}}/>`, say, may not be thinking about that, so generate a good error message in the "looks like self-close" case.
          const looksLikeSelfClose = (scanner.input.substr(scanner.pos - 2, 2) === '/>');

          let content = null;

          if (token.n === 'textarea') {
            if (scanner.peek() === '\n') scanner.pos++;
            const textareaValue = getRCData(scanner, token.n, shouldStopFunc);
            if (textareaValue) {
              if (attrs instanceof HTML.Attrs) {
                attrs = HTML.Attrs.apply(
                  null, attrs.value.concat([{ value: textareaValue }]));
              } else {
                attrs = (attrs || {});
                attrs.value = textareaValue;
              }
            }
          } else if (token.n === 'script' || token.n === 'style') {
            content = getRawText(scanner, token.n, shouldStopFunc);
          } else {
            content = getContent(scanner, shouldStopFunc);
          }

          const endTag = getHTMLToken(scanner);

          if (!(endTag && endTag.t === 'Tag' && endTag.isEnd && endTag.n === tagName)) scanner.fatal(`Expected "${tagName}" end tag${looksLikeSelfClose ? ` -- if the "<${token.n} />" tag was supposed to self-close, try adding a space before the "/"` : ''}`);

          // XXX support implied end tags in cases allowed by the spec

          // make `content` into an array suitable for applying tag constructor
          // as in `FOO.apply(null, content)`.
          if (content == null) content = [];
          else if (!HTML.isArray(content)) content = [content];

          items.push(HTML.getTag(tagName).apply(null, (attrs ? [attrs] : []).concat(content)));
        }
      } else {
        scanner.fatal(`Unknown token type: ${token.t}`);
      }
    }
  }

  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  return items;
}

// template tag (using the "shouldStop" option).
export function parseFragment(input, options) {
  let scanner;

  if (typeof input === 'string') {
    scanner = new Scanner(input);
  } else {
    // input can be a scanner.  We'd better not have a different
    // value for the "getTemplateTag" option as when the scanner
    // was created, because we don't do anything special to reset
    // the value (which is attached to the scanner).
    scanner = input;
  }

  if (options && options.getTemplateTag) {
    scanner.getTemplateTag = options.getTemplateTag;
  }

  // function (scanner) -> boolean
  const shouldStop = options && options.shouldStop;

  let result;

  if (options && options.textMode) {
    if (options.textMode === HTML.TEXTMODE.STRING) {
      result = getRawText(scanner, null, shouldStop);
    } else if (options.textMode === HTML.TEXTMODE.RCDATA) {
      result = getRCData(scanner, null, shouldStop);
    } else {
      throw new Error(`Unsupported textMode: ${options.textMode}`);
    }
  } else {
    result = getContent(scanner, shouldStop);
  }

  if (!scanner.isEOF()) {
    // If we aren't at the end of the input, we either stopped at an unmatched
    // HTML end tag or at a template tag (like `{{else}}` or `{{/if}}`).
    // Detect the former case (stopped at an HTML end tag) and throw a good
    // error.

    const posBefore = scanner.pos;
    let endTag;

    try {
      endTag = getHTMLToken(scanner);
    } catch (e) {
      // ignore errors from getTemplateTag
    }

    // XXX we make some assumptions about shouldStop here, like that it
    // won't tell us to stop at an HTML end tag.  Should refactor
    // `shouldStop` into something more suitable.
    if (endTag && endTag.t === 'Tag' && endTag.isEnd) {
      const closeTag = endTag.n;
      const isVoidElement = HTML.isVoidElement(closeTag);
      scanner.fatal(`Unexpected HTML close tag${isVoidElement ? `.  <${endTag.n}> should have no close tag.` : ''}`);
    }

    scanner.pos = posBefore; // rewind, we'll continue parsing as usual

    // If no "shouldStop" option was provided, we should have consumed the whole
    // input.
    if (!shouldStop) scanner.fatal('Expected EOF');
  }

  return result;
}
