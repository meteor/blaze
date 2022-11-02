/* eslint-disable meteor/no-session,no-debugger,meteor/no-template-lifecycle-assignments */
/* global Tinytest renderToDiv Template Session canonicalizeHtml Tracker LocalCollection clickElement $ simulateEvent Spacebars ReactiveVar */

// for events to bubble an element needs to be in the DOM.
// @return {Function} call this for cleanup
const addToBody = function (el) {
  // eslint-disable-next-line no-param-reassign
  el.style.display = 'none';
  document.body.appendChild(el);
  return function () {
    document.body.removeChild(el);
  };
};


Tinytest.add('spacebars-tests - templating_tests - assembly', function (test) {
  // Test for a bug that made it to production -- after a replacement,
  // we need to also check the newly replaced node for replacements
  const div = renderToDiv(Template.test_assembly_a0);
  test.equal(canonicalizeHtml(div.innerHTML),
               'Hi');

  // Another production bug -- we must use LiveRange to replace the
  // placeholder, or risk breaking other LiveRanges
  Session.set('stuff', true); // XXX bad form to use Session in a test?
  Template.test_assembly_b1.helpers({
    stuff () {
      return Session.get('stuff');
    },
  });
  const onscreen = renderToDiv(Template.test_assembly_b0);
  test.equal(canonicalizeHtml(onscreen.innerHTML), 'xyhi');
  Session.set('stuff', false);
  Tracker.flush();
  test.equal(canonicalizeHtml(onscreen.innerHTML), 'xhi');
  Tracker.flush();
});

// Test that if a template throws an error, then pending_partials is
// cleaned up properly (that template rendering doesn't break..)


Tinytest.add('spacebars-tests - templating_tests - table assembly', function(test) {
  const childWithTag = function(node, tag) {
    return Array.from(node.childNodes).find(function(n) {
      return n.nodeName === tag;
    });
  };

  // The table.rows test would fail when TR/TD tags are stripped due
  // to improper html-to-fragment
  let table = childWithTag(renderToDiv(Template.test_table_b0), 'TABLE');
  test.equal(table.rows.length, 3);

  const c = new LocalCollection();
  c.insert({ bar: 'a' });
  c.insert({ bar: 'b' });
  c.insert({ bar: 'c' });
  const onscreen = renderToDiv(Template.test_table_each, { foo: c.find() });
  table = childWithTag(onscreen, 'TABLE');

  test.equal(table.rows.length, 3, table.parentNode.innerHTML);
  const tds = onscreen.getElementsByTagName('TD');
  test.equal(tds.length, 3);
  test.equal(canonicalizeHtml(tds[0].innerHTML), 'a');
  test.equal(canonicalizeHtml(tds[1].innerHTML), 'b');
  test.equal(canonicalizeHtml(tds[2].innerHTML), 'c');

  Tracker.flush();
});

Tinytest.add('spacebars-tests - templating_tests - event handler this', function(test) {
  const eventBuf = [];
  Template.test_event_data_with.helpers({
    ONE: { str: 'one' },
    TWO: { str: 'two' },
    THREE: { str: 'three' },
  });

  Template.test_event_data_with.events({
    click(event, instance) {
      test.isTrue(this.str);
      test.equal(instance.data.str, 'one');
      eventBuf.push(this.str);
    },
  });

  const containerDiv = renderToDiv(Template.test_event_data_with, { str: 'one' });
  const cleanupDiv = addToBody(containerDiv);

  const divs = containerDiv.getElementsByTagName('div');
  test.equal(3, divs.length);

  clickElement(divs[0]);
  test.equal(eventBuf, ['one']);
  eventBuf.length = 0;

  clickElement(divs[1]);
  test.equal(eventBuf, ['two']);
  eventBuf.length = 0;

  clickElement(divs[2]);
  test.equal(eventBuf, ['three']);
  eventBuf.length = 0;

  cleanupDiv();
  Tracker.flush();
});


if (document.addEventListener) {
  // Only run this test on browsers with support for event
  // capturing. A more detailed analysis can be found at
  // https://www.meteor.com/blog/2013/09/06/browser-events-bubbling-capturing-and-delegation

  // This is related to issue at https://gist.github.com/mquandalle/8157017
  // Tests two situations related to events that can only be captured, not bubbled:
  // 1. Event should only fire the handler that matches the selector given
  // 2. Event should work on every element in the selector and not just the first element
  // This test isn't written against mouseenter because it is synthesized by jQuery,
  // the bug also happened with the play event
  Tinytest.add('spacebars-tests - templating_tests - capturing events', function (test) {
    let video1Played = 0;
        let video2Played = 0;

    Template.test_capture_events.events({
      'play .video1' () {
        video1Played++;
      },
      'play .video2' () {
        video2Played++;
      },
    });

    // add to body or else events don't actually fire
    const containerDiv = renderToDiv(Template.test_capture_events);
    const cleanupDiv = addToBody(containerDiv);

    const checkAndResetEvents = function(video1, video2) {
      test.equal(video1Played, video1);
      test.equal(video2Played, video2);

      video1Played = 0;
      video2Played = 0;
    };

    simulateEvent($(containerDiv).find('.video1').get(0),
                  'play', {}, { bubbles: false });
    checkAndResetEvents(1, 0);

    simulateEvent($(containerDiv).find('.video2').get(0),
                  'play', {}, { bubbles: false });
    checkAndResetEvents(0, 1);

    simulateEvent($(containerDiv).find('.video2').get(1),
                  'play', {}, { bubbles: false });
    checkAndResetEvents(0, 1);

    // clean up DOM
    cleanupDiv();
    Tracker.flush();
  });
}

Tinytest.add('spacebars-tests - templating_tests - safestring', function(test) {
  Template.test_safestring_a.helpers({
    foo() {
      return '<br>';
    },
    bar() {
      return new Spacebars.SafeString('<hr>');
    },
  });

  const obj = { fooprop: '<br>',
             barprop: new Spacebars.SafeString('<hr>') };
  const html = canonicalizeHtml(
    renderToDiv(Template.test_safestring_a, obj).innerHTML);

  test.equal(html,
             '&lt;br&gt;<br><hr><hr>' +
             '&lt;br&gt;<br><hr><hr>');
});

