// These run on both client and server with the same expected strings, so a
// template compiled for the server must render exactly as it does on the client.

Tinytest.add('templating-runtime - server rendering - compiled template renders to HTML', function (test) {
  test.equal(Blaze.toHTML(Template.server_render_test_static), '<p class="greeting">Hello</p>');
});

Tinytest.add('templating-runtime - server rendering - data context is escaped in text and attributes', function (test) {
  const html = Blaze.toHTMLWithData(Template.server_render_test_data, {
    tip: 'say "hi" & bye',
    title: '<script>alert(1)</script> & co',
    raw: '<em>trusted</em>'
  });

  test.equal(html, '<h1 title="say &quot;hi&quot; &amp; bye">&lt;script>alert(1)&lt;/script> &amp; co</h1><div><em>trusted</em></div>');
});

Tinytest.add('templating-runtime - server rendering - block helpers expand', function (test) {
  const tmpl = Template.server_render_test_flow;
  const owner = { name: 'owner' };

  test.equal(
    Blaze.toHTMLWithData(tmpl, { show: true, items: [{ name: 'a' }, { name: 'b' }], owner }),
    '<b>yes</b><ul><li>a</li><li>b</li></ul><ol><li>a</li><li>b</li></ol><span>owner</span>'
  );
  test.equal(
    Blaze.toHTMLWithData(tmpl, { show: false, items: [], owner }),
    '<b>no</b><i>hidden</i><ul></ul><ol></ol><span>owner</span>'
  );
});

Tinytest.add('templating-runtime - server rendering - helpers and inclusion arguments', function (test) {
  Template.server_render_test_parent.helpers({
    greeting() {
      return `Hi ${this.user}`;
    }
  });

  test.equal(
    Blaze.toHTMLWithData(Template.server_render_test_parent, { user: 'Ann' }),
    '<section><span>Hi Ann!</span></section>'
  );
});

if (Meteor.isServer) {
  // server_render_body_tests.html has a <body> with attributes: on the server its
  // body code must be skipped, or loading the file would reach for `document`.
  Tinytest.add('templating-runtime - server rendering - templates next to a <body> load on the server', function (test) {
    test.equal(Blaze.toHTML(Template.server_render_test_beside_body), '<p>beside body</p>');
  });
}
