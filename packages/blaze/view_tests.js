if (Meteor.isClient) {

  Tinytest.add("blaze - view - callbacks", function (test) {
    var R = ReactiveVar('foo');

    var buf = '';

    var v = Blaze.View(function () {
      return R.get();
    });

    v.onViewCreated(function () {
      buf += 'c' + v.renderCount;
    });
    v._onViewRendered(function () {
      buf += 'r' + v.renderCount;
    });
    v.onViewReady(function () {
      buf += 'y' + v.renderCount;
    });
    v.onViewDestroyed(function () {
      buf += 'd' + v.renderCount;
    });

    test.equal(buf, '');

    var div = document.createElement("DIV");
    test.isFalse(v.isRendered);
    test.isFalse(v._isAttached);
    test.equal(canonicalizeHtml(div.innerHTML), "");
    test.throws(function () { v.firstNode(); }, /View must be attached/);
    test.throws(function () { v.lastNode(); }, /View must be attached/);
    Blaze.render(v, div);
    test.equal(buf, 'c0r1');
    test.equal(typeof (v.firstNode().nodeType), "number");
    test.equal(typeof (v.lastNode().nodeType), "number");
    test.isTrue(v.isRendered);
    test.isTrue(v._isAttached);
    test.equal(buf, 'c0r1');
    test.equal(canonicalizeHtml(div.innerHTML), "foo");
    Tracker.flush();
    test.equal(buf, 'c0r1y1');

    R.set("bar");
    Tracker.flush();
    test.equal(buf, 'c0r1y1r2y2');
    test.equal(canonicalizeHtml(div.innerHTML), "bar");

    Blaze.remove(v);
    test.equal(buf, 'c0r1y1r2y2d2');
    test.equal(canonicalizeHtml(div.innerHTML), "");

    buf = "";
    R.set("baz");
    Tracker.flush();
    test.equal(buf, "");
  });

  // this checks, whether a DOMRange is correctly marked as
  // desroyed after Blaze.remove has destroyed 
  // the corresponding view
  Tinytest.add("blaze - view - destroy", function (test) {
    var v = {
      _domrange: Blaze._DOMRange([])
    };
    v._domrange.view = Blaze.View();
    test.equal(v._domrange.view.isDestroyed, false);
    Blaze.remove(v);
    test.equal(v._domrange.view.isDestroyed, true);
  });
  
  // this checks, whether an unattached DOMRange notifies
  // correctly about it's root cause, when throwing due to an event
  Tinytest.add("blaze - view - attached", function (test) {
    test.throws(() => Blaze._DOMRange.prototype.containsElement.call({attached: false, view: {name: 'Template.foo'}}, undefined, '.class', 'click'), 
    `click event triggerd with .class on foo but associated view is not be found.
    Make sure the event doesn't destroy the view.`);
  });
}
