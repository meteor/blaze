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

const TEMPLATE_TAG_POSITION = HTMLTools.TEMPLATE_TAG_POSITION;

export function TemplateTag (...args) {
  HTMLTools.TemplateTag.apply(this, args);
}

TemplateTag.prototype = new HTMLTools.TemplateTag;
TemplateTag.prototype.constructorName = 'SpacebarsCompiler.TemplateTag';

const makeStacheTagStartRegex = (r) => {
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
  BLOCKCLOSE: makeStacheTagStartRegex(/^\{\{\s*\/\s*(?!\s)/)
};

const ends = {
  DOUBLE: /^\s*\}\}/,
  TRIPLE: /^\s*\}\}\}/,
  EXPR: /^\s*\)/
};

const endsString = {
  DOUBLE: '}}',
  TRIPLE: '}}}',
  EXPR: ')'
};

// Parse a tag from the provided scanner or string.  If the input
// doesn't start with `{{`, returns null.  Otherwise, either succeeds
// and returns a SpacebarsCompiler.TemplateTag, or throws an error (using
// `scanner.fatal` if a scanner is provided).
TemplateTag.parse = function (scannerOrString) {
  let scanner = scannerOrString;
  if (typeof scanner === 'string')
    scanner = new HTMLTools.Scanner(scannerOrString);

  if (! (scanner.peek() === '{' &&
         (scanner.rest()).slice(0, 2) === '{{'))
    return null;

  const run = (regex) => {
    // regex is assumed to start with `^`
    const result = regex.exec(scanner.rest());
    if (! result)
      return null;
    const ret = result[0];
    scanner.pos += ret.length;
    return ret;
  };

  const advance = function (amount) {
    scanner.pos += amount;
  };

  const scanIdentifier = function (isFirstInPath) {
    const id = BlazeTools.parseExtendedIdentifierName(scanner);
    if (! id) {
      expected('IDENTIFIER');
    }
    if (isFirstInPath &&
        (id === 'null' || id === 'true' || id === 'false'))
      scanner.fatal("Can't use null, true, or false, as an identifier at start of path");

    return id;
  };

  const scanPath = function () {
    const segments = [];

    // handle initial `.`, `..`, `./`, `../`, `../..`, `../../`, etc
    let dots;
    if ((dots = run(/^[\.\/]+/))) {
      let ancestorStr = '.'; // eg `../../..` maps to `....`
      const endsWithSlash = /\/$/.test(dots);

      if (endsWithSlash)
        dots = dots.slice(0, -1);

      dots.split('/').forEach(function(dotClause, index) {
        if (index === 0) {
          if (dotClause !== '.' && dotClause !== '..')
            expected("`.`, `..`, `./` or `../`");
        } else {
          if (dotClause !== '..')
            expected("`..` or `../`");
        }

        if (dotClause === '..')
          ancestorStr += '.';
      });

      segments.push(ancestorStr);

      if (!endsWithSlash)
        return segments;
    }

    while (true) {
      // scan a path segment

      if (run(/^\[/)) {
        let seg = run(/^[\s\S]*?\]/);
        if (! seg)
          error("Unterminated path segment");
        seg = seg.slice(0, -1);
        if (! seg && ! segments.length)
          error("Path can't start with empty string");
        segments.push(seg);
      } else {
        const id = scanIdentifier(! segments.length);
        if (id === 'this') {
          if (! segments.length) {
            // initial `this`
            segments.push('.');
          } else {
            error("Can only use `this` at the beginning of a path.\nInstead of `foo.this` or `../this`, just write `foo` or `..`.");
          }
        } else {
          segments.push(id);
        }
      }

      const sep = run(/^[\.\/]/);
      if (! sep)
        break;
    }

    return segments;
  };

  // scan the keyword portion of a keyword argument
  // (the "foo" portion in "foo=bar").
  // Result is either the keyword matched, or null
  // if we're not at a keyword argument position.
  const scanArgKeyword = function () {
    const match = /^([^\{\}\(\)\>#=\s"'\[\]]+)\s*=\s*/.exec(scanner.rest());
    if (match) {
      scanner.pos += match[0].length;
      return match[1];
    } else {
      return null;
    }
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

  // scan an argument value (for keyword or positional arguments);
  // succeeds or errors.  Result is an array of type, value.
  const scanArgValue = function () {
    const startPos = scanner.pos;
    let result;
    if ((result = BlazeTools.parseNumber(scanner))) {
      return ['NUMBER', result.value];
    } else if ((result = BlazeTools.parseStringLiteral(scanner))) {
      return ['STRING', result.value];
    } else if (/^[\.\[]/.test(scanner.peek())) {
      return ['PATH', scanPath()];
    } else if (run(/^\(/)) {
      return ['EXPR', scanExpr('EXPR')];
    } else if ((result = BlazeTools.parseExtendedIdentifierName(scanner))) {
      const id = result;
      if (id === 'null') {
        return ['NULL', null];
      } else if (id === 'true' || id === 'false') {
        return ['BOOLEAN', id === 'true'];
      } else {
        scanner.pos = startPos; // unconsume `id`
        return ['PATH', scanPath()];
      }
    } else {
      expected('identifier, number, string, boolean, null, or a sub expression enclosed in "(", ")"');
    }
  };

  // ============================================================
  // Inline Expression support (Pratt parser)
  //
  // Allows expressions like {{a + b}}, {{a > b}}, {{a ? b : c}}
  // inside {{ }} tags. Backward-compatible: if no operator is found
  // after the first path, falls through to the classic helper-call
  // argument loop.

  // Operator precedence table (higher = tighter binding)
  const PREC_TERNARY   = 1;
  const PREC_OR        = 2;
  const PREC_AND       = 3;
  const PREC_EQUALITY  = 4;
  const PREC_COMPARE   = 5;
  const PREC_ADD       = 6;
  const PREC_MULTIPLY  = 7;
  const PREC_UNARY     = 8;

  // Binary operators and their precedence
  const binaryOps = {
    '||':  PREC_OR,
    '&&':  PREC_AND,
    '===': PREC_EQUALITY,
    '!==': PREC_EQUALITY,
    '>':   PREC_COMPARE,
    '>=':  PREC_COMPARE,
    '<':   PREC_COMPARE,
    '<=':  PREC_COMPARE,
    '+':   PREC_ADD,
    '-':   PREC_ADD,
    '*':   PREC_MULTIPLY,
    '/':   PREC_MULTIPLY,
    '%':   PREC_MULTIPLY,
  };

  // Regex to detect and consume a binary operator at current position.
  // Order matters: longer operators first (=== before =, >= before >, etc.)
  const operatorRegex = /^(===|!==|&&|\|\||>=|<=|[+\-*\/%]|>(?![}])|<|[?:])/;

  // Peek at the next operator without consuming it.
  // Returns the operator string or null.
  const peekOperator = function () {
    const rest = scanner.rest();
    const match = operatorRegex.exec(rest);
    if (!match) return null;
    const op = match[1];
    // Reject operators that aren't in our set (`:` is only valid as
    // part of ternary, handled specially)
    if (op === ':') return ':';
    if (op === '?') return '?';
    if (binaryOps.hasOwnProperty(op)) return op;
    return null;
  };

  // Check for forbidden operators and give clear error messages
  const checkForbiddenOperator = function () {
    const rest = scanner.rest();
    if (/^\|(?!\|)/.test(rest)) {
      error("The `|` (pipe/bitwise OR) operator is not supported in Spacebars expressions. " +
            "Use `||` for logical OR");
    }
    if (/^&(?!&)/.test(rest)) {
      error("The `&` (bitwise AND) operator is not supported in Spacebars expressions. " +
            "Use `&&` for logical AND");
    }
    if (/^\+\+/.test(rest)) {
      error("The `++` (increment) operator is not supported in Spacebars expressions");
    }
    if (/^--/.test(rest)) {
      error("The `--` (decrement) operator is not supported in Spacebars expressions");
    }
    // Check for assignment operators: =, +=, -=, *=, /=, %=
    // But NOT ==, ===, !=, !==
    if (/^=(?!=)/.test(rest)) {
      error("Assignment (`=`) is not allowed in Spacebars expressions");
    }
    if (/^[+\-*\/%]=/.test(rest)) {
      const op = rest.slice(0, 2);
      error(`Compound assignment (\`${op}\`) is not allowed in Spacebars expressions`);
    }
  };

  // Scan a primary expression (the atomic unit of an expression).
  // Returns an inline expression AST node.
  const scanPrimary = function () {
    run(/^\s*/);

    // Unary `!`
    if (run(/^!/)) {
      const argument = scanPrimary();
      return { type: 'UnaryExpression', operator: '!', argument };
    }

    // Unary `-` (but not `--`)
    if (/^-(?!-)/.test(scanner.rest())) {
      advance(1);
      const argument = scanPrimary();
      return { type: 'UnaryExpression', operator: '-', argument };
    }

    // Parenthesized expression or sub-expression
    if (run(/^\(/)) {
      // First, try to determine if this is a grouped expression or a
      // Handlebars sub-expression like (helper arg1 arg2).
      // Strategy: scan the first value, then check what follows.
      const savedPos = scanner.pos;
      run(/^\s*/);

      // Try to parse as inline expression first
      const expr = scanInlineExpr(0);
      run(/^\s*/);

      if (run(/^\)/)) {
        // Successfully parsed as a grouped expression
        return expr;
      }

      // If we didn't find `)`, it might be a sub-expression with
      // helper args. Backtrack and parse as sub-expression.
      scanner.pos = savedPos;
      const subExpr = scanExpr('EXPR');
      return {
        type: 'SubExpression',
        path: subExpr.path,
        args: subExpr.args,
      };
    }

    // Number literal
    let result;
    if ((result = BlazeTools.parseNumber(scanner))) {
      return { type: 'LiteralExpression', value: result.value };
    }

    // String literal
    if ((result = BlazeTools.parseStringLiteral(scanner))) {
      return { type: 'LiteralExpression', value: result.value };
    }

    // Dot-leading paths (./foo, ../foo)
    if (/^[\.\[]/.test(scanner.peek())) {
      return { type: 'PathExpression', path: scanPath() };
    }

    // Identifiers: null, true, false, or path
    if ((result = BlazeTools.parseExtendedIdentifierName(scanner))) {
      const id = result;
      if (id === 'null') {
        return { type: 'LiteralExpression', value: null };
      } else if (id === 'true') {
        return { type: 'LiteralExpression', value: true };
      } else if (id === 'false') {
        return { type: 'LiteralExpression', value: false };
      } else {
        // It's a path start — unconsume and use scanPath
        scanner.pos -= id.length;
        return { type: 'PathExpression', path: scanPath() };
      }
    }

    // If nothing matched, check for forbidden operators for better errors
    checkForbiddenOperator();
    expected('expression');
  };

  // Pratt parser: scan an inline expression with minimum precedence `minPrec`.
  // If `initialLeft` is provided, use it as the left operand instead of
  // scanning a new primary (used when the caller already scanned a path).
  const scanInlineExpr = function (minPrec, initialLeft) {
    let left = initialLeft || scanPrimary();

    while (true) {
      run(/^\s*/);
      const op = peekOperator();
      if (op === null) break;

      // Ternary operator: `?`
      if (op === '?') {
        if (PREC_TERNARY < minPrec) break;
        advance(1); // consume `?`
        run(/^\s*/);
        const consequent = scanInlineExpr(0); // any expression
        run(/^\s*/);
        if (!run(/^:/)) {
          error("Expected `:` in ternary expression (`a ? b : c`). " +
                "If you meant to use `?` differently, ternary expressions require both `?` and `:`");
        }
        run(/^\s*/);
        const alternate = scanInlineExpr(PREC_TERNARY); // right-associative
        left = { type: 'ConditionalExpression', test: left, consequent, alternate };
        continue;
      }

      // `:` outside of a ternary — stop (let the caller handle it)
      if (op === ':') break;

      const prec = binaryOps[op];
      if (prec === undefined || prec < minPrec) break;

      // Consume the operator
      advance(op.length);

      // Check for forbidden patterns after consuming operator
      run(/^\s*/);
      checkForbiddenOperator();

      // Right operand: parse with prec+1 for left-associativity
      const right = scanInlineExpr(prec + 1);
      left = { type: 'BinaryExpression', operator: op, left, right };
    }

    return left;
  };

  // Detect if we should enter inline expression mode.
  // Called after scanning the first path in scanExpr.
  // Returns true if the next non-whitespace token is a binary operator
  // (not a `-` followed by a digit, which is a negative number arg).
  const shouldEnterExprMode = function (endType) {
    const savedPos = scanner.pos;
    run(/^\s*/);
    const rest = scanner.rest();

    // Check for end of tag first
    if (ends[endType].test(rest) || /^[})]/.test(scanner.peek())) {
      scanner.pos = savedPos;
      return false;
    }

    // Check for binary operator
    const match = operatorRegex.exec(rest);
    if (!match) {
      scanner.pos = savedPos;
      return false;
    }

    const op = match[1];

    // `-` followed by a digit is a negative number argument, not subtraction
    // (preserves `{{foo -1}}` as helper call)
    if (op === '-' && /^-\d/.test(rest)) {
      scanner.pos = savedPos;
      return false;
    }

    // `+` followed by a digit could be ambiguous but we treat it as addition
    // since `{{foo +1}}` is not valid Handlebars anyway

    scanner.pos = savedPos;
    return true;
  };

  const scanExpr = function (type) {
    let endType = type;
    if (type === 'INCLUSION' || type === 'BLOCKOPEN' || type === 'ELSE')
      endType = 'DOUBLE';

    // Check if the expression starts with a unary operator (`-` or `!`).
    // If so, go directly into inline expression mode.
    const preCheckPos = scanner.pos;
    run(/^\s*/);
    const firstChar = scanner.peek();
    scanner.pos = preCheckPos;

    // Unary `-` at start (but not `--`): always an inline expression.
    // `(` at start: grouped expression.
    // Digit or `"` or `'` at start: literal value (e.g. {{0}}, {{"hello"}}).
    // Note: `!` at start is NOT handled here because `{{!...}}` is comment syntax
    //       (filtered earlier by the COMMENT regex). If we reach here with `!`,
    //       it would be inside a sub-expression like `(!foo)`.
    const isLiteralStart = (firstChar >= '0' && firstChar <= '9') ||
                           firstChar === '"' || firstChar === "'";
    if (firstChar === '-' || firstChar === '!' || firstChar === '(' || isLiteralStart) {
      // This must be an inline expression starting with unary op or grouped expr
      const expr = scanInlineExpr(0);
      const tag = new TemplateTag;
      tag.type = type;
      tag.expr = expr;
      // We need a path for compatibility — use a sentinel
      tag.path = ['__expr__'];
      tag.args = [];
      run(/^\s*/);
      if (!run(ends[endType])) {
        // Check if there's trailing content that shouldn't be there
        checkForbiddenOperator();
        expected(`\`${endsString[endType]}\``);
      }
      return tag;
    }

    const tag = new TemplateTag;
    tag.type = type;
    tag.path = scanPath();
    tag.args = [];

    // After the first path, check if an operator follows.
    // If so, switch to inline expression mode.
    if (shouldEnterExprMode(endType)) {
      // Re-wrap the already-scanned path as an expression AST node
      // and continue parsing as an inline expression.
      const leftExpr = { type: 'PathExpression', path: tag.path };
      tag.expr = scanInlineExpr(0, leftExpr);
      tag.path = ['__expr__'];
      tag.args = [];

      run(/^\s*/);
      if (!run(ends[endType])) {
        checkForbiddenOperator();
        expected(`\`${endsString[endType]}\``);
      }
      return tag;
    }

    // No operator found directly after the first path.
    // For BLOCKOPEN with built-in helpers (if, unless, with, each),
    // the arguments themselves may form an expression:
    //   {{#if score >= 90}} — `score >= 90` is an expression
    // Strategy: scan the first arg value, then peek for an operator.
    // If found, backtrack and re-parse all args as a single inline expression.
    if (type === 'BLOCKOPEN' || type === 'ELSE') {
      const argsStartPos = scanner.pos;
      run(/^\s*/);

      // Don't try this if we're at the end already
      if (!ends[endType].test(scanner.rest()) && !/^[})]/.test(scanner.peek())) {
        // Save position, scan one arg value, then check for operator
        const beforeFirstArg = scanner.pos;
        try {
          const firstArgVal = scanArgValue();
          // Check if an operator follows this first arg
          if (shouldEnterExprMode(endType)) {
            // This is an expression! Backtrack to before first arg and
            // parse everything as a single inline expression.
            scanner.pos = beforeFirstArg;
            tag.expr = scanInlineExpr(0);
            tag.args = [];

            run(/^\s*/);
            if (!run(ends[endType])) {
              checkForbiddenOperator();
              expected(`\`${endsString[endType]}\``);
            }
            return tag;
          }
          // No operator — backtrack to re-parse args in classic mode
          scanner.pos = argsStartPos;
        } catch (e) {
          // If scanning failed, backtrack and let classic loop handle it
          scanner.pos = argsStartPos;
        }
      } else {
        scanner.pos = argsStartPos;
      }
    }

    // Classic Handlebars argument loop
    let foundKwArg = false;
    while (true) {
      run(/^\s*/);
      if (run(ends[endType]))
        break;
      else if (/^[})]/.test(scanner.peek())) {
        expected(`\`${endsString[endType]}\``);
      }
      const newArg = scanArg();
      if (newArg.length === 3) {
        foundKwArg = true;
      } else {
        if (foundKwArg)
          error("Can't have a non-keyword argument after a keyword argument");
      }
      tag.args.push(newArg);

      // expect a whitespace or a closing ')' or '}'
      if (run(/^(?=[\s})])/) !== '')
        expected('space');
    }

    return tag;
  };

  let type;

  const error = function (msg) {
    scanner.fatal(msg);
  };

  const expected = function (what) {
    error(`Expected ${what}`);
  };

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
  else
    error('Unknown stache tag');

  let tag = new TemplateTag;
  tag.type = type;

  if (type === 'BLOCKCOMMENT') {
    const result = run(/^[\s\S]*?--\s*?\}\}/);
    if (! result)
      error("Unclosed block comment");
    tag.value = result.slice(0, result.lastIndexOf('--'));
  } else if (type === 'COMMENT') {
    const result = run(/^[\s\S]*?\}\}/);
    if (! result)
      error("Unclosed comment");
    tag.value = result.slice(0, -2);
  } else if (type === 'BLOCKCLOSE') {
    tag.path = scanPath();
    if (! run(ends.DOUBLE))
      expected('`}}`');
  } else if (type === 'ELSE') {
    if (! run(ends.DOUBLE)) {
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
  const startPos = scanner.pos;
  const result = TemplateTag.parse(scanner);
  scanner.pos = startPos;
  return result;
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
  if (typeof scanner === 'string')
    scanner = new HTMLTools.Scanner(scannerOrString);

  const startPos = scanner.pos; // for error messages
  const result = TemplateTag.parse(scannerOrString);
  if (! result)
    return result;

  if (result.type === 'BLOCKCOMMENT')
    return null;

  if (result.type === 'COMMENT')
    return null;

  if (result.type === 'ELSE')
    scanner.fatal("Unexpected {{else}}");

  if (result.type === 'BLOCKCLOSE')
    scanner.fatal("Unexpected closing template tag");

  position = (position || TEMPLATE_TAG_POSITION.ELEMENT);
  if (position !== TEMPLATE_TAG_POSITION.ELEMENT)
    result.position = position;

  if (result.type === 'BLOCKOPEN') {
    // parse block contents

    // Construct a string version of `.path` for comparing start and
    // end tags.  For example, `foo/[0]` was parsed into `["foo", "0"]`
    // and now becomes `foo,0`.  This form may also show up in error
    // messages.
    const blockName = result.path.join(',');

    let textMode = null;
      if (blockName === 'markdown' ||
          position === TEMPLATE_TAG_POSITION.IN_RAWTEXT) {
        textMode = HTML.TEXTMODE.STRING;
      } else if (position === TEMPLATE_TAG_POSITION.IN_RCDATA ||
                 position === TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {
        textMode = HTML.TEXTMODE.RCDATA;
      }
      const parserOptions = {
        getTemplateTag: TemplateTag.parseCompleteTag,
        shouldStop: isAtBlockCloseOrElse,
        textMode: textMode
      };
    result.textMode = textMode;
    result.content = HTMLTools.parseFragment(scanner, parserOptions);

    if (scanner.rest().slice(0, 2) !== '{{')
      scanner.fatal(`Expected {{else}} or block close for ${blockName}`);

    let lastPos = scanner.pos; // save for error messages
    let tmplTag = TemplateTag.parse(scanner); // {{else}} or {{/foo}}

    let lastElseContentTag = result;
    while (tmplTag.type === 'ELSE') {
      if (lastElseContentTag === null) {
        scanner.fatal("Unexpected else after {{else}}");
      }

      if (tmplTag.path) {
        lastElseContentTag.elseContent = new TemplateTag;
        lastElseContentTag.elseContent.type = 'BLOCKOPEN';
        lastElseContentTag.elseContent.path = tmplTag.path;
        lastElseContentTag.elseContent.args = tmplTag.args;
        lastElseContentTag.elseContent.textMode = textMode;
        lastElseContentTag.elseContent.content = HTMLTools.parseFragment(scanner, parserOptions);

        lastElseContentTag = lastElseContentTag.elseContent;
      }
      else {
        // parse {{else}} and content up to close tag
        lastElseContentTag.elseContent = HTMLTools.parseFragment(scanner, parserOptions);

        lastElseContentTag = null;
      }

      if (scanner.rest().slice(0, 2) !== '{{')
        scanner.fatal(`Expected block close for ${blockName}`);

      lastPos = scanner.pos;
      tmplTag = TemplateTag.parse(scanner);
    }

    if (tmplTag.type === 'BLOCKCLOSE') {
      const blockName2 = tmplTag.path.join(',');
      if (blockName !== blockName2) {
        scanner.pos = lastPos;
        scanner.fatal(`Expected tag to close ${blockName}, found ${blockName2}`);
      }
    } else {
      scanner.pos = lastPos;
      scanner.fatal(`Expected tag to close ${blockName}, found ${tmplTag.type}`);
    }
  }

  const finalPos = scanner.pos;
  scanner.pos = startPos;
  validateTag(result, scanner);
  scanner.pos = finalPos;

  return result;
};

const isAtBlockCloseOrElse = function (scanner) {
  // Detect `{{else}}` or `{{/foo}}`.
  //
  // We do as much work ourselves before deferring to `TemplateTag.peek`,
  // for efficiency (we're called for every input token) and to be
  // less obtrusive, because `TemplateTag.peek` will throw an error if it
  // sees `{{` followed by a malformed tag.
  let rest, type;
  return (scanner.peek() === '{' &&
          (rest = scanner.rest()).slice(0, 2) === '{{' &&
          /^\{\{\s*(\/|else\b)/.test(rest) &&
          (type = TemplateTag.peek(scanner).type) &&
          (type === 'BLOCKCLOSE' || type === 'ELSE'));
};

// Validate that `templateTag` is correctly formed and legal for its
// HTML position.  Use `scanner` to report errors. On success, does
// nothing.
const validateTag = function (ttag, scanner) {

  if (ttag.type === 'INCLUSION' || ttag.type === 'BLOCKOPEN') {
    const args = ttag.args;
    if (ttag.path[0] === 'each' && args[1] && args[1][0] === 'PATH' &&
        args[1][1][0] === 'in') {
      // For slightly better error messages, we detect the each-in case
      // here in order not to complain if the user writes `{{#each 3 in x}}`
      // that "3 is not a function"
    } else {
      if (args.length > 1 && args[0].length === 2 && args[0][0] !== 'PATH') {
        // we have a positional argument that is not a PATH followed by
        // other arguments
        scanner.fatal("First argument must be a function, to be called on " +
                      `the rest of the arguments; found ${args[0][0]}`);
      }
    }
  }

  const position = ttag.position || TEMPLATE_TAG_POSITION.ELEMENT;
  if (position === TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {
    if (ttag.type === 'DOUBLE' || ttag.type === 'ESCAPE') {
      return;
    } else if (ttag.type === 'BLOCKOPEN') {
      const path = ttag.path;
      const path0 = path[0];
      if (! (path.length === 1 && (path0 === 'if' ||
                                   path0 === 'unless' ||
                                   path0 === 'with' ||
                                   path0 === 'each'))) {
        scanner.fatal("Custom block helpers are not allowed in an HTML attribute, only built-in ones like #each and #if");
      }
    } else {
      scanner.fatal(`${ttag.type} template tag is not allowed in an HTML attribute`);
    }
  } else if (position === TEMPLATE_TAG_POSITION.IN_START_TAG) {
    if (! (ttag.type === 'DOUBLE')) {
      scanner.fatal(`Reactive HTML attributes must either have a constant name or consist of a single {{helper}} providing a dictionary of names and values.  A template tag of type ${ttag.type} is not allowed here.`);
    }
    if (scanner.peek() === '=') {
      scanner.fatal("Template tags are not allowed in attribute names, only in attribute values or in the form of a single {{helper}} that evaluates to a dictionary of name=value pairs.");
    }
  }

};
