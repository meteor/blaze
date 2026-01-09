import { BlazeTools } from 'meteor/blaze-tools';

const toCode = BlazeTools.toJS;

const P = HTML.P;
const CharRef = HTML.CharRef;
const DIV = HTML.DIV;
const Comment = HTML.Comment;
const BR = HTML.BR;
const A = HTML.A;
const UL = HTML.UL;
const LI = HTML.LI;
const SPAN = HTML.SPAN;
const HR = HTML.HR;
const TEXTAREA = HTML.TEXTAREA;
const INPUT = HTML.INPUT;

const materialize = function (content, parent) {
  let func = content;
  if (typeof content !== 'function') {
    func = function () {
      return content;
    };
  }
  Blaze.render(func, parent);
};

const toHTML = Blaze.toHTML;

Tinytest.add("blaze - render - basic", function (test) {
  const run = function (input, expectedInnerHTML, expectedHTML, expectedCode) {
    const div = document.createElement("DIV");
    materialize(input, div);
    test.equal(canonicalizeHtml(div.innerHTML), expectedInnerHTML);
    test.equal(toHTML(input), expectedHTML);
    if (typeof expectedCode !== 'undefined')
      test.equal(toCode(input), expectedCode);
  };

  run(P('Hello'),
      '<p>Hello</p>',
      '<p>Hello</p>',
      'HTML.P("Hello")');

  run([], '', '', '[]');
  run([null, null], '', '', '[null, null]');

  // Test crazy character references

  // `&zopf;` is "Mathematical double-struck small z" a.k.a. "open-face z"
  run(P(CharRef({html: '&zopf;', str: '\ud835\udd6b'})),
      '<p>\ud835\udd6b</p>',
      '<p>&zopf;</p>',
      'HTML.P(HTML.CharRef({html: "&zopf;", str: "\\ud835\\udd6b"}))');

  run(P({id: CharRef({html: '&zopf;', str: '\ud835\udd6b'})}, 'Hello'),
      '<p id="\ud835\udd6b">Hello</p>',
      '<p id="&zopf;">Hello</p>',
      'HTML.P({id: HTML.CharRef({html: "&zopf;", str: "\\ud835\\udd6b"})}, "Hello")');

  run(P({id: [CharRef({html: '&zopf;', str: '\ud835\udd6b'}), '!']}, 'Hello'),
      '<p id="\ud835\udd6b!">Hello</p>',
      '<p id="&zopf;!">Hello</p>',
      'HTML.P({id: [HTML.CharRef({html: "&zopf;", str: "\\ud835\\udd6b"}), "!"]}, "Hello")');

  // Test comments

  run(DIV(Comment('Test')),
      '<div><!----></div>', // our innerHTML-canonicalization function kills comment contents
      '<div><!--Test--></div>',
      'HTML.DIV(HTML.Comment("Test"))');

  // Test arrays

  run([P('Hello'), P('World')],
      '<p>Hello</p><p>World</p>',
      '<p>Hello</p><p>World</p>',
      '[HTML.P("Hello"), HTML.P("World")]');

  // Test slightly more complicated structure

  run(DIV({'class': 'foo'}, UL(LI(P(A({href: '#one'}, 'One'))),
                               LI(P('Two', BR(), 'Three')))),
      '<div class="foo"><ul><li><p><a href="#one">One</a></p></li><li><p>Two<br>Three</p></li></ul></div>',
      '<div class="foo"><ul><li><p><a href="#one">One</a></p></li><li><p>Two<br>Three</p></li></ul></div>',
      'HTML.DIV({"class": "foo"}, HTML.UL(HTML.LI(HTML.P(HTML.A({href: "#one"}, "One"))), HTML.LI(HTML.P("Two", HTML.BR(), "Three"))))');


  // Test nully attributes
  run(BR({x: null,
          y: [[], []],
          a: [['']]}),
      '<br a="">',
      '<br a="">',
      'HTML.BR({a: [[""]]})');

  run(BR({
    x: function () { return Blaze.View(function () { return Blaze.View(function () { return []; }); }); },
    a: function () { return Blaze.View(function () { return Blaze.View(function () { return ''; }); }); }}),
      '<br a="">',
      '<br a="">');
});

