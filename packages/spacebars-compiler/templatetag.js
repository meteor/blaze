import { HTMLTools } from 'meteor/html-tools';
import { HTML } from 'meteor/htmljs';
import { BlazeTools } from 'meteor/blaze-tools';

// A TemplateTag is the result of parsing a single `{{...}}` tag.
//
// The `.type` of a TemplateTag is one of:
//
// - `"DOUBLE"` - `{{foo}}`
// - `"TRIPLE"` - `{{{foo}}}`
// - `"EXPR"` - `(foo)`
// - `"COMMENT"` - `{{! foo}}`
// - `"BLOCKCOMMENT" - `{{!-- foo--}}`
// - `"INCLUSION"` - `{{> foo}}`
// - `"BLOCKOPEN"` - `{{#foo}}`
// - `"BLOCKCLOSE"` - `{{/foo}}`
// - `"ELSE"` - `{{else}}`
// - `"ESCAPE"` - `{{|`, `{{{|`, `{{{{|` and so on
//
// Besides `type`, the mandatory properties of a TemplateTag are:
//
// - `path` - An array of one or more strings.  The path of `{{foo.bar}}`
//   is `["foo", "bar"]`.  Applies to DOUBLE, TRIPLE, INCLUSION, BLOCKOPEN,
//   BLOCKCLOSE, and ELSE.
//
// - `args` - An array of zero or more argument specs.  An argument spec
//   is a two or three element array, consisting of a type, value, and
//   optional keyword name.  For example, the `args` of `{{foo "bar" x=3}}`
//   are `[["STRING", "bar"], ["NUMBER", 3, "x"]]`.  Applies to DOUBLE,
//   TRIPLE, INCLUSION, BLOCKOPEN, and ELSE.
//
// - `value` - A string of the comment's text. Applies to COMMENT and
//   BLOCKCOMMENT.
//
// These additional are typically set during parsing:
//
// - `position` - The HTMLTools.TEMPLATE_TAG_POSITION specifying at what sort
//   of site the TemplateTag was encountered (e.g. at element level or as
//   part of an attribute value). Its absence implies
//   TEMPLATE_TAG_POSITION.ELEMENT.
//
// - `content` and `elseContent` - When a BLOCKOPEN tag's contents are
//   parsed, they are put here.  `elseContent` will only be present if
//   an `{{else}}` was found.

const { TEMPLATE_TAG_POSITION } = HTMLTools;

export function TemplateTag(...args) {
  // eslint-disable-next-line no-new
  new HTMLTools.TemplateTag(args);
}

TemplateTag.prototype = new HTMLTools.TemplateTag();
TemplateTag.prototype.constructorName = 'SpacebarsCompiler.TemplateTag';

