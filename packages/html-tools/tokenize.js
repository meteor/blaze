import { asciiLowerCase, properCaseAttributeName, properCaseTagName } from './utils';
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

export const TEMPLATE_TAG_POSITION = {
  ELEMENT: 1,
  IN_START_TAG: 2,
  IN_ATTRIBUTE: 3,
  IN_RCDATA: 4,
  IN_RAWTEXT: 5,
};

const convertCRLF = function (str) {
  return str.replace(/\r\n?/g, '\n');
};

export function getComment(scanner) {
  const _scanner = scanner;

  if (_scanner.rest().slice(0, 4) !== '<!--') return null;
  _scanner.pos += 4;

  // Valid comments are easy to parse; they end at the first `--`!
  // Our main job is throwing errors.

  const rest = _scanner.rest();
  if (rest.charAt(0) === '>' || rest.slice(0, 2) === '->') _scanner.fatal('HTML comment can\'t start with > or ->');

  const closePos = rest.indexOf('-->');
  if (closePos < 0) _scanner.fatal('Unclosed HTML comment');

  const commentContents = rest.slice(0, closePos);
  if (commentContents.slice(-1) === '-') _scanner.fatal('HTML comment must end at first `--`');
  if (commentContents.indexOf('--') >= 0) _scanner.fatal('HTML comment cannot contain `--` anywhere');
  if (commentContents.indexOf('\u0000') >= 0) _scanner.fatal('HTML comment cannot contain NULL');

  _scanner.pos += closePos + 3;

  return {
    t: 'Comment',
    v: convertCRLF(commentContents),
  };
}

const skipSpaces = function (scanner) {
  const _scanner = scanner;
  while (HTML_SPACE.test(_scanner.peek())) _scanner.pos++;
};

const requireSpaces = function (scanner) {
  if (!HTML_SPACE.test(scanner.peek())) scanner.fatal('Expected space');
  skipSpaces(scanner);
};

