import { HTMLTools } from 'meteor/html-tools';
import { HTML } from 'meteor/htmljs';
import { BlazeTools } from 'meteor/blaze-tools';
import { SpacebarsCompiler } from 'meteor/spacebars-compiler';
import { runCompilerOutputTests } from './compiler_output_tests';


Tinytest.add("spacebars-compiler - compiler output", function (test) {

  var run = function (input, expected, whitespace = '') {
    if (expected.fail) {
      var expectedMessage = expected.fail;
      // test for error starting with expectedMessage
      var msg = '';
      test.throws(function () {
        try {
          SpacebarsCompiler.compile(input, {isTemplate: true, whitespace});
        } catch (e) {
          msg = e.message;
          throw e;
        }
      });
      test.equal(msg.slice(0, expectedMessage.length),
                 expectedMessage);
    } else {
      var output = SpacebarsCompiler.compile(input, {isTemplate: true, whitespace});
      var postProcess = function (string) {
        // remove initial and trailing parens
        string = string.replace(/^\(([\S\s]*)\)$/, '$1');
        if (! (Package['minifier-js'] && Package['minifier-js'].UglifyJSMinify)) {
          // these tests work a lot better with access to beautification,
          // but let's at least do some sort of test without it.
          // These regexes may have to be adjusted if new tests are added.

          // ======================== !!NOTE!! =================================
          // Since we are bringing uglify-js in from NPM, this code should no
          // longer ever be needed. Leaving it just in case.
          // ==================================+================================

          // Remove single-line comments, including line nums from build system.
          string = string.replace(/\/\/.*$/mg, '');
          string = string.replace(/\s+/g, ''); // kill whitespace
        }
        return string;
      };
      // compare using Function .toString()!
      test._stringEqual(
        postProcess(output.toString()),
        postProcess(
          SpacebarsCompiler._beautify('(' + expected.toString() + ')')),
        input);
    }
  };

  runCompilerOutputTests(run);
});


Tinytest.add("spacebars-compiler - compiler errors", function (test) {

  var getError = function (input) {
    try {
      SpacebarsCompiler.compile(input);
    } catch (e) {
      return e.message;
    }
    test.fail("Didn't throw an error: " + input);
    return '';
  };

  var assertStartsWith = function (a, b) {
    test.equal(a.substring(0, b.length), b);
  };

  var isError = function (input, errorStart) {
    assertStartsWith(getError(input), errorStart);
  };

  isError("<input></input>",
          "Unexpected HTML close tag.  <input> should have no close tag.");
  isError("{{#each foo}}<input></input>{{/foo}}",
          "Unexpected HTML close tag.  <input> should have no close tag.");

  isError("{{#if}}{{/if}}", "#if requires an argument");
  isError("{{#with}}{{/with}}", "#with requires an argument");
  isError("{{#each}}{{/each}}", "#each requires an argument");
  isError("{{#unless}}{{/unless}}", "#unless requires an argument");

  isError("{{0 0}}", "Expected IDENTIFIER");

  isError("{{> foo 0 0}}",
          "First argument must be a function");
  isError("{{> foo 0 x=0}}",
          "First argument must be a function");
  isError("{{#foo 0 0}}{{/foo}}",
          "First argument must be a function");
  isError("{{#foo 0 x=0}}{{/foo}}",
          "First argument must be a function");

  _.each(['asdf</br>', '{{!foo}}</br>', '{{!foo}} </br>',
          'asdf</a>', '{{!foo}}</a>', '{{!foo}} </a>'], function (badFrag) {
            isError(badFrag, "Unexpected HTML close tag");
          });

  isError("{{#let myHelper}}{{/let}}", "Incorrect form of #let");
  isError("{{#each foo in.in bar}}{{/each}}", "Malformed #each");
  isError("{{#each foo.bar in baz}}{{/each}}", "Bad variable name in #each");
  isError("{{#each ../foo in baz}}{{/each}}", "Bad variable name in #each");
  isError("{{#each 3 in baz}}{{/each}}", "Bad variable name in #each");

  isError("{{#foo}}x{{else bar}}y{{else}}z{{else baz}}q{{/foo}}", "Unexpected else after {{else}}");
  isError("{{#foo}}x{{else bar}}y{{else}}z{{else}}q{{/foo}}", "Unexpected else after {{else}}");

  // errors using `{{> React}}`
  isError("{{> React component=emptyComponent}}",
          "{{> React}} must be used in a container element");
  isError("<div>{{#if include}}{{> React component=emptyComponent}}{{/if}}</div>",
          "{{> React}} must be used in a container element");
  isError("<div><div>Sibling</div>{{> React component=emptyComponent}}</div>",
          "{{> React}} must be used as the only child in a container element");
  isError("<div>Sibling{{> React component=emptyComponent}}</div>",
          "{{> React}} must be used as the only child in a container element");
  isError("<div>{{#if sibling}}Sibling{{/if}}{{> React component=emptyComponent}}</div>",
          "{{> React}} must be used as the only child in a container element");
});
