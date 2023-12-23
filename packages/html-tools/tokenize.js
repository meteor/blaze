import { asciiLowerCase, properCaseTagName, properCaseAttributeName } from './utils';
import { TemplateTag } from './templatetag';
import { getCharacterReference } from './charref';
import { makeRegexMatcher } from './scanner';

// Token types:
//
// { t: 'Doctype',
//   v: String (entire Doctype declaration from the source),
//   name: String,
//   systemId: String (optional),
//   publicId: String (optional)
// }
//
// { t: 'Comment',
//   v: String (not including "<!--" and "-->")
// }
//
// { t: 'Chars',
//   v: String (pure text like you might pass to document.createTextNode,
//              no character references)
// }
//
// { t: 'Tag',
//   isEnd: Boolean (optional),
//   isSelfClosing: Boolean (optional),
//   n: String (tag name, in lowercase or camel case),
//   attrs: dictionary of { String: [tokens] }
//          OR [{ String: [tokens] }, TemplateTag tokens...]
//     (only for start tags; required)
// }
//
// { t: 'CharRef',
//   v: String (entire character reference from the source, e.g. "&amp;"),
//   cp: [Integer] (array of Unicode code point numbers it expands to)
// }
//
// We keep around both the original form of the character reference and its
// expansion so that subsequent processing steps have the option to
// re-emit it (if they are generating HTML) or interpret it.  Named and
// numerical code points may be more than 16 bits, in which case they
// need to passed through codePointToString to make a JavaScript string.
// Most named entities and all numeric character references are one codepoint
// (e.g. "&amp;" is [38]), but a few are two codepoints.
//
// { t: 'TemplateTag',
//   v: HTMLTools.TemplateTag
// }

// The HTML tokenization spec says to preprocess the input stream to replace
// CR(LF)? with LF.  However, preprocessing `scanner` would complicate things
// by making indexes not match the input (e.g. for error messages), so we just
// keep in mind as we go along that an LF might be represented by CRLF or CR.
// In most cases, it doesn't actually matter what combination of whitespace
// characters are present (e.g. inside tags).
const HTML_SPACE = /^[\f\n\r\t ]/;

const convertCRLF = function (str) {
  return str.replace(/\r\n?/g, '\n');
};

export function getComment(scanner) {
  if (scanner.rest().slice(0, 4) !== '<!--') return null;
  scanner.pos += 4;

  // Valid comments are easy to parse; they end at the first `--`!
  // Our main job is throwing errors.

  const rest = scanner.rest();
  if (rest.charAt(0) === '>' || rest.slice(0, 2) === '->') scanner.fatal("HTML comment can't start with > or ->");

  const closePos = rest.indexOf('-->');
  if (closePos < 0) scanner.fatal('Unclosed HTML comment');

  const commentContents = rest.slice(0, closePos);
  if (commentContents.slice(-1) === '-') scanner.fatal('HTML comment must end at first `--`');
  if (commentContents.indexOf('--') >= 0) scanner.fatal('HTML comment cannot contain `--` anywhere');
  if (commentContents.indexOf('\u0000') >= 0) scanner.fatal('HTML comment cannot contain NULL');

  scanner.pos += closePos + 3;

  return {
    t: 'Comment',
    v: convertCRLF(commentContents),
  };
}

const skipSpaces = function (scanner) {
  while (HTML_SPACE.test(scanner.peek())) {
    scanner.pos++;
  }
};

const requireSpaces = function (scanner) {
  if (!HTML_SPACE.test(scanner.peek())) scanner.fatal('Expected space');
  skipSpaces(scanner);
};

const getDoctypeQuotedString = function (scanner) {
  const quote = scanner.peek();
  if (!(quote === '"' || quote === "'")) scanner.fatal('Expected single or double quote in DOCTYPE');
  scanner.pos++;

  if (scanner.peek() === quote) {
    // prevent a falsy return value (empty string)
    scanner.fatal('Malformed DOCTYPE');
  }

  let str = '';
  let ch;
  while ((ch = scanner.peek()), ch !== quote) {
    if ((!ch) || (ch === '\u0000') || (ch === '>')) {
      scanner.fatal('Malformed DOCTYPE');
    }

    str += ch;
    scanner.pos++;
  }

  scanner.pos++;

  return str;
};

