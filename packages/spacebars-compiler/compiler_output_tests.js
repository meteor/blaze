export function runCompilerOutputTests(run) {
  run("abc", `function () {
  var view = this;
  return "abc";
}`);
  run("{{foo}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"));
  });
}`);
  run("{{foo bar}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"),
                              view.lookup("bar"));
  });
}`);
  run("{{foo x=bar}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"), Spacebars.kw({
      x: view.lookup("bar")
    }));
  });
}`);
  run("{{foo.bar baz}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo.bar", function() {
    return Spacebars.mustache(Spacebars.dot(
             view.lookup("foo"), "bar"),
             view.lookup("baz"));
  });
}`);
  run("{{foo.bar (baz qux)}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo.bar", function() {
    return Spacebars.mustache(Spacebars.dot(
             view.lookup("foo"), "bar"),
             Spacebars.dataMustache(view.lookup("baz"), view.lookup("qux")));
  });
}`);
  run("{{foo bar.baz}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"),
           Spacebars.dot(view.lookup("bar"), "baz"));
  });
}`);
  run("{{foo x=bar.baz}}", `function() {
  var view = this;
  return Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"), Spacebars.kw({
      x: Spacebars.dot(view.lookup("bar"), "baz")
    }));
  });
}`);
  run("{{#foo}}abc{{/foo}}", `function() {
  var view = this;
  return Spacebars.include(view.lookupTemplate("foo"), (function() {
    return "abc";
  }));
}`);
  run("{{#if cond}}aaa{{else}}bbb{{/if}}", `function() {
  var view = this;
  return Blaze.If(function () {
    return Spacebars.call(view.lookup("cond"));
  }, (function() {
    return "aaa";
  }), (function() {
    return "bbb";
  }));
}`);
  run("{{!-- --}}{{#if cond}}aaa{{!\n}}{{else}}{{!}}bbb{{!-- --}}{{/if}}{{!}}", `function() {
  var view = this;
  return Blaze.If(function () {
    return Spacebars.call(view.lookup("cond"));
  }, (function() {
    return "aaa";
  }), (function() {
    return "bbb";
  }));
}`);
  run("{{!-- --}}{{#if cond}}<p>aaa</p><p>ppp</p>{{!\n}}{{else}}{{!}}<p>{{bbb}}</p>{{!-- --}}{{/if}}{{!}}", `function() {
  var view = this;
  return Blaze.If(function () {
    return Spacebars.call(view.lookup("cond"));
  }, (function() {
    return HTML.Raw("<p>aaa</p><p>ppp</p>");
  }), (function() {
    return HTML.P(Blaze.View("lookup:bbb", function() {
      return Spacebars.mustache(view.lookup("bbb"));
    }));
  }));
}`);
  run("{{> foo bar}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("bar"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}`);
  run("{{> foo x=bar}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      x: Spacebars.call(view.lookup("bar"))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}
`);
  run("{{> foo bar.baz}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("bar"), "baz"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}`);
  run("{{> foo x=bar.baz}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      x: Spacebars.call(Spacebars.dot(view.lookup("bar"), "baz"))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}`);
  run("{{> foo bar baz}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.dataMustache(view.lookup("bar"), view.lookup("baz"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"));
  });
}
`);
  run("{{#foo bar baz}}aaa{{/foo}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.dataMustache(view.lookup("bar"), view.lookup("baz"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"), (function() {
      return "aaa";
    }));
  });
}`);
  run("{{#foo p.q r.s}}aaa{{/foo}}", `function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.dataMustache(Spacebars.dot(view.lookup("p"), "q"), Spacebars.dot(view.lookup("r"), "s"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("foo"), (function() {
      return "aaa";
    }));
  });
}`);
  run("<a {{b}}></a>", `function() {
  var view = this;
  return HTML.A(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("b"));
  }));
}`);
  run("<a {{b}} c=d{{e}}f></a>", `function() {
  var view = this;
  return HTML.A(HTML.Attrs({
    c: (function() { return [
      "d",
      Spacebars.mustache(view.lookup("e")),
      "f" ]; })
  }, function() {
    return Spacebars.attrMustache(view.lookup("b"));
  }));
}`);
  run("<asdf>{{foo}}</asdf>", `function() {
  var view = this;
  return HTML.getTag("asdf")(Blaze.View("lookup:foo", function() {
    return Spacebars.mustache(view.lookup("foo"));
  }));
}`);
  run("<textarea>{{foo}}</textarea>", `function() {
  var view = this;
  return HTML.TEXTAREA({value: (function () {
    return Spacebars.mustache(view.lookup("foo"));
  }) });
}`);
  run("<textarea>{{{{|{{|foo}}</textarea>", `function() {
  var view = this;
  return HTML.TEXTAREA({value: (function () {
    return [ "{{{{", "{{", "foo}}" ];
  }) });
}`);
  run("{{|foo}}", `function() {
  var view = this;
  return [ "{{", "foo}}" ];
}`);
  run("<a b={{{|></a>", `function() {
  var view = this;
  return HTML.A({
    b: (function () {
      return "{{{";
    })
  });
}`);
  run("<div><div>{{helper}}<div>a</div><div>b</div></div></div>", `function() {
  var view = this;
  return HTML.DIV(HTML.DIV(Blaze.View("lookup:helper",function(){
      return Spacebars.mustache(view.lookup("helper"));
  }), HTML.Raw("<div>a</div><div>b</div>")));
}`);
  run("<table><colgroup><col></colgroup><tr><td>aaa</td><td>bbb</td></tr></table>", `function() {
  var view = this;
  return HTML.TABLE(
    HTML.Raw("<colgroup><col></colgroup>"),
    HTML.TR(HTML.Raw("<td>aaa</td><td>bbb</td>"))
  );
}`);
  run(`<div>
    {{helper}}
</div>`, `function() {
  var view = this;
  return HTML.DIV(
    "\\n    ",
    Blaze.View("lookup:helper",function(){
      return Spacebars.mustache(view.lookup("helper"));
    }),
    "\\n"
  );
}`);
  run(`<div>
    {{helper}}
</div>`, `function() {
  var view = this;
  return HTML.DIV(
    Blaze.View("lookup:helper",function(){
      return Spacebars.mustache(view.lookup("helper"));
    })
  );
}`, 'strip');
  run(`<div>
    {{helper}}
    <span>Test</span> <span>Spaces</span>
</div>`, `function() {
  var view = this;
  return HTML.DIV(
    Blaze.View("lookup:helper",function(){
      return Spacebars.mustache(view.lookup("helper"));
    }),
    HTML.Raw("<span>Test</span> <span>Spaces</span>")
  );
}`, 'strip');
}
