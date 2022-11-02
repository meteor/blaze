/* global Tinytest */

import { BlazeTools } from 'meteor/blaze-tools';
import { HTMLTools } from 'meteor/html-tools';

Tinytest.add('blaze-tools - token parsers', function (test) {
  const run = function (func, input, expected) {
    const scanner = new HTMLTools.Scanner(`z${input}`);
    // make sure the parse function respects `scanner.pos`
    scanner.pos = 1;
    const result = func(scanner);
    if (expected === null) {
      test.equal(scanner.pos, 1);
      test.equal(result, null);
    } else {
      test.isTrue(scanner.isEOF());
      test.equal(result, expected);
    }
  };

  const runValue = function (func, input, expectedValue) {
    let expected;
    if (expectedValue === null) expected = null;
    else expected = { text: input, value: expectedValue };
    run(func, input, expected);
  };

  const { parseNumber } = BlazeTools;
  const { parseIdentifierName } = BlazeTools;
  const { parseExtendedIdentifierName } = BlazeTools;
  const { parseStringLiteral } = BlazeTools;

  runValue(parseNumber, '0', 0);
  runValue(parseNumber, '-0', 0);
  runValue(parseNumber, '-', null);
  runValue(parseNumber, '.a', null);
  runValue(parseNumber, '.1', 0.1);
  runValue(parseNumber, '1.', 1);
  runValue(parseNumber, '1.1', 1.1);
  runValue(parseNumber, '0x', null);
  runValue(parseNumber, '0xa', 10);
  runValue(parseNumber, '-0xa', -10);
  runValue(parseNumber, '1e+1', 10);

  [parseIdentifierName, parseExtendedIdentifierName].forEach(function (f) {
    run(f, 'a', 'a');
    run(f, 'true', 'true');
    run(f, 'null', 'null');
    run(f, 'if', 'if');
    run(f, '1', null);
    run(f, '1a', null);
    run(f, '+a', null);
    run(f, 'a1', 'a1');
    run(f, 'a1a', 'a1a');
    run(f, '_a8f_f8d88_', '_a8f_f8d88_');
  });
  run(parseIdentifierName, '@index', null);
  run(parseExtendedIdentifierName, '@index', '@index');
  run(parseExtendedIdentifierName, '@something', '@something');
  run(parseExtendedIdentifierName, '@', null);

  runValue(parseStringLiteral, '"a"', 'a');
  runValue(parseStringLiteral, '"\'"', "'");
  runValue(parseStringLiteral, '\'"\'', '"');
  runValue(parseStringLiteral, '"a\\\nb"', 'ab'); // line continuation
  runValue(parseStringLiteral, '"a\u0062c"', 'abc');
  // Note: IE 8 doesn't correctly parse '\v' in JavaScript.
  runValue(parseStringLiteral, '"\\0\\b\\f\\n\\r\\t\\v"', '\0\b\f\n\r\t\u000b');
  runValue(parseStringLiteral, '"\\x41"', 'A');
  runValue(parseStringLiteral, '"\\\\"', '\\');
  // eslint-disable-next-line no-useless-escape
  runValue(parseStringLiteral, '"\\\""', '\"');
  runValue(parseStringLiteral, '"\\\'"', '\'');
  runValue(parseStringLiteral, "'\\\\'", '\\');
  // eslint-disable-next-line no-useless-escape
  runValue(parseStringLiteral, "'\\\"'", '\"');
  // eslint-disable-next-line no-useless-escape
  runValue(parseStringLiteral, "'\\\''", '\'');

  test.throws(function () {
    run(parseStringLiteral, "'this is my string");
  }, /Unterminated string literal/);
});