// See http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html#the-doctype.
//
// If `getDocType` sees "<!DOCTYPE" (case-insensitive), it will match or fail fatally.
export function getDoctype(scanner) {
  if (asciiLowerCase(scanner.rest().slice(0, 9)) !== '<!doctype') return null;
  const start = scanner.pos;
  scanner.pos += 9;

  requireSpaces(scanner);

  let ch = scanner.peek();
  if ((!ch) || (ch === '>') || (ch === '\u0000')) scanner.fatal('Malformed DOCTYPE');
  let name = ch;
  scanner.pos++;

  while ((ch = scanner.peek()), !(HTML_SPACE.test(ch) || ch === '>')) {
    if ((!ch) || (ch === '\u0000')) scanner.fatal('Malformed DOCTYPE');
    name += ch;
    scanner.pos++;
  }
  name = asciiLowerCase(name);

  // Now we're looking at a space or a `>`.
  skipSpaces(scanner);

  let systemId = null;
  let publicId = null;

  if (scanner.peek() !== '>') {
    // Now we're essentially in the "After DOCTYPE name state" of the tokenizer,
    // but we're not looking at space or `>`.

    // this should be "public" or "system".
    const publicOrSystem = asciiLowerCase(scanner.rest().slice(0, 6));

    if (publicOrSystem === 'system') {
      scanner.pos += 6;
      requireSpaces(scanner);
      systemId = getDoctypeQuotedString(scanner);
      skipSpaces(scanner);
      if (scanner.peek() !== '>') scanner.fatal('Malformed DOCTYPE');
    } else if (publicOrSystem === 'public') {
      scanner.pos += 6;
      requireSpaces(scanner);
      publicId = getDoctypeQuotedString(scanner);
      if (scanner.peek() !== '>') {
        requireSpaces(scanner);
        if (scanner.peek() !== '>') {
          systemId = getDoctypeQuotedString(scanner);
          skipSpaces(scanner);
          if (scanner.peek() !== '>') scanner.fatal('Malformed DOCTYPE');
        }
      }
    } else {
      scanner.fatal('Expected PUBLIC or SYSTEM in DOCTYPE');
    }
  }

  // looking at `>`
  scanner.pos++;
  const result = {
    t: 'Doctype',
    v: scanner.input.slice(start, scanner.pos),
    name,
  };

  if (systemId) result.systemId = systemId;
  if (publicId) result.publicId = publicId;

  return result;
}