const makeStacheTagStartRegex = function (r) {
  return new RegExp(r.source + /(?![{>!#/])/.source,
    r.ignoreCase ? 'i' : '');
};

// "starts" regexes are used to see what type of template
// tag the parser is looking at.  They must match a non-empty
// result, but not the interesting part of the tag.
const starts = {
  ESCAPE: /^\{\{(?=\{*\|)/,
  ELSE: makeStacheTagStartRegex(/^\{\{\s*else(\s+(?!\s)|(?=[}]))/i),
  DOUBLE: makeStacheTagStartRegex(/^\{\{\s*(?!\s)/),
  TRIPLE: makeStacheTagStartRegex(/^\{\{\{\s*(?!\s)/),
  BLOCKCOMMENT: makeStacheTagStartRegex(/^\{\{\s*!--/),
  COMMENT: makeStacheTagStartRegex(/^\{\{\s*!/),
  INCLUSION: makeStacheTagStartRegex(/^\{\{\s*>\s*(?!\s)/),
  BLOCKOPEN: makeStacheTagStartRegex(/^\{\{\s*#\s*(?!\s)/),
  BLOCKCLOSE: makeStacheTagStartRegex(/^\{\{\s*\/\s*(?!\s)/),
};

const ends = {
  DOUBLE: /^\s*\}\}/,
  TRIPLE: /^\s*\}\}\}/,
  EXPR: /^\s*\)/,
};

const endsString = {
  DOUBLE: '}}',
  TRIPLE: '}}}',
  EXPR: ')',
};

// Parse a tag from the provided scanner or string.  If the input
// doesn't start with `{{`, returns null.  Otherwise, either succeeds
// and returns a SpacebarsCompiler.TemplateTag, or throws an error (using
// `scanner.fatal` if a scanner is provided).
TemplateTag.parse = function (scannerOrString) {
  let scanner = scannerOrString;
  if (typeof scanner === 'string') scanner = new HTMLTools.Scanner(scannerOrString);

  if (!(scanner.peek() === '{' &&
    (scanner.rest()).slice(0, 2) === '{{')) return null;

  const run = function (regex) {
    // regex is assumed to start with `^`
    const result = regex.exec(scanner.rest());
    if (!result) return null;
    const ret = result[0];
    scanner.pos += ret.length;
    return ret;
  };

  /*
    const advance = function (amount) {
      scanner.pos += amount;
    };
  */

  const error = function (msg) {
    scanner.fatal(msg);
  };

  const expected = function (what) {
    error(`Expected ${what}`);
  };

  const scanIdentifier = function (isFirstInPath) {
    const id = BlazeTools.parseExtendedIdentifierName(scanner);
    if (!id) {
      expected('IDENTIFIER');
    }
    if (isFirstInPath &&
      (id === 'null' || id === 'true' || id === 'false')) scanner.fatal('Can\'t use null, true, or false, as an identifier at start of path');

    return id;
  };

  const scanPath = function () {
    const segments = [];

    // handle initial `.`, `..`, `./`, `../`, `../..`, `../../`, etc
    let dots = run(/^[./]+/);
    if (dots) {
      let ancestorStr = '.'; // eg `../../..` maps to `....`
      const endsWithSlash = /\/$/.test(dots);

      if (endsWithSlash) dots = dots.slice(0, -1);

      dots.split('/').forEach(function (dotClause, index) {
        if (index === 0) {
          if (dotClause !== '.' && dotClause !== '..') expected('`.`, `..`, `./` or `../`');
        } else if (dotClause !== '..') expected('`..` or `../`');

        if (dotClause === '..') ancestorStr += '.';
      });

      segments.push(ancestorStr);

      if (!endsWithSlash) return segments;
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // scan a path segment

      if (run(/^\[/)) {
        let seg = run(/^[\s\S]*?\]/);
        if (!seg) error('Unterminated path segment');
        seg = seg.slice(0, -1);
        if (!seg && !segments.length) error('Path can\'t start with empty string');
        segments.push(seg);
      } else {
        const id = scanIdentifier(!segments.length);
        if (id === 'this') {
          if (!segments.length) {
            // initial `this`
            segments.push('.');
          } else {
            error('Can only use `this` at the beginning of a path.\nInstead of `foo.this` or `../this`, just write `foo` or `..`.');
          }
        } else {
          segments.push(id);
        }
      }

      const sep = run(/^[./]/);
      if (!sep) break;
    }

    return segments;
  };

  // scan the keyword portion of a keyword argument
  // (the "foo" portion in "foo=bar").
  // Result is either the keyword matched, or null
  // if we're not at a keyword argument position.
  const scanArgKeyword = function () {
    const match = /^([^{}()>#=\s"'[\]]+)\s*=\s*/.exec(scanner.rest());
    if (match) {
      scanner.pos += match[0].length;
      return match[1];
    }
    return null;
  };

  const scanExpr = function (type) {
    let endType = type;
    if (type === 'INCLUSION' || type === 'BLOCKOPEN' || type === 'ELSE') endType = 'DOUBLE';

    const tag = new TemplateTag();
    tag.type = type;
    tag.path = scanPath();
    tag.args = [];
    let foundKwArg = false;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      run(/^\s*/);
      if (run(ends[endType])) break;
      else if (/^[})]/.test(scanner.peek())) {
        expected(`\`${endsString[endType]}\``);
      }
      // eslint-disable-next-line no-use-before-define
      const newArg = scanArg();
      if (newArg.length === 3) {
        foundKwArg = true;
      } else if (foundKwArg) error('Can\'t have a non-keyword argument after a keyword argument');
      tag.args.push(newArg);

      // expect a whitespace or a closing ')' or '}'
      if (run(/^(?=[\s})])/) !== '') expected('space');
    }

    return tag;
  };

  // scan an argument value (for keyword or positional arguments);
  // succeeds or errors.  Result is an array of type, value.
  const scanArgValue = function () {
    const startPos = scanner.pos;
    let result = BlazeTools.parseNumber(scanner);
    if (result) {
      return ['NUMBER', result.value];
    }
    result = BlazeTools.parseStringLiteral(scanner);
    if (result) {
      return ['STRING', result.value];
    }
    if (/^[.[]/.test(scanner.peek())) {
      return ['PATH', scanPath()];
    }
    if (run(/^\(/)) {
      return ['EXPR', scanExpr('EXPR')];
    }
    result = BlazeTools.parseExtendedIdentifierName(scanner);
    if (result) {
      const id = result;
      if (id === 'null') {
        return ['NULL', null];
      }
      if (id === 'true' || id === 'false') {
        return ['BOOLEAN', id === 'true'];
      }
      scanner.pos = startPos; // unconsume `id`
      return ['PATH', scanPath()];
    }
    expected('identifier, number, string, boolean, null, or a sub expression enclosed in "(", ")"');
    return null;
  };

  // scan an argument; succeeds or errors.
  // Result is an array of two or three items:
  // type , value, and (indicating a keyword argument)
  // keyword name.
  const scanArg = function () {
    const keyword = scanArgKeyword(); // null if not parsing a kwarg
    const value = scanArgValue();
    return keyword ? value.concat(keyword) : value;
  };

  let type;

  // must do ESCAPE first, immediately followed by ELSE
  // order of others doesn't matter
  if (run(starts.ESCAPE)) type = 'ESCAPE';
  else if (run(starts.ELSE)) type = 'ELSE';
  else if (run(starts.DOUBLE)) type = 'DOUBLE';
  else if (run(starts.TRIPLE)) type = 'TRIPLE';
  else if (run(starts.BLOCKCOMMENT)) type = 'BLOCKCOMMENT';
  else if (run(starts.COMMENT)) type = 'COMMENT';
  else if (run(starts.INCLUSION)) type = 'INCLUSION';
  else if (run(starts.BLOCKOPEN)) type = 'BLOCKOPEN';
  else if (run(starts.BLOCKCLOSE)) type = 'BLOCKCLOSE';
  else error('Unknown stache tag');

  let tag = new TemplateTag();
  tag.type = type;

  if (type === 'BLOCKCOMMENT') {
    const result = run(/^[\s\S]*?--\s*?\}\}/);
    if (!result) error('Unclosed block comment');
    tag.value = result.slice(0, result.lastIndexOf('--'));
  } else if (type === 'COMMENT') {
    const result = run(/^[\s\S]*?\}\}/);
    if (!result) error('Unclosed comment');
    tag.value = result.slice(0, -2);
  } else if (type === 'BLOCKCLOSE') {
    tag.path = scanPath();
    if (!run(ends.DOUBLE)) expected('`}}`');
  } else if (type === 'ELSE') {
    if (!run(ends.DOUBLE)) {
      tag = scanExpr(type);
    }
  } else if (type === 'ESCAPE') {
    const result = run(/^\{*\|/);
    tag.value = `{{${result.slice(0, -1)}`;
  } else {
    // DOUBLE, TRIPLE, BLOCKOPEN, INCLUSION
    tag = scanExpr(type);
  }

  return tag;
};

// Returns a SpacebarsCompiler.TemplateTag parsed from `scanner`, leaving scanner
// at its original position.
//
// An error will still be thrown if there is not a valid template tag at
// the current position.
TemplateTag.peek = function (scanner) {
  const _scanner = scanner;
  const startPos = _scanner.pos;
  const result = TemplateTag.parse(_scanner);
  _scanner.pos = startPos;
  return result;
};

const isAtBlockCloseOrElse = function (scanner) {
  // Detect `{{else}}` or `{{/foo}}`.
  //
  // We do as much work ourselves before deferring to `TemplateTag.peek`,
  // for efficiency (we're called for every input token) and to be
  // less obtrusive, because `TemplateTag.peek` will throw an error if it
  // sees `{{` followed by a malformed tag.
  let rest;

  if (scanner.peek() === '{') {
    rest = scanner.rest();
    if (rest.slice(0, 2) === '{{' && /^\{\{\s*(\/|else\b)/.test(rest)) {
      const { type } = TemplateTag.peek(scanner);
      return (type === 'BLOCKCLOSE' || type === 'ELSE');
    }
  }

  return false;

  /*
    const newVar = scanner.peek() === '{' &&
      (rest = scanner.rest()).slice(0, 2) === '{{' &&
      /^\{\{\s*(\/|else\b)/.test(rest) &&
      (type = TemplateTag.peek(scanner).type) &&
      (type === 'BLOCKCLOSE' || type === 'ELSE');
  */
};

// Validate that `templateTag` is correctly formed and legal for its
// HTML position.  Use `scanner` to report errors. On success, does
// nothing.
const validateTag = function (ttag, scanner) {
  if (ttag.type === 'INCLUSION' || ttag.type === 'BLOCKOPEN') {
    const { args } = ttag;
    if (ttag.path[0] === 'each' && args[1] && args[1][0] === 'PATH' &&
      args[1][1][0] === 'in') {
      // For slightly better error messages, we detect the each-in case
      // here in order not to complain if the user writes `{{#each 3 in x}}`
      // that "3 is not a function"
    } else if (args.length > 1 && args[0].length === 2 && args[0][0] !== 'PATH') {
      // we have a positional argument that is not a PATH followed by
      // other arguments
      scanner.fatal(`${'First argument must be a function, to be called on ' +
      'the rest of the arguments; found '}${args[0][0]}`);
    }
  }

  const position = ttag.position || TEMPLATE_TAG_POSITION.ELEMENT;
  if (position === TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {
    // eslint-disable-next-line no-empty
    if (ttag.type === 'DOUBLE' || ttag.type === 'ESCAPE') {

    } else if (ttag.type === 'BLOCKOPEN') {
      const { path } = ttag;
      const path0 = path[0];
      if (!(path.length === 1 && (path0 === 'if' ||
        path0 === 'unless' ||
        path0 === 'with' ||
        path0 === 'each'))) {
        scanner.fatal('Custom block helpers are not allowed in an HTML attribute, only built-in ones like #each and #if');
      }
    } else {
      scanner.fatal(`${ttag.type} template tag is not allowed in an HTML attribute`);
    }
  } else if (position === TEMPLATE_TAG_POSITION.IN_START_TAG) {
    if (!(ttag.type === 'DOUBLE')) {
      scanner.fatal(`Reactive HTML attributes must either have a constant name or consist of a single {{helper}} providing a dictionary of names and values.  A template tag of type ${ttag.type} is not allowed here.`);
    }
    if (scanner.peek() === '=') {
      scanner.fatal('Template tags are not allowed in attribute names, only in attribute values or in the form of a single {{helper}} that evaluates to a dictionary of name=value pairs.');
    }
  }
};

// Like `TemplateTag.parse`, but in the case of blocks, parse the complete
// `{{#foo}}...{{/foo}}` with `content` and possible `elseContent`, rather
// than just the BLOCKOPEN tag.
//
// In addition:
//
// - Throws an error if `{{else}}` or `{{/foo}}` tag is encountered.
//
// - Returns `null` for a COMMENT.  (This case is distinguishable from
//   parsing no tag by the fact that the scanner is advanced.)
//
// - Takes an HTMLTools.TEMPLATE_TAG_POSITION `position` and sets it as the
//   TemplateTag's `.position` property.
//
// - Validates the tag's well-formedness and legality at in its position.
TemplateTag.parseCompleteTag = function (scannerOrString, position) {
  let scanner = scannerOrString;
  if (typeof scanner === 'string') scanner = new HTMLTools.Scanner(scannerOrString);

  const startPos = scanner.pos; // for error messages
  const result = TemplateTag.parse(scannerOrString);
  if (!result) return result;

  if (result.type === 'BLOCKCOMMENT') return null;

  if (result.type === 'COMMENT') return null;

  if (result.type === 'ELSE') scanner.fatal('Unexpected {{else}}');

  if (result.type === 'BLOCKCLOSE') scanner.fatal('Unexpected closing template tag');

  const _position = (position || TEMPLATE_TAG_POSITION.ELEMENT);
  if (_position !== TEMPLATE_TAG_POSITION.ELEMENT) result.position = _position;

  if (result.type === 'BLOCKOPEN') {
    // parse block contents

    // Construct a string version of `.path` for comparing start and
    // end tags.  For example, `foo/[0]` was parsed into `["foo", "0"]`
    // and now becomes `foo,0`.  This form may also show up in error
    // messages.
    const blockName = result.path.join(',');

    let textMode = null;
    if (blockName === 'markdown' ||
      _position === TEMPLATE_TAG_POSITION.IN_RAWTEXT) {
      textMode = HTML.TEXTMODE.STRING;
    } else if (_position === TEMPLATE_TAG_POSITION.IN_RCDATA ||
      _position === TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {
      textMode = HTML.TEXTMODE.RCDATA;
    }
    const parserOptions = {
      getTemplateTag: TemplateTag.parseCompleteTag,
      shouldStop: isAtBlockCloseOrElse,
      textMode,
    };
    result.textMode = textMode;
    result.content = HTMLTools.parseFragment(scanner, parserOptions);

    if (scanner.rest().slice(0, 2) !== '{{') scanner.fatal(`Expected {{else}} or block close for ${blockName}`);

    let lastPos = scanner.pos; // save for error messages
    let tmplTag = TemplateTag.parse(scanner); // {{else}} or {{/foo}}

    let lastElseContentTag = result;
    while (tmplTag.type === 'ELSE') {
      if (lastElseContentTag === null) {
        scanner.fatal('Unexpected else after {{else}}');
      }

      if (tmplTag.path) {
        lastElseContentTag.elseContent = new TemplateTag();
        lastElseContentTag.elseContent.type = 'BLOCKOPEN';
        lastElseContentTag.elseContent.path = tmplTag.path;
        lastElseContentTag.elseContent.args = tmplTag.args;
        lastElseContentTag.elseContent.textMode = textMode;
        lastElseContentTag.elseContent.content = HTMLTools.parseFragment(scanner, parserOptions);

        lastElseContentTag = lastElseContentTag.elseContent;
      } else {
        // parse {{else}} and content up to close tag
        lastElseContentTag.elseContent = HTMLTools.parseFragment(scanner, parserOptions);

        lastElseContentTag = null;
      }

      if (scanner.rest().slice(0, 2) !== '{{') scanner.fatal(`Expected block close for ${blockName}`);

      lastPos = scanner.pos;
      tmplTag = TemplateTag.parse(scanner);
    }

    if (tmplTag.type === 'BLOCKCLOSE') {
      const blockName2 = tmplTag.path.join(',');
      if (blockName !== blockName2) {
        scanner.pos = lastPos;
        scanner.fatal(`Expected tag to close ${blockName}, found ${
          blockName2}`);
      }
    } else {
      scanner.pos = lastPos;
      scanner.fatal(`Expected tag to close ${blockName}, found ${
        tmplTag.type}`);
    }
  }

  const finalPos = scanner.pos;
  scanner.pos = startPos;
  validateTag(result, scanner);
  scanner.pos = finalPos;

  return result;
};