// test that we correctly update the 'value' property on input fields
// rather than the 'value' attribute. the 'value' attribute only sets
// the initial value.
Tinytest.add("blaze - render - input - value", function (test) {
  const R = ReactiveVar("hello");
  const div = document.createElement("DIV");
  materialize(INPUT({value: function () { return R.get(); }}), div);
  const inputEl = div.querySelector('input');
  test.equal(inputEl.value, "hello");
  inputEl.value = "goodbye";
  R.set("hola");
  Tracker.flush();
  test.equal(inputEl.value, "hola");
});

// test that we correctly update the 'checked' property rather than
// the 'checked' attribute on input fields of type 'checkbox'. the
// 'checked' attribute only sets the initial value.
Tinytest.add("blaze - render - input - checked", function (test) {
  const R = ReactiveVar(null);
  const div = document.createElement("DIV");
  materialize(INPUT({type: "checkbox", checked: function () { return R.get(); }}), div);
  const inputEl = div.querySelector('input');
  test.equal(inputEl.checked, false);
  inputEl.checked = true;

  R.set("checked");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(inputEl.checked, false);
});

Tinytest.add("blaze - render - textarea", function (test) {
  const run = function (optNode, text, html, code) {
    if (typeof optNode === 'string') {
      // called with args (text, html, code)
      code = html;
      html = text;
      text = optNode;
      optNode = null;
    }
    const div = document.createElement("DIV");
    const node = TEXTAREA({value: optNode || text});
    materialize(node, div);

    let value = div.querySelector('textarea').value;
    value = value.replace(/\r\n/g, "\n"); // IE8 substitutes \n with \r\n
    test.equal(value, text);

    test.equal(toHTML(node), html);
    if (typeof code === 'string')
      test.equal(toCode(node), code);
  };

  run('Hello',
      '<textarea>Hello</textarea>',
      'HTML.TEXTAREA({value: "Hello"})');

  run('\nHello',
      '<textarea>\n\nHello</textarea>',
      'HTML.TEXTAREA({value: "\\nHello"})');

  run('</textarea>',
      '<textarea>&lt;/textarea></textarea>',
      'HTML.TEXTAREA({value: "</textarea>"})');

  run(CharRef({html: '&amp;', str: '&'}),
      '&',
      '<textarea>&amp;</textarea>',
      'HTML.TEXTAREA({value: HTML.CharRef({html: "&amp;", str: "&"})})');

  run(function () {
    return ['a', Blaze.View(function () { return 'b'; }), 'c'];
  },
      'abc',
      '<textarea>abc</textarea>');

  // test that reactivity of textarea "value" attribute works...
  (function () {
    const R = ReactiveVar('one');
    const div = document.createElement("DIV");
    const node = TEXTAREA({value: function () {
      return Blaze.View(function () {
        return R.get();
      });
    }});
    materialize(node, div);
    const textarea = div.querySelector('textarea');
    test.equal(textarea.value, 'one');
    R.set('two');
    Tracker.flush();
    test.equal(textarea.value, 'two');
  })();

  // ... while "content" reactivity simply doesn't update
  // (but doesn't throw either)
  (function () {
    const R = ReactiveVar('one');
    const div = document.createElement("DIV");
    const node = TEXTAREA([Blaze.View(function () {
      return R.get();
    })]);
    materialize(node, div);
    const textarea = div.querySelector('textarea');
    test.equal(textarea.value, 'one');
    R.set('two');
    Tracker.flush({_throwFirstError: true});
    test.equal(textarea.value, 'one');
  })();
});

Tinytest.add("blaze - render - view isolation", function (test) {

  // Reactively change a text node
  (function () {
    const R = ReactiveVar('Hello');
    const test1 = function () {
      return P(Blaze.View(function () { return R.get(); }));
    };

    test.equal(toHTML(test1()), '<p>Hello</p>');

    const div = document.createElement("DIV");
    materialize(test1, div);
    test.equal(canonicalizeHtml(div.innerHTML), "<p>Hello</p>");

    R.set('World');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "<p>World</p>");
  })();

  // Reactively change an array of text nodes
  (function () {
    const R = ReactiveVar(['Hello', ' World']);
    const test1 = function () {
      return P(Blaze.View(function () { return R.get(); }));
    };

    test.equal(toHTML(test1()), '<p>Hello World</p>');

    const div = document.createElement("DIV");
    materialize(test1, div);
    test.equal(canonicalizeHtml(div.innerHTML), "<p>Hello World</p>");

    R.set(['Goodbye', ' World']);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "<p>Goodbye World</p>");
  })();

});

