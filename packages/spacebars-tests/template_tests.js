const hasJquery = Blaze._DOMBackend._hasJQuery;
const divRendersTo = function (test, div, html) {
  Tracker.flush({ _throwFirstError: true });
  const actual = canonicalizeHtml(div.innerHTML);
  test.equal(actual, html);
};

const nodesToArray = function (array) {
  return Array.from(array);
};

// maybe use created callback on the template instead of this?
const extendTemplateWithInit = function (template, initFunc) {
  const tmpl = new Template(
    template.viewName + '-extended',
    template.renderFunction
  );
  tmpl.constructView = function (...args) {
    const view = Template.prototype.constructView.apply(this, args);
    initFunc(view);
    return view;
  };
  return tmpl;
};

// Make a "clone" of origTemplate (but not its helpers)
const copyTemplate = function (origTemplate) {
  return new Template(origTemplate.viewName, origTemplate.renderFunction);
};

Tinytest.add(
  'spacebars-tests - template_tests - simple helper',
  function (test) {
    const baseTmpl = Template.spacebars_template_test_simple_helper;
    const tmpl1 = copyTemplate(baseTmpl);
    let R = ReactiveVar(1);
    tmpl1.helpers({
      foo: function (x) {
        return x + R.get();
      },
      bar: function () {
        return 123;
      },
    });
    let div = renderToDiv(tmpl1);

    test.equal(canonicalizeHtml(div.innerHTML), '124');
    R.set(2);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '125');

    // Test that `{{foo bar}}` throws if `foo` is missing or not a function.
    const tmpl2 = copyTemplate(baseTmpl);
    tmpl2.helpers({ foo: 3 });
    test.throws(function () {
      renderToDiv(tmpl2);
    }, /Can't call non-function/);

    const tmpl3 = copyTemplate(baseTmpl);
    test.throws(function () {
      renderToDiv(tmpl3);
    }, /No such function/);

    const tmpl4 = copyTemplate(baseTmpl);
    tmpl4.helpers({ foo: function () {} });
    // doesn't throw
    div = renderToDiv(tmpl4);
    test.equal(canonicalizeHtml(div.innerHTML), '');

    // now make "foo" is a function in the data context
    const tmpl5 = copyTemplate(baseTmpl);
    tmpl5.helpers({
      bar: function () {
        return 123;
      },
    });

    R = ReactiveVar(1);
    div = renderToDiv(tmpl5, {
      foo: function (x) {
        return x + R.get();
      },
    });
    test.equal(canonicalizeHtml(div.innerHTML), '124');
    R.set(2);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '125');

    test.throws(function () {
      renderToDiv(tmpl5, { foo: 3 });
    }, /Can't call non-function/);

    test.throws(function () {
      renderToDiv(tmpl5, { foo: null });
    }, /No such function/);

    test.throws(function () {
      renderToDiv(tmpl5, {});
    }, /No such function/);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - member helper',
  function (test) {
    const baseTmpl = Template.spacebars_template_test_member_helper;

    // Test that returning function member of a data object can be used as a
    // a helper within a template, in this case, {{user.prefixName 'Mr.'}}
    const tmpl1 = copyTemplate(baseTmpl);
    const name = ReactiveVar('foo');
    tmpl1.helpers({
      user: function () {
        return {
          prefixName: function (prefix) {
            return prefix + ' ' + name.get();
          },
        };
      },
    });
    let div = renderToDiv(tmpl1);
    test.equal(canonicalizeHtml(div.innerHTML), 'Mr. foo');
    name.set('bar');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'Mr. bar');

    // Test that `{{user.prefixName 'Mr.'}}` returns nothing if `user` is not
    // not a function or is completely missing from helpers.
    const tmpl2 = copyTemplate(baseTmpl);
    tmpl2.helpers({ user: 3 });
    div = renderToDiv(tmpl2);
    test.equal(canonicalizeHtml(div.innerHTML), '');

    const tmpl3 = copyTemplate(baseTmpl);
    div = renderToDiv(tmpl3);
    test.equal(canonicalizeHtml(div.innerHTML), '');

    // Test that `{{user.prefixName 'Mr.'}}` returns nothing if the `user`
    // returns null. Before fixing Meteor issue #5441, this test would throw.
    const tmpl4 = copyTemplate(baseTmpl);
    tmpl4.helpers({ user: function () {} });
    div = renderToDiv(tmpl4);
    test.equal(canonicalizeHtml(div.innerHTML), '');

    // One more test, similar to the above, but where `user` is not null but
    // `user.prefixName` is. This test was also broken prior to the fix.
    const tmpl5 = copyTemplate(baseTmpl);
    tmpl5.helpers({
      user: function () {
        return { prefixName: null };
      },
    });
    div = renderToDiv(tmpl5);
    test.equal(canonicalizeHtml(div.innerHTML), '');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - dynamic template',
  function (test) {
    const tmpl = Template.spacebars_template_test_dynamic_template;
    const aaa = Template.spacebars_template_test_aaa;
    const bbb = Template.spacebars_template_test_bbb;
    const R = ReactiveVar('aaa');
    tmpl.helpers({
      foo: function () {
        return R.get() === 'aaa' ? aaa : bbb;
      },
    });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'aaa');

    R.set('bbb');
    Tracker.flush();

    test.equal(canonicalizeHtml(div.innerHTML), 'bbb');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - interpolate attribute',
  function (test) {
    const tmpl = Template.spacebars_template_test_interpolate_attribute;
    tmpl.helpers({
      foo: function (x) {
        return x + 1;
      },
      bar: function () {
        return 123;
      },
    });
    const div = renderToDiv(tmpl);
    
    test.equal(div.querySelector('div').className, 'aaa124zzz');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - dynamic attrs',
  function (test) {
    const tmpl = Template.spacebars_template_test_dynamic_attrs;

    const R2 = ReactiveVar({ x: 'X' });
    const R3 = ReactiveVar('selected');
    tmpl.helpers({
      attrsObj: function () {
        return R2.get();
      },
      singleAttr: function () {
        return R3.get();
      },
    });

    const div = renderToDiv(tmpl);
    const span = div.querySelector('span');
    test.equal(span.innerHTML, 'hi');
    test.isTrue(span.hasAttribute('selected'));
    test.equal(span.getAttribute('x'), 'X');

    R2.set({ y: 'Y', z: 'Z' });
    R3.set('');
    Tracker.flush();
    test.equal(canonicalizeHtml(span.innerHTML), 'hi');
    test.isFalse(span.hasAttribute('selected'));
    test.isFalse(span.hasAttribute('x'));
    test.equal(span.getAttribute('y'), 'Y');
    test.equal(span.getAttribute('z'), 'Z');
  }
);

Tinytest.add('spacebars-tests - template_tests - triple', function (test) {
  let tmpl = Template.spacebars_template_test_triple;

  const R = ReactiveVar('<span class="hi">blah</span>');
  tmpl.helpers({
    html: function () {
      return R.get();
    },
  });

  let div = renderToDiv(tmpl);
  let elems = div.querySelectorAll(':scope > *');
  test.equal(elems.length, 1);
  test.equal(elems[0].nodeName, 'SPAN');
  let span = elems[0];
  test.equal(span.className, 'hi');
  test.equal(span.innerHTML, 'blah');

  R.set('asdf');
  Tracker.flush();
  elems = div.querySelectorAll(':scope > *');
  test.equal(elems.length, 0);
  test.equal(canonicalizeHtml(div.innerHTML), 'asdf');

  R.set('<span class="hi">blah</span>');
  Tracker.flush();
  elems = div.querySelectorAll(':scope > *');
  test.equal(elems.length, 1);
  test.equal(elems[0].nodeName, 'SPAN');
  span = elems[0];
  test.equal(span.className, 'hi');
  test.equal(canonicalizeHtml(span.innerHTML), 'blah');

  tmpl = Template.spacebars_template_test_triple2;
  tmpl.helpers({
    html: function () {},
    html2: function () {
      return null;
    },
  });
  // no tmpl.html3
  div = renderToDiv(tmpl);
  test.equal(canonicalizeHtml(div.innerHTML), 'xy');
});

Tinytest.add(
  'spacebars-tests - template_tests - inclusion args',
  function (test) {
    const tmpl = Template.spacebars_template_test_inclusion_args;

    let R = ReactiveVar(Template.spacebars_template_test_aaa);
    tmpl.helpers({
      foo: function () {
        return R.get();
      },
    });

    let div = renderToDiv(tmpl);
    // `{{> foo bar}}`, with `foo` resolving to Template.aaa,
    // which consists of "aaa"
    test.equal(canonicalizeHtml(div.innerHTML), 'aaa');
    R.set(Template.spacebars_template_test_bbb);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'bbb');

    ////// Ok, now `foo` *is* Template.aaa
    tmpl.helpers({ foo: Template.spacebars_template_test_aaa });
    div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'aaa');

    ////// Ok, now `foo` is a template that takes an argument; bar is a string.
    tmpl.helpers({
      foo: Template.spacebars_template_test_bracketed_this,
      bar: 'david',
    });
    div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '[david]');

    ////// Now `foo` is a template that takes an arg; bar is a function.
    tmpl.helpers({ foo: Template.spacebars_template_test_span_this });
    R = ReactiveVar('david');
    tmpl.helpers({
      bar: function () {
        return R.get();
      },
    });
    div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '<span>david</span>');
    const span1 = div.querySelector('span');
    R.set('avi');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span>avi</span>');
    const span2 = div.querySelector('span');
    test.isTrue(span1 === span2);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - inclusion args 2',
  function (test) {
    // `{{> foo bar q=baz}}`
    const tmpl = Template.spacebars_template_test_inclusion_args2;

    tmpl.helpers({
      foo: Template.spacebars_template_test_span_this,
      bar: function (options) {
        return options.hash.q;
      },
    });

    const R = ReactiveVar('david!');
    tmpl.helpers({
      baz: function () {
        return R.get().slice(0, 5);
      },
    });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '<span>david</span>');
    const span1 = div.querySelector('span');
    R.set('brillo');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '<span>brill</span>');
    const span2 = div.querySelector('span');
    test.isTrue(span1 === span2);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - inclusion dotted args',
  function (test) {
    // `{{> foo bar.baz}}`
    const tmpl = Template.spacebars_template_test_inclusion_dotted_args;

    let initCount = 0;
    tmpl.helpers({
      foo: extendTemplateWithInit(
        Template.spacebars_template_test_bracketed_this,
        function () {
          initCount++;
        }
      ),
    });

    const R = ReactiveVar('david');
    tmpl.helpers({
      bar: function () {
        // make sure `this` is bound correctly
        return { baz: this.symbol + R.get() };
      },
    });

    const div = renderToDiv(tmpl, { symbol: '%' });
    test.equal(initCount, 1);
    test.equal(canonicalizeHtml(div.innerHTML), '[%david]');

    R.set('avi');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '[%avi]');
    // check that invalidating the argument to `foo` doesn't require
    // creating a new `foo`.
    test.equal(initCount, 1);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - inclusion slashed args',
  function (test) {
    // `{{> foo bar/baz}}`
    const tmpl = Template.spacebars_template_test_inclusion_dotted_args;

    let initCount = 0;
    tmpl.helpers({
      foo: extendTemplateWithInit(
        Template.spacebars_template_test_bracketed_this,
        function () {
          initCount++;
        }
      ),
    });
    const R = ReactiveVar('david');
    tmpl.helpers({
      bar: function () {
        // make sure `this` is bound correctly
        return { baz: this.symbol + R.get() };
      },
    });

    const div = renderToDiv(tmpl, { symbol: '%' });
    test.equal(initCount, 1);
    test.equal(canonicalizeHtml(div.innerHTML), '[%david]');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - block helper',
  function (test) {
    // test the case where `foo` is a calculated template that changes
    // reactively.
    // `{{#foo}}bar{{else}}baz{{/foo}}`
    const tmpl = Template.spacebars_template_test_block_helper;
    const R = ReactiveVar(Template.spacebars_template_test_content);
    tmpl.helpers({
      foo: function () {
        return R.get();
      },
    });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'bar');

    R.set(Template.spacebars_template_test_elsecontent);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'baz');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - block helper function with one string arg',
  function (test) {
    // `{{#foo "bar"}}content{{/foo}}`
    const tmpl =
      Template.spacebars_template_test_block_helper_function_one_string_arg;
    tmpl.helpers({
      foo: function () {
        if (String(this) === 'bar')
          return Template.spacebars_template_test_content;
        else return null;
      },
    });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'content');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - block helper function with one helper arg',
  function (test) {
    const tmpl =
      Template.spacebars_template_test_block_helper_function_one_helper_arg;
    const R = ReactiveVar('bar');
    tmpl.helpers({
      bar: function () {
        return R.get();
      },
      foo: function () {
        if (String(this) === 'bar')
          return Template.spacebars_template_test_content;
        else return null;
      },
    });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'content');

    R.set('baz');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - block helper component with one helper arg',
  function (test) {
    const tmpl =
      Template.spacebars_template_test_block_helper_component_one_helper_arg;
    const R = ReactiveVar(true);
    tmpl.helpers({
      bar: function () {
        return R.get();
      },
    });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'content');

    R.set(false);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - block helper component with three helper args',
  function (test) {
    const tmpl =
      Template.spacebars_template_test_block_helper_component_three_helper_args;
    const R = ReactiveVar('bar');
    tmpl.helpers({
      bar_or_baz: function () {
        return R.get();
      },
      equals: function (x, y) {
        return x === y;
      },
    });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'content');

    R.set('baz');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - block helper with dotted arg',
  function (test) {
    const tmpl = Template.spacebars_template_test_block_helper_dotted_arg;
    const R1 = ReactiveVar(1);
    const R2 = ReactiveVar(10);
    const R3 = ReactiveVar(100);

    let initCount = 0;
    tmpl.helpers({
      foo: extendTemplateWithInit(
        Template.spacebars_template_test_bracketed_this,
        function () {
          initCount++;
        }
      ),

      bar: function () {
        return {
          r1: R1.get(),
          baz: function (r3) {
            return this.r1 + R2.get() + r3;
          },
        };
      },
      qux: function () {
        return R3.get();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '[111]');
    test.equal(initCount, 1);

    R1.set(2);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '[112]');
    test.equal(initCount, 1);

    R2.set(20);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '[122]');
    test.equal(initCount, 1);

    R3.set(200);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '[222]');
    test.equal(initCount, 1);

    R2.set(30);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '[232]');
    test.equal(initCount, 1);

    R1.set(3);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '[233]');
    test.equal(initCount, 1);

    R3.set(300);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '[333]');
    test.equal(initCount, 1);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - nested content',
  function (test) {
    // Test that `{{> Template.contentBlock}}` in an `{{#if}}` works.

    // ```
    // <template name="spacebars_template_test_iftemplate">
    //   {{#if condition}}
    //     {{> Template.contentBlock}}
    //   {{else}}
    //     {{> Template.elseBlock}}
    //   {{/if}}
    // </template>
    // ```

    // ```
    //  {{#spacebars_template_test_iftemplate flag}}
    //    hello
    //  {{else}}
    //    world
    //  {{/spacebars_template_test_iftemplate}}
    // ```

    let tmpl = Template.spacebars_template_test_nested_content;
    let R = ReactiveVar(true);
    tmpl.helpers({
      flag: function () {
        return R.get();
      },
    });
    let div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'hello');
    R.set(false);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'world');
    R.set(true);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'hello');

    // Also test that `{{> Template.contentBlock}}` in a custom block helper works.
    tmpl = Template.spacebars_template_test_nested_content2;
    R = ReactiveVar(true);
    tmpl.helpers({
      x: function () {
        return R.get();
      },
    });
    div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'hello');
    R.set(false);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'world');
    R.set(true);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'hello');
  }
);