const getTagName = makeRegexMatcher(/^[a-zA-Z][^\f\n\r\t />{]*/);
const getClangle = makeRegexMatcher(/^>/);
const getSlash = makeRegexMatcher(/^\//);
// eslint-disable-next-line no-control-regex
const getAttributeName = makeRegexMatcher(/^[^>/\u0000"'<=\f\n\r\t ][^\f\n\r\t /=>"'<\u0000]*/);

const { hasOwnProperty } = Object.prototype;

// Try to parse `>` or `/>`, mutating `tag` to be self-closing in the latter
// case (and failing fatally if `/` isn't followed by `>`).
// Return tag if successful.
const handleEndOfTag = function (scanner, tag) {
  const _tag = tag;
  if (getClangle(scanner)) return _tag;

  if (getSlash(scanner)) {
    if (!getClangle(scanner)) scanner.fatal('Expected `>` after `/`');
    _tag.isSelfClosing = true;
    return _tag;
  }

  return null;
};

const getDoctypeQuotedString = function (scanner) {
  const _scanner = scanner;
  const quote = _scanner.peek();
  if (!(quote === '"' || quote === '\'')) _scanner.fatal('Expected single or double quote in DOCTYPE');
  _scanner.pos++;

  // prevent a falsy return value (empty string)
  if (_scanner.peek() === quote) {
    _scanner.fatal('Malformed DOCTYPE');
  }

  let str = '';
  let ch = _scanner.peek();
  while (ch !== quote) {
    if ((!ch) || (ch === '\u0000') || (ch === '>')) _scanner.fatal('Malformed DOCTYPE');
    str += ch;
    _scanner.pos++;
    ch = _scanner.peek();
  }

  _scanner.pos++;

  return str;
};

// See http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html#the-doctype.
//
// If `getDocType` sees "<!DOCTYPE" (case-insensitive), it will match or fail fatally.
export function getDoctype(scanner) {
  const _scanner = scanner;

  if (asciiLowerCase(_scanner.rest().slice(0, 9)) !== '<!doctype') return null;
  const start = _scanner.pos;
  _scanner.pos += 9;

  requireSpaces(_scanner);

  let ch = _scanner.peek();
  if ((!ch) || (ch === '>') || (ch === '\u0000')) _scanner.fatal('Malformed DOCTYPE');
  let name = ch;
  _scanner.pos++;

  ch = _scanner.peek();
  while (!(HTML_SPACE.test(ch) || ch === '>')) {
    if ((!ch) || (ch === '\u0000')) _scanner.fatal('Malformed DOCTYPE');
    name += ch;
    _scanner.pos++;
    ch = _scanner.peek();
  }
  name = asciiLowerCase(name);

  // Now we're looking at a space or a `>`.
  skipSpaces(_scanner);

  let systemId = null;
  let publicId = null;

  if (_scanner.peek() !== '>') {
    // Now we're essentially in the "After DOCTYPE name state" of the tokenizer,
    // but we're not looking at space or `>`.

    // this should be "public" or "system".
    const publicOrSystem = asciiLowerCase(_scanner.rest().slice(0, 6));

    if (publicOrSystem === 'system') {
      _scanner.pos += 6;
      requireSpaces(_scanner);
      systemId = getDoctypeQuotedString(_scanner);
      skipSpaces(_scanner);
      if (_scanner.peek() !== '>') _scanner.fatal('Malformed DOCTYPE');
    } else if (publicOrSystem === 'public') {
      _scanner.pos += 6;
      requireSpaces(_scanner);
      publicId = getDoctypeQuotedString(_scanner);
      if (_scanner.peek() !== '>') {
        requireSpaces(_scanner);
        if (_scanner.peek() !== '>') {
          systemId = getDoctypeQuotedString(_scanner);
          skipSpaces(_scanner);
          if (_scanner.peek() !== '>') _scanner.fatal('Malformed DOCTYPE');
        }
      }
    } else {
      _scanner.fatal('Expected PUBLIC or SYSTEM in DOCTYPE');
    }
  }

  // looking at `>`
  _scanner.pos++;
  const result = {
    t: 'Doctype',
    v: _scanner.input.slice(start, _scanner.pos),
    name,
  };

  if (systemId) result.systemId = systemId;
  if (publicId) result.publicId = publicId;

  return result;
}

// The special character `{` is only allowed as the first character
// of a Chars, so that we have a chance to detect template tags.
// eslint-disable-next-line no-control-regex
const getChars = makeRegexMatcher(/^[^&<\u0000][^&<\u0000{]*/);

const assertIsTemplateTag = function (x) {
  if (!(x instanceof TemplateTag)) throw new Error('Expected an instance of HTMLTools.TemplateTag');
  return x;
};

// Scan a quoted or unquoted attribute value (omit `quote` for unquoted).
const getAttributeValue = function (scanner, quote) {
  const _scanner = scanner;

  if (quote) {
    if (_scanner.peek() !== quote) return null;
    _scanner.pos++;
  }

  const tokens = [];
  let charsTokenToExtend = null;

  let charRef;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const ch = _scanner.peek();
    let templateTag;
    const curPos = _scanner.pos;
    if (quote && ch === quote) {
      _scanner.pos++;
      return tokens;
    }
    if ((!quote) && (HTML_SPACE.test(ch) || ch === '>')) {
      return tokens;
    }
    if (!ch) {
      _scanner.fatal('Unclosed attribute in tag');
    } else if (quote ? ch === '\u0000' : ('\u0000"\'<=`'.indexOf(ch) >= 0)) {
      _scanner.fatal('Unexpected character in attribute value');
      // eslint-disable-next-line no-cond-assign
    } else if (ch === '&' &&
      (charRef = getCharacterReference(_scanner, true,
        quote || '>'))) {
      tokens.push(charRef);
      charsTokenToExtend = null;
      // eslint-disable-next-line no-cond-assign
    } else if (_scanner.getTemplateTag &&
      ((templateTag = _scanner.getTemplateTag(
          _scanner, TEMPLATE_TAG_POSITION.IN_ATTRIBUTE)) ||
        _scanner.pos > curPos /* `{{! comment}}` */)) {
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
      _scanner.pos++;
      if (quote && ch === '\r' && _scanner.peek() === '\n') _scanner.pos++;
    }
  }
};

export function getTagToken(scanner) {
  const _scanner = scanner;

  if (!(_scanner.peek() === '<' && _scanner.rest().charAt(1) !== '!')) return null;
  _scanner.pos++;

  const tag = { t: 'Tag' };

  // now looking at the character after `<`, which is not a `!`
  if (_scanner.peek() === '/') {
    tag.isEnd = true;
    _scanner.pos++;
  }

  const tagName = getTagName(_scanner);
  if (!tagName) _scanner.fatal('Expected tag name after `<`');
  tag.n = properCaseTagName(tagName);

  if (_scanner.peek() === '/' && tag.isEnd) _scanner.fatal('End tag can\'t have trailing slash');
  if (handleEndOfTag(_scanner, tag)) return tag;

  if (_scanner.isEOF()) _scanner.fatal('Unclosed `<`');

  // e.g. `<a{{b}}>`
  if (!HTML_SPACE.test(_scanner.peek())) {
    _scanner.fatal('Expected space after tag name');
  }

  // we're now in "Before attribute name state" of the tokenizer
  skipSpaces(_scanner);

  if (_scanner.peek() === '/' && tag.isEnd) _scanner.fatal('End tag can\'t have trailing slash');
  if (handleEndOfTag(_scanner, tag)) return tag;

  if (tag.isEnd) _scanner.fatal('End tag can\'t have attributes');

  tag.attrs = {};
  const nondynamicAttrs = tag.attrs;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Note: at the top of this loop, we've already skipped any spaces.

    // This will be set to true if after parsing the attribute, we should
    // require spaces (or else an end of tag, i.e. `>` or `/>`).
    let spacesRequiredAfter = false;

    // first, try for a template tag.
    const curPos = _scanner.pos;
    const templateTag = (_scanner.getTemplateTag &&
      _scanner.getTemplateTag(
        _scanner, TEMPLATE_TAG_POSITION.IN_START_TAG));
    if (templateTag || (_scanner.pos > curPos)) {
      if (templateTag) {
        if (tag.attrs === nondynamicAttrs) tag.attrs = [nondynamicAttrs];
        tag.attrs.push({
          t: 'TemplateTag',
          v: assertIsTemplateTag(templateTag),
        });
      } // else, must have scanned a `{{! comment}}`

      spacesRequiredAfter = true;
    } else {
      let attributeName = getAttributeName(_scanner);
      if (!attributeName) _scanner.fatal('Expected attribute name in tag');
      // Throw error on `{` in attribute name.  This provides *some* error message
      // if someone writes `<a x{{y}}>` or `<a x{{y}}=z>`.  The HTML tokenization
      // spec doesn't say that `{` is invalid, but the DOM API (setAttribute) won't
      // allow it, so who cares.
      if (attributeName.indexOf('{') >= 0) _scanner.fatal('Unexpected `{` in attribute name.');
      attributeName = properCaseAttributeName(attributeName);

      if (hasOwnProperty.call(nondynamicAttrs, attributeName)) _scanner.fatal(`Duplicate attribute in tag: ${attributeName}`);

      nondynamicAttrs[attributeName] = [];

      skipSpaces(_scanner);

      if (handleEndOfTag(_scanner, tag)) return tag;

      let ch = _scanner.peek();
      if (!ch) _scanner.fatal('Unclosed <');
      if ('\u0000"\'<'.indexOf(ch) >= 0) _scanner.fatal('Unexpected character after attribute name in tag');

      if (ch === '=') {
        _scanner.pos++;

        skipSpaces(_scanner);

        ch = _scanner.peek();
        if (!ch) _scanner.fatal('Unclosed <');
        if ('\u0000><=`'.indexOf(ch) >= 0) _scanner.fatal('Unexpected character after = in tag');

        if ((ch === '"') || (ch === '\'')) nondynamicAttrs[attributeName] = getAttributeValue(_scanner, ch);
        else nondynamicAttrs[attributeName] = getAttributeValue(_scanner);

        spacesRequiredAfter = true;
      }
    }
    // now we are in the "post-attribute" position, whether it was a template tag
    // attribute (like `{{x}}`) or a normal one (like `x` or `x=y`).

    if (handleEndOfTag(_scanner, tag)) return tag;

    if (_scanner.isEOF()) _scanner.fatal('Unclosed `<`');

    if (spacesRequiredAfter) requireSpaces(_scanner);
    else skipSpaces(_scanner);

    if (handleEndOfTag(_scanner, tag)) return tag;
  }
}

// Returns the next HTML token, or `null` if we reach EOF.
//
// Note that if we have a `getTemplateTag` function that sometimes
// consumes characters and emits nothing (e.g. in the case of template
// comments), we may go from not-at-EOF to at-EOF and return `null`,
// while otherwise we always find some token to return.
export function getHTMLToken(scanner, dataMode) {
  const _scanner = scanner;

  let result = null;
  if (_scanner.getTemplateTag) {
    // Try to parse a template tag by calling out to the provided
    // `getTemplateTag` function.  If the function returns `null` but
    // consumes characters, it must have parsed a comment or something,
    // so we loop and try it again.  If it ever returns `null` without
    // consuming anything, that means it didn't see anything interesting
    // so we look for a normal token.  If it returns a truthy value,
    // the value must be instanceof HTMLTools.TemplateTag.  We wrap it
    // in a Special token.
    const lastPos = _scanner.pos;
    result = _scanner.getTemplateTag(
      _scanner,
      (dataMode === 'rcdata' ? TEMPLATE_TAG_POSITION.IN_RCDATA :
        (dataMode === 'rawtext' ? TEMPLATE_TAG_POSITION.IN_RAWTEXT :
          TEMPLATE_TAG_POSITION.ELEMENT)));

    if (result) return { t: 'TemplateTag', v: assertIsTemplateTag(result) };
    if (_scanner.pos > lastPos) return null;
  }

  const chars = getChars(_scanner);
  if (chars) {
    return {
      t: 'Chars',
      v: convertCRLF(chars),
    };
  }

  const ch = _scanner.peek();
  if (!ch) return null; // EOF

  if (ch === '\u0000') _scanner.fatal('Illegal NULL character');

  if (ch === '&') {
    if (dataMode !== 'rawtext') {
      const charRef = getCharacterReference(_scanner);
      if (charRef) return charRef;
    }

    _scanner.pos++;
    return {
      t: 'Chars',
      v: '&',
    };
  }

  // If we're here, we're looking at `<`.

  if (_scanner.peek() === '<' && dataMode) {
    // don't interpret tags
    _scanner.pos++;
    return {
      t: 'Chars',
      v: '<',
    };
  }

  // `getTag` will claim anything starting with `<` not followed by `!`.
  // `getComment` takes `<!--` and getDoctype takes `<!doctype`.
  result = (getTagToken(_scanner) || getComment(_scanner) || getDoctype(_scanner));

  if (result) return result;

  _scanner.fatal('Unexpected `<!` directive.');

  return null;
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