// IE strips malformed styles like "bar::d" from the `style`
// attribute. We detect this to adjust expectations for the StyleHandler
// test below.
const malformedStylesAllowed = function () {
  const div = document.createElement("div");
  div.setAttribute("style", "bar::d;");
  return (div.getAttribute("style") === "bar::d;");
};

Tinytest.add("blaze - render - view GC", function (test) {
  // test that removing parent element removes listeners and stops autoruns.
  (function () {
    const R = ReactiveVar('Hello');
    const test1 = P(Blaze.View(function () { return R.get(); }));

    const div = document.createElement("DIV");
    materialize(test1, div);
    test.equal(canonicalizeHtml(div.innerHTML), "<p>Hello</p>");

    R.set('World');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "<p>World</p>");

    test.equal(R._numListeners(), 1);

    $(div).remove();

    test.equal(R._numListeners(), 0);

    R.set('Steve');
    Tracker.flush();
    // should not have changed:
    test.equal(canonicalizeHtml(div.innerHTML), "<p>World</p>");
  })();

});

Tinytest.add("blaze - render - reactive attributes", function (test) {
  (function () {
    const R = ReactiveVar({'class': ['david gre', CharRef({html: '&euml;', str: '\u00eb'}), 'nspan'],
                         id: 'foo'});

    const spanFunc = function () {
      return SPAN(HTML.Attrs(
        function () { return R.get(); }));
    };

    test.equal(Blaze.toHTML(spanFunc()),
               '<span class="david gre&euml;nspan" id="foo"></span>');

    test.equal(R._numListeners(), 0);

    const div = document.createElement("DIV");
    Blaze.render(spanFunc, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<span class="david gre\u00ebnspan" id="foo"></span>');

    test.equal(R._numListeners(), 1);

    const span = div.firstChild;
    test.equal(span.nodeName, 'SPAN');
    span.className += ' blah'; // change the element's class outside of Blaze. this simulates what a jQuery could do

    R.set({'class': 'david smith', id: 'bar'});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span class="david smith blah" id="bar"></span>');
    test.equal(R._numListeners(), 1);

    R.set({});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span class="blah"></span>');
    test.equal(R._numListeners(), 1);

    $(div).remove();

    test.equal(R._numListeners(), 0);
  })();

  (function () {
    const style = ReactiveVar(false);

    const div = document.createElement("DIV");

    const divFunc = function () {
      return DIV({
        style: function () {
          return [Blaze.If(function () {
            return style.get();
          }, function () {
            return "background-color: red; ";
          }), "padding: 10px"];
        }
      });
    };

    Blaze.render(divFunc, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<div style="padding: 10px"></div>');

    style.set('blue');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<div style="background-color: red; padding: 10px"></div>');

    $(div).remove();

    test.equal(style._numListeners(), 0);
  })();

  // Test styles.
  (function () {
    // Test the case where there is a semicolon in the css attribute.
    const R = ReactiveVar({'style': 'foo: "a;aa"; bar: b;',
      id: 'foo'});

    const spanFunc = function () {
      return SPAN(HTML.Attrs(function () { return R.get(); }));
    };

    test.equal(Blaze.toHTML(spanFunc()), '<span style="foo: &quot;a;aa&quot;; bar: b;" id="foo"></span>');

    test.equal(R._numListeners(), 0);

    const div = document.createElement("DIV");
    Blaze.render(spanFunc, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<span id="foo" style="foo: &quot;a;aa&quot;; bar: b"></span>');

    test.equal(R._numListeners(), 1);
    const span = div.firstChild;
    test.equal(span.nodeName, 'SPAN');

    span.setAttribute('style', span.getAttribute('style') + '; jquery-style: hidden');

    R.set({'style': 'foo: "a;zz;aa";', id: 'bar'});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML, true), '<span id="bar" style="foo: &quot;a;zz;aa&quot;; jquery-style: hidden"></span>');
    test.equal(R._numListeners(), 1);

    R.set({});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span style="jquery-style: hidden"></span>');
    test.equal(R._numListeners(), 1);

    $(div).remove();

    test.equal(R._numListeners(), 0);
  })();

  // Test that identical styles are successfully overwritten.
  (function () {

    const R = ReactiveVar({'style': 'foo: a;'});

    const spanFunc = function () {
      return SPAN(HTML.Attrs(function () { return R.get(); }));
    };

    const div = document.createElement("DIV");
    document.body.appendChild(div);
    Blaze.render(spanFunc, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<span style="foo: a"></span>');

    const span = div.firstChild;
    test.equal(span.nodeName, 'SPAN');
    span.setAttribute("style", 'foo: b;');
    test.equal(canonicalizeHtml(div.innerHTML), '<span style="foo: b"></span>');

    R.set({'style': 'foo: c;'});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span style="foo: c"></span>');

    // test malformed styles - different expectations in IE (which
    // strips malformed styles) from other browsers
    R.set({'style': 'foo: a; bar::d;:e; baz: c;'});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML),
      malformedStylesAllowed() ?
               '<span style="foo: a; bar::d; baz: c"></span>' :
               '<span style="foo: a; baz: c"></span>');

    // Test strange styles
    R.set({'style': ' foo: c; constructor: a; __proto__: b;'});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span style="foo: c; constructor: a; __proto__: b"></span>');

    R.set({});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span></span>');

    R.set({'style': 'foo: bar;'});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span style="foo: bar"></span>');
  })();

  // Test `null`, `undefined`, and `[]` attributes
  (function () {
    const R = ReactiveVar({id: 'foo',
                         aaa: null,
                         bbb: undefined,
                         ccc: [],
                         ddd: [null],
                         eee: [undefined],
                         fff: [[]],
                         ggg: ['x', ['y', ['z']]]});

    const spanFunc = function () {
      return SPAN(HTML.Attrs(
        function () { return R.get(); }));
    };

    test.equal(Blaze.toHTML(spanFunc()), '<span id="foo" ggg="xyz"></span>');
    test.equal(toCode(SPAN(R.get())),
               'HTML.SPAN({id: "foo", ggg: ["x", ["y", ["z"]]]})');

    const div = document.createElement("DIV");
    Blaze.render(spanFunc, div);
    const span = div.firstChild;
    test.equal(span.nodeName, 'SPAN');

    test.equal(canonicalizeHtml(div.innerHTML), '<span ggg="xyz" id="foo"></span>');
    R.set({id: 'foo', ggg: [[], [], []]});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span id="foo"></span>');

    R.set({id: 'foo', ggg: null});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span id="foo"></span>');

    R.set({id: 'foo', ggg: ''});
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span ggg="" id="foo"></span>');

    $(div).remove();

    test.equal(R._numListeners(), 0);
  })();
});

