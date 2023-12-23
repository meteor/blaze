/* eslint-env meteor */
import { HTML } from 'meteor/htmljs';
import { HTMLTools } from 'meteor/html-tools';
import { BlazeTools } from 'meteor/blaze-tools';

const { Scanner } = HTMLTools;
const { getContent } = HTMLTools.Parse;

const { CharRef } = HTML;
const { Comment } = HTML;
const { TemplateTag } = HTMLTools;
const { Attrs } = HTML;

const { BR } = HTML;
const { HR } = HTML;
const { INPUT } = HTML;
const { A } = HTML;
const { DIV } = HTML;
const { P } = HTML;
const { TEXTAREA } = HTML;
const { SCRIPT } = HTML;
const { STYLE } = HTML;

Tinytest.add('html-tools - parser getContent', function (test) {
  const succeed = function (input, expected) {
    let endPos = input.indexOf('^^^');
    if (endPos < 0) endPos = input.length;

    const scanner = new Scanner(input.replace('^^^', ''));
    const result = getContent(scanner);
    test.equal(scanner.pos, endPos);
    test.equal(BlazeTools.toJS(result), BlazeTools.toJS(expected));
  };

  const fatal = function (input, messageContains) {
    const scanner = new Scanner(input);
    let error;
    try {
      getContent(scanner);
    } catch (e) {
      error = e;
    }
    test.isTrue(error);
    if (messageContains) test.isTrue(messageContains && error.message.indexOf(messageContains) >= 0, error.message);
  };


  succeed('', null);
  succeed('abc', 'abc');
  succeed('abc^^^</x>', 'abc');
  succeed('a&lt;b', ['a', CharRef({ html: '&lt;', str: '<' }), 'b']);
  succeed('<!-- x -->', Comment(' x '));
  succeed('&acE;', CharRef({ html: '&acE;', str: '\u223e\u0333' }));
  succeed('&zopf;', CharRef({ html: '&zopf;', str: '\ud835\udd6b' }));
  succeed('&&>&g&gt;;', ['&&>&g', CharRef({ html: '&gt;', str: '>' }), ';']);

  // Can't have an unescaped `&` if followed by certain names like `gt`
  fatal('&gt&');
  // tests for other failure cases
  fatal('<');

  succeed('<br>', BR());
  succeed('<br/>', BR());
  fatal('<div/>', 'self-close');

  succeed('<hr id=foo>', HR({ id: 'foo' }));
  succeed('<hr id=&lt;foo&gt;>', HR({ id: [CharRef({ html: '&lt;', str: '<' }),
                                         'foo',
                                         CharRef({ html: '&gt;', str: '>' })] }));
  succeed('<input selected>', INPUT({ selected: '' }));
  succeed('<input selected/>', INPUT({ selected: '' }));
  succeed('<input selected />', INPUT({ selected: '' }));
  const FOO = HTML.getTag('foo');
  succeed('<foo bar></foo>', FOO({ bar: '' }));
  succeed('<foo bar baz ></foo>', FOO({ bar: '', baz: '' }));
  succeed('<foo bar=x baz qux=y blah ></foo>',
          FOO({ bar: 'x', baz: '', qux: 'y', blah: '' }));
  succeed('<foo bar="x" baz qux="y" blah ></foo>',
          FOO({ bar: 'x', baz: '', qux: 'y', blah: '' }));
  fatal('<input bar"baz">');
  fatal('<input x="y"z >');
  fatal('<input x=\'y\'z >');
  succeed('<br x=&&&>', BR({ x: '&&&' }));
  succeed('<br><br><br>', [BR(), BR(), BR()]);
  succeed('aaa<br>\nbbb<br>\nccc<br>', ['aaa', BR(), '\nbbb', BR(), '\nccc', BR()]);

  succeed('<a></a>', A());
  fatal('<');
  fatal('<a');
  fatal('<a>');
  fatal('<a><');
  fatal('<a></');
  fatal('<a></a');

  succeed('<a href="http://www.apple.com/">Apple</a>',
          A({ href: 'http://www.apple.com/' }, 'Apple'));

  (function () {
    const a = HTML.getTag('a');
    const b = HTML.getTag('b');
    const c = HTML.getTag('c');
    const d = HTML.getTag('d');

    succeed('<a>1<b>2<c>3<d>4</d>5</c>6</b>7</a>8',
            [a('1', b('2', c('3', d('4'), '5'), '6'), '7'), '8']);
  }());

  fatal('<b>hello <i>there</b> world</i>');

  // XXX support implied end tags in cases allowed by the spec
  fatal('<p>');

  fatal('<a>Foo</a/>');
  fatal('<a>Foo</a b=c>');

  succeed('<textarea>asdf</textarea>', TEXTAREA({ value: 'asdf' }));
  succeed('<textarea x=y>asdf</textarea>', TEXTAREA({ x: 'y', value: 'asdf' }));
  succeed('<textarea><p></textarea>', TEXTAREA({ value: '<p>' }));
  succeed('<textarea>a&amp;b</textarea>',
          TEXTAREA({ value: ['a', CharRef({ html: '&amp;', str: '&' }), 'b'] }));
  succeed('<textarea></textarea</textarea>', TEXTAREA({ value: '</textarea' }));
  // absorb up to one initial newline, as per HTML parsing spec
  succeed('<textarea>\n</textarea>', TEXTAREA());
  succeed('<textarea>\nasdf</textarea>', TEXTAREA({ value: 'asdf' }));
  succeed('<textarea>\n\nasdf</textarea>', TEXTAREA({ value: '\nasdf' }));
  succeed('<textarea>\n\n</textarea>', TEXTAREA({ value: '\n' }));
  succeed('<textarea>\nasdf\n</textarea>', TEXTAREA({ value: 'asdf\n' }));
  succeed('<textarea><!-- --></textarea>', TEXTAREA({ value: '<!-- -->' }));
  succeed('<tExTaReA>asdf</TEXTarea>', TEXTAREA({ value: 'asdf' }));
  fatal('<textarea>asdf');
  fatal('<textarea>asdf</textarea');
  fatal('<textarea>&davidgreenspan;</textarea>');
  succeed('<textarea>&</textarea>', TEXTAREA({ value: '&' }));
  succeed('<textarea></textarea  \n<</textarea  \n>asdf',
          [TEXTAREA({ value: '</textarea  \n<' }), 'asdf']);
  // regression test for a bug that happened with textarea content
  // handling after an element with content
  succeed('<div>x</div><textarea></textarea>', [DIV('x'), TEXTAREA()]);

  // CR/LF behavior
  succeed('<br\r\n x>', BR({ x: '' }));
  succeed('<br\r x>', BR({ x: '' }));
  succeed('<br x="y"\r\n>', BR({ x: 'y' }));
  succeed('<br x="y"\r>', BR({ x: 'y' }));
  succeed('<br x=\r\n"y">', BR({ x: 'y' }));
  succeed('<br x=\r"y">', BR({ x: 'y' }));
  succeed('<br x\r=\r"y">', BR({ x: 'y' }));
  succeed('<!--\r\n-->', Comment('\n'));
  succeed('<!--\r-->', Comment('\n'));
  succeed('<textarea>a\r\nb\r\nc</textarea>', TEXTAREA({ value: 'a\nb\nc' }));
  succeed('<textarea>a\rb\rc</textarea>', TEXTAREA({ value: 'a\nb\nc' }));
  succeed('<br x="\r\n\r\n">', BR({ x: '\n\n' }));
  succeed('<br x="\r\r">', BR({ x: '\n\n' }));
  succeed('<br x=y\r>', BR({ x: 'y' }));
  fatal('<br x=\r>');

  succeed('<script>const x="<div>";</script>', SCRIPT('const x="<div>";'));
  succeed('<script>const x=1 && 0;</script>', SCRIPT('const x=1 && 0;'));

  succeed('<script>asdf</script>', SCRIPT('asdf'));
  succeed('<script x=y>asdf</script>', SCRIPT({ x: 'y' }, 'asdf'));
  succeed('<script><p></script>', SCRIPT('<p>'));
  succeed('<script>a&amp;b</script>', SCRIPT('a&amp;b'));
  succeed('<script></script</script>', SCRIPT('</script'));
  succeed('<script>\n</script>', SCRIPT('\n'));
  succeed('<script><!-- --></script>', SCRIPT('<!-- -->'));
  succeed('<sCrIpT>asdf</SCRipt>', SCRIPT('asdf'));
  fatal('<script>asdf');
  fatal('<script>asdf</script');
  succeed('<script>&davidgreenspan;</script>', SCRIPT('&davidgreenspan;'));
  succeed('<script>&</script>', SCRIPT('&'));
  succeed('<script></script  \n<</script  \n>asdf',
          [SCRIPT('</script  \n<'), 'asdf']);

  succeed('<style>asdf</style>', STYLE('asdf'));
  succeed('<style x=y>asdf</style>', STYLE({ x: 'y' }, 'asdf'));
  succeed('<style><p></style>', STYLE('<p>'));
  succeed('<style>a&amp;b</style>', STYLE('a&amp;b'));
  succeed('<style></style</style>', STYLE('</style'));
  succeed('<style>\n</style>', STYLE('\n'));
  succeed('<style><!-- --></style>', STYLE('<!-- -->'));
  succeed('<sTyLe>asdf</STYle>', STYLE('asdf'));
  fatal('<style>asdf');
  fatal('<style>asdf</style');
  succeed('<style>&davidgreenspan;</style>', STYLE('&davidgreenspan;'));
  succeed('<style>&</style>', STYLE('&'));
  succeed('<style></style  \n<</style  \n>asdf',
          [STYLE('</style  \n<'), 'asdf']);
});