// The special character `{` is only allowed as the first character
// of a Chars, so that we have a chance to detect template tags.
const getChars = makeRegexMatcher(/^[^&<\u0000][^&<\u0000{]*/);

const assertIsTemplateTag = function (x) {
  if (!(x instanceof TemplateTag)) throw new Error('Expected an instance of HTMLTools.TemplateTag');
  return x;
};

export const TEMPLATE_TAG_POSITION = {
  ELEMENT: 1,
  IN_START_TAG: 2,
  IN_ATTRIBUTE: 3,
  IN_RCDATA: 4,
  IN_RAWTEXT: 5,
};

const getTagName = makeRegexMatcher(/^[a-zA-Z][^\f\n\r\t />{]*/);
const getClangle = makeRegexMatcher(/^>/);
const getSlash = makeRegexMatcher(/^\//);
const getAttributeName = makeRegexMatcher(/^[^>/\u0000"'<=\f\n\r\t ][^\f\n\r\t /=>"'<\u0000]*/);

const { hasOwnProperty } = Object.prototype;

// Try to parse `>` or `/>`, mutating `tag` to be self-closing in the latter
// case (and failing fatally if `/` isn't followed by `>`).
// Return tag if successful.
const handleEndOfTag = function (scanner, tag) {
  if (getClangle(scanner)) return tag;

  if (getSlash(scanner)) {
    if (!getClangle(scanner)) scanner.fatal('Expected `>` after `/`');
    tag.isSelfClosing = true;
    return tag;
  }

  return null;
};

// Scan a quoted or unquoted attribute value (omit `quote` for unquoted).
const getAttributeValue = function (scanner, quote) {
  if (quote) {
    if (scanner.peek() !== quote) return null;
    scanner.pos++;
  }

  const tokens = [];
  let charsTokenToExtend = null;

  let charRef;
  while (true) {
    const ch = scanner.peek();
    let templateTag;
    const curPos = scanner.pos;
    if (quote && ch === quote) {
      scanner.pos++;
      return tokens;
    }
    if ((!quote) && (HTML_SPACE.test(ch) || ch === '>')) {
      return tokens;
    }
    if (!ch) {
      scanner.fatal('Unclosed attribute in tag');
    } else if (quote ? ch === '\u0000' : ('\u0000"\'<=`'.indexOf(ch) >= 0)) {
      scanner.fatal('Unexpected character in attribute value');
    } else if (ch === '&' &&
      (charRef = getCharacterReference(scanner, true,
        quote || '>'))) {
      tokens.push(charRef);
      charsTokenToExtend = null;
    } else if (scanner.getTemplateTag &&
      ((templateTag = scanner.getTemplateTag(scanner, TEMPLATE_TAG_POSITION.IN_ATTRIBUTE)) ||
        scanner.pos > curPos /* `{{! comment}}` */)) {
      if (templateTag) {
        tokens.push({
          t: 'TemplateTag',
          v: assertIsTemplateTag(templateTag),
        });
        charsTokenToExtend = null;
      }
    } else {
      if (!charsTokenToExtend) {
        charsTokenToExtend = { t: 'Chars', v: '' };
        tokens.push(charsTokenToExtend);
      }
      charsTokenToExtend.v += (ch === '\r' ? '\n' : ch);
      scanner.pos++;
      if (quote && ch === '\r' && scanner.peek() === '\n') scanner.pos++;
    }
  }
};

export function getTagToken(scanner) {
  if (!(scanner.peek() === '<' && scanner.rest().charAt(1) !== '!')) return null;
  scanner.pos++;

  const tag = { t: 'Tag' };

  // now looking at the character after `<`, which is not a `!`
  if (scanner.peek() === '/') {
    tag.isEnd = true;
    scanner.pos++;
  }

  const tagName = getTagName(scanner);
  if (!tagName) scanner.fatal('Expected tag name after `<`');
  tag.n = properCaseTagName(tagName);

  if (scanner.peek() === '/' && tag.isEnd) scanner.fatal("End tag can't have trailing slash");
  if (handleEndOfTag(scanner, tag)) return tag;

  if (scanner.isEOF()) {
    scanner.fatal('Unclosed `<`');
  }

  if (!HTML_SPACE.test(scanner.peek())) {
    // e.g. `<a{{b}}>`
    scanner.fatal('Expected space after tag name');
  }

  // we're now in "Before attribute name state" of the tokenizer
  skipSpaces(scanner);

  if (scanner.peek() === '/' && tag.isEnd) scanner.fatal("End tag can't have trailing slash");
  if (handleEndOfTag(scanner, tag)) return tag;

  if (tag.isEnd) scanner.fatal("End tag can't have attributes");

  tag.attrs = {};
  const nondynamicAttrs = tag.attrs;

  while (true) {
    // Note: at the top of this loop, we've already skipped any spaces.

    // This will be set to true if after parsing the attribute, we should
    // require spaces (or else an end of tag, i.e. `>` or `/>`).
    let spacesRequiredAfter = false;

    // first, try for a template tag.
    const curPos = scanner.pos;
    const templateTag = (scanner.getTemplateTag &&
      scanner.getTemplateTag(scanner, TEMPLATE_TAG_POSITION.IN_START_TAG));

    if (templateTag || (scanner.pos > curPos)) {
      if (templateTag) {
        if (tag.attrs === nondynamicAttrs) tag.attrs = [nondynamicAttrs];
        tag.attrs.push({
          t: 'TemplateTag',
          v: assertIsTemplateTag(templateTag),
        });
      } // else, must have scanned a `{{! comment}}`

      spacesRequiredAfter = true;
    } else {
      let attributeName = getAttributeName(scanner);
      if (!attributeName) scanner.fatal('Expected attribute name in tag');
      // Throw error on `{` in attribute name.  This provides *some* error message
      // if someone writes `<a x{{y}}>` or `<a x{{y}}=z>`.  The HTML tokenization
      // spec doesn't say that `{` is invalid, but the DOM API (setAttribute) won't
      // allow it, so who cares.
      if (attributeName.indexOf('{') >= 0) scanner.fatal('Unexpected `{` in attribute name.');
      attributeName = properCaseAttributeName(attributeName);

      if (hasOwnProperty.call(nondynamicAttrs, attributeName)) scanner.fatal(`Duplicate attribute in tag: ${attributeName}`);

      nondynamicAttrs[attributeName] = [];

      skipSpaces(scanner);

      if (handleEndOfTag(scanner, tag)) return tag;

      let ch = scanner.peek();
      if (!ch) scanner.fatal('Unclosed <');
      if ('\u0000"\'<'.indexOf(ch) >= 0) scanner.fatal('Unexpected character after attribute name in tag');

      if (ch === '=') {
        scanner.pos++;

        skipSpaces(scanner);

        ch = scanner.peek();
        if (!ch) scanner.fatal('Unclosed <');
        if ('\u0000><=`'.indexOf(ch) >= 0) scanner.fatal('Unexpected character after = in tag');

        if ((ch === '"') || (ch === "'")) nondynamicAttrs[attributeName] = getAttributeValue(scanner, ch);
        else nondynamicAttrs[attributeName] = getAttributeValue(scanner);

        spacesRequiredAfter = true;
      }
    }
    // now we are in the "post-attribute" position, whether it was a template tag
    // attribute (like `{{x}}`) or a normal one (like `x` or `x=y`).

    if (handleEndOfTag(scanner, tag)) return tag;

    if (scanner.isEOF()) scanner.fatal('Unclosed `<`');

    if (spacesRequiredAfter) requireSpaces(scanner);
    else skipSpaces(scanner);

    if (handleEndOfTag(scanner, tag)) return tag;
  }
}

// Returns the next HTML token, or `null` if we reach EOF.
//
// Note that if we have a `getTemplateTag` function that sometimes
// consumes characters and emits nothing (e.g. in the case of template
// comments), we may go from not-at-EOF to at-EOF and return `null`,
// while otherwise we always find some token to return.
export function getHTMLToken(scanner, dataMode) {
  let result = null;
  if (scanner.getTemplateTag) {
    // Try to parse a template tag by calling out to the provided
    // `getTemplateTag` function.  If the function returns `null` but
    // consumes characters, it must have parsed a comment or something,
    // so we loop and try it again.  If it ever returns `null` without
    // consuming anything, that means it didn't see anything interesting,
    // so we look for a normal token.  If it returns a truthy value,
    // the value must be instanceof HTMLTools.TemplateTag.  We wrap it
    // in a Special token.
    const lastPos = scanner.pos;
    const position = (dataMode === 'rcdata' ? TEMPLATE_TAG_POSITION.IN_RCDATA : (dataMode === 'rawtext' ? TEMPLATE_TAG_POSITION.IN_RAWTEXT : TEMPLATE_TAG_POSITION.ELEMENT));

    result = scanner.getTemplateTag(scanner, position);

    if (result) return { t: 'TemplateTag', v: assertIsTemplateTag(result) };
    if (scanner.pos > lastPos) return null;
  }

  const chars = getChars(scanner);
  if (chars) {
    return {
      t: 'Chars',
      v: convertCRLF(chars),
    };
  }

  const ch = scanner.peek();
  if (!ch) return null; // EOF

  if (ch === '\u0000') scanner.fatal('Illegal NULL character');

  if (ch === '&') {
    if (dataMode !== 'rawtext') {
      const charRef = getCharacterReference(scanner);
      if (charRef) return charRef;
    }

    scanner.pos++;
    return {
      t: 'Chars',
      v: '&',
    };
  }

  // If we're here, we're looking at `<`.

  if (scanner.peek() === '<' && dataMode) {
    // don't interpret tags
    scanner.pos++;
    return {
      t: 'Chars',
      v: '<',
    };
  }

  // `getTag` will claim anything starting with `<` not followed by `!`.
  // `getComment` takes `<!--` and getDoctype takes `<!doctype`.
  result = (getTagToken(scanner) || getComment(scanner) || getDoctype(scanner));

  if (result) return result;

  scanner.fatal('Unexpected `<!` directive.');
}

// tagName must be proper case
export function isLookingAtEndTag(scanner, tagName) {
  const rest = scanner.rest();
  let pos = 0; // into rest
  const firstPart = /^<\/([a-zA-Z]+)/.exec(rest);

  if (firstPart &&
    properCaseTagName(firstPart[1]) === tagName) {
    // we've seen `</foo`, now see if the end tag continues
    pos += firstPart[0].length;
    while (pos < rest.length && HTML_SPACE.test(rest.charAt(pos))) pos++;
    if (pos < rest.length && rest.charAt(pos) === '>') return true;
  }

  return false;
}