Tinytest.add("blaze - render - templates and views", function (test) {
  (function () {
    let counter = 1;
    const buf = [];

    const myTemplate = Blaze.Template(
      'myTemplate',
      function () {
        return [String(this.number),
                (this.number < 3 ? makeView() : HR())];
      });

    myTemplate.constructView = function (number) {
      const view = Template.prototype.constructView.call(this);
      view.number = number;
      return view;
    };

    myTemplate.created = function () {
      test.isFalse(Tracker.active);
      const view = this.view;
      const parent = Blaze.getView(view, 'myTemplate');
      if (parent) {
        buf.push('parent of ' + view.number + ' is ' +
                 parent.number);
      }

      buf.push('created ' + Template.currentData());
    };

    myTemplate.onRendered(function () {
      test.isFalse(Tracker.active);
      const nodeDescr = function (node) {
        if (node.nodeType === 8) // comment
          return '';
        if (node.nodeType === 3) // text
          return node.nodeValue;

        return node.nodeName;
      };

      const view = this.view;
      let start = view.firstNode();
      let end = view.lastNode();
      // skip marker nodes
      while (start !== end && ! nodeDescr(start))
        start = start.nextSibling;
      while (end !== start && ! nodeDescr(end))
        end = end.previousSibling;

      buf.push('dom-' + Template.currentData() +
               ' is ' + nodeDescr(start) +'..' +
               nodeDescr(end));
    });

    myTemplate.onDestroyed(function () {
      test.isFalse(Tracker.active);
      buf.push('destroyed ' + Template.currentData());
    });

    const makeView = function () {
      let number = counter++;
      return Blaze.With(number, function () {
        return myTemplate.constructView(number);
      });
    };

    const div = document.createElement("DIV");

    Blaze.render(makeView, div);
    buf.push('---flush---');
    Tracker.flush();
    test.equal(buf, ['created 1',
                     'parent of 2 is 1',
                     'created 2',
                     'parent of 3 is 2',
                     'created 3',
                     '---flush---',
                     // (proper order for these has not be thought out:)
                     'dom-3 is 3..HR',
                     'dom-2 is 2..HR',
                     'dom-1 is 1..HR']);

    test.equal(canonicalizeHtml(div.innerHTML), '123<hr>');

    buf.length = 0;
    $(div).remove();
    buf.sort();
    test.equal(buf, ['destroyed 1', 'destroyed 2', 'destroyed 3']);

    // Now use toHTML.  Should still get most of the callbacks (not `rendered`).

    buf.length = 0;
    counter = 1;

    const html = Blaze.toHTML(makeView());

    test.equal(buf, ['created 1',
                     'parent of 2 is 1',
                     'created 2',
                     'parent of 3 is 2',
                     'created 3',
                     'destroyed 3',
                     'destroyed 2',
                     'destroyed 1']);

    test.equal(html, '123<hr>');
  })();
});