Tinytest.add('html-tools - parseFragment', function (test) {
  test.equal(BlazeTools.toJS(HTMLTools.parseFragment('<div><p id=foo>Hello</p></div>')),
             BlazeTools.toJS(DIV(P({ id: 'foo' }, 'Hello'))));

  ['asdf</br>', '{{!foo}}</br>', '{{!foo}} </br>',
          'asdf</a>', '{{!foo}}</a>', '{{!foo}} </a>'].forEach(function (badFrag) {
            test.throws(function() {
              HTMLTools.parseFragment(badFrag);
            }, /Unexpected HTML close tag/);
          });

  (function () {
    const p = HTMLTools.parseFragment('<p></p>');
    test.equal(p.tagName, 'p');
    test.equal(p.attrs, null);
    test.isTrue(p instanceof HTML.Tag);
    test.equal(p.children.length, 0);
  }());

  (function () {
    const p = HTMLTools.parseFragment('<p>x</p>');
    test.equal(p.tagName, 'p');
    test.equal(p.attrs, null);
    test.isTrue(p instanceof HTML.Tag);
    test.equal(p.children.length, 1);
    test.equal(p.children[0], 'x');
  }());

  (function () {
    const p = HTMLTools.parseFragment('<p>x&#65;</p>');
    test.equal(p.tagName, 'p');
    test.equal(p.attrs, null);
    test.isTrue(p instanceof HTML.Tag);
    test.equal(p.children.length, 2);
    test.equal(p.children[0], 'x');

    test.isTrue(p.children[1] instanceof HTML.CharRef);
    test.equal(p.children[1].html, '&#65;');
    test.equal(p.children[1].str, 'A');
  }());

  (function () {
    const pp = HTMLTools.parseFragment('<p>x</p><p>y</p>');
    test.isTrue(pp instanceof Array);
    test.equal(pp.length, 2);

    test.equal(pp[0].tagName, 'p');
    test.equal(pp[0].attrs, null);
    test.isTrue(pp[0] instanceof HTML.Tag);
    test.equal(pp[0].children.length, 1);
    test.equal(pp[0].children[0], 'x');

    test.equal(pp[1].tagName, 'p');
    test.equal(pp[1].attrs, null);
    test.isTrue(pp[1] instanceof HTML.Tag);
    test.equal(pp[1].children.length, 1);
    test.equal(pp[1].children[0], 'y');
  }());

  const scanner = new Scanner('asdf');
  scanner.pos = 1;
  test.equal(HTMLTools.parseFragment(scanner), 'sdf');

  test.throws(function () {
    const scannerTest = new Scanner('asdf</p>');
    scannerTest.pos = 1;
    HTMLTools.parseFragment(scannerTest);
  });
});

