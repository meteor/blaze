Tinytest.add(
  "spacebars - ui-dynamic-template - render template dynamically", function (test, expect) {
    const tmpl = Template.ui_dynamic_test;

    const nameVar = new ReactiveVar;
    const dataVar = new ReactiveVar;
    tmpl.helpers({
      templateName: function () {
        return nameVar.get();
      },
      templateData: function () {
        return dataVar.get();
      }
    });

    // No template chosen
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), "");

    // Choose the "ui-dynamic-test-sub" template, with no data context
    // passed in.
    nameVar.set("ui_dynamic_test_sub");
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "test");

    // Set a data context.
    dataVar.set({ foo: "bar" });
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "testbar");
  });

// Same test as above, but the {{> Template.dynamic}} inclusion has no
// `dataContext` argument.
Tinytest.add(
  "spacebars - ui-dynamic-template - render template dynamically, no data context",
  function (test, expect) {
    const tmpl = Template.ui_dynamic_test_no_data;

    const nameVar = new ReactiveVar;
    tmpl.helpers({
      templateName: function () {
        return nameVar.get();
      }
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), "");

    nameVar.set("ui_dynamic_test_sub");
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "test");
  });


Tinytest.add(
  "spacebars - ui-dynamic-template - render template " +
    "dynamically, data context gets inherited",
  function (test, expect) {
    const tmpl = Template.ui_dynamic_test_inherited_data;

    const nameVar = new ReactiveVar();
    const dataVar = new ReactiveVar();
    tmpl.helpers({
      templateName: function () {
        return nameVar.get();
      },
      context: function () {
        return dataVar.get();
      }
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), "");

    nameVar.set("ui_dynamic_test_sub");
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "test");

    // Set the top-level template's data context; this should be
    // inherited by the dynamically-chosen template, since the {{>
    // Template.dynamic}} inclusion didn't include a data argument.
    dataVar.set({ foo: "bar" });
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "testbar");
  }
);

Tinytest.add(
  "spacebars - ui-dynamic-template - render template dynamically with contentBlock", function (test, expect) {
    const tmpl = Template.ui_dynamic_test_contentblock;

    const nameVar = new ReactiveVar;
    const dataVar = new ReactiveVar;
    tmpl.helpers({
      templateName: function () {
        return nameVar.get();
      },
      templateData: function () {
        return dataVar.get();
      }
    });

    // No template chosen
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), "");

    // Choose the "ui-dynamic-test-sub" template, with no data context
    // passed in.
    nameVar.set("ui_dynamic_test_sub_contentblock");
    Tracker.flush({_throwFirstError: true});
    test.equal(canonicalizeHtml(div.innerHTML), "testcontentBlock");

    // Set a data context.
    dataVar.set({ foo: "bar" });
    Tracker.flush({_throwFirstError: true});
    test.equal(canonicalizeHtml(div.innerHTML), "testbarcontentBlock");
  });

// Same test as above, but the {{> Template.dynamic}} inclusion has no
// `dataContext` argument.
Tinytest.add(
  "spacebars - ui-dynamic-template - render template dynamically with contentBlock, no data context",
  function (test, expect) {
    const tmpl = Template.ui_dynamic_test_contentblock_no_data;

    const nameVar = new ReactiveVar;
    tmpl.helpers({
      templateName: function () {
        return nameVar.get();
      }
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), "");

    nameVar.set("ui_dynamic_test_sub_contentblock");
    Tracker.flush({_throwFirstError: true});
    test.equal(canonicalizeHtml(div.innerHTML), "testcontentBlock");
  });

Tinytest.add(
  "spacebars - ui-dynamic-template - render template " +
    "dynamically, data context does not get inherited if " +
    "falsey context is passed in",
  function (test, expect) {
    const tmpl = Template.ui_dynamic_test_falsey_inner_context;

    const nameVar = new ReactiveVar();
    const dataVar = new ReactiveVar();
    tmpl.helpers({
      templateName: function () {
        return nameVar.get();
      },
      context: function () {
        return dataVar.get();
      }
    });

    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), "");

    nameVar.set("ui_dynamic_test_sub");
    Tracker.flush();
    // Even though the data context is falsey, we DON'T expect the
    // subtemplate to inherit the data context from the parent template.
    test.equal(canonicalizeHtml(div.innerHTML), "test");
  }
);

Tinytest.add(
  "spacebars - ui-dynamic-template - render template " +
    "dynamically, bad arguments",
  function (test, expect) {
    const tmplPrefix = "ui_dynamic_test_bad_args";
    const errors = [
      "Must specify 'template' as an argument",
      "Must specify 'template' as an argument",
      "Invalid argument to {{> Template.dynamic}}"
    ];

    for (let i = 0; i < 3; i++) {
      const tmpl = Template[tmplPrefix + i];
      test.throws(function () {
        Blaze._throwNextException = true;
        const div = renderToDiv(tmpl);
      });
    }
  }
);

Tinytest.add(
  "spacebars - ui-dynamic-template - render template " +
    "dynamically, falsey context",
  function (test, expect) {
    const tmpl = Template.ui_dynamic_test_falsey_context;
    const subtmpl = Template.ui_dynamic_test_falsey_context_sub;

    let subtmplContext;
    subtmpl.helpers({foo: function () {
      subtmplContext = this;
    }});
    const div = renderToDiv(tmpl);

    // Because `this` can only be an object, Blaze normalizes falsey
    // data contexts to {}.
    test.equal(subtmplContext, {});
  }
);

Tinytest.add(
  "spacebars - ui-dynamic-template - back-compat", function (test, expect) {
    const tmpl = Template.ui_dynamic_backcompat;

    const nameVar = new ReactiveVar;
    const dataVar = new ReactiveVar;
    tmpl.helpers({
      templateName: function () {
        return nameVar.get();
      },
      templateData: function () {
        return dataVar.get();
      }
    });

    // No template chosen
    const div = renderToDiv(tmpl);
    test.equal(canonicalizeHtml(div.innerHTML), "");

    // Choose the "ui-dynamic-test-sub" template, with no data context
    // passed in.
    nameVar.set("ui_dynamic_test_sub");
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "test");

    // Set a data context.
    dataVar.set({ foo: "bar" });
    Tracker.flush();
    test.equal(canonicalizeHtml(div.innerHTML), "testbar");
  });