Tinytest.add("blaze - render - findAll", function (test) {
  let found = null;
  let $found = null;

  const myTemplate = new Template(
    'findAllTest',
    function() {
      return DIV([P('first'), P('second')]);
    });
  myTemplate.rendered = function() {
    found = this.findAll('p');
    $found = this.$('p');
  };

  const div = document.createElement("DIV");

  Blaze.render(myTemplate, div);
  Tracker.flush();

  test.equal(Array.isArray(found), true);
  test.equal(Array.isArray($found), false);
  test.equal(found.length, 2);
  test.equal($found.length, 2);
});

Tinytest.add("blaze - render - reactive attributes 2", function (test) {
  const R1 = ReactiveVar(['foo']);
  const R2 = ReactiveVar(['bar']);

  const spanFunc = function () {
    return SPAN(HTML.Attrs(
      { blah: function () { return R1.get(); } },
      function () { return { blah: R2.get() }; }));
  };

  const div = document.createElement("DIV");
  Blaze.render(spanFunc, div);
  const check = function (expected) {
    test.equal(Blaze.toHTML(spanFunc()), expected);
    test.equal(canonicalizeHtml(div.innerHTML), expected);
  };
  check('<span blah="bar"></span>');

  test.equal(R1._numListeners(), 1);
  test.equal(R2._numListeners(), 1);

  R2.set([[]]);
  Tracker.flush();
  // We combine `['foo']` with what evaluates to `[[[]]]`, which is nully.
  check('<span blah="foo"></span>');

  R2.set([['']]);
  Tracker.flush();
  // We combine `['foo']` with what evaluates to `[[['']]]`, which is non-nully.
  check('<span blah=""></span>');

  R2.set(null);
  Tracker.flush();
  // We combine `['foo']` with `[null]`, which is nully.
  check('<span blah="foo"></span>');

  R1.set([[], []]);
  Tracker.flush();
  // We combine two nully values.
  check('<span></span>');

  R1.set([[], ['foo']]);
  Tracker.flush();
  check('<span blah="foo"></span>');

  // clean up

  $(div).remove();

  test.equal(R1._numListeners(), 0);
  test.equal(R2._numListeners(), 0);
});

Tinytest.add("blaze - render - SVG", function (test) {
  if (! document.createElementNS) {
    // IE 8
    return;
  }

  const fillColor = ReactiveVar('red');
  const classes = ReactiveVar('one two');

  const content = DIV({'class': 'container'}, HTML.SVG(
    {width: 100, height: 100},
    HTML.CIRCLE({cx: 50, cy: 50, r: 40,
                 stroke: 'black', 'stroke-width': 3,
                 'class': function () { return classes.get(); },
                 fill: function () { return fillColor.get(); }})));

  const div = document.createElement("DIV");
  materialize(content, div);

  const circle = div.querySelector('.container > svg > circle');
  test.equal(circle.getAttribute('fill'), 'red');
  test.equal(circle.className.baseVal, 'one two');

  fillColor.set('green');
  classes.set('two three');
  Tracker.flush();
  test.equal(circle.getAttribute('fill'), 'green');
  test.equal(circle.className.baseVal, 'two three');

  test.equal(circle.nodeName, 'circle');
  test.equal(circle.namespaceURI, "http://www.w3.org/2000/svg");
  test.equal(circle.parentNode.namespaceURI, "http://www.w3.org/2000/svg");
});