Tinytest.add('html-tools - getTemplateTag', function (test) {
  // match a simple tag consisting of `{{`, an optional `!`, one
  // or more ASCII letters, spaces or html tags, and a closing `}}`.
  const mustache = /^\{\{(!?[a-zA-Z 0-9</>]+)\}\}/;

  // This implementation of `getTemplateTag` looks for "{{" and if it
  // finds it, it will match the regex above or fail fatally trying.
  // The object it returns is opaque to the tokenizer/parser and can
  // be anything we want.
  const getTemplateTag = function (scanner, position) {
    // one-char peek is just an optimization
    if (!(scanner.peek() === '{' && scanner.rest().slice(0, 2) === '{{')) {
      return null;
    }

    const match = mustache.exec(scanner.rest());
    if (!match) scanner.fatal(`Bad mustache at ${position}`);

    scanner.pos += match[0].length;

    if (match[1].charAt(0) === '!') return null; // `{{!foo}}` is like a comment

    return TemplateTag({ stuff: match[1] });
  };


  const succeed = function (input, expected) {
    let endPos = input.indexOf('^^^');
    if (endPos < 0) endPos = input.length;

    const scanner = new Scanner(input.replace('^^^', ''));
    scanner.getTemplateTag = getTemplateTag;
    let result;
    try {
      result = getContent(scanner);
    } catch (e) {
      result = String(e);
    }
    test.equal(scanner.pos, endPos);
    test.equal(BlazeTools.toJS(result), BlazeTools.toJS(expected));
  };

  const fatal = function (input, messageContains) {
    const scanner = new Scanner(input);
    scanner.getTemplateTag = getTemplateTag;
    let error;
    try {
      getContent(scanner);
    } catch (e) {
      error = e;
    }
    test.isTrue(error);
    if (messageContains) test.isTrue(messageContains && error.message.indexOf(messageContains) >= 0, error.message);
  };


  succeed('{{foo}}', TemplateTag({ stuff: 'foo' }));

  succeed('<a href=http://www.apple.com/>{{foo}}</a>',
          A({ href: 'http://www.apple.com/' }, TemplateTag({ stuff: 'foo' })));

  // tags not parsed in comments
  succeed('<!--{{foo}}-->', Comment('{{foo}}'));
  succeed('<!--{{foo-->', Comment('{{foo'));

  succeed('&am{{foo}}p;', ['&am', TemplateTag({ stuff: 'foo' }), 'p;']);

  // can't start a mustache and not finish it
  fatal('{{foo');
  fatal('<a>{{</a>');

  // no mustache allowed in tag name
  fatal('<{{a}}>');
  fatal('<{{a}}b>');
  fatal('<a{{b}}>');

  // single curly brace is no biggie
  succeed('a{b', 'a{b');
  succeed('<br x={ />', BR({ x: '{' }));
  succeed('<br x={foo} />', BR({ x: '{foo}' }));

  succeed('<br {{x}}>', BR(Attrs(TemplateTag({ stuff: 'x' }))));
  succeed('<br {{x}} {{y}}>', BR(Attrs(TemplateTag({ stuff: 'x' }),
                                       TemplateTag({ stuff: 'y' }))));
  succeed('<br {{x}} y>', BR(Attrs({ y: '' }, TemplateTag({ stuff: 'x' }))));
  fatal('<br {{x}}y>');
  fatal('<br {{x}}=y>');
  succeed('<br x={{y}} z>', BR({ x: TemplateTag({ stuff: 'y' }), z: '' }));
  succeed('<br x=y{{z}}w>', BR({ x: ['y', TemplateTag({ stuff: 'z' }), 'w'] }));
  succeed('<br x="y{{z}}w">', BR({ x: ['y', TemplateTag({ stuff: 'z' }), 'w'] }));
  succeed('<br x="y {{z}}{{w}} v">', BR({ x: ['y ', TemplateTag({ stuff: 'z' }),
                                             TemplateTag({ stuff: 'w' }), ' v'] }));
  // Slash is parsed as part of unquoted attribute!  This is consistent with
  // the HTML tokenization spec.  It seems odd for some inputs but is probably
  // for cases like `<a href=http://foo.com/>` or `<a href=/foo/>`.
  succeed('<br x={{y}}/>', BR({ x: [TemplateTag({ stuff: 'y' }), '/'] }));
  succeed('<br x={{z}}{{w}}>', BR({ x: [TemplateTag({ stuff: 'z' }),
                                       TemplateTag({ stuff: 'w' })] }));
  fatal('<br x="y"{{z}}>');

  succeed('<br x=&amp;>', BR({ x: CharRef({ html: '&amp;', str: '&' }) }));


  // check tokenization of stache tags with spaces
  succeed('<br {{x 1}}>', BR(Attrs(TemplateTag({ stuff: 'x 1' }))));
  succeed('<br {{x 1}} {{y 2}}>', BR(Attrs(TemplateTag({ stuff: 'x 1' }),
                                           TemplateTag({ stuff: 'y 2' }))));
  succeed('<br {{x 1}} y>', BR(Attrs({ y: '' }, TemplateTag({ stuff: 'x 1' }))));
  fatal('<br {{x 1}}y>');
  fatal('<br {{x 1}}=y>');
  succeed('<br x={{y 2}} z>', BR({ x: TemplateTag({ stuff: 'y 2' }), z: '' }));
  succeed('<br x=y{{z 3}}w>', BR({ x: ['y', TemplateTag({ stuff: 'z 3' }), 'w'] }));
  succeed('<br x="y{{z 3}}w">', BR({ x: ['y', TemplateTag({ stuff: 'z 3' }), 'w'] }));
  succeed('<br x="y {{z 3}}{{w 4}} v">', BR({ x: ['y ', TemplateTag({ stuff: 'z 3' }),
                                                 TemplateTag({ stuff: 'w 4' }), ' v'] }));
  succeed('<br x={{y 2}}/>', BR({ x: [TemplateTag({ stuff: 'y 2' }), '/'] }));
  succeed('<br x={{z 3}}{{w 4}}>', BR({ x: [TemplateTag({ stuff: 'z 3' }),
                                           TemplateTag({ stuff: 'w 4' })] }));

  succeed('<p></p>', P());

  succeed('x{{foo}}{{bar}}y', ['x', TemplateTag({ stuff: 'foo' }),
                               TemplateTag({ stuff: 'bar' }), 'y']);
  succeed('x{{!foo}}{{!bar}}y', 'xy');
  succeed('x{{!foo}}{{bar}}y', ['x', TemplateTag({ stuff: 'bar' }), 'y']);
  succeed('x{{foo}}{{!bar}}y', ['x', TemplateTag({ stuff: 'foo' }), 'y']);
  succeed('<div>{{!foo}}{{!bar}}</div>', DIV());
  succeed('<div>{{!foo}}<br />{{!bar}}</div>', DIV(BR()));
  succeed('<div> {{!foo}} {{!bar}} </div>', DIV('   '));
  succeed('<div> {{!foo}} <br /> {{!bar}}</div>', DIV('  ', BR(), ' '));
  succeed('{{! <div></div> }}', null);
  succeed('{{!<div></div>}}', null);

  succeed('', null);
  succeed('{{!foo}}', null);

  succeed('<textarea {{a}} x=1 {{b}}></textarea>',
          TEXTAREA(Attrs({ x: '1' }, TemplateTag({ stuff: 'a' }),
                         TemplateTag({ stuff: 'b' }))));
});
