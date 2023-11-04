function asyncTest(templateName, testName, fn) {
  const name = [templateName, testName].filter(Boolean).join(' ');
  Tinytest.addAsync(`spacebars-tests - async - ${name}`, test => {
    const template = Blaze.Template[`spacebars_async_tests_${templateName}`];
    const templateCopy = new Blaze.Template(template.viewName, template.renderFunction);
    return fn(test, templateCopy, () => {
      const div = renderToDiv(templateCopy);
      return () => canonicalizeHtml(div.innerHTML);
    });
  });
}

function asyncSuite(templateName, cases) {
  for (const [testName, helpers, before, after] of cases) {
    asyncTest(templateName, testName, async (test, template, render) => {
      template.helpers(helpers);
      const readHTML = render();
      test.equal(readHTML(), before);
      await new Promise(Tracker.afterFlush);
      test.equal(readHTML(), after);
    });
  }
}

const getter = async () => 'foo';
const thenable = { then: resolve => Promise.resolve().then(() => resolve('foo')) };
const value = Promise.resolve('foo');

asyncSuite('access', [
  ['getter', { x: { y: getter } }, '', 'foo'],
  ['thenable', { x: { y: thenable } }, '', 'foo'],
  ['value', { x: { y: value } }, '', 'foo'],
]);

asyncSuite('direct', [
  ['getter', { x: getter }, '', 'foo'],
  ['thenable', { x: thenable }, '', 'foo'],
  ['value', { x: value }, '', 'foo'],
]);

asyncTest('missing1', 'outer', async (test, template, render) => {
  Blaze._throwNextException = true;
  test.throws(render, 'Binding for "b" was not found.');
});

asyncTest('missing2', 'inner', async (test, template, render) => {
  Blaze._throwNextException = true;
  test.throws(render, 'Binding for "b" was not found.');
});

asyncSuite('attribute', [
  ['getter', { x: getter }, '<img>', '<img class="foo">'],
  ['thenable', { x: thenable }, '<img>', '<img class="foo">'],
  ['value', { x: value }, '<img>', '<img class="foo">'],
]);

asyncTest('attributes', '', async (test, template, render) => {
  Blaze._throwNextException = true;
  template.helpers({ x: Promise.resolve() });
  test.throws(render, 'Asynchronous attributes are not supported. Use #let to unwrap them first.');
});

asyncSuite('value_direct', [
  ['getter', { x: getter }, '', 'foo'],
  ['thenable', { x: thenable }, '', 'foo'],
  ['value', { x: value }, '', 'foo'],
]);

asyncSuite('value_raw', [
  ['getter', { x: getter }, '', 'foo'],
  ['thenable', { x: thenable }, '', 'foo'],
  ['value', { x: value }, '', 'foo'],
]);

asyncSuite('if', [
  ['false', { x: Promise.resolve(false) }, '', '2'],
  ['true', { x: Promise.resolve(true) }, '', '1 1'],
]);

asyncSuite('unless', [
  ['false', { x: Promise.resolve(false) }, '', '1 1'],
  ['true', { x: Promise.resolve(true) }, '', '2'],
]);

asyncSuite('each_old', [
  ['null', { x: Promise.resolve(null) }, '0', '0'],
  ['empty', { x: Promise.resolve([]) }, '0', '0'],
  ['one', { x: Promise.resolve([1]) }, '0', '1'],
  ['two', { x: Promise.resolve([1, 2]) }, '0', '12'],
]);

asyncSuite('each_new', [
  ['null', { x: Promise.resolve(null) }, '0', '0'],
  ['empty', { x: Promise.resolve([]) }, '0', '0'],
  ['one', { x: Promise.resolve([1]) }, '0', '1'],
  ['two', { x: Promise.resolve([1, 2]) }, '0', '12'],
]);

// In the following tests pending=1, rejected=2, resolved=3.
const pending = new Promise(() => {});
const rejected = Promise.reject();
const resolved = Promise.resolve();

// Ignore unhandled rejection error.
rejected.catch(() => {});

asyncSuite('state1', [
  ['pending', { x: pending }, '1 a1', '1 a1'],
  ['rejected', { x: rejected }, '1 a1', '2 a2'],
  ['resolved', { x: resolved }, '1 a1', '3 a3'],
]);

asyncSuite('state2flat', [
  ['pending pending', { x: pending, y: pending }, '1 a1 b1 ab1', '1 a1 b1 ab1'],
  ['pending rejected', { x: pending, y: rejected }, '1 a1 b1 ab1', '1 2 a1 b2 ab1 ab2'],
  ['pending resolved', { x: pending, y: resolved }, '1 a1 b1 ab1', '1 3 a1 b3 ab1 ab3'],
  ['rejected pending', { x: rejected, y: pending }, '1 a1 b1 ab1', '1 2 a2 b1 ab1 ab2'],
  ['rejected rejected', { x: rejected, y: rejected }, '1 a1 b1 ab1', '2 a2 b2 ab2'],
  ['rejected resolved', { x: rejected, y: resolved }, '1 a1 b1 ab1', '2 3 a2 b3 ab2 ab3'],
  ['resolved pending', { x: resolved, y: pending }, '1 a1 b1 ab1', '1 3 a3 b1 ab1 ab3'],
  ['resolved rejected', { x: resolved, y: rejected }, '1 a1 b1 ab1', '2 3 a3 b2 ab2 ab3'],
  ['resolved resolved', { x: resolved, y: resolved }, '1 a1 b1 ab1', '3 a3 b3 ab3'],
]);

asyncSuite('state2nested', [
  ['pending pending', { x: pending, y: pending }, '1 a1 b1 ab1', '1 a1 b1 ab1'],
  ['pending rejected', { x: pending, y: rejected }, '1 a1 b1 ab1', '2 a1 b2 ab1 ab2'],
  ['pending resolved', { x: pending, y: resolved }, '1 a1 b1 ab1', '3 a1 b3 ab1 ab3'],
  ['rejected pending', { x: rejected, y: pending }, '1 a1 b1 ab1', '1 a2 b1 ab1 ab2'],
  ['rejected rejected', { x: rejected, y: rejected }, '1 a1 b1 ab1', '2 a2 b2 ab2'],
  ['rejected resolved', { x: rejected, y: resolved }, '1 a1 b1 ab1', '3 a2 b3 ab2 ab3'],
  ['resolved pending', { x: resolved, y: pending }, '1 a1 b1 ab1', '1 a3 b1 ab1 ab3'],
  ['resolved rejected', { x: resolved, y: rejected }, '1 a1 b1 ab1', '2 a3 b2 ab2 ab3'],
  ['resolved resolved', { x: resolved, y: resolved }, '1 a1 b1 ab1', '3 a3 b3 ab3'],
]);
