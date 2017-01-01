var toCode = BlazeTools.toJS;

var A = HTML.A;
var BR = HTML.BR;
var CharRef = HTML.CharRef;
var Comment = HTML.Comment;
var DIV = HTML.DIV;
var FORM = HTML.FORM;
var HR = HTML.HR;
var LI = HTML.LI;
var IFRAME = HTML.IFRAME;
var IMG = HTML.IMG;
var INPUT = HTML.INPUT;
var OL = HTML.OL;
var P = HTML.P;
var SCRIPT = HTML.SCRIPT;
var SELECT = HTML.SELECT;
var SPAN = HTML.SPAN;
var TEXTAREA = HTML.TEXTAREA;
var UL = HTML.UL;
var VIDEO = HTML.VIDEO;

var materialize = function (content, parent) {
  var func = content;
  if (typeof content !== 'function') {
    func = function () {
      return content;
    };
  }
  Blaze.render(func, parent);
};

var toHTML = Blaze.toHTML;

Tinytest.add("blaze - render - basic", function (test) {
  var run = function (input, expectedInnerHTML, expectedHTML, expectedCode) {
    var div = document.createElement("DIV");
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
  var R = ReactiveVar("hello");
  var div = document.createElement("DIV");
  materialize(INPUT({value: function () { return R.get(); }}), div);
  var inputEl = div.querySelector('input');
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
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(INPUT({type: "checkbox", checked: function () { return R.get(); }}), div);
  var inputEl = div.querySelector('input');
  test.equal(inputEl.checked, false);
  inputEl.checked = true;

  R.set("checked");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(inputEl.checked, false);
});

// test that we correctly update the HTML5 boolean properties
Tinytest.add("blaze - render - input - autofocus", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(INPUT({type: "text", autofocus: function () { return R.get(); }}), div);
  var inputEl = div.querySelector('input');
  test.equal(inputEl.autofocus, false);
  inputEl.autofocus = true;

  R.set("autofocus");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(inputEl.autofocus, false);
});

Tinytest.add("blaze - render - input - disabled", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(INPUT({type: "text", disabled: function () { return R.get(); }}), div);
  var inputEl = div.querySelector('input');
  test.equal(inputEl.disabled, false);
  inputEl.disabled = true;

  R.set("disabled");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(inputEl.disabled, false);
});

Tinytest.add("blaze - render - input - hidden", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(INPUT({type: "text", hidden: function () { return R.get(); }}), div);
  var inputEl = div.querySelector('input');
  test.equal(inputEl.hidden, false);
  inputEl.hidden = true;

  R.set("hidden");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(inputEl.hidden, false);
});

Tinytest.add("blaze - render - input - readonly", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(INPUT({type: "text", readOnly: function () { return R.get(); }}), div);
  var inputEl = div.querySelector('input');
  test.equal(inputEl.readOnly, false);
  inputEl.readOnly = true;

  R.set("readonly");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(inputEl.readOnly, false);
});

Tinytest.add("blaze - render - input - required", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(INPUT({type: "text", required: function () { return R.get(); }}), div);
  var inputEl = div.querySelector('input');
  test.equal(inputEl.required, false);
  inputEl.required = true;

  R.set("required");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(inputEl.required, false);
});

Tinytest.add("blaze - render - select - multiple", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(SELECT({multiple: function () { return R.get(); }}), div);
  var selectEl = div.querySelector('select');
  test.equal(selectEl.multiple, false);
  selectEl.multiple = true;

  R.set("multiple");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(selectEl.multiple, false);
});

// test that we correctly update the HTML5 <form> novalidate boolean property
Tinytest.add("blaze - render - form - novalidate", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(FORM({noValidate: function () { return R.get(); }}), div);
  var formEl = div.querySelector('form');
  test.equal(formEl.noValidate, false);
  formEl.noValidate = true;

  R.set("novalidate");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(formEl.noValidate, false);
});

// test that we correctly update the HTML5 <image> ismap boolean property
Tinytest.add("blaze - render - image - ismap", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(IMG({isMap: function () { return R.get(); }}), div);
  var imageEl = div.querySelector('img');
  test.equal(imageEl.isMap, false);
  imageEl.isMap = true;

  R.set("ismap");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(imageEl.isMap, false);
});

// test that we correctly update the HTML5 <ol> reversed boolean property
Tinytest.add("blaze - render - ordered list - reversed", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(OL({reversed: function () { return R.get(); }}), div);
  var orderedListEl = div.querySelector('ol');
  test.equal(orderedListEl.reversed, false);
  orderedListEl.reversed = true;

  R.set("reversed");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(orderedListEl.reversed, false);
});

// test that we correctly update the HTML5 <script> boolean properties
Tinytest.add("blaze - render - script - defer", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(SCRIPT({src: "", defer: function () { return R.get(); }}), div);
  var scriptEl = div.querySelector('script');
  test.equal(scriptEl.defer, false);
  scriptEl.defer = true;

  R.set("defer");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(scriptEl.defer, false);
});

// test that we correctly update the HTML5 <video> boolean properties
Tinytest.add("blaze - render - video - autoplay", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(VIDEO({autoplay: function () { return R.get(); }}), div);
  var videoEl = div.querySelector('video');
  test.equal(videoEl.autoplay, false);
  videoEl.autoplay = true;

  R.set("autoplay");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(videoEl.autoplay, false);
});

Tinytest.add("blaze - render - video - controls", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(VIDEO({controls: function () { return R.get(); }}), div);
  var videoEl = div.querySelector('video');
  test.equal(videoEl.controls, false);
  videoEl.controls = true;

  R.set("controls");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(videoEl.controls, false);
});

Tinytest.add("blaze - render - video - loop", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(VIDEO({loop: function () { return R.get(); }}), div);
  var videoEl = div.querySelector('video');
  test.equal(videoEl.loop, false);
  videoEl.loop = true;

  R.set("loop");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(videoEl.loop, false);
});

Tinytest.add("blaze - render - video - muted", function (test) {
  var R = ReactiveVar(null);
  var div = document.createElement("DIV");
  materialize(VIDEO({muted: function () { return R.get(); }}), div);
  var videoEl = div.querySelector('video');
  test.equal(videoEl.muted, false);
  videoEl.muted = true;

  R.set("muted");
  Tracker.flush();
  R.set(null);
  Tracker.flush();
  test.equal(videoEl.muted, false);
});

Tinytest.add("blaze - render - textarea", function (test) {
  var run = function (optNode, text, html, code) {
    if (typeof optNode === 'string') {
      // called with args (text, html, code)
      code = html;
      html = text;
      text = optNode;
      optNode = null;
    }
    var div = document.createElement("DIV");
    var node = TEXTAREA({value: optNode || text});
    materialize(node, div);

    var value = div.querySelector('textarea').value;
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
    var R = ReactiveVar('one');
    var div = document.createElement("DIV");
    var node = TEXTAREA({value: function () {
      return Blaze.View(function () {
        return R.get();
      });
    }});
    materialize(node, div);
    var textarea = div.querySelector('textarea');
    test.equal(textarea.value, 'one');
    R.set('two');
    Tracker.flush();
    test.equal(textarea.value, 'two');
  })();

  // ... while "content" reactivity simply doesn't update
  // (but doesn't throw either)
  (function () {
    var R = ReactiveVar('one');
    var div = document.createElement("DIV");
    var node = TEXTAREA([Blaze.View(function () {
      return R.get();
    })]);
    materialize(node, div);
    var textarea = div.querySelector('textarea');
    test.equal(textarea.value, 'one');
    R.set('two');
    Tracker.flush({_throwFirstError: true});
    test.equal(textarea.value, 'one');
  })();
});