Tinytest.add("ui - attributes", function (test) {
  const SPAN = HTML.SPAN;
  const amp = HTML.CharRef({html: '&amp;', str: '&'});

  test.equal(HTML.toHTML(SPAN({title: ['M', amp, 'Ms']}, 'M', amp, 'M candies')),
             '<span title="M&amp;Ms">M&amp;M candies</span>');
});

if (typeof MutationObserver !== 'undefined') {
  // This test is not really able to test that Blaze._materializeDOM is called only when
  // not Blaze._isContentEqual(lastHtmljs, htmljs), which is what we would in fact want to test.
  Tinytest.addAsync("blaze - render - optimization", function (test, onComplete) {
    const R = ReactiveVar('aa');
    const view = Blaze.View(function () { return R.get().substr(0, 1); });

    let renderedCount = 0;
    test.equal(view.renderCount, 0);

    view._onViewRendered(function () {
      renderedCount++;
    });

    const test1 = P(view);

    const div = document.createElement("DIV");

    const observedMutations = [];
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        observedMutations.push(mutation);
      });
    });

    observer.observe(div, {childList: true, subtree: true});

    let materializeCount = 0;
    const originalMaterializeDOM = Blaze._materializeDOM;
    Blaze._materializeDOM = function (htmljs, intoArray, parentView, _existingWorkStack) {
      if (parentView === view) {
        materializeCount++;
      }
      return originalMaterializeDOM(htmljs, intoArray, parentView, _existingWorkStack);
    };

    try {
      materialize(test1, div);
      test.equal(canonicalizeHtml(div.innerHTML), "<p>a</p>");

      test.equal(view.renderCount, 1);

      R.set('ab');
      Tracker.flush();
      test.equal(canonicalizeHtml(div.innerHTML), "<p>a</p>");

      test.equal(view.renderCount, 2);
      test.equal(renderedCount, 1);
    }
    finally {
      Blaze._materializeDOM = originalMaterializeDOM;
    }

    test.equal(materializeCount, 1);

    // We have to wait a bit, for mutation observer to run.
    Meteor.setTimeout(function () {
      // We do not update anything after initial rendering, so only one mutation is there.
      test.equal(observedMutations.length, 1);

      $(div).remove();
      observer.disconnect();

      onComplete();
    }, 0);
  });
}