Tinytest.add('spacebars-tests - template_tests - if', function (test) {
  const tmpl = Template.spacebars_template_test_if;
  const R = ReactiveVar(true);
  tmpl.helpers({
    foo: function () {
      return R.get();
    },
    bar: 1,
    baz: 2,
  });

  const div = renderToDiv(tmpl);
  const rendersTo = function (html) {
    divRendersTo(test, div, html);
  };

  rendersTo('1');
  R.set(false);
  rendersTo('2');
});

Tinytest.add('spacebars-tests - template_tests - if in with', function (test) {
  const tmpl = Template.spacebars_template_test_if_in_with;
  tmpl.helpers({ foo: { bar: 'bar' } });

  const div = renderToDiv(tmpl);
  divRendersTo(test, div, 'bar bar');
});

Tinytest.addAsync(
  'spacebars-tests - template_tests - each on cursor',
  async function (test) {
    const tmpl = Template.spacebars_template_test_each;
    const coll = new Mongo.Collection(null);
    tmpl.helpers({
      items: function () {
        return coll.find({}, { sort: { pos: 1 } });
      },
    });

    const div = renderToDiv(tmpl);
    const rendersTo = function (html) {
      divRendersTo(test, div, html);
    };

    rendersTo('else-clause');
    await coll.insertAsync({ text: 'one', pos: 1 });
    rendersTo('one');
    await coll.insertAsync({ text: 'two', pos: 2 });
    rendersTo('one two');
    await coll.updateAsync({ text: 'two' }, { $set: { text: 'three' } });
    rendersTo('one three');
    await coll.updateAsync({ text: 'three' }, { $set: { pos: 0 } });
    rendersTo('three one');
    await coll.removeAsync({});
    rendersTo('else-clause');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - each on array',
  function (test) {
    const tmpl = Template.spacebars_template_test_each;
    const R = new ReactiveVar([]);
    tmpl.helpers({
      items: function () {
        return R.get();
      },
      text: function () {
        return this;
      },
    });

    const div = renderToDiv(tmpl);
    const rendersTo = function (html) {
      divRendersTo(test, div, html);
    };

    rendersTo('else-clause');
    R.set(['']);
    rendersTo('');
    R.set(['x', '', 'toString']);
    rendersTo('x toString');
    R.set(['toString']);
    rendersTo('toString');
    R.set([]);
    rendersTo('else-clause');
    R.set([0, 1, 2]);
    rendersTo('0 1 2');
    R.set([]);
    rendersTo('else-clause');
  }
);

Tinytest.add('spacebars-tests - template_tests - ..', function (test) {
  const tmpl = Template.spacebars_template_test_dots;

  Template.spacebars_template_test_dots_subtemplate.helpers({
    getTitle: function (from) {
      return from.title;
    },
  });

  tmpl.helpers({
    foo: {
      title: 'foo',
      bar: { title: 'bar', items: [{ title: 'item' }] },
    },
  });

  const div = renderToDiv(tmpl);

  test.equal(
    canonicalizeHtml(div.innerHTML),
    [
      'A',
      'B',
      'C',
      'D',
      // {{> spacebars_template_test_dots_subtemplate}}
      'TITLE',
      '1item',
      '2item',
      '3bar',
      '4foo',
      'GETTITLE',
      '5item',
      '6bar',
      '7foo',
      // {{> spacebars_template_test_dots_subtemplate ..}}
      'TITLE',
      '1bar',
      '2bar',
      '3item',
      '4bar',
      'GETTITLE',
      '5bar',
      '6item',
      '7bar',
    ].join(' ')
  );
});

Tinytest.addAsync('spacebars-tests - template_tests - select tags', async function (test) {
  const tmpl = Template.spacebars_template_test_select_tag;

  // {label: (string)}
  const optgroups = new Mongo.Collection(null);

  // {optgroup: (id), value: (string), selected: (boolean), label: (string)}
  const options = new Mongo.Collection(null);

  tmpl.helpers({
    optgroups: function () {
      return optgroups.find();
    },
    options: function () {
      return options.find({ optgroup: this._id });
    },
    selectedAttr: function () {
      return this.selected ? { selected: true } : {};
    },
  });

  const div = renderToDiv(tmpl);
  const selectEl = div.querySelector('select');

  // returns canonicalized contents of `div` in the form eg
  // ["<select>", "</select>"]. strip out selected attributes -- we
  // verify correctness by observing the `selected` property
  const divContent = function () {
    return canonicalizeHtml(
      div.innerHTML.replace(/selected="[^"]*"/g, '').replace(/selected/g, '')
    )
      .replace(/\>\s*\</g, '>\n<')
      .split('\n');
  };

  test.equal(divContent(), ['<select>', '</select>']);

  const optgroup1 = await optgroups.insertAsync({ label: 'one' });
  const optgroup2 = await optgroups.insertAsync({ label: 'two' });
  test.equal(divContent(), [
    '<select>',
    '<optgroup label="one">',
    '</optgroup>',
    '<optgroup label="two">',
    '</optgroup>',
    '</select>',
  ]);

  await options.insertAsync({
    optgroup: optgroup1,
    value: 'value1',
    selected: false,
    label: 'label1',
  });
  await options.insertAsync({
    optgroup: optgroup1,
    value: 'value2',
    selected: true,
    label: 'label2',
  });
  test.equal(divContent(), [
    '<select>',
    '<optgroup label="one">',
    '<option value="value1">label1</option>',
    '<option value="value2">label2</option>',
    '</optgroup>',
    '<optgroup label="two">',
    '</optgroup>',
    '</select>',
  ]);
  test.equal(selectEl.value, 'value2');
  test.equal(selectEl.querySelectorAll('option')[0].selected, false);
  test.equal(selectEl.querySelectorAll('option')[1].selected, true);

  // swap selection
  await options.updateAsync({ value: 'value2' }, { $set: { selected: false } });
  await options.updateAsync({ value: 'value1' }, { $set: { selected: true } });
  Tracker.flush();

  test.equal(divContent(), [
    '<select>',
    '<optgroup label="one">',
    '<option value="value1">label1</option>',
    '<option value="value2">label2</option>',
    '</optgroup>',
    '<optgroup label="two">',
    '</optgroup>',
    '</select>',
  ]);
  test.equal(selectEl.value, 'value1');
  test.equal(selectEl.querySelectorAll('option')[0].selected, true);
  test.equal(selectEl.querySelectorAll('option')[1].selected, false);

  // change value and label
  await options.updateAsync({ value: 'value1' }, { $set: { value: 'value1.0' } });
  await options.updateAsync({ value: 'value2' }, { $set: { label: 'label2.0' } });
  Tracker.flush();

  test.equal(divContent(), [
    '<select>',
    '<optgroup label="one">',
    '<option value="value1.0">label1</option>',
    '<option value="value2">label2.0</option>',
    '</optgroup>',
    '<optgroup label="two">',
    '</optgroup>',
    '</select>',
  ]);
  test.equal(selectEl.value, 'value1.0');
  test.equal(selectEl.querySelectorAll('option')[0].selected, true);
  test.equal(selectEl.querySelectorAll('option')[1].selected, false);

  // unselect and then select both options. normally, the second is
  // selected (since it got selected later). then switch to <select
  // multiple="">. both should be selected.
  await options.updateAsync({}, { $set: { selected: false } }, { multi: true });
  Tracker.flush();
  await options.updateAsync({}, { $set: { selected: true } }, { multi: true });
  Tracker.flush();
  test.equal(selectEl.querySelectorAll('option')[0].selected, false);
  test.equal(selectEl.querySelectorAll('option')[1].selected, true);

  selectEl.multiple = true; // allow multiple selection
  await options.updateAsync({}, { $set: { selected: false } }, { multi: true });
  Tracker.flush();
  await options.updateAsync({}, { $set: { selected: true } }, { multi: true });
  Tracker.flush();
  test.equal(selectEl.querySelectorAll('option')[0].selected, true);
  test.equal(selectEl.querySelectorAll('option')[1].selected, true);
});

Tinytest.add(
  'spacebars-tests - template_tests - {{#with}} falsy; issue #770',
  function (test) {
    Template.test_template_issue770.helpers({
      value1: function () {
        return 'abc';
      },
      value2: function () {
        return false;
      },
    });
    const div = renderToDiv(Template.test_template_issue770);
    test.equal(canonicalizeHtml(div.innerHTML), 'abc xxx abc');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - tricky attrs',
  function (test) {
    const tmpl = Template.spacebars_template_test_tricky_attrs;
    const R = ReactiveVar('foo');
    tmpl.helpers({
      theType: function () {
        return 'text';
      },
      theClass: function () {
        return R.get();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(
      canonicalizeHtml(div.innerHTML).slice(0, 30),
      '<input type="text"><input class="foo" type="checkbox">'.slice(0, 30)
    );

    R.set('bar');
    Tracker.flush();
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<input type="text"><input class="bar" type="checkbox">'
    );
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - no data context',
  function (test) {
    const tmpl = Template.spacebars_template_test_no_data;

    // failure is if an exception is thrown here
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'asdf');
  }
);

Tinytest.add('spacebars-tests - template_tests - textarea', function (test) {
  const tmpl = Template.spacebars_template_test_textarea;

  const R = ReactiveVar('hello');

  tmpl.helpers({
    foo: function () {
      return R.get();
    },
  });

  const div = renderToDiv(tmpl);
  const textarea = div.querySelector('textarea');
  test.equal(textarea.value, 'hello');

  R.set('world');
  Tracker.flush();
  test.equal(textarea.value, 'world');
});

Tinytest.add('spacebars-tests - template_tests - textarea 2', function (test) {
  const tmpl = Template.spacebars_template_test_textarea2;

  const R = ReactiveVar(true);

  tmpl.helpers({
    foo: function () {
      return R.get();
    },
  });

  const div = renderToDiv(tmpl);
  const textarea = div.querySelector('textarea');
  test.equal(textarea.value, '</not a tag>');

  R.set(false);
  Tracker.flush();
  test.equal(textarea.value, '<also not a tag>');

  R.set(true);
  Tracker.flush();
  test.equal(textarea.value, '</not a tag>');
});

Tinytest.add('spacebars-tests - template_tests - textarea 3', function (test) {
  const tmpl = Template.spacebars_template_test_textarea3;

  const R = ReactiveVar('hello');

  tmpl.helpers({
    foo: function () {
      return R.get();
    },
  });

  const div = renderToDiv(tmpl);
  const textarea = div.querySelector('textarea');
  test.equal(textarea.id, 'myTextarea');
  test.equal(textarea.value, 'hello');

  R.set('world');
  Tracker.flush();
  test.equal(textarea.value, 'world');
});

Tinytest.add(
  'spacebars-tests - template_tests - textarea each',
  function (test) {
    const tmpl = Template.spacebars_template_test_textarea_each;

    const R = ReactiveVar(['APPLE', 'BANANA']);

    tmpl.helpers({
      foo: function () {
        return R.get();
      },
    });

    const div = renderToDiv(tmpl);
    const textarea = div.querySelector('textarea');
    test.equal(textarea.value, '<not a tag APPLE <not a tag BANANA ');

    R.set([]);
    Tracker.flush();
    test.equal(textarea.value, '<>');

    R.set(['CUCUMBER']);
    Tracker.flush();
    test.equal(textarea.value, '<not a tag CUCUMBER ');
  }
);

// Ensure that one can call `Meteor.defer` within a rendered callback
// triggered by a document insertion that happend in a method stub.
//
// Why do we have this test? Because you generally can't call
// `Meteor.defer` inside a method stub (see
// packages/meteor/timers.js).  This test verifies that rendered
// callbacks don't fire synchronously as part of a method stub.
testAsyncMulti(
  'spacebars-tests - template_tests - defer in rendered callbacks',
  [
    function (test, expect) {
      const tmpl = Template.spacebars_template_test_defer_in_rendered;
      const coll = new Mongo.Collection(null);

      Meteor.methods({
        spacebarsTestInsertEmptyObject: function () {
          // cause a new instance of `subtmpl` to be placed in the
          // DOM. verify that it's not fired directly within a method
          // stub, in which `Meteor.defer` is not allowed.
          coll.insert({});
        },
      });

      tmpl.helpers({
        items: function () {
          return coll.find();
        },
      });

      const subtmpl =
        Template.spacebars_template_test_defer_in_rendered_subtemplate;

      subtmpl.rendered = expect(function () {
        // will throw if called in a method stub
        Meteor.defer(function () {});
      });

      const div = renderToDiv(tmpl);

      // not defined on the server, but it's fine since the stub does
      // the relevant work
      Meteor._suppress_log(1);
      Meteor.call('spacebarsTestInsertEmptyObject');
    },
  ]
);

testAsyncMulti(
  'spacebars-tests - template_tests - rendered template is DOM in rendered callbacks',
  [
    function (test, expect) {
      const tmpl = Template.spacebars_template_test_aaa;
      tmpl.rendered = expect(function () {
        test.equal(canonicalizeHtml(div.innerHTML), 'aaa');
      });
      const div = renderToDiv(tmpl);
      Tracker.flush();
    },
  ]
);

// Test that in:
//
// ```
// {{#with someData}}
//   {{foo}} {{bar}}
// {{/with}}
// ```
//
// ... we run `someData` once even if `foo` re-renders.
Tinytest.add(
  'spacebars-tests - template_tests - with someData',
  function (test) {
    const tmpl = Template.spacebars_template_test_with_someData;

    const foo = ReactiveVar('AAA');
    let someDataRuns = 0;

    tmpl.helpers({
      someData: function () {
        someDataRuns++;
        return {};
      },
      foo: function () {
        return foo.get();
      },
      bar: function () {
        return 'YO';
      },
    });

    const div = renderToDiv(tmpl);

    test.equal(someDataRuns, 1);
    test.equal(canonicalizeHtml(div.innerHTML), 'AAA YO');

    foo.set('BBB');
    Tracker.flush();
    test.equal(someDataRuns, 1);
    test.equal(canonicalizeHtml(div.innerHTML), 'BBB YO');

    foo.set('CCC');
    Tracker.flush();
    test.equal(someDataRuns, 1);
    test.equal(canonicalizeHtml(div.innerHTML), 'CCC YO');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - #each stops when rendered element is removed',
  function (test) {
    const tmpl = Template.spacebars_template_test_each_stops;
    const coll = new Mongo.Collection(null);
    coll.insert({});
    tmpl.helpers({
      items: function () {
        return coll.find();
      },
    });

    const div = renderToDiv(tmpl);
    divRendersTo(test, div, 'x');

    // trigger #each component destroyed
    if (hasJquery) { $(div).remove() } else { div.remove() }

    // insert another document. cursor should no longer be observed so
    // should have no effect.
    coll.insert({});
    divRendersTo(test, div, 'x');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - block helpers in attribute',
  function (test) {
    const tmpl = Template.spacebars_template_test_block_helpers_in_attribute;

    const coll = new Mongo.Collection(null);
    tmpl.helpers({
      classes: function () {
        return coll.find({}, { sort: { name: 1 } });
      },
      startsLowerCase: function (name) {
        return /^[a-z]/.test(name);
      },
    });
    coll.insert({ name: 'David' });
    coll.insert({ name: 'noodle' });
    coll.insert({ name: 'donut' });
    coll.insert({ name: 'frankfurter' });
    coll.insert({ name: 'Steve' });

    const containerDiv = renderToDiv(tmpl);
    const div = containerDiv.querySelector('div');

    const shouldBe = function (className) {
      Tracker.flush();
      test.equal(div.innerHTML, 'Smurf');
      test.equal(div.className, className);
      let result = canonicalizeHtml(containerDiv.innerHTML);
      if (result === '<div>Smurf</div>') result = '<div class="">Smurf</div>'; // e.g. IE 9 and 10
      test.equal(result, '<div class="' + className + '">Smurf</div>');
    };

    shouldBe('donut frankfurter noodle');
    coll.remove({ name: 'frankfurter' }); // (it was kind of a mouthful)
    shouldBe('donut noodle');
    coll.remove({ name: 'donut' });
    shouldBe('noodle');
    coll.remove({ name: 'noodle' });
    shouldBe(''); // 'David' and 'Steve' appear in the #each but fail the #if
    coll.remove({});
    shouldBe('none'); // now the `{{else}}` case kicks in
    coll.insert({ name: 'bubblegum' });
    shouldBe('bubblegum');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - block helpers in attribute 2',
  function (test) {
    const tmpl = Template.spacebars_template_test_block_helpers_in_attribute_2;

    const R = ReactiveVar(true);

    tmpl.helpers({
      foo: function () {
        return R.get();
      },
    });

    const div = renderToDiv(tmpl);
    const input = div.querySelector('input');

    test.equal(input.value, '"');
    R.set(false);
    Tracker.flush();
    test.equal(input.value, '&<></x>');
  }
);

// Test that if the argument to #each is a constant, it doesn't establish a
// dependency on the data context, so when the context changes, items of
// the #each are not "changed" and helpers do not rerun.
Tinytest.add(
  'spacebars-tests - template_tests - constant #each argument',
  function (test) {
    const tmpl = Template.spacebars_template_test_constant_each_argument;

    let justReturnRuns = 0; // how many times `justReturn` is called
    const R = ReactiveVar(1);

    tmpl.helpers({
      someData: function () {
        return R.get();
      },
      anArray: ['foo', 'bar'],
      justReturn: function (x) {
        justReturnRuns++;
        return String(x);
      },
    });

    const div = renderToDiv(tmpl);

    test.equal(justReturnRuns, 2);
    test.equal(
      canonicalizeHtml(div.innerHTML).replace(/\s+/g, ' '),
      'foo bar 1'
    );

    R.set(2);
    Tracker.flush();

    test.equal(justReturnRuns, 2); // still 2, no new runs!
    test.equal(
      canonicalizeHtml(div.innerHTML).replace(/\s+/g, ' '),
      'foo bar 2'
    );
  }
);

Tinytest.addAsync(
  'spacebars-tests - template_tests - #markdown - basic',
  function (test, onComplete) {
    const tmpl = Template.spacebars_template_test_markdown_basic;
    tmpl.helpers({
      obj: { snippet: '<i>hi</i>' },
      hi: function () {
        return this.snippet;
      },
    });
    const div = renderToDiv(tmpl);

    Meteor.call('getAsset', 'markdown_basic.html', function (err, html) {
      test.isFalse(err);
      test.equal(canonicalizeHtml(div.innerHTML), canonicalizeHtml(html));
      onComplete();
    });
  }
);

testAsyncMulti('spacebars-tests - template_tests - #markdown - if', [
  function (test, expect) {
    const self = this;
    Meteor.call(
      'getAsset',
      'markdown_if1.html',
      expect(function (err, html) {
        test.isFalse(err);
        self.html1 = html;
      })
    );
    Meteor.call(
      'getAsset',
      'markdown_if2.html',
      expect(function (err, html) {
        test.isFalse(err);
        self.html2 = html;
      })
    );
  },

  function (test, expect) {
    const self = this;
    const tmpl = Template.spacebars_template_test_markdown_if;
    const R = new ReactiveVar(false);
    tmpl.helpers({
      cond: function () {
        return R.get();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), canonicalizeHtml(self.html1));
    R.set(true);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), canonicalizeHtml(self.html2));
  },
]);

testAsyncMulti('spacebars-tests - template_tests - #markdown - each', [
  function (test, expect) {
    const self = this;
    Meteor.call(
      'getAsset',
      'markdown_each1.html',
      expect(function (err, html) {
        test.isFalse(err);
        self.html1 = html;
      })
    );
    Meteor.call(
      'getAsset',
      'markdown_each2.html',
      expect(function (err, html) {
        test.isFalse(err);
        self.html2 = html;
      })
    );
  },

  function (test, expect) {
    const self = this;
    const tmpl = Template.spacebars_template_test_markdown_each;
    const R = new ReactiveVar([]);
    tmpl.helpers({
      seq: function () {
        return R.get();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), canonicalizeHtml(self.html1));

    R.set(['item']);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), canonicalizeHtml(self.html2));
  },
]);

Tinytest.add(
  'spacebars-tests - template_tests - #markdown - inclusion',
  function (test) {
    const tmpl = Template.spacebars_template_test_markdown_inclusion;
    const subtmpl = Template.spacebars_template_test_markdown_inclusion_subtmpl;
    subtmpl.helpers({ foo: 'bar' });
    const div = renderToDiv(tmpl);
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<p><span>Foo is bar.</span></p>'
    );
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - #markdown - block helpers',
  function (test) {
    const tmpl = Template.spacebars_template_test_markdown_block_helpers;
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '<p>Hi there!</p>');
  }
);

// Test that when a simple helper re-runs due to a dependency changing
// but the return value is the same, the DOM text node is not
// re-rendered.
Tinytest.add(
  'spacebars-tests - template_tests - simple helpers are isolated',
  function (test) {
    const runs = [
      {
        helper: function () {
          return 'foo';
        },
        nodeValue: 'foo',
      },
      {
        helper: function () {
          return new Spacebars.SafeString('bar');
        },
        nodeValue: 'bar',
      },
    ];

    runs.forEach(function (run) {
      const tmpl = Template.spacebars_template_test_simple_helpers_are_isolated;
      const dep = new Tracker.Dependency();
      tmpl.helpers({
        foo: function () {
          dep.depend();
          return run.helper();
        },
      });
      const div = renderToDiv(tmpl);
      const fooTextNode = Array.from(div.childNodes).find(function (node) {
        return node.nodeValue === run.nodeValue;
      });

      test.isTrue(fooTextNode);

      dep.changed();
      Tracker.flush();
      const newFooTextNode = Array.from(div.childNodes).find(function (node) {
        return node.nodeValue === run.nodeValue;
      });

      test.equal(fooTextNode, newFooTextNode);
    });
  }
);

// Test that when a helper in an element attribute re-runs due to a
// dependency changing but the return value is the same, the attribute
// value is not set.
Tinytest.add(
  'spacebars-tests - template_tests - attribute helpers are isolated',
  function (test) {
    const tmpl = Template.spacebars_template_test_attr_helpers_are_isolated;
    const dep = new Tracker.Dependency();
    tmpl.helpers({
      foo: function () {
        dep.depend();
        return 'foo';
      },
    });
    const div = renderToDiv(tmpl);
    const pElement = div.querySelector('p');

    test.equal(pElement.getAttribute('attr'), 'foo');

    // set the attribute to something else, afterwards check that it
    // hasn't been updated back to the correct value.
    pElement.setAttribute('attr', 'not-foo');
    dep.changed();
    Tracker.flush();
    test.equal(pElement.getAttribute('attr'), 'not-foo');
  }
);

// A helper can return an object with a set of element attributes via
// `<p {{attrs}}>`. When it re-runs due to a dependency changing the
// value for a given attribute might stay the same. Test that the
// attribute is not set on the DOM element.
Tinytest.add(
  'spacebars-tests - template_tests - attribute object helpers are isolated',
  function (test) {
    const tmpl =
      Template.spacebars_template_test_attr_object_helpers_are_isolated;
    const dep = new Tracker.Dependency();
    tmpl.helpers({
      attrs: function () {
        dep.depend();
        return { foo: 'bar' };
      },
    });
    const div = renderToDiv(tmpl);
    const pElement = div.querySelector('p');

    test.equal(pElement.getAttribute('foo'), 'bar');

    // set the attribute to something else, afterwards check that it
    // hasn't been updated back to the correct value.
    pElement.setAttribute('foo', 'not-bar');
    dep.changed();
    Tracker.flush();
    test.equal(pElement.getAttribute('foo'), 'not-bar');
  }
);

// The attribute object could be disabled or null, which
// should be handled, as if an empty object is passed
Tinytest.add(
  'spacebars-tests - template_tests - attribute object helpers are disabled',
  function (test) {
    const tmpl =
      Template.spacebars_template_test_attr_object_helpers_are_disabled;
    tmpl.helpers({
      disabled: function () {
        return undefined;
      },
    });

    // should not throw
    const div = renderToDiv(tmpl);

    // button should not be affected
    const pElement = div.querySelector('button');
    test.equal(pElement.getAttribute('title'), null);
    const text = pElement.firstChild.textContent;
    test.equal(text, 'test');
  }
);

// The attribute object could be disabled or null, which
// should be handled, as if an empty object is passed
Tinytest.add(
  'spacebars-tests - template_tests - attribute object helpers are disabled should not affect existing atts',
  function (test) {
    const tmpl =
      Template.spacebars_template_test_attr_object_helpers_are_disabled2;
    tmpl.helpers({
      disabled: function () {
        return undefined;
      },
    });

    // should not throw
    const div = renderToDiv(tmpl);

    // existing atts should not be affected
    const pElement = div.querySelector('button');
    test.equal(pElement.getAttribute('title'), 'foo');
    const text = pElement.firstChild.textContent
    test.equal(text, 'test');
  }
);

// Test that when a helper in an inclusion directive (`{{> foo }}`)
// re-runs due to a dependency changing but the return value is the
// same, the template is not re-rendered.
//
// Also, verify that an error is thrown if the return value from such
// a helper is not a component.
Tinytest.add(
  'spacebars-tests - template_tests - inclusion helpers are isolated',
  function (test) {
    const tmpl = Template.spacebars_template_test_inclusion_helpers_are_isolated;
    const dep = new Tracker.Dependency();
    const subtmpl =
      Template.spacebars_template_test_inclusion_helpers_are_isolated_subtemplate;
    // make a copy so we can set "rendered" without mutating the original
    const subtmplCopy = copyTemplate(subtmpl);

    const R = new ReactiveVar(subtmplCopy);
    tmpl.helpers({
      foo: function () {
        dep.depend();
        return R.get();
      },
    });

    const div = renderToDiv(tmpl);
    subtmplCopy.rendered = function () {
      test.fail("shouldn't re-render when same value returned from helper");
    };
    subtmplCopy.onRendered(function () {
      test.fail("shouldn't re-render when same value returned from helper");
    });

    dep.changed();
    Tracker.flush({ _throwFirstError: true }); // `subtmplCopy.rendered` not called

    R.set(null);
    Tracker.flush({ _throwFirstError: true }); // no error thrown

    R.set('neither a component nor null');

    test.throws(function () {
      Tracker.flush({ _throwFirstError: true });
    }, /Expected template or null/);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - nully attributes',
  function (test) {
    const tmpls = {
      0: Template.spacebars_template_test_nully_attributes0,
      1: Template.spacebars_template_test_nully_attributes1,
      2: Template.spacebars_template_test_nully_attributes2,
      3: Template.spacebars_template_test_nully_attributes3,
    };

    const run = function (whichTemplate, data, expectTrue) {
      const div = renderToDiv(tmpls[whichTemplate], data);
      const input = div.querySelector('input');
      const descr = JSON.stringify([whichTemplate, data, expectTrue]);
      if (expectTrue) {
        test.isTrue(input.checked, descr);
        test.equal(typeof input.getAttribute('stuff'), 'string', descr);
      } else {
        test.isFalse(input.checked);
        test.equal(JSON.stringify(input.getAttribute('stuff')), 'null', descr);
      }

      const html = Blaze.toHTML(
        Blaze.With(data, function () {
          return tmpls[whichTemplate];
        })
      );

      test.equal(/ checked="[^"]*"/.test(html), !!expectTrue);
      test.equal(/ stuff="[^"]*"/.test(html), !!expectTrue);
    };

    run(0, {}, true);

    const truthies = [true, ''];
    const falsies = [false, null, undefined];

    truthies.forEach(function (x) {
      run(1, { foo: x }, true);
    });
    falsies.forEach(function (x) {
      run(1, { foo: x }, false);
    });

    truthies.forEach(function (x) {
      truthies.forEach(function (y) {
        run(2, { foo: x, bar: y }, true);
      });
      falsies.forEach(function (y) {
        run(2, { foo: x, bar: y }, true);
      });
    });
    falsies.forEach(function (x) {
      truthies.forEach(function (y) {
        run(2, { foo: x, bar: y }, true);
      });
      falsies.forEach(function (y) {
        run(2, { foo: x, bar: y }, false);
      });
    });

    run(3, { foo: true }, false);
    run(3, { foo: false }, false);
  }
);

Tinytest.add('spacebars-tests - template_tests - double', function (test) {
  const tmpl = Template.spacebars_template_test_double;

  const run = function (foo, expectedResult) {
    tmpl.helpers({ foo: foo });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), expectedResult);
  };

  run('asdf', 'asdf');
  run(1.23, '1.23');
  run(0, '0');
  run(true, 'true');
  run(false, '');
  run(null, '');
  run(undefined, '');
});

Tinytest.add(
  'spacebars-tests - template_tests - inclusion lookup order',
  function (test) {
    // test that {{> foo}} looks for a helper named 'foo', then a
    // template named 'foo', then a 'foo' field in the data context.
    const tmpl = Template.spacebars_template_test_inclusion_lookup;
    const tmplData = function () {
      return {
        // shouldn't have an effect since we define a helper with the
        // same name.
        spacebars_template_test_inclusion_lookup_subtmpl:
          Template.spacebars_template_test_inclusion_lookup_subtmpl3,
        dataContextSubtmpl:
          Template.spacebars_template_test_inclusion_lookup_subtmpl3,
      };
    };

    tmpl.helpers({
      spacebars_template_test_inclusion_lookup_subtmpl:
        Template.spacebars_template_test_inclusion_lookup_subtmpl2,
    });

    test.equal(
      canonicalizeHtml(renderToDiv(tmpl, tmplData).innerHTML),
      [
        'This is generated by a helper with the same name.',
        'This is a template passed in the data context.',
      ].join(' ')
    );
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - content context',
  function (test) {
    const tmpl = Template.spacebars_template_test_content_context;
    const R = ReactiveVar(true);
    tmpl.helpers({
      foo: {
        firstLetter: 'F',
        secondLetter: 'O',
        bar: {
          cond: function () {
            return R.get();
          },
          firstLetter: 'B',
          secondLetter: 'A',
        },
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'BO');
    R.set(false);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'FA');
  }
);

[
  'textarea',
  'text',
  'password',
  'submit',
  'button',
  'reset',
  'select',
  'hidden',
].forEach(function (type) {
  Tinytest.add(
    'spacebars-tests - template_tests - controls - ' + type,
    function (test) {
      const R = ReactiveVar({ x: 'test' });
      const R2 = ReactiveVar('');
      let tmpl;

      if (type === 'select') {
        tmpl = Template.spacebars_test_control_select;
        tmpl.helpers({
          options: [
            'This is a test',
            'This is a fridge',
            'This is a frog',
            'This is a new frog',
            'foobar',
            'This is a photograph',
            'This is a monkey',
            'This is a donkey',
          ],
          selected: function () {
            R2.get(); // Re-render when R2 is changed, even though it
            // doesn't affect HTML.
            return 'This is a ' + R.get().x === this.toString();
          },
        });
      } else if (type === 'textarea') {
        tmpl = Template.spacebars_test_control_textarea;
        tmpl.helpers({
          value: function () {
            R2.get(); // Re-render when R2 is changed, even though it
            // doesn't affect HTML.
            return 'This is a ' + R.get().x;
          },
        });
      } else {
        tmpl = Template.spacebars_test_control_input;
        tmpl.helpers({
          value: function () {
            R2.get(); // Re-render when R2 is changed, even though it
            // doesn't affect HTML.
            return 'This is a ' + R.get().x;
          },
          type: type,
        });
      }

      const div = renderToDiv(tmpl);
      document.body.appendChild(div);
      const canFocus = type !== 'hidden';

      // find first element child, ignoring any marker nodes
      let input = div.firstChild;
      while (input.nodeType !== 1) input = input.nextSibling;

      if (type === 'textarea' || type === 'select') {
        test.equal(input.nodeName, type.toUpperCase());
      } else {
        test.equal(input.nodeName, 'INPUT');
        test.equal(input.type, type);
      }
      test.equal(DomUtils.getElementValue(input), 'This is a test');

      // value updates reactively
      R.set({ x: 'fridge' });
      Tracker.flush();
      test.equal(DomUtils.getElementValue(input), 'This is a fridge');

      if (canFocus) {
        // ...if focused, it still updates but focus isn't lost.
        focusElement(input);
        DomUtils.setElementValue(input, 'something else');
        R.set({ x: 'frog' });

        Tracker.flush();
        test.equal(DomUtils.getElementValue(input), 'This is a frog');
        test.equal(document.activeElement, input);
      }

      // Setting a value (similar to user typing) should prevent value from being
      // reverted if the div is re-rendered but the rendered value (ie, R) does
      // not change.
      DomUtils.setElementValue(input, 'foobar');
      R2.set('change');
      Tracker.flush();
      test.equal(DomUtils.getElementValue(input), 'foobar');

      // ... but if the actual rendered value changes, that should take effect.
      R.set({ x: 'photograph' });
      Tracker.flush();
      test.equal(DomUtils.getElementValue(input), 'This is a photograph');

      document.body.removeChild(div);
    }
  );
});

Tinytest.add('spacebars-tests - template_tests - radio', function (test) {
  const R = ReactiveVar('');
  const R2 = ReactiveVar('');
  const change_buf = [];
  const tmpl = Template.spacebars_test_control_radio;
  tmpl.helpers({
    bands: ['AM', 'FM', 'XM'],
    isChecked: function () {
      return R.get() === this.toString();
    },
    band: function () {
      return R.get();
    },
  });
  tmpl.events({
    'change input': function (event) {
      const btn = event.target;
      const band = btn.value;
      change_buf.push(band);
      R.set(band);
    },
  });

  const div = renderToDiv(tmpl);
  document.body.appendChild(div);

  // get the three buttons; they should not change identities!
  const btns = nodesToArray(div.getElementsByTagName('INPUT'));
  const text = function () {
    const text = div.innerText || div.textContent;
    return text.replace(/[ \n\r]+/g, ' ').replace(/^\s+|\s+$/g, '');
  };

  test.equal(
    btns.map((x) => x.checked),
    [false, false, false]
  );
  test.equal(text(), 'Band:');

  clickIt(btns[0]);
  test.equal(change_buf, ['AM']);
  change_buf.length = 0;
  Tracker.flush();
  test.equal(
    btns.map((x) => x.checked),
    [true, false, false]
  );
  test.equal(text(), 'Band: AM');

  R2.set('change');
  Tracker.flush();
  test.length(change_buf, 0);
  test.equal(
    btns.map((x) => x.checked),
    [true, false, false]
  );
  test.equal(text(), 'Band: AM');

  clickIt(btns[1]);
  test.equal(change_buf, ['FM']);
  change_buf.length = 0;
  Tracker.flush();
  test.equal(
    btns.map((x) => x.checked),
    [false, true, false]
  );
  test.equal(text(), 'Band: FM');

  clickIt(btns[2]);
  test.equal(change_buf, ['XM']);
  change_buf.length = 0;
  Tracker.flush();
  test.equal(
    btns.map((x) => x.checked),
    [false, false, true]
  );
  test.equal(text(), 'Band: XM');

  clickIt(btns[1]);
  test.equal(change_buf, ['FM']);
  change_buf.length = 0;
  Tracker.flush();
  test.equal(
    btns.map((x) => x.checked),
    [false, true, false]
  );
  test.equal(text(), 'Band: FM');

  document.body.removeChild(div);
});

Tinytest.add('spacebars-tests - template_tests - checkbox', function (test) {
  const tmpl = Template.spacebars_test_control_checkbox;
  const labels = ['Foo', 'Bar', 'Baz'];
  const Rs = {};
  labels.forEach(function (label) {
    Rs[label] = ReactiveVar(false);
  });
  tmpl.helpers({
    labels: labels,
    isChecked: function () {
      return Rs[this.toString()].get();
    },
  });

  const div = renderToDiv(tmpl);
  document.body.appendChild(div);

  const boxes = nodesToArray(div.getElementsByTagName('INPUT'));

  test.equal(
    boxes.map((x) => x.checked),
    [false, false, false]
  );

  // Re-render with first one checked.
  Rs.Foo.set(true);
  Tracker.flush();
  test.equal(
    boxes.map((x) => x.checked),
    [true, false, false]
  );

  // Re-render with first one unchecked again.
  Rs.Foo.set(false);
  Tracker.flush();
  test.equal(
    boxes.map((x) => x.checked),
    [false, false, false]
  );

  // User clicks the second one.
  clickElement(boxes[1]);
  test.equal(
    boxes.map((x) => x.checked),
    [false, true, false]
  );
  Tracker.flush();
  test.equal(
    boxes.map((x) => x.checked),
    [false, true, false]
  );

  // Re-render with third one checked. Second one should stay checked because
  // it's a user update!
  Rs.Baz.set(true);
  Tracker.flush();
  test.equal(
    boxes.map((x) => x.checked),
    [false, true, true]
  );

  // User turns second and third off.
  clickElement(boxes[1]);
  clickElement(boxes[2]);
  test.equal(
    boxes.map((x) => x.checked),
    [false, false, false]
  );
  Tracker.flush();
  test.equal(
    boxes.map((x) => x.checked),
    [false, false, false]
  );

  // Re-render with first one checked. Third should stay off because it's a user
  // update!
  Rs.Foo.set(true);
  Tracker.flush();
  test.equal(
    boxes.map((x) => x.checked),
    [true, false, false]
  );

  // Re-render with first one unchecked. Third should still stay off.
  Rs.Foo.set(false);
  Tracker.flush();
  test.equal(
    boxes.map((x) => x.checked),
    [false, false, false]
  );

  document.body.removeChild(div);
});

Tinytest.add('spacebars-tests - template_tests - attributes', function (test) {
  const tmpl = Template.spacebars_test_attributes;
  const isReadonly = ReactiveVar(false);
  const isDisabled = ReactiveVar(false);
  const isChecked = ReactiveVar(false);
  const nameValue = ReactiveVar('bar');
  const attrs = ReactiveVar({});
  tmpl.helpers({
    isReadonly: function () {
      return isReadonly.get();
    },
    isChecked: function () {
      return isChecked.get();
    },
    attrs: function () {
      return attrs.get();
    },
    isDisabled: function () {
      return isDisabled.get();
    },
    nameValue: function () {
      return nameValue.get();
    },
  });

  const div = renderToDiv(tmpl);
  document.body.appendChild(div);

  const buttons = nodesToArray(div.getElementsByTagName('INPUT'));

  test.equal(buttons.map(x => x.readOnly), [false, false, true]);

  isReadonly.set(true);
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [true, false, true]);

  isReadonly.set(false);
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [false, false, true]);

  isReadonly.set('readonly');
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [true, false, true]);

  isReadonly.set(null);
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [false, false, true]);

  nameValue.set('foo');
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [false, false, true]);

  test.equal(buttons.map(x => x.disabled), [false, false, false]);

  isDisabled.set(true);
  Tracker.flush();
  test.equal(buttons.map(x => x.disabled), [false, true, false]);

  isDisabled.set(false);
  Tracker.flush();
  test.equal(buttons.map(x => x.disabled), [false, false, false]);

  isDisabled.set('disabled');
  Tracker.flush();
  test.equal(buttons.map(x => x.disabled), [false, true, false]);

  isDisabled.set(null);
  Tracker.flush();
  test.equal(buttons.map(x => x.disabled), [false, false, false]);

  test.equal(buttons.map(x => x.checked), [false, false, false]);

  isChecked.set(true);
  Tracker.flush();
  test.equal(buttons.map(x => x.checked), [true, false, false]);

  isChecked.set(false);
  Tracker.flush();
  test.equal(buttons.map(x => x.checked), [false, false, false]);

  isChecked.set('checked');
  Tracker.flush();
  test.equal(buttons.map(x => x.checked), [true, false, false]);

  isChecked.set(null);
  Tracker.flush();
  test.equal(buttons.map(x => x.checked), [false, false, false]);

  attrs.set({ disabled: true, checked: true, readonly: true });
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [false, true, true]);
  test.equal(buttons.map(x => x.disabled), [false, true, false]);
  test.equal(buttons.map(x => x.checked), [false, true, false]);

  attrs.set({ disabled: false, checked: false, readonly: false });
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [false, false, true]);
  test.equal(buttons.map(x => x.disabled), [false, false, false]);
  test.equal(buttons.map(x => x.checked), [false, false, false]);

  attrs.set({ disabled: 'disabled', checked: 'checked', readonly: 'readonly' });
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [false, true, true]);
  test.equal(buttons.map(x => x.disabled), [false, true, false]);
  test.equal(buttons.map(x => x.checked), [false, true, false]);

  attrs.set({ disabled: null, checked: null, readonly: null });
  Tracker.flush();
  test.equal(buttons.map(x => x.readOnly), [false, false, true]);
  test.equal(buttons.map(x => x.disabled), [false, false, false]);
  test.equal(buttons.map(x => x.checked), [false, false, false]);

  document.body.removeChild(div);
});