Tinytest.add("blaze - render - view isolation", function (test) {

  // Reactively change a text node
  (function () {
    var R = ReactiveVar('Hello');
    var test1 = function () {
      return P(Blaze.View(function () { return R.get(); }));
    };

    test.equal(toHTML(test1()), '<p>Hello</p>');

    var div = document.createElement("DIV");
    materialize(test1, div);
    test.equal(canonicalizeHtml(div.innerHTML), "<p>Hello</p>");

    R.set('World');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "<p>World</p>");
  })();

  // Reactively change an array of text nodes
  (function () {
    var R = ReactiveVar(['Hello', ' World']);
    var test1 = function () {
      return P(Blaze.View(function () { return R.get(); }));
    };

    test.equal(toHTML(test1()), '<p>Hello World</p>');

    var div = document.createElement("DIV");
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
var malformedStylesAllowed = function () {
  var div = document.createElement("div");
  div.setAttribute("style", "bar::d;");
  return (div.getAttribute("style") === "bar::d;");
};

Tinytest.add("blaze - render - view GC", function (test) {
  // test that removing parent element removes listeners and stops autoruns.
  (function () {
    var R = ReactiveVar('Hello');
    var test1 = P(Blaze.View(function () { return R.get(); }));

    var div = document.createElement("DIV");
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
    var R = ReactiveVar({'class': ['david gre', CharRef({html: '&euml;', str: '\u00eb'}), 'nspan'],
                         id: 'foo'});

    var spanFunc = function () {
      return SPAN(HTML.Attrs(
        function () { return R.get(); }));
    };

    test.equal(Blaze.toHTML(spanFunc()),
               '<span class="david gre&euml;nspan" id="foo"></span>');

    test.equal(R._numListeners(), 0);

    var div = document.createElement("DIV");
    Blaze.render(spanFunc, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<span class="david gre\u00ebnspan" id="foo"></span>');

    test.equal(R._numListeners(), 1);

    var span = div.firstChild;
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
    var style = ReactiveVar(false);

    var div = document.createElement("DIV");

    var divFunc = function () {
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
    var R = ReactiveVar({'style': 'foo: "a;aa"; bar: b;',
      id: 'foo'});

    var spanFunc = function () {
      return SPAN(HTML.Attrs(function () { return R.get(); }));
    };

    test.equal(Blaze.toHTML(spanFunc()), '<span style="foo: &quot;a;aa&quot;; bar: b;" id="foo"></span>');

    test.equal(R._numListeners(), 0);

    var div = document.createElement("DIV");
    Blaze.render(spanFunc, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<span id="foo" style="foo: &quot;a;aa&quot;; bar: b"></span>');

    test.equal(R._numListeners(), 1);
    var span = div.firstChild;
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

    var R = ReactiveVar({'style': 'foo: a;'});

    var spanFunc = function () {
      return SPAN(HTML.Attrs(function () { return R.get(); }));
    };

    var div = document.createElement("DIV");
    document.body.appendChild(div);
    Blaze.render(spanFunc, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<span style="foo: a"></span>');

    var span = div.firstChild;
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
    var R = ReactiveVar({id: 'foo',
                         aaa: null,
                         bbb: undefined,
                         ccc: [],
                         ddd: [null],
                         eee: [undefined],
                         fff: [[]],
                         ggg: ['x', ['y', ['z']]]});

    var spanFunc = function () {
      return SPAN(HTML.Attrs(
        function () { return R.get(); }));
    };

    test.equal(Blaze.toHTML(spanFunc()), '<span id="foo" ggg="xyz"></span>');
    test.equal(toCode(SPAN(R.get())),
               'HTML.SPAN({id: "foo", ggg: ["x", ["y", ["z"]]]})');

    var div = document.createElement("DIV");
    Blaze.render(spanFunc, div);
    var span = div.firstChild;
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
    var counter = 1;
    var buf = [];

    var myTemplate = Blaze.Template(
      'myTemplate',
      function () {
        return [String(this.number),
                (this.number < 3 ? makeView() : HR())];
      });

    myTemplate.constructView = function (number) {
      var view = Template.prototype.constructView.call(this);
      view.number = number;
      return view;
    };

    myTemplate.created = function () {
      test.isFalse(Tracker.active);
      var view = this.view;
      var parent = Blaze.getView(view, 'myTemplate');
      if (parent) {
        buf.push('parent of ' + view.number + ' is ' +
                 parent.number);
      }

      buf.push('created ' + Template.currentData());
    };

    myTemplate.onRendered(function () {
      test.isFalse(Tracker.active);
      var nodeDescr = function (node) {
        if (node.nodeType === 8) // comment
          return '';
        if (node.nodeType === 3) // text
          return node.nodeValue;

        return node.nodeName;
      };

      var view = this.view;
      var start = view.firstNode();
      var end = view.lastNode();
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

    var makeView = function () {
      var number = counter++;
      return Blaze.With(number, function () {
        return myTemplate.constructView(number);
      });
    };

    var div = document.createElement("DIV");

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

    var html = Blaze.toHTML(makeView());

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
  var found = null;
  var $found = null;

  var myTemplate = new Template(
    'findAllTest',
    function() {
      return DIV([P('first'), P('second')]);
    });
  myTemplate.rendered = function() {
    found = this.findAll('p');
    $found = this.$('p');
  };

  var div = document.createElement("DIV");

  Blaze.render(myTemplate, div);
  Tracker.flush();

  test.equal(_.isArray(found), true);
  test.equal(_.isArray($found), false);
  test.equal(found.length, 2);
  test.equal($found.length, 2);
});

Tinytest.add("blaze - render - reactive attributes 2", function (test) {
  var R1 = ReactiveVar(['foo']);
  var R2 = ReactiveVar(['bar']);

  var spanFunc = function () {
    return SPAN(HTML.Attrs(
      { blah: function () { return R1.get(); } },
      function () { return { blah: R2.get() }; }));
  };

  var div = document.createElement("DIV");
  Blaze.render(spanFunc, div);
  var check = function (expected) {
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

  var fillColor = ReactiveVar('red');
  var classes = ReactiveVar('one two');

  var content = DIV({'class': 'container'}, HTML.SVG(
    {width: 100, height: 100},
    HTML.CIRCLE({cx: 50, cy: 50, r: 40,
                 stroke: 'black', 'stroke-width': 3,
                 'class': function () { return classes.get(); },
                 fill: function () { return fillColor.get(); }})));

  var div = document.createElement("DIV");
  materialize(content, div);

  var circle = div.querySelector('.container > svg > circle');
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
  var SPAN = HTML.SPAN;
  var amp = HTML.CharRef({html: '&amp;', str: '&'});

  test.equal(HTML.toHTML(SPAN({title: ['M', amp, 'Ms']}, 'M', amp, 'M candies')),
             '<span title="M&amp;Ms">M&amp;M candies</span>');
});

if (typeof MutationObserver !== 'undefined') {
  // This test is not really able to test that Blaze._materializeDOM is called only when
  // not Blaze._isContentEqual(lastHtmljs, htmljs), which is what we would in fact want to test.
  Tinytest.addAsync("blaze - render - optimization", function (test, onComplete) {
    var R = ReactiveVar('aa');
    var view = Blaze.View(function () { return R.get().substr(0, 1); });

    var renderedCount = 0;
    test.equal(view.renderCount, 0);

    view._onViewRendered(function () {
      renderedCount++;
    });

    var test1 = P(view);

    var div = document.createElement("DIV");

    var observedMutations = [];
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        observedMutations.push(mutation);
      });
    });

    observer.observe(div, {childList: true, subtree: true});

    var materializeCount = 0;
    var originalMaterializeDOM = Blaze._materializeDOM;
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