Tinytest.add('spacebars-tests - templating_tests - helpers and dots', function(test) {
  Template.registerHelper('platypus', function() {
    return 'eggs';
  });
  Template.registerHelper('watermelon', function() {
    return 'seeds';
  });

  Template.registerHelper('daisygetter', function() {
    return this.daisy;
  });

  // XXX for debugging
  Template.registerHelper('debugger', function() {
    debugger;
  });

  const getFancyObject = function() {
    return {
      foo: 'bar',
      apple: { banana: 'smoothie' },
      currentFruit() {
        return 'guava';
      },
      currentCountry() {
        return { name: 'Iceland',
                _pop: 321007,
                population() {
                  return this._pop;
                },
                unicorns: 0, // falsy value
                daisyGetter() {
                  return this.daisy;
                },
               };
      },
    };
  };

  Template.registerHelper('fancyhelper', getFancyObject);

  Template.test_helpers_a.helpers({
    platypus: 'bill',
    warthog() {
      return 'snout';
    },
  });

  const listFour = function(a, b, c, d, options) {
    test.isTrue(options instanceof Spacebars.kw);
    const keywordArgs = Object.keys(options.hash).map(function(k) {
      const val = options.hash[k];
      return `${k}:${val}`;
    });
    return [a, b, c, d].concat(keywordArgs).join(' ');
  };

  const dataObj = {
    zero: 0,
    platypus: 'weird',
    watermelon: 'rind',
    daisy: 'petal',
    tree() { return 'leaf'; },
    thisTest() { return this.tree(); },
    getNull() { return null; },
    getUndefined () { },
    fancy: getFancyObject(),
    methodListFour: listFour,
  };

  let html;
  html = canonicalizeHtml(
    renderToDiv(Template.test_helpers_a, dataObj).innerHTML);
  test.equal(html.match(/\S+/g), [
    'platypus=bill', // helpers on Template object take first priority
    'watermelon=seeds', // global helpers take second priority
    'daisy=petal', // unshadowed object property
    'tree=leaf', // function object property
    'warthog=snout', // function Template property
  ]);

  html = canonicalizeHtml(
    renderToDiv(Template.test_helpers_b, dataObj).innerHTML);
  test.equal(html.match(/\S+/g), [
    // unknown properties silently fail
    'unknown=',
    // falsy property comes through
    'zero=0',
  ]);

  html = canonicalizeHtml(
    renderToDiv(Template.test_helpers_c, dataObj).innerHTML);
  test.equal(html.match(/\S+/g), [
    // property gets are supposed to silently fail
    'platypus.X=',
    'watermelon.X=',
    'daisy.X=',
    'tree.X=',
    'warthog.X=',
    'getNull.X=',
    'getUndefined.X=',
    'getUndefined.X.Y=',
  ]);

  html = canonicalizeHtml(
    renderToDiv(Template.test_helpers_d, dataObj).innerHTML);
  test.equal(html.match(/\S+/g), [
    // helpers should get current data context in `this`
    'daisygetter=petal',
    // object methods should get object in `this`
    'thisTest=leaf',
    // nesting inside {{#with fancy}} shouldn't affect
    // method
    '../thisTest=leaf',
    // combine .. and .
    '../fancy.currentFruit=guava',
  ]);

  html = canonicalizeHtml(
    renderToDiv(Template.test_helpers_e, dataObj).innerHTML);
  test.equal(html.match(/\S+/g), [
    'fancy.foo=bar',
    'fancy.apple.banana=smoothie',
    'fancy.currentFruit=guava',
    'fancy.currentCountry.name=Iceland',
    'fancy.currentCountry.population=321007',
    'fancy.currentCountry.unicorns=0',
  ]);

  html = canonicalizeHtml(
    renderToDiv(Template.test_helpers_f, dataObj).innerHTML);
  test.equal(html.match(/\S+/g), [
    'fancyhelper.foo=bar',
    'fancyhelper.apple.banana=smoothie',
    'fancyhelper.currentFruit=guava',
    'fancyhelper.currentCountry.name=Iceland',
    'fancyhelper.currentCountry.population=321007',
    'fancyhelper.currentCountry.unicorns=0',
  ]);

  // test significance of 'this', which prevents helper from
  // shadowing property
  html = canonicalizeHtml(
    renderToDiv(Template.test_helpers_g, dataObj).innerHTML);
  test.equal(html.match(/\S+/g), [
    'platypus=eggs',
    'this.platypus=weird',
  ]);

  // test interpretation of arguments

  Template.test_helpers_h.helpers({ helperListFour: listFour });

  html = canonicalizeHtml(
    renderToDiv(Template.test_helpers_h, dataObj).innerHTML);
  const trials =
        html.match(/\(.*?\)/g);
  test.equal(trials[0],
             '(methodListFour 6 7 8 9=6 7 8 9)');
  test.equal(trials[1],
             '(methodListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns=eggs leaf guava 0)');
  test.equal(trials[2],
             '(methodListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns a=platypus b=thisTest c=fancyhelper.currentFruit d=fancyhelper.currentCountry.unicorns=eggs leaf guava 0 a:eggs b:leaf c:guava d:0)');
  test.equal(trials[3],
             '(helperListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns=eggs leaf guava 0)');
  test.equal(trials[4],
             '(helperListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns a=platypus b=thisTest c=fancyhelper.currentFruit d=fancyhelper.currentCountry.unicorns=eggs leaf guava 0 a:eggs b:leaf c:guava d:0)');
  test.equal(trials.length, 5);
});


Tinytest.add('spacebars-tests - templating_tests - rendered template', function(test) {
  let R = ReactiveVar('foo');
  Template.test_render_a.helpers({
    foo() {
      R.get();
      return this.x + 1;
    },
  });

  let div = renderToDiv(Template.test_render_a, { x: 123 });
  test.equal($(div).text().match(/\S+/)[0], '124');

  let br1 = div.getElementsByTagName('br')[0];
  let hr1 = div.getElementsByTagName('hr')[0];
  test.isTrue(br1);
  test.isTrue(hr1);

  R.set('bar');
  Tracker.flush();
  let br2 = div.getElementsByTagName('br')[0];
  let hr2 = div.getElementsByTagName('hr')[0];
  test.isTrue(br2);
  test.isTrue(br1 === br2);
  test.isTrue(hr2);
  test.isTrue(hr1 === hr2);

  Tracker.flush();

  // ///

  R = ReactiveVar('foo');

  Template.test_render_b.helpers({ foo() {
    R.get();
    return (+this) + 1;
  } });

  div = renderToDiv(Template.test_render_b, { x: 123 });
  test.equal($(div).text().match(/\S+/)[0], '201');

  // eslint-disable-next-line prefer-destructuring
  br1 = div.getElementsByTagName('br')[0];
  // eslint-disable-next-line prefer-destructuring
  hr1 = div.getElementsByTagName('hr')[0];
  test.isTrue(br1);
  test.isTrue(hr1);

  R.set('bar');
  Tracker.flush();
  // eslint-disable-next-line prefer-destructuring
  br2 = div.getElementsByTagName('br')[0];
  // eslint-disable-next-line prefer-destructuring
  hr2 = div.getElementsByTagName('hr')[0];
  test.isTrue(br2);
  test.isTrue(br1 === br2);
  test.isTrue(hr2);
  test.isTrue(hr1 === hr2);

  Tracker.flush();
});

Tinytest.add('spacebars-tests - templating_tests - template arg', function (test) {
  Template.test_template_arg_a.events({
    click (event, instance) {
      const _instance = instance;
      _instance.firstNode.innerHTML = 'Hello';
      _instance.lastNode.innerHTML = 'World';
      _instance.find('i').innerHTML =
        `${_instance.findAll('*').length}-element`;
      _instance.lastNode.innerHTML += ` (the secret is ${
        _instance.secret})`;
    },
  });

  Template.test_template_arg_a.created = function() {
    const self = this;
    test.isFalse(self.firstNode);
    test.isFalse(self.lastNode);
    test.throws(function () { return self.find('*'); });
    test.throws(function () { return self.findAll('*'); });
  };

  Template.test_template_arg_a.rendered = function () {
    const template = this;
    template.firstNode.innerHTML = 'Greetings';
    template.lastNode.innerHTML = 'Line';
    template.find('i').innerHTML =
      `${template.findAll('b').length}-bold`;
    template.secret = `strawberry ${template.data.food}`;
  };

  Template.test_template_arg_a.destroyed = function() {
    const self = this;
    test.isFalse(self.firstNode);
    test.isFalse(self.lastNode);
    test.throws(function () { return self.find('*'); });
    test.throws(function () { return self.findAll('*'); });
  };

  const div = renderToDiv(Template.test_template_arg_a, { food: 'pie' });
  const cleanupDiv = addToBody(div);
  Tracker.flush(); // cause `rendered` to be called
  test.equal($(div).text(), 'Greetings 1-bold Line');
  clickElement(div.querySelector('i'));
  test.equal($(div).text(), 'Hello 3-element World (the secret is strawberry pie)');

  cleanupDiv();
  Tracker.flush();
});

Tinytest.add('spacebars-tests - templating_tests - helpers', function (test) {
  let tmpl = Template.test_template_helpers_a;

  tmpl._NOWARN_OLDSTYLE_HELPERS = true;
  tmpl.foo = 'z';
  tmpl.helpers({ bar: 'b' });
  // helpers(...) takes precendence of assigned helper
  tmpl.helpers({ foo: 'a', baz() { return 'c'; } });

  let div = renderToDiv(tmpl);
  test.equal($(div).text().match(/\S+/)[0], 'abc');
  Tracker.flush();

  tmpl = Template.test_template_helpers_b;

  tmpl.helpers({
    name: 'A',
    arity: 'B',
    toString: 'C',
    length: 4,
    var: 'D',
  });

  div = renderToDiv(tmpl);
  let txt = $(div).text();
  txt = txt.replace('[object Object]', 'X'); // IE 8
  // eslint-disable-next-line prefer-destructuring
  txt = txt.match(/\S+/)[0];
  test.isTrue(txt.match(/^AB[CX]4D$/));
  // We don't make helpers with names like toString work in IE 8.
  test.expect_fail();
  test.equal(txt, 'ABC4D');
  Tracker.flush();

  // test that helpers don't "leak"
  tmpl = Template.test_template_helpers_c;
  div = renderToDiv(tmpl);
  test.equal($(div).text(), 'x');
  Tracker.flush();
});

Tinytest.add('spacebars-tests - templating_tests - events', function (test) {
  let tmpl = Template.test_template_events_a;

  let buf = [];

  // old style
  tmpl.events = {
    'click b' () { buf.push('b'); },
  };

  let div = renderToDiv(tmpl);
  let cleanupDiv = addToBody(div);
  clickElement($(div).find('b')[0]);
  test.equal(buf, ['b']);
  cleanupDiv();
  Tracker.flush();

  // /

  tmpl = Template.test_template_events_b;
  buf = [];
  // new style
  tmpl.events({
    'click u' () { buf.push('u'); },
  });
  tmpl.events({
    'click i' () { buf.push('i'); },
  });

  div = renderToDiv(tmpl);
  cleanupDiv = addToBody(div);
  clickElement($(div).find('u')[0]);
  clickElement($(div).find('i')[0]);
  test.equal(buf, ['u', 'i']);
  cleanupDiv();
  Tracker.flush();

  // Test for identical callbacks for issue #650
  tmpl = Template.test_template_events_c;
  buf = [];
  tmpl.events({
    'click u' () { buf.push('a'); },
  });
  tmpl.events({
    'click u' () { buf.push('b'); },
  });

  div = renderToDiv(tmpl);
  cleanupDiv = addToBody(div);
  clickElement($(div).find('u')[0]);
  test.equal(buf.length, 2);
  test.isTrue(buf.includes('a'));
  test.isTrue(buf.includes('b'));
  cleanupDiv();
  Tracker.flush();
});


Tinytest.add('spacebars-tests - templating_tests - helper typecast Issue #617', function (test) {
  Template.registerHelper('testTypeCasting', function (/* arguments */) {
    // Return a string representing the arguments passed to this
    // function, including types. eg:
    // (1, true) -> "[number,1][boolean,true]"
    // eslint-disable-next-line prefer-rest-params
    return Array.from(arguments).reduce(function (memo, arg) {
      if (typeof arg === 'object') return `${memo}[object]`;
      return `${memo}[${typeof arg},${arg}]`;
    }, '');
  });

  const div = renderToDiv(Template.test_type_casting);
  const result = canonicalizeHtml(div.innerHTML);
  test.equal(
    result,
    // This corresponds to entries in templating_tests.html.
    // true/faslse
    '[string,true][string,false][boolean,true][boolean,false]' +
      // numbers
      '[number,0][number,1][number,-1][number,10][number,-10]' +
      // handlebars 'options' argument. appended to args of all helpers.
      '[object]');
});

Tinytest.add('spacebars-tests - templating_tests - each falsy Issue #801', function (test) {
  // Minor test for issue #801 (#each over array containing nulls)
  Template.test_template_issue801.helpers({
    values() { return [0, 1, 2, null, undefined, false]; } });
  const div = renderToDiv(Template.test_template_issue801);
  test.equal(canonicalizeHtml(div.innerHTML), '012');
});

Tinytest.add('spacebars-tests - templating_tests - duplicate template error', function (test) {
  Template.__checkName('test_duplicate_template');
  Template.test_duplicate_template = new Template(
    'dup', function () { return null; });

  test.throws(function () {
    Template.__checkName('test_duplicate_template');
  });
});

Tinytest.add('spacebars-tests - templating_tests - reserved template name error', function (test) {
  'length __proto__ prototype name body currentData instance'.split(' ').forEach(
         function (name) {
           test.throws(function () {
             Template.__checkName(name);
           }, /This template name is reserved: /);
         });
});