Tinytest.add("blaze - dombackend - parseHTML", function (test) {
  // Test basic HTML parsing
  const basicHtml = "<div>Hello</div>";
  const basicResult = Blaze._DOMBackend.parseHTML(basicHtml);
  test.equal(basicResult.length, 1);
  test.equal(basicResult[0].nodeName, "DIV");
  test.equal(basicResult[0].textContent || basicResult[0].innerText, "Hello");  // innerText for IE

  // Test various falsy/empty inputs (from jQuery tests)
  test.equal(Blaze._DOMBackend.parseHTML().length, 0, "Without arguments");
  test.equal(Blaze._DOMBackend.parseHTML(undefined).length, 0, "Undefined");
  test.equal(Blaze._DOMBackend.parseHTML(null).length, 0, "Null");
  test.equal(Blaze._DOMBackend.parseHTML(false).length, 0, "Boolean false");
  test.equal(Blaze._DOMBackend.parseHTML(0).length, 0, "Zero");
  test.equal(Blaze._DOMBackend.parseHTML(true).length, 0, "Boolean true");
  test.equal(Blaze._DOMBackend.parseHTML(42).length, 0, "Positive number");
  test.equal(Blaze._DOMBackend.parseHTML("").length, 0, "Empty string");

  // Test whitespace preservation (from jQuery tests)
  const leadingWhitespace = Blaze._DOMBackend.parseHTML("\t<div></div>");
  test.equal(leadingWhitespace[0].nodeType, Node.TEXT_NODE, "First node should be text node");
  test.equal(leadingWhitespace[0].nodeValue, "\t", "Leading whitespace should be preserved");

  const surroundingWhitespace = Blaze._DOMBackend.parseHTML(" <div></div> ");
  test.equal(surroundingWhitespace[0].nodeType, Node.TEXT_NODE, "Leading space should be text node");
  test.equal(surroundingWhitespace[2].nodeType, Node.TEXT_NODE, "Trailing space should be text node");

  // Test anchor href preservation (from jQuery gh-2965)
  const anchor = Blaze._DOMBackend.parseHTML("<a href='example.html'></a>")[0];
  test.ok(anchor.href.endsWith("example.html"), "href attribute should be preserved");

  // Test malformed HTML handling
  const malformedTestCases = [
    {
      html: "<span><span>",  // Unclosed tags
      expectedLength: 1
    },
    {
      html: "<td><td>",  // Multiple table cells
      expectedLength: 2
    },
    {
      html: "<div class=''''''><span><<<>>></span",  // Invalid attributes and unclosed tags
      expectedLength: 1  // Should attempt to fix malformed HTML
    },
    {
      html: "<html><!DOCTYPE html><head></head><body>invalid order</body></html>",  // Wrong DOM structure order
      expectedLength: 1  // Should still parse despite invalid structure
    }
  ];

  malformedTestCases.forEach((testCase, i) => {
    const result = Blaze._DOMBackend.parseHTML(testCase.html);
    test.equal(result.length, testCase.expectedLength,
      `Malformed test ${i}: Expected length ${testCase.expectedLength} but got ${result.length}`);
  });

  // Test plain text (no HTML)
  const textOnly = "Just some text";
  const textResult = Blaze._DOMBackend.parseHTML(textOnly);
  test.equal(textResult.length, 1);
  test.equal(textResult[0].nodeType, Node.TEXT_NODE);
  test.equal(textResult[0].textContent || textResult[0].nodeValue, "Just some text");

  // Test self-closing tags
  const selfClosing = "<div/>Content";
  const selfClosingResult = Blaze._DOMBackend.parseHTML(selfClosing);
  test.equal(selfClosingResult.length, 1);
  test.equal(selfClosingResult[0].nodeName, "DIV");
  test.equal(selfClosingResult[0].nodeType, Node.ELEMENT_NODE);

  // Test nested table elements (testing proper wrapping levels)
  const nestedTable = "<td>Cell</td>";
  const nestedResult = Blaze._DOMBackend.parseHTML(nestedTable);
  test.equal(nestedResult.length, 1);
  test.equal(nestedResult[0].nodeName, "TD");

  // Test table elements (IE has special requirements)
  const tableTestCases = {
    tr: {
      html: "<tr><td>Cell</td></tr>",
      expectedTags: ["TR", "TD"]
    },
    td: {
      html: "<td>Cell</td>",
      expectedTags: ["TD"]
    },
    tbody: {
      html: "<tbody><tr><td>Cell</td></tr></tbody>",
      expectedTags: ["TBODY", "TR", "TD"]
    },
    thead: {
      html: "<thead><tr><th>Header</th></tr></thead>",
      expectedTags: ["THEAD", "TR", "TH"]
    },
    tfoot: {
      html: "<tfoot><tr><td>Footer</td></tr></tfoot>",
      expectedTags: ["TFOOT", "TR", "TD"]
    },
    colgroup: {
      html: "<colgroup><col span='2'></colgroup>",
      expectedTags: ["COLGROUP", "COL"]
    }
  };

  Object.entries(tableTestCases).forEach(([testCaseName, testCase]) => {
    const result = Blaze._DOMBackend.parseHTML(testCase.html);
    const firstNode = result[0];
    test.equal(firstNode.nodeName, testCase.expectedTags[0], 
      `${testCaseName}: Expected ${testCase.expectedTags[0]} but got ${firstNode.nodeName}`);
  });

  // Test whitespace handling (IE is sensitive to this)
  const whitespaceTestCases = [
    {
      html: "  <div>Padded</div>  ",
      expectedLength: 3,  // Leading space + div + trailing space
      expectedTag: "DIV"
    },
    {
      html: "\n<div>Newlines</div>\n",
      expectedLength: 3,  // Leading newline + div + trailing newline
      expectedTag: "DIV"
    },
    {
      html: "\t<div>Tabs</div>\t",
      expectedLength: 3,  // Leading tab + div + trailing tab
      expectedTag: "DIV"
    }
  ];

  whitespaceTestCases.forEach((testCase, i) => {
    const result = Blaze._DOMBackend.parseHTML(testCase.html);
    test.equal(result.length, testCase.expectedLength,
      `Whitespace test ${i}: Expected length ${testCase.expectedLength} but got ${result.length}`);
    // Check the middle node (the div)
    test.equal(result[1].nodeName, testCase.expectedTag,
      `Whitespace test ${i}: Expected tag ${testCase.expectedTag} but got ${result[1].nodeName}`);
    // Verify surrounding nodes are text nodes
    test.equal(result[0].nodeType, Node.TEXT_NODE,
      `Whitespace test ${i}: Expected leading text node`);
    test.equal(result[2].nodeType, Node.TEXT_NODE,
      `Whitespace test ${i}: Expected trailing text node`);
  });

  // Test empty input
  test.equal(Blaze._DOMBackend.parseHTML("").length, 0);
  test.equal(Blaze._DOMBackend.parseHTML(null).length, 0);
  test.equal(Blaze._DOMBackend.parseHTML(undefined).length, 0);
  // This is a unique case since a whitespace-only input is parsed as a single text node. 
  test.equal(Blaze._DOMBackend.parseHTML("   ").length, 1);

  // Test malformed HTML (IE is more strict)
  const malformedTestCasesIE = [
    {
      html: "<div>Hello<span>World</span></div>",  // Well-formed control case
      expectedLength: 1,
      expectedChildren: 1
    },
    {
      html: "<div>Test</div><p>",  // Partial second tag
      expectedLength: 2
    },
    {
      html: "<div class=>Test</div>",  // Invalid attribute
      expectedLength: 1
    }
  ];

  malformedTestCasesIE.forEach((testCase, i) => {
    const result = Blaze._DOMBackend.parseHTML(testCase.html);
    test.equal(result.length, testCase.expectedLength,
      `Malformed test ${i}: Expected length ${testCase.expectedLength} but got ${result.length}`);
    if (testCase.expectedChildren !== undefined) {
      const childCount = result[0].getElementsByTagName('span').length;
      test.equal(childCount, testCase.expectedChildren,
        `Malformed test ${i}: Expected ${testCase.expectedChildren} span elements but got ${childCount}`);
    }
  });

  // Test array-like properties of result (important for IE)
  const arrayResult = Blaze._DOMBackend.parseHTML("<div></div><span></span>");
  test.equal(typeof arrayResult.length, "number", "Result should have length property");
  test.equal(typeof arrayResult[0], "object", "Result should have indexed access");
  test.equal(arrayResult[0].nodeName, "DIV", "First element should be accessible by index");
});