Tinytest.add(
  'spacebars-tests - template_tests - unfound template',
  function (test) {
    test.throws(function () {
      renderToDiv(Template.spacebars_test_nonexistent_template);
    }, /No such template/);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - helper passed to #if called exactly once when invalidated',
  function (test) {
    const tmpl = Template.spacebars_test_if_helper;

    let foo;
    let count = 0;
    const d = new Tracker.Dependency();
    tmpl.helpers({
      foo: function () {
        d.depend();
        count++;
        return foo;
      },
    });

    foo = false;
    const div = renderToDiv(tmpl);
    divRendersTo(test, div, 'false');
    test.equal(count, 1);

    foo = true;
    d.changed();
    divRendersTo(test, div, 'true');
    test.equal(count, 2);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - custom block helper functions called exactly once when invalidated',
  function (test) {
    const tmpl = Template.spacebars_test_block_helper_function;

    let foo;
    let count = 0;
    const d = new Tracker.Dependency();
    tmpl.helpers({
      foo: function () {
        d.depend();
        count++;
        return Template.spacebars_template_test_aaa;
      },
    });

    foo = false;
    renderToDiv(tmpl);
    Tracker.flush();
    test.equal(count, 1);

    foo = true;
    d.changed();
    Tracker.flush();
    test.equal(count, 2);
  }
);

const runOneTwoTest = function (test, subTemplateName, optionsData) {
  [
    Template.spacebars_test_helpers_stop_onetwo,
    Template.spacebars_test_helpers_stop_onetwo_attribute,
  ].forEach(function (tmpl) {
    const sub1 = Template[subTemplateName + '1'];
    const sub2 = Template[subTemplateName + '2'];

    tmpl.helpers({
      one: sub1,
      two: sub2,
    });

    let buf = '';

    const showOne = ReactiveVar(true);
    const dummy = ReactiveVar(0);

    tmpl.helpers({
      showOne: function () {
        return showOne.get();
      },
    });
    sub1.helpers({
      options: function () {
        const x = dummy.get();
        buf += '1';
        if (optionsData) return optionsData[x];
        else return ['something'];
      },
    });
    sub2.helpers({
      options: function () {
        const x = dummy.get();
        buf += '2';
        if (optionsData) return optionsData[x];
        else return ['something'];
      },
    });

    const div = renderToDiv(tmpl);
    Tracker.flush();
    test.equal(buf, '1');

    showOne.set(false);
    dummy.set(1);
    Tracker.flush();
    test.equal(buf, '12');

    showOne.set(true);
    dummy.set(2);
    Tracker.flush();
    test.equal(buf, '121');

    // clean up the div
    if (hasJquery) { $(div).remove() } else { div.remove() }
    test.equal(showOne._numListeners(), 0);
    test.equal(dummy._numListeners(), 0);
  });
};

Tinytest.add(
  'spacebars-tests - template_tests - with stops without re-running helper',
  function (test) {
    runOneTwoTest(test, 'spacebars_test_helpers_stop_with');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - each stops without re-running helper',
  function (test) {
    runOneTwoTest(test, 'spacebars_test_helpers_stop_each');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - each inside with stops without re-running helper',
  function (test) {
    runOneTwoTest(test, 'spacebars_test_helpers_stop_with_each');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - if stops without re-running helper',
  function (test) {
    runOneTwoTest(test, 'spacebars_test_helpers_stop_if', ['a', 'b', 'a']);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - unless stops without re-running helper',
  function (test) {
    runOneTwoTest(test, 'spacebars_test_helpers_stop_unless', ['a', 'b', 'a']);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - inclusion stops without re-running function',
  function (test) {
    const t = Template.spacebars_test_helpers_stop_inclusion3;
    runOneTwoTest(test, 'spacebars_test_helpers_stop_inclusion', [t, t, t]);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - template with callbacks inside with stops without recalculating data',
  function (test) {
    const tmpl = Template.spacebars_test_helpers_stop_with_callbacks3;
    tmpl.created = function () {};
    tmpl.rendered = function () {};
    tmpl.destroyed = function () {};
    runOneTwoTest(test, 'spacebars_test_helpers_stop_with_callbacks');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - no data context is seen as an empty object',
  function (test) {
    const tmpl = Template.spacebars_test_no_data_context;

    let dataInHelper = 'UNSET';
    let dataInRendered = 'UNSET';
    let dataInCreated = 'UNSET';
    let dataInDestroyed = 'UNSET';
    let dataInEvent = 'UNSET';

    tmpl.helpers({
      foo: function () {
        dataInHelper = this;
      },
    });
    tmpl.created = function () {
      dataInCreated = this.data;
    };
    tmpl.rendered = function () {
      dataInRendered = this.data;
    };
    tmpl.destroyed = function () {
      dataInDestroyed = this.data;
    };
    tmpl.events({
      click: function () {
        dataInEvent = this;
      },
    });

    const div = renderToDiv(tmpl);
    document.body.appendChild(div);
    clickElement(div.querySelector('button'));
    Tracker.flush(); // rendered gets called afterFlush
    if (hasJquery) { $(div).remove() } else { div.remove() }

    test.isFalse(dataInHelper === window);
    test.equal(dataInHelper, {});
    test.equal(dataInCreated, null);
    test.equal(dataInRendered, null);
    test.equal(dataInDestroyed, null);
    test.isFalse(dataInEvent === window);
    test.equal(dataInEvent, {});
  }
);

Tinytest.add('spacebars-tests - template_tests - falsy with', function (test) {
  const tmpl = Template.spacebars_test_falsy_with;
  const R = ReactiveVar(null);
  tmpl.helpers({
    obj: function () {
      return R.get();
    },
  });

  const div = renderToDiv(tmpl);
  divRendersTo(test, div, '');

  R.set({ greekLetter: 'alpha' });
  divRendersTo(test, div, 'alpha');

  R.set(null);
  divRendersTo(test, div, '');

  R.set({ greekLetter: 'alpha' });
  divRendersTo(test, div, 'alpha');
});

Tinytest.add(
  "spacebars-tests - template_tests - helpers don't leak",
  function (test) {
    const tmpl = Template.spacebars_test_helpers_dont_leak;
    tmpl.foo = 'wrong';
    tmpl.bar = function () {
      return 'WRONG';
    };

    // Also test that custom block helpers (implemented as templates) do NOT
    // interfere with helper lookup in the current template
    Template.spacebars_test_helpers_dont_leak2.helpers({
      bonus: function () {
        return 'BONUS';
      },
    });

    const div = renderToDiv(tmpl);
    divRendersTo(test, div, 'correct BONUS');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - event handler returns false',
  function (test) {
    const tmpl = Template.spacebars_test_event_returns_false;
    const elemId = 'spacebars_test_event_returns_false_link';
    tmpl.events({
      'click a': function (evt) {
        return false;
      },
    });

    const div = renderToDiv(tmpl);
    document.body.appendChild(div);
    const target = document.getElementById(elemId);
    clickIt(target);
    // NOTE: This failure can stick across test runs!  Try
    // removing '#bad-url' from the location bar and run
    // the tests again. :)
    test.isFalse(/#bad-url/.test(window.location.hash));
    document.body.removeChild(div);
  }
);

// Make sure that if you bind an event on "div p", for example,
// both the div and the p need to be in the template.  jQuery's
// `$(elem).find(...)` works this way, but the browser's
// querySelector doesn't.
Tinytest.add(
  'spacebars-tests - template_tests - event map selector scope',
  function (test) {
    const tmpl = Template.spacebars_test_event_selectors1;
    const tmpl2 = Template.spacebars_test_event_selectors2;
    const buf = [];
    tmpl2.events({
      'click div p': function (evt) {
        buf.push(evt.currentTarget.className);
      },
    });

    const div = renderToDiv(tmpl);
    document.body.appendChild(div);
    test.equal(buf.join(), '');

    clickIt(div.querySelector('.p1'));
    test.equal(buf.join(), '');
    clickIt(div.querySelector('.p2'));
    test.equal(buf.join(), 'p2');
    document.body.removeChild(div);
  }
);

if (document.addEventListener) {
  // see note about non-bubbling events in the "capturing events"
  // templating test for why we use the VIDEO tag.  (It would be
  // nice to get rid of the network dependency, though.)
  // We skip this test in IE 8.
  Tinytest.add(
    'spacebars-tests - template_tests - event map selector scope (capturing)',
    function (test) {
      const tmpl = Template.spacebars_test_event_selectors_capturing1;
      const tmpl2 = Template.spacebars_test_event_selectors_capturing2;
      const buf = [];
      tmpl2.events({
        'play div video': function (evt) {
          buf.push(evt.currentTarget.className);
        },
      });

      const div = renderToDiv(tmpl);
      document.body.appendChild(div);
      test.equal(buf.join(), '');
      trigger({
        el: div.querySelector('.video1'),
        eventType: 'play',
        bubbles: false
      });
      test.equal(buf.join(), '');
      trigger({
        el: div.querySelector('.video2'),
        eventType: 'play',
        bubbles: false
      });
      test.equal(buf.join(), 'video2');
      document.body.removeChild(div);
    }
  );
}

Tinytest.add('spacebars-tests - template_tests - tables', function (test) {
  const tmpl1 = Template.spacebars_test_tables1;

  let div = renderToDiv(tmpl1);
  test.equal(
    Array.from(div.querySelectorAll('*')).map((x) => x.tagName),
    ['TABLE', 'TR', 'TD']
  );
  divRendersTo(test, div, '<table><tr><td>Foo</td></tr></table>');

  const tmpl2 = Template.spacebars_test_tables2;
  tmpl2.helpers({ foo: 'Foo' });
  div = renderToDiv(tmpl2);
  test.equal(
    Array.from(div.querySelectorAll('*')).map((x) => x.tagName),
    ['TABLE', 'TR', 'TD']
  );
  divRendersTo(test, div, '<table><tr><td>Foo</td></tr></table>');
});

if (hasJquery){
  Tinytest.add(
    'spacebars-tests - template_tests - jQuery.trigger extraParameters are passed to the event callback',
    function (test) {
      const tmpl = Template.spacebars_test_jquery_events;
      let captured = false;
      const args = ['param1', 'param2', { option: 1 }, 1, 2, 3];

      tmpl.events({
        someCustomEvent: function (...args1) {
          let i;
          for (i = 0; i < args.length; i++) {
            // expect the arguments to be just after template
            test.equal(args1[i + 2], args[i]);
          }
          captured = true;
        },
      });

      tmpl.rendered = function () {
        $(this.find('button')).trigger('someCustomEvent', args);
      };

      renderToDiv(tmpl);
      Tracker.flush();
      test.equal(captured, true);
    }
  );
}

Tinytest.add('spacebars-tests - template_tests - toHTML', function (test) {
  // run once, verifying that autoruns are stopped
  const once = function (tmplToRender, tmplForHelper, helper, val) {
    let count = 0;
    const R = new ReactiveVar();
    const getR = function () {
      count++;
      return R.get();
    };

    R.set(val);
    const helpers = {};
    helpers[helper] = getR;
    tmplForHelper.helpers(helpers);
    test.equal(canonicalizeHtml(Blaze.toHTML(tmplToRender)), 'bar');
    test.equal(count, 1);
    R.set('');
    Tracker.flush();
    test.equal(count, 1); // all autoruns stopped
  };

  once(
    Template.spacebars_test_tohtml_basic,
    Template.spacebars_test_tohtml_basic,
    'foo',
    'bar'
  );
  once(
    Template.spacebars_test_tohtml_if,
    Template.spacebars_test_tohtml_if,
    'foo',
    'bar'
  );
  once(
    Template.spacebars_test_tohtml_with,
    Template.spacebars_test_tohtml_with,
    'foo',
    'bar'
  );
  once(
    Template.spacebars_test_tohtml_each,
    Template.spacebars_test_tohtml_each,
    'foos',
    ['bar']
  );

  once(
    Template.spacebars_test_tohtml_include_with,
    Template.spacebars_test_tohtml_with,
    'foo',
    'bar'
  );
  once(
    Template.spacebars_test_tohtml_include_each,
    Template.spacebars_test_tohtml_each,
    'foos',
    ['bar']
  );
});

Tinytest.add(
  'spacebars-tests - template_tests - block comments should not be displayed',
  function (test) {
    const tmpl = Template.spacebars_test_block_comment;
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '');
  }
);

// Originally reported at https://github.com/meteor/meteor/issues/2046
Tinytest.add(
  'spacebars-tests - template_tests - {{#with}} with mutated data context',
  function (test) {
    const tmpl = Template.spacebars_test_with_mutated_data_context;
    const foo = { value: 0 };
    const dep = new Tracker.Dependency();
    tmpl.helpers({
      foo: function () {
        dep.depend();
        return foo;
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '0');

    foo.value = 1;
    dep.changed();
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), '1');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - javascript scheme urls',
  function (test) {
    const tmpl = Template.spacebars_test_url_attribute;
    const sessionKey = 'foo-' + Random.id();
    tmpl.helpers({
      foo: function () {
        return Session.get(sessionKey);
      },
    });

    const numUrlAttrs = 4;
    const div = renderToDiv(tmpl);

    // [tag name, attr name, is a url attribute]
    const attrsList = [
      ['A', 'href', true],
      ['FORM', 'action', true],
      ['IMG', 'src', true],
      ['INPUT', 'value', false],
    ];

    const checkAttrs = function (url, isJavascriptProtocol) {
      if (isJavascriptProtocol) {
        Meteor._suppress_log(numUrlAttrs);
      }
      Session.set(sessionKey, url);
      Tracker.flush();

      attrsList.forEach(function (attrInfo) {
        let normalizedUrl;
        const elem = document.createElement(attrInfo[0]);
        try {
          elem[attrInfo[1]] = url;
        } catch (err) {
          // IE throws an exception if you set an img src to a
          // javascript: URL. Blaze can't override this behavior;
          // whether you've called Blaze._javascriptUrlsAllowed() or not,
          // you won't be able to set a javascript: URL in an img
          // src. So we only test img tags in other browsers.
          if (attrInfo[0] === 'IMG') {
            return;
          }
          throw err;
        }
        document.body.appendChild(elem);
        normalizedUrl = elem[attrInfo[1]];
        document.body.removeChild(elem);

        Array.from(div.getElementsByTagName(attrInfo[0])).forEach(function (
          elem
        ) {
          // Intentional Change in Form Action behaviour in Chrome 66
          // Safari 11.0 and Firefox 59. An empty or missing form action will
          // now return the document's base URL. To recieve the actual action
          // getAttribute('action') must be called. If HTML attribute being checked
          // is form, check against getAttribute('action') instead.
          // https://bugs.chromium.org/p/chromium/issues/detail?id=724596
          if (attrInfo[0] === 'FORM' && isJavascriptProtocol === true) {
            test.equal(
              elem.getAttribute('action'),
              isJavascriptProtocol && attrInfo[2] ? null : normalizedUrl
            );
          } else {
            test.equal(
              elem[attrInfo[1]],
              isJavascriptProtocol && attrInfo[2] ? '' : normalizedUrl
            );
          }
        });
      });
    };

    test.equal(Blaze._javascriptUrlsAllowed(), false);
    checkAttrs('http://www.meteor.com', false);
    checkAttrs('javascript:alert(1)', true);
    checkAttrs('jAvAsCrIpT:alert(1)', true);
    checkAttrs('    javascript:alert(1)', true);
    Blaze._allowJavascriptUrls();
    test.equal(Blaze._javascriptUrlsAllowed(), true);
    checkAttrs('http://www.meteor.com', false);
    checkAttrs('javascript:alert(1)', false);
    checkAttrs('jAvAsCrIpT:alert(1)', false);
    checkAttrs('    javascript:alert(1)', false);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - event handlers get cleaned up when template is removed',
  function (test) {
    const tmpl = Template.spacebars_test_event_handler_cleanup;
    const subtmpl = Template.spacebars_test_event_handler_cleanup_sub;

    const rv = new ReactiveVar(true);
    tmpl.helpers({
      foo: function () {
        return rv.get();
      },
    });

    subtmpl.events({
      'click/mouseover': function () {},
    });

    const div = renderToDiv(tmpl);

    test.equal(div.$blaze_events['click'].handlers.length, 1);
    test.equal(div.$blaze_events['mouseover'].handlers.length, 1);

    rv.set(false);
    Tracker.flush();

    test.equal(div.$blaze_events['click'].handlers.length, 0);
    test.equal(div.$blaze_events['mouseover'].handlers.length, 0);
  }
);

// This test makes sure that Blaze correctly finds the controller
// heirarchy surrounding an element that itself doesn't have a
// controller.
Tinytest.add(
  'spacebars-tests - template_tests - data context in event handlers on elements inside {{#if}}',
  function (test) {
    const tmpl = Template.spacebars_test_data_context_for_event_handler_in_if;
    let data = null;
    tmpl.events({
      'click span': function () {
        data = this;
      },
    });
    const div = renderToDiv(tmpl);
    document.body.appendChild(div);
    clickIt(div.querySelector('span'));
    test.equal(data, { foo: 'bar' });
    document.body.removeChild(div);
  }
);

// https://github.com/meteor/meteor/issues/2156
Tinytest.addAsync(
  'spacebars-tests - template_tests - each with inserts inside autorun',
  async function (test) {
    const tmpl = Template.spacebars_test_each_with_autorun_insert;
    const coll = new Mongo.Collection(null);
    const rv = new ReactiveVar();

    tmpl.helpers({
      items: function () {
        return coll.find();
      },
    });

    const div = renderToDiv(tmpl);

    Tracker.autorun(function () {
      if (rv.get()) {
        coll.insert({ name: rv.get() });
      }
    });

    rv.set('foo1');
    Tracker.flush();
    const firstId = coll.findOne()._id;

    rv.set('foo2');
    Tracker.flush();

    test.equal(canonicalizeHtml(div.innerHTML), 'foo1 foo2');

    await coll.updateAsync(firstId, { $set: { name: 'foo3' } });
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'foo3 foo2');
  }
);

Tinytest.add('spacebars-tests - template_tests - ui hooks', function (test) {
  const tmpl = Template.spacebars_test_ui_hooks;
  const rv = new ReactiveVar([]);
  tmpl.helpers({
    items: function () {
      return rv.get();
    },
  });

  const div = renderToDiv(tmpl);

  const hooks = [];
  const container = div.querySelector('.test-ui-hooks');

  // Before we attach the ui hooks, put two items in the DOM.
  const origVal = [{ _id: 'foo1' }, { _id: 'foo2' }];
  rv.set(origVal);
  Tracker.flush();

  container._uihooks = {
    insertElement: function (n, next) {
      hooks.push('insert');

      // check that the element hasn't actually been added yet
      test.isTrue(
        !n.parentNode || n.parentNode.nodeType === 11 /*DOCUMENT_FRAGMENT_NODE*/
      );
    },
    removeElement: function (n) {
      hooks.push('remove');
      // check that the element hasn't actually been removed yet
      test.isTrue(n.parentNode === container);
    },
    moveElement: function (n, next) {
      hooks.push('move');
      // check that the element hasn't actually been moved yet
      test.isFalse(n.nextNode === next);
    },
  };

  const testDomUnchanged = function () {
    const items = div.querySelectorAll('.item');
    test.equal(items.length, 2);
    test.equal(canonicalizeHtml(items[0].innerHTML), 'foo1');
    test.equal(canonicalizeHtml(items[1].innerHTML), 'foo2');
  };

  let newVal = [...origVal];
  newVal.push({ _id: 'foo3' });
  rv.set(newVal);
  Tracker.flush();
  test.equal(hooks, ['insert']);
  testDomUnchanged();

  newVal.reverse();
  rv.set(newVal);
  Tracker.flush();
  test.equal(hooks, ['insert', 'move']);
  testDomUnchanged();

  newVal = [origVal[0]];
  rv.set(newVal);
  Tracker.flush();
  test.equal(hooks, ['insert', 'move', 'remove']);
  testDomUnchanged();
});

Tinytest.add(
  'spacebars-tests - template_tests - ui hooks - nested domranges',
  function (test) {
    const tmpl = Template.spacebars_test_ui_hooks_nested;
    const rv = new ReactiveVar(true);

    tmpl.helpers({
      foo: function () {
        return rv.get();
      },
    });

    const subtmpl = Template.spacebars_test_ui_hooks_nested_sub;
    let uiHookCalled = false;
    subtmpl.rendered = function () {
      this.firstNode.parentNode._uihooks = {
        removeElement: function (node) {
          uiHookCalled = true;
        },
      };
    };

    const div = renderToDiv(tmpl);
    document.body.appendChild(div);
    Tracker.flush();

    const htmlBeforeRemove = canonicalizeHtml(div.innerHTML);
    rv.set(false);
    Tracker.flush();
    test.isTrue(uiHookCalled);
    const htmlAfterRemove = canonicalizeHtml(div.innerHTML);
    test.equal(htmlBeforeRemove, htmlAfterRemove);
    document.body.removeChild(div);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - Template.instance from helper',
  function (test) {
    // Set a property on the template instance; check that it's still
    // there from a helper.

    const tmpl = Template.spacebars_test_template_instance_helper;
    const value = Random.id();
    let instanceFromHelper;

    tmpl.created = function () {
      this.value = value;
    };
    tmpl.helpers({
      foo: function () {
        instanceFromHelper = Template.instance();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(instanceFromHelper.value, value);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - Template.instance from helper, ' +
    'template instance is kept up-to-date',
  function (test) {
    const tmpl = Template.spacebars_test_template_instance_helper;
    const rv = new ReactiveVar('');
    let instanceFromHelper;

    tmpl.helpers({
      foo: function () {
        return Template.instance().data;
      },
    });

    const div = renderToDiv(tmpl, function () {
      return rv.get();
    });
    rv.set('first');
    divRendersTo(test, div, 'first');

    rv.set('second');
    Tracker.flush();
    divRendersTo(test, div, 'second');

    // Template.instance() returns null when no template instance
    test.isTrue(Template.instance() === null);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - {{#with}} autorun is cleaned up',
  function (test) {
    const tmpl = Template.spacebars_test_with_cleanup;
    const rv = new ReactiveVar('');
    let helperCalled = false;
    tmpl.helpers({
      foo: function () {
        helperCalled = true;
        return rv.get();
      },
    });

    const div = renderToDiv(tmpl);
    rv.set('first');
    Tracker.flush();
    test.equal(helperCalled, true);

    helperCalled = false;
    if (hasJquery) {
      $(div).find('.test-with-cleanup').remove();
    } else {
      div.querySelector('.test-with-cleanup').remove();
    }

    rv.set('second');
    Tracker.flush();
    test.equal(helperCalled, false);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - Template.parentData from helpers',
  function (test) {
    const childTmpl = Template.spacebars_test_template_parent_data_helper_child;
    const parentTmpl = Template.spacebars_test_template_parent_data_helper;

    const height = new ReactiveVar(0);
    const bar = new ReactiveVar('bar');

    childTmpl.helpers({
      a: ['a'],
      b: function () {
        return bar.get();
      },
      c: ['c'],
      foo: function () {
        const a = Template.parentData(height.get());
        const b = UI._parentData(height.get()); // back-compat
        test.equal(a, b);
        return a;
      },
    });

    const div = renderToDiv(parentTmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'd');

    height.set(1);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'bar');

    // Test Template.parentData() reactivity

    bar.set('baz');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'baz');

    height.set(2);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'a');

    height.set(3);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'parent');

    // Test that calling Template.parentData() without any arguments is the same as Template.parentData(1)

    height.set(null);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'baz');
  }
);

Tinytest.add('spacebars - SVG <a> elements', function (test) {
  if (!document.createElementNS) {
    // IE 8
    return;
  }

  const tmpl = Template.spacebars_test_svg_anchor;
  const div = renderToDiv(tmpl);
  const anchNamespace = div.querySelector('a').namespaceURI;
  test.equal(anchNamespace, 'http://www.w3.org/2000/svg');
});

Tinytest.add(
  'spacebars-tests - template_tests - created/rendered/destroyed by each',
  function (test) {
    const outerTmpl =
      Template.spacebars_test_template_created_rendered_destroyed_each;
    const innerTmpl =
      Template.spacebars_test_template_created_rendered_destroyed_each_sub;

    let buf = '';

    innerTmpl.created = function () {
      buf += 'C' + String(this.data).toLowerCase();
    };
    innerTmpl.rendered = function () {
      buf += 'R' + String(this.data).toLowerCase();
    };
    innerTmpl.destroyed = function () {
      buf += 'D' + String(this.data).toLowerCase();
    };

    const R = ReactiveVar([{ _id: 'A' }]);

    outerTmpl.helpers({
      items: function () {
        return R.get();
      },
    });

    const div = renderToDiv(outerTmpl);
    divRendersTo(test, div, '<div>A</div>');
    test.equal(buf, 'CaRa');

    R.set([{ _id: 'B' }]);
    divRendersTo(test, div, '<div>B</div>');
    test.equal(buf, 'CaRaDaCbRb');

    R.set([{ _id: 'C' }]);
    divRendersTo(test, div, '<div>C</div>');
    test.equal(buf, 'CaRaDaCbRbDbCcRc');

    if (hasJquery) { $(div).remove() } else { div.remove() }
    test.equal(buf, 'CaRaDaCbRbDbCcRcDc');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - Blaze.render/Blaze.remove',
  function (test) {
    const div = document.createElement('DIV');
    document.body.appendChild(div);

    let created = false,
      rendered = false,
      destroyed = false;
    const R = ReactiveVar('aaa');

    const tmpl = Template.spacebars_test_ui_render;
    tmpl.helpers({
      greeting: function () {
        return this.greeting || 'Hello';
      },
      r: function () {
        return R.get();
      },
    });
    tmpl.created = function () {
      created = true;
    };
    tmpl.rendered = function () {
      rendered = true;
    };
    tmpl.destroyed = function () {
      destroyed = true;
    };

    test.equal([created, rendered, destroyed], [false, false, false]);

    const renderedTmpl = Blaze.render(tmpl, div);
    test.equal([created, rendered, destroyed], [true, false, false]);

    // Flush now. We fire the rendered callback in an afterFlush block,
    // to ensure that the DOM is completely updated.
    Tracker.flush();
    test.equal([created, rendered, destroyed], [true, true, false]);

    const otherDiv = document.createElement('DIV');
    // can run a second time without throwing
    const x = Blaze.render(tmpl, otherDiv);
    // note: we'll have clean up `x` below

    const renderedTmpl2 = Blaze.renderWithData(tmpl, { greeting: 'Bye' }, div);
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<span>Hello aaa</span><span>Bye aaa</span>'
    );
    R.set('bbb');
    Tracker.flush();
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<span>Hello bbb</span><span>Bye bbb</span>'
    );
    test.equal([created, rendered, destroyed], [true, true, false]);
    test.equal(R._numListeners(), 3);
    Blaze.remove(renderedTmpl);
    Blaze.remove(renderedTmpl); // test that double-remove doesn't throw
    Blaze.remove(renderedTmpl2);
    Blaze.remove(x);
    test.equal([created, rendered, destroyed], [true, true, true]);
    test.equal(R._numListeners(), 0);
    test.equal(canonicalizeHtml(div.innerHTML), '');
  }
);

if (hasJquery) {
  Tinytest.add(
    'spacebars-tests - template_tests - Blaze.render fails on jQuery objects',
    function (test) {
      const tmpl = Template.spacebars_test_ui_render;
      test.throws(function () {
        Blaze.render(tmpl, $('body'));
      }, /'parentElement' must be a DOM node/);
      test.throws(function () {
        Blaze.render(tmpl, document.body, $('body'));
      }, /'nextNode' must be a DOM node/);
    }
  );
}

Tinytest.add(
  'spacebars-tests - template_tests - UI.getElementData',
  function (test) {
    const div = document.createElement('DIV');
    const tmpl = Template.spacebars_test_ui_getElementData;
    Blaze.renderWithData(tmpl, { foo: 'bar' }, div);

    const span = div.querySelector('SPAN');
    test.isTrue(span);
    test.equal(UI.getElementData(span), { foo: 'bar' });
    test.equal(Blaze.getData(span), { foo: 'bar' });
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - autorun cleanup',
  function (test) {
    const tmpl = Template.spacebars_test_parent_removal;

    let Acalls = '';
    const A = ReactiveVar('hi');
    tmpl.helpers({
      A: function (chr) {
        Acalls += chr;
        return A.get();
      },
    });
    let Bcalls = 0;
    const B = ReactiveVar(['one', 'two']);
    tmpl.helpers({
      B: function () {
        Bcalls++;
        return B.get();
      },
    });

    // Assert how many times A and B were accessed (since last time)
    // and how many autoruns are listening to them.
    const assertCallsAndListeners = function (
      a_calls,
      b_calls,
      a_listeners,
      b_listeners
    ) {
      test.equal('A calls: ' + Acalls.length, 'A calls: ' + a_calls, Acalls);
      test.equal('B calls: ' + Bcalls, 'B calls: ' + b_calls);
      test.equal(
        'A listeners: ' + A._numListeners(),
        'A listeners: ' + a_listeners
      );
      test.equal(
        'B listeners: ' + B._numListeners(),
        'B listeners: ' + b_listeners
      );
      Acalls = '';
      Bcalls = 0;
    };

    const div = renderToDiv(tmpl);
    assertCallsAndListeners(10, 1, 10, 1);
    A.set('');
    Tracker.flush();
    // Confirm that #4, #5, #6, and #9 are not re-run.
    // #a is newly run, for a total of 10 - 4 + 1 = 7,
    assertCallsAndListeners(7, 0, 7, 1);
    A.set('hi');
    Tracker.flush();
    assertCallsAndListeners(10, 0, 10, 1);

    // Now see that removing the DOM with jQuery, below
    // the level of the entire template, stops everything.
    if (hasJquery) {
      $(div.querySelector('.toremove')).remove();
    } else {
      div.querySelector('.toremove').remove();
    }
    assertCallsAndListeners(0, 0, 0, 0);
  }
);

const trigger = ({ el, eventType, bubbles = true, options }) => {
  const event = new Event(eventType, { bubbles, cancelable: true });
  if (options) Object.assign(event, options);
  el.dispatchEvent(event);
};

Tinytest.add(
  'spacebars-tests - template_tests - focus/blur with clean-up',
  function (test) {
    const tmpl = Template.spacebars_test_focus_blur_outer;
    const cond = ReactiveVar(true);
    tmpl.helpers({
      cond: function () {
        return cond.get();
      },
    });
    const buf = [];
    Template.spacebars_test_focus_blur_inner.events({
      'focus input': function () {
        buf.push('FOCUS');
      },
      'blur input': function () {
        buf.push('BLUR');
      },
    });

    const div = renderToDiv(tmpl);
    document.body.appendChild(div);

    // check basic focus and blur to make sure
    // everything is sane
    test.equal(div.querySelectorAll('input').length, 1);
    let input;
    focusElement((input = div.querySelector('input')));
    // We don't get focus events when the Chrome Dev Tools are focused,
    // unfortunately, as of Chrome 35.  I think this is a regression in
    // Chrome 34.  So, the goal is to work whether or not focus is
    // "borken," where "working" means always failing if DOMBackend isn't
    // correctly unbinding the old event handlers when we switch the IF,
    // and always passing if it is.  To cause the problem in DOMBackend,
    // delete the '**' argument to jQuery#off in
    // DOMBackend.Events.undelegateEvents.  The only compromise we are
    // making here is that if some unrelated bug in Blaze makes
    // focus/blur not work, the failure might be masked while the Dev
    // Tools are open.
    let borken = false;
    if (buf.length === 0 && document.activeElement === input) {
      test.ok({
        note:
          'You might need to defocus the Chrome Dev Tools to get a more accurate run of this test!',
      });
      borken = true;
      if (hasJquery) {
        $(input).trigger('focus');
      } else {
        trigger({ el: input, eventType: 'focusin',bubbles:  true });
      }
    }
    test.equal(buf.join(), 'FOCUS');
    blurElement(div.querySelector('input'));
    if (buf.length === 1) {
      if (hasJquery) {
        $(input).trigger('blur');
      } else {
        trigger({ el: input, eventType: 'focusout', bubbles: true });
      }
    }
    test.equal(buf.join(), 'FOCUS,BLUR');

    // now switch the IF and check again.  The failure mode
    // we observed was that DOMBackend would not correctly
    // unbind the old event listener at the jQuery level,
    // so the old event listener would fire and cause an
    // exception inside Blaze ("Must be attached" in
    // DOMRange#containsElement), which would show up in
    // the console and cause our handler not to fire.
    cond.set(false);
    buf.length = 0;
    Tracker.flush();
    test.equal(div.querySelectorAll('input').length, 1);
    focusElement((input = div.querySelector('input')));
    if (borken) {
      if (hasJquery) {
        $(input).trigger('focus');
      } else {
        trigger({ el: input, eventType: 'focusin', bubbles: true });
      }
    }
    test.equal(buf.join(), 'FOCUS');
    blurElement(div.querySelector('input'));
    if (!borken) test.equal(buf.join(), 'FOCUS,BLUR');

    document.body.removeChild(div);
  }
);

// this is an explicit additional test for manual event
// dispatch of focus/blur, in case the previous test did not
// branch into these cases
Tinytest.add(
  'spacebars-tests - template_tests - manual focus/blur with clean-up',
  function (test) {
    const tmpl = Template.spacebars_test_focus_blur_outer;
    const cond = ReactiveVar(true);
    tmpl.helpers({
      cond: function () {
        return cond.get();
      },
    });
    const buf = [];
    Template.spacebars_test_focus_blur_inner.events({
      'focus input': function () {
        buf.push('FOCUS');
      },
      'blur input': function () {
        buf.push('BLUR');
      },
    });

    const div = renderToDiv(tmpl);
    document.body.appendChild(div);

    // check basic focus and blur to make sure
    // everything is sane
    test.equal(div.querySelectorAll('input').length, 1);
    let input = div.querySelector('input');
    focusElement(input);
    // We don't get focus events when the Chrome Dev Tools are focused,
    // unfortunately, as of Chrome 35.  I think this is a regression in
    // Chrome 34.  So, the goal is to work whether or not focus is
    // "borken," where "working" means always failing if DOMBackend isn't
    // correctly unbinding the old event handlers when we switch the IF,
    // and always passing if it is.  To cause the problem in DOMBackend,
    // delete the '**' argument to jQuery#off in
    // DOMBackend.Events.undelegateEvents.  The only compromise we are
    // making here is that if some unrelated bug in Blaze makes
    // focus/blur not work, the failure might be masked while the Dev
    // Tools are open.
    let borken = false;
    if (buf.length === 0 && document.activeElement === input) {
      test.ok({
        note:
          'You might need to defocus the Chrome Dev Tools to get a more accurate run of this test!',
      });
      borken = true;
      if (hasJquery) {
        $(input).trigger('focus');
      } else {
        trigger({ el: input, eventType: 'focusin', bubbles: true });
      }
    }
    test.equal(buf.join(), 'FOCUS');
    input = div.querySelector('input')
    blurElement(input);
    if (buf.length === 1) {
      if (hasJquery) {
        $(input).trigger('blur');
      } else {
        trigger({ el: input, eventType: 'focusout', bubbles: true });
      }
    }
    test.equal(buf.join(), 'FOCUS,BLUR');

    // now switch the IF and check again.  The failure mode
    // we observed was that DOMBackend would not correctly
    // unbind the old event listener at the jQuery level,
    // so the old event listener would fire and cause an
    // exception inside Blaze ("Must be attached" in
    // DOMRange#containsElement), which would show up in
    // the console and cause our handler not to fire.
    cond.set(false);
    buf.length = 0;
    Tracker.flush();
    test.equal(div.querySelectorAll('input').length, 1);
    input = div.querySelector('input')
    focusElement(input);
    if (borken) {
      if (hasJquery) {
        $(input).trigger('focus');
      } else {
        trigger({ el: input, eventType: 'focusin', bubbles: true });
      }
    }
    test.equal(buf.join(), 'FOCUS');
    input = div.querySelector('input')
    blurElement(input);
    if (!borken) test.equal(buf.join(), 'FOCUS,BLUR');

    document.body.removeChild(div);
  }
);

// We used to remove event handlers on DOMRange detached, but when
// tearing down a view, we don't "detach" all the DOMRanges recursively.
// Mainly, we destroy the View.  Destroying a View should remove its
// event listeners.  (In practice, however, it's hard to think of
// consequences to not removing event handlers on removed DOM nodes,
// which will probably be GCed anyway.)
Tinytest.add(
  'spacebars-tests - template_tests - event cleanup on destroyed',
  function (test) {
    const tmpl = Template.spacebars_test_event_cleanup_on_destroyed_outer;
    const cond = ReactiveVar(true);
    tmpl.helpers({
      cond: function () {
        return cond.get();
      },
    });

    Template.spacebars_test_event_cleanup_on_destroyed_inner.events({
      'click span': function () {},
    });

    const div = renderToDiv(tmpl);
    document.body.appendChild(div);

    const eventDiv = div.querySelector('div');
    test.equal(eventDiv.$blaze_events.click.handlers.length, 1);

    cond.set(false);
    Tracker.flush();
    test.equal(eventDiv.$blaze_events.click.handlers.length, 0);

    document.body.removeChild(div);
  }
);

[1, 2, 3].forEach(function (n) {
  Tinytest.add(
    'spacebars-tests - template_tests - lookup is isolated ' + n,
    function (test) {
      let buf = '';
      const inclusion = Template.spacebars_test_isolated_lookup_inclusion;
      inclusion.created = function () {
        buf += 'C';
      };
      inclusion.destroyed = function () {
        buf += 'D';
      };

      const tmpl = Template['spacebars_test_isolated_lookup' + n];
      const R = ReactiveVar(Template.spacebars_template_test_aaa);

      tmpl.helpers({
        bar: function () {
          return R.get();
        },
      });

      const div = renderToDiv(tmpl, function () {
        return { foo: R.get() };
      });

      test.equal(canonicalizeHtml(div.innerHTML), 'aaa--x');
      test.equal(buf, 'C');
      R.set(Template.spacebars_template_test_bbb);
      Tracker.flush();
      test.equal(canonicalizeHtml(div.innerHTML), 'bbb--x');
      test.equal(buf, 'C');
    }
  );
});

Tinytest.add(
  'spacebars-tests - template_tests - current view in event handler',
  function (test) {
    const tmpl = Template.spacebars_test_current_view_in_event;

    let currentView;
    let currentData;

    tmpl.events({
      'click span': function () {
        currentView = Blaze.getView();
        currentData = Blaze.getData();
      },
    });

    const div = renderToDiv(tmpl, 'blah');
    test.equal(canonicalizeHtml(div.innerHTML), '<span>blah</span>');
    document.body.appendChild(div);
    clickElement(div.querySelector('span'));
    if (hasJquery) { $(div).remove() } else { div.remove() }

    test.isTrue(currentView);
    test.equal(currentData, 'blah');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - helper invalidates self',
  function (test) {
    const tmpl = Template.spacebars_template_test_bracketed_foo;

    const count = new ReactiveVar(0);

    tmpl.helpers({
      // It's unusual for a helper to have side effects, but it's possible
      // and people do it.  Regression test for #4097.
      foo: function () {
        // Make count odd and return it.
        const c = count.get();
        if (c % 2 === 0) {
          count.set(c + 1);
        }
        return c;
      },
    });

    const div = renderToDiv(tmpl);
    divRendersTo(test, div, '[1]');
    count.set(2);
    divRendersTo(test, div, '[3]');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - textarea attrs',
  function (test) {
    const tmplNoContents = {
      tmpl: Template.spacebars_test_textarea_attrs,
      hasTextAreaContents: false,
    };
    const tmplWithContents = {
      tmpl: Template.spacebars_test_textarea_attrs_contents,
      hasTextAreaContents: true,
    };
    const tmplWithContentsAndMoreAttrs = {
      tmpl: Template.spacebars_test_textarea_attrs_array_contents,
      hasTextAreaContents: true,
    };

    [tmplNoContents, tmplWithContents, tmplWithContentsAndMoreAttrs].forEach(
      function (tmplInfo) {
        const id = new ReactiveVar('textarea-' + Random.id());
        const name = new ReactiveVar('one');
        const attrs = new ReactiveVar({
          id: 'textarea-' + Random.id(),
        });

        const div = renderToDiv(tmplInfo.tmpl, {
          attrs: function () {
            return attrs.get();
          },
          name: function () {
            return name.get();
          },
        });

        // Check that the id and value attribute are as we expect.
        // We can't check div.innerHTML because Chrome at least doesn't
        // appear to put textarea value attributes in innerHTML.
        const textarea = div.querySelector('textarea');
        test.equal(textarea.id, attrs.get().id);
        test.equal(
          textarea.value,
          tmplInfo.hasTextAreaContents ? 'Hello one' : ''
        );
        // One of the templates has a separate attribute in addition to
        // an attributes dictionary.
        if (tmplInfo === tmplWithContentsAndMoreAttrs) {
          test.equal(textarea.getAttribute('class'), 'bar');
        }

        // Change the id, check that the attribute updates reactively.
        attrs.set({ id: 'textarea-' + Random.id() });
        Tracker.flush();
        test.equal(textarea.id, attrs.get().id);

        // Change the name variable, check that the textarea value
        // updates reactively.
        name.set('two');
        Tracker.flush();
        test.equal(
          textarea.value,
          tmplInfo.hasTextAreaContents ? 'Hello two' : ''
        );

        if (tmplInfo === tmplWithContentsAndMoreAttrs) {
          test.equal(textarea.getAttribute('class'), 'bar');
        }
      }
    );
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - this.autorun',
  function (test) {
    const tmpl = Template.spacebars_test_autorun;
    const tmplInner = Template.spacebars_test_autorun_inner;

    // Keep track of the value of `Template.instance()` inside the
    // autorun each time it runs.
    const autorunTemplateInstances = [];
    let actualTemplateInstance;
    let returnedComputation;
    let computationArg;

    const show = new ReactiveVar(true);
    const rv = new ReactiveVar('foo');

    tmplInner.created = function () {
      actualTemplateInstance = this;
      returnedComputation = this.autorun(function (c) {
        // Test nested autorun.
        actualTemplateInstance.autorun(function (c2) {
          rv.get();
          autorunTemplateInstances.push(Template.instance());
        });
        computationArg = c;
        rv.get();
        autorunTemplateInstances.push(Template.instance());
      });
    };

    tmpl.helpers({
      show: function () {
        return show.get();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(autorunTemplateInstances.length, 2);
    test.equal(autorunTemplateInstances[0], actualTemplateInstance);
    test.equal(autorunTemplateInstances[1], actualTemplateInstance);

    // Test that the autorun returned a computation and received a
    // computation as an argument.
    test.isTrue(returnedComputation instanceof Tracker.Computation);
    test.equal(returnedComputation, computationArg);

    // Make sure the autorun re-runs when `rv` changes, and that it has
    // the correct current view.
    rv.set('bar');
    Tracker.flush();
    test.equal(autorunTemplateInstances.length, 4);
    test.equal(autorunTemplateInstances[1], actualTemplateInstance);
    test.equal(autorunTemplateInstances[2], actualTemplateInstance);

    // If the inner template is destroyed, the autorun should be stopped.
    show.set(false);
    Tracker.flush();
    rv.set('baz');
    Tracker.flush();

    test.equal(autorunTemplateInstances.length, 4);
    test.equal(rv._numListeners(), 0);
  }
);

// Test that argument in {{> Template.contentBlock arg}} is evaluated in
// the proper data context.
Tinytest.add(
  'spacebars-tests - template_tests - contentBlock argument',
  function (test) {
    const tmpl = Template.spacebars_test_contentBlock_arg;
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'AAA BBB');
  }
);

// Test that when Blaze sets an input field to the same value,
// we don't lose the insertion point position.
Tinytest.add(
  'spacebars-tests - template_tests - input field to same value',
  function (test) {
    const tmpl = Template.spacebars_template_test_input_field_to_same_value;
    const R = ReactiveVar('BLAH');
    tmpl.helpers({
      foo: function () {
        return R.get();
      },
    });
    const div = renderToDiv(tmpl);

    document.body.appendChild(div);

    const input = div.querySelector('input');
    test.equal(input.value, 'BLAH');

    const setSelection = function (startEnd) {
      startEnd = startEnd.split(' ');
      if (typeof input.selectionStart === 'number') {
        // all but IE < 9
        input.selectionStart = startEnd[0];
        input.selectionEnd = startEnd[1];
      } else {
        // IE 8
        input.focus();
        const r = input.createTextRange();
        // move the start and end of the range to the beginning
        // of the input field
        r.moveStart('textedit', -1);
        r.moveEnd('textedit', -1);
        // move the start and end a certain number of characters
        // (relative to their current position)
        r.moveEnd('character', startEnd[1]);
        r.moveStart('character', startEnd[0]);
        r.select();
      }
    };
    const getSelection = function () {
      if (typeof input.selectionStart === 'number') {
        // all but IE < 9
        return input.selectionStart + ' ' + input.selectionEnd;
      } else {
        // IE 8
        input.focus();
        const r = document.selection.createRange();
        const fullText = input.value;
        let start, end;
        if (r.text) {
          // one or more characters are selected.
          // this is kind of hacky!  Relies on fullText
          // not having duplicate letters, for example.
          start = fullText.indexOf(r.text);
          end = start + r.text.length;
        } else {
          r.moveStart('textedit', -1);
          start = end = r.text.length;
        }
        return start + ' ' + end;
      }
    };

    setSelection('2 3');
    test.equal(getSelection(), '2 3');
    // At this point, we COULD confirm that setting input.value to
    // the same thing as before ("BLAH") loses the insertion
    // point (per browser behavior).  However, it doesn't on Firefox.
    // So we set it to something different, which verifies that our
    // test machinery is correct.
    input.value = 'BLAN';
    // test that insertion point is lost
    const selectionAfterSet = getSelection();
    if (selectionAfterSet !== '0 0')
      // IE 8
      test.equal(getSelection(), '4 4');

    // now make the input say "BLAH" but the AttributeHandler
    // says "OTHER" (so we can make it do the no-op update)
    R.set('OTHER');
    Tracker.flush();
    test.equal(input.value, 'OTHER');
    input.value = 'BLAH';
    setSelection('2 2');

    R.set('BLAH');
    Tracker.flush();
    test.equal(input.value, 'BLAH');
    // test that didn't lose insertion point!
    test.equal(getSelection(), '2 2');

    // clean up after ourselves
    document.body.removeChild(div);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - contentBlock back-compat',
  function (test) {
    // adapted from another test, but this time make sure `UI.contentBlock`
    // and `UI.elseBlock` correctly behave as `Template.contentBlock`
    // and `Template.elseBlock`.

    const tmpl = Template.spacebars_template_test_content_backcompat;
    const R = ReactiveVar(true);
    tmpl.helpers({
      flag: function () {
        return R.get();
      },
    });
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'hello');
    R.set(false);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'world');
    R.set(true);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'hello');
  }
);

// For completeness (of coverage), make sure the code that calls
// `Template.contentBlock` in the correct scope also causes
// the old `UI.contentBlock` to be called in the correct scope.
Tinytest.add(
  'spacebars-tests - template_tests - content context back-compat',
  function (test) {
    const tmpl = Template.spacebars_template_test_content_context_backcompat;
    const R = ReactiveVar(true);
    tmpl.helpers({
      foo: {
        firstLetter: 'F',
        secondLetter: 'O',
        bar: {
          cond: function () {
            return R.get();
          },
          firstLetter: 'B',
          secondLetter: 'A',
        },
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'BO');
    R.set(false);
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'FA');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - falsy helper',
  function (test) {
    const tmpl = Template.spacebars_template_test_falsy_helper;
    tmpl.helpers({ foo: 0 });
    Template.registerHelper('GLOBAL_ZERO', 0);

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'foo:0 GLOBAL_ZERO:0');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - old-style helpers',
  function (test) {
    const tmpl = Template.spacebars_template_test_oldstyle_helpers;
    tmpl._NOWARN_OLDSTYLE_HELPERS = true;

    // Test old-style helper
    tmpl.foo = 'hello';
    let div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'hello');

    // Test that replacing a helper still works (i.e. we don't cache them).
    // We can change this behavior if we need to, but it is more breaking
    // to do so.  It breaks some unit tests, for example.
    tmpl.foo = 'world';
    div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'world');

    // Test that you can delete an old-style helper with `delete`.
    // As with the previous case, we can break this functionality, but
    // we should do it intentionally.
    delete tmpl.foo;
    div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - with data remove (#3130)',
  function (test) {
    const tmpl = Template.spacebars_template_test_with_data_remove;

    const div = document.createElement('DIV');
    const theWith = Blaze.renderWithData(tmpl, { foo: 3130 }, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<b>some data - 3130</b>');
    const view = Blaze.getView(div.querySelector('b'));
    test.isFalse(theWith.isDestroyed);
    Blaze.remove(view);
    test.isTrue(theWith.isDestroyed);
    test.equal(div.innerHTML, '');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - inclusion with data remove (#3130)',
  function (test) {
    const tmpl = Template.spacebars_template_test_inclusion_with_data_remove;

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '<span><b>stuff</b></span>');
    const view = Blaze.getView(div.querySelector('b'));
    const parentView = view.parentView;
    test.isTrue(parentView.__isTemplateWith);
    test.isFalse(parentView.isDestroyed);
    Blaze.remove(view);
    test.isTrue(parentView.isDestroyed);
    test.equal(canonicalizeHtml(div.innerHTML), '<span></span>');
  }
);

Tinytest.add(
  "spacebars-tests - template_tests - custom block helper doesn't break Template.instance() (#3540)",
  function (test) {
    const tmpl = Template.spacebars_template_test_template_instance_wrapper_outer;

    tmpl.helpers({
      thisShouldOutputHello: function () {
        return Template.instance().customProp;
      },
    });

    tmpl.created = function () {
      this.customProp = 'hello';
    };

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'hello hello');
  }
);

testAsyncMulti(
  'spacebars-tests - template_tests - template-level subscriptions',
  [
    function (test, expect) {
      const tmpl = Template.spacebars_template_test_template_level_subscriptions;
      let tmplInstance;
      let div;

      // Make sure the subscriptions stop when the template is destroyed
      const stopCallback = expect();
      const stopCallback2 = expect();

      const futureId = Random.id();

      // Make sure the HTML is what we expect when one subscription is ready
      const checkOneReady = expect(function () {
        test.equal(canonicalizeHtml(div.innerHTML), '');
        Meteor.call('makeTemplateSubReady', futureId);
      });

      // Make sure the HTML is what we expect when both subscriptions are ready
      const checkBothReady = expect(function () {
        test.equal(canonicalizeHtml(div.innerHTML), 'ready! true');

        // This will call the template's destroyed callback
        Blaze.remove(tmplInstance.view);
      });

      let subscriptionsFinished = 0;

      // Manually use the subscribe ready callback to make sure the template is
      // doing the right thing
      const subscribeCallback = expect(function () {
        subscriptionsFinished++;

        if (subscriptionsFinished === 1) {
          // We need to use Tracker.afterFlush here and Tracker.flush doesn't work
          // because we need to wait for the other callback to fire (the one that
          // makes ready return true) _and_ we need the UI to rerender
          Tracker.afterFlush(checkOneReady);
        }

        if (subscriptionsFinished === 2) {
          Tracker.afterFlush(checkBothReady);
        }
      });

      tmpl.onCreated(function () {
        const subHandle = this.subscribe('templateSub', subscribeCallback);
        const subHandle2 = this.subscribe('templateSub', futureId, {
          onReady: subscribeCallback,
          connection: Meteor.connection,
        });

        subHandle.stop = stopCallback;
        subHandle2.stop = stopCallback2;

        tmplInstance = this;
      });

      // Insertion point
      div = renderToDiv(tmpl);

      // To start, there is no content because the template isn't ready
      test.equal(canonicalizeHtml(div.innerHTML), '');
    },
  ]
);

testAsyncMulti(
  "spacebars-tests - template_tests - template-level subscriptions don't resubscribe unnecessarily",
  [
    function (test, expect) {
      const tmpl =
        Template.spacebars_template_test_template_level_subs_resubscribe;
      let subHandle;
      const trueThenFalse = new ReactiveVar(true);

      tmpl.helpers({
        ifArg: function () {
          return trueThenFalse.get();
        },
        subscribingHelper1: expect(function () {
          subHandle = Template.instance().subscribe('templateSub');
        }),
        subscribingHelper2: expect(function () {
          const subHandle2 = Template.instance().subscribe('templateSub');
          test.isTrue(subHandle.subscriptionId === subHandle2.subscriptionId);

          // Make sure we didn't add two subscription handles to our internal list
          test.equal(
            Object.keys(Template.instance()._subscriptionHandles).length,
            1
          );
        }),
      });

      renderToDiv(tmpl);
      Tracker.flush();
      trueThenFalse.set(false);
    },
  ]
);

Tinytest.add(
  'spacebars-tests - template_tests - old #each sets data context',
  function (test) {
    const tmpl = Template.spacebars_template_test_old_each_data_context;
    tmpl.helpers({
      items: [{ text: 'a' }, { text: 'b' }],
    });

    const div = document.createElement('DIV');
    const theWith = Blaze.render(tmpl, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<div>a</div><div>b</div>');
    const view = Blaze.getView(div.querySelector('div'));
    Blaze.remove(view);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - new #each extends data context',
  function (test) {
    const tmpl = Template.spacebars_template_test_new_each_data_context;
    tmpl.helpers({
      dataContext: function () {
        return {
          items: [{ text: 'a' }, { text: 'b' }],
          toplevel: 'XYZ',
        };
      },
    });

    const div = document.createElement('DIV');
    const theWith = Blaze.render(tmpl, div);
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<div>a -- XYZ</div><div>b -- XYZ</div>'
    );
    const view = Blaze.getView(div.querySelector('div'));
    Blaze.remove(view);
  }
);

// Same as above, but now the argument to each in has a subexpression
Tinytest.add(
  'spacebars-tests - template_tests - new #each with subexpression (#5137)',
  function (test) {
    const tmpl = Template.spacebars_template_test_new_each_data_context_subexpr;
    tmpl.helpers({
      dataContext: function () {
        return {
          items: [{ text: 'a' }, { text: 'b' }],
          toplevel: 'XYZ',
        };
      },
    });

    const div = document.createElement('DIV');
    const theWith = Blaze.render(tmpl, div);
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<div>a -- XYZ</div><div>b -- XYZ</div>'
    );
    const view = Blaze.getView(div.querySelector('div'));
    Blaze.remove(view);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - new #each binding lookup is scoped to the template',
  function (test) {
    const tmpl = Template.spacebars_template_test_new_each_lookup_top_level;
    tmpl.helpers({
      dataContext: function () {
        return {
          letter_a: ['a'],
          subcontext: {
            letter_b: ['b'],
          },
        };
      },
    });

    const div = document.createElement('DIV');
    const theWith = Blaze.render(tmpl, div);
    test.equal(canonicalizeHtml(div.innerHTML), '<div>a</div>');
    const view = Blaze.getView(div.querySelector('div'));
    Blaze.remove(view);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - let bindings',
  function (test) {
    const tmpl = Template.spacebars_template_test_let_bindings;

    const v = new ReactiveVar('var');
    tmpl.helpers({
      dataContext: function () {
        return {
          varFromContext: 'from context',
          anotherVarFromContext: 'another var from context',
        };
      },
      helper: function () {
        return v.get();
      },
    });

    const div = document.createElement('DIV');
    const theWith = Blaze.render(tmpl, div);
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<div>var -- var -- from context -- override</div>'
    );

    v.set('new var');
    Tracker.flush();
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<div>new var -- new var -- from context -- override</div>'
    );

    const view = Blaze.getView(div.querySelector('div'));
    Blaze.remove(view);
  }
);

Tinytest.addAsync(
  'spacebars-tests - template_tests - #each @index',
  async function (test) {
    const tmpl = Template.spacebars_template_test_each_index;

    const c = new Mongo.Collection();
    await c.insertAsync({ num: 2 });
    await c.insertAsync({ num: 4 });
    tmpl.helpers({
      things: function () {
        return c.find({}, { sort: { num: 1 } });
      },
    });

    const div = document.createElement('DIV');
    const theEach = Blaze.render(tmpl, div);
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<span>0 - 2</span><span>1 - 4</span>'
    );

    await c.insertAsync({ num: 1 });
    Tracker.flush();
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<span>0 - 1</span><span>1 - 2</span><span>2 - 4</span>'
    );

    const three = await c.insertAsync({ num: 3 });
    Tracker.flush();
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<span>0 - 1</span><span>1 - 2</span><span>2 - 3</span><span>3 - 4</span>'
    );

    await c.updateAsync(three, { num: 0 });
    Tracker.flush();
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<span>0 - 0</span><span>1 - 1</span><span>2 - 2</span><span>3 - 4</span>'
    );

    await c.removeAsync(three);
    Tracker.flush();
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<span>0 - 1</span><span>1 - 2</span><span>2 - 4</span>'
    );

    const view = Blaze.getView(div.querySelector('span'));
    Blaze.remove(view);
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - nested expressions',
  function (test) {
    const tmpl = Template.spacebars_template_test_nested_exprs;

    tmpl.helpers({
      add: function (a, b) {
        return a + b;
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), '6');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - nested sub-expressions',
  function (test) {
    const tmpl = Template.spacebars_template_test_nested_subexprs;

    const sentence = new ReactiveVar("can't even imagine a world without Light");
    tmpl.helpers({
      capitalize: function (str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
      },
      firstWord: function (sentence) {
        return sentence.split(' ')[0];
      },
      generateSentence: function () {
        return sentence.get();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), "Can't");

    sentence.set('that would be quite dark');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'That');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - expressions as keyword args',
  function (test) {
    const tmpl = Template.spacebars_template_test_exprs_keyword;

    const name = new ReactiveVar('light');
    tmpl.helpers({
      capitalize: function (str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
      },
      name: function () {
        return name.get();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), 'Light Mello');

    name.set('misa');
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), 'Misa Mello');
  }
);

const testDoesntRerender = function (test, which) {
  const tmpl = {
    WITH: Template.spacebars_template_test_with_rerender,
    LET: Template.spacebars_template_test_let_rerender,
  }[which];

  const x = new ReactiveVar('aaa');
  tmpl.helpers({
    x: function () {
      return x.get();
    },
  });

  const div = renderToDiv(tmpl);
  const input = div.querySelector('input.foo');
  const span = div.querySelector('span.bar');
  test.isTrue(input && input.className === 'foo');
  test.isTrue(span && span.className === 'bar');
  test.equal(canonicalizeHtml(span.innerHTML), 'aaa');

  x.set('bbb');
  Tracker.flush();
  // make sure the input and span are still the same, but the new
  // value of x is reflected
  const input2 = div.querySelector('input.foo');
  const span2 = div.querySelector('span.bar');
  test.isTrue(input2 === input, 'input');
  test.isTrue(span2 === span, 'span');
  test.equal(canonicalizeHtml(span2.innerHTML), 'bbb');
};

Tinytest.add(
  "spacebars-tests - template_tests - #with doesn't re-render template",
  function (test) {
    testDoesntRerender(test, 'WITH');
  }
);

Tinytest.add(
  "spacebars-tests - template_tests - #let doesn't re-render template",
  function (test) {
    testDoesntRerender(test, 'LET');
  }
);

Tinytest.add(
  'spacebars-tests - template_tests - #each takes multiple arguments',
  function (test) {
    const tmpl = Template.spacebars_template_test_each_multiarg;
    tmpl.helpers({
      arg: ['a', 'b', 'c'],
      helper: function (x) {
        return x;
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<div>a</div><div>b</div><div>c</div>'
    );
  }
);

Tinytest.add(
  "spacebars-tests - template_tests - lexical scope doesn't leak",
  function (test) {
    // make sure '@index' doesn't leak into subtemplates
    const tmpl = Template.spacebars_template_test_lexical_leakage;
    tmpl.helpers({
      list: ['a', 'b', 'c'],
    });

    test.throws(function () {
      const div = renderToDiv(tmpl);
    }, /Unsupported directive/);
  }
);

// PR #5138
Tinytest.add(
  'spacebars-tests - template_tests - multiple arguments in each-in',
  function (test) {
    const tmpl = Template.spacebars_template_test_each_in_multi_args;
    tmpl.helpers({
      list: ['a', 'b', 'c'],
      helper: function (list) {
        return list.reverse();
      },
    });

    const div = renderToDiv(tmpl);
    test.equal(
      canonicalizeHtml(div.innerHTML),
      '<div>c</div><div>b</div><div>a</div>'
    );
  }
);