Tinytest.add("blaze - security - XSS prevention in HTML parsing", function (test) {
  const xssTestCases = [
    {
      html: "<div><p>Test</p><script>alert('XSS')</script></div>",
      description: "Prevents inline script execution",
      checks: (result) => {
        test.equal(result.length, 1, "Should parse into a single element");
        const div = result[0];
        test.equal(div.querySelector('script'), null, "Script tag should be removed");
        test.equal(div.querySelector('p').textContent, "Test", "Safe content should be preserved");
      }
    },
    {
      html: "<div><p>Test</p><img src='x' onerror='alert(\"XSS\")'></div>",
      description: "Prevents event handler injection",
      checks: (result) => {
        test.equal(result.length, 1, "Should parse into a single element");
        const div = result[0];
        const img = div.querySelector('img');
        test.isNotNull(img, "Image element should be preserved");
        test.isFalse(img.hasAttribute('onerror'), "Event handler should be stripped");
        test.equal(div.querySelector('p').textContent, "Test", "Safe content should be preserved");
      }
    },
    {
      html: "<div><p>Test</p><iframe src='javascript:alert(\"XSS\")'></iframe></div>",
      description: "Prevents javascript: URL injection",
      checks: (result) => {
        test.equal(result.length, 1, "Should parse into a single element");
        const div = result[0];
        const iframe = div.querySelector('iframe');
        test.isNotNull(iframe, "iframe element should be preserved");
        const src = iframe.getAttribute('src') || '';
        test.isFalse(src.includes('javascript:'), "javascript: protocol should be stripped");
        test.equal(div.querySelector('p').textContent, "Test", "Safe content should be preserved");
      }
    }
  ];

  xssTestCases.forEach((testCase, i) => {
    const result = Blaze._DOMBackend.parseHTML(testCase.html);
    testCase.checks(result);
  });
});