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
  for (const [testName, helpers, before, after, cycles = 1] of cases) {
    asyncTest(templateName, testName, async (test, template, render) => {
      template.helpers(helpers);
      const readHTML = render();
      // Some test cases require more cycles to propagate.
      for (let cycle = 0; cycle < cycles; ++cycle) {
        test.equal(readHTML(), before);
        await new Promise(Tracker.afterFlush);
      }
      test.equal(readHTML(), after);
    });
  }
}

const getter = v => async () => v;
const thenable = v => ({ then: resolve => Promise.resolve().then(() => resolve(v)) });
const value = v => Promise.resolve(v);

asyncSuite('access', [
  ['getter', { x: { y: getter('foo') } }, '', 'foo'],
  ['thenable', { x: { y: thenable('foo') } }, '', 'foo'],
  ['value', { x: { y: value('foo') } }, '', 'foo'],
]);

asyncSuite('direct', [
  ['getter', { x: getter('foo') }, '', 'foo'],
  ['thenable', { x: thenable('foo') }, '', 'foo'],
  ['value', { x: value('foo') }, '', 'foo'],
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
  ['getter', { x: getter('foo') }, '<img>', '<img class="foo">'],
  ['thenable', { x: thenable('foo') }, '<img>', '<img class="foo">'],
  ['value', { x: value('foo') }, '<img>', '<img class="foo">'],
]);

asyncSuite('attributes', [
  ['getter in getter', { x: getter({ class: getter('foo') }) }, '<img>', '<img>'], // Nested getters are NOT evaluated.
  ['getter in thenable', { x: thenable({ class: getter('foo') }) }, '<img>', '<img>'], // Nested getters are NOT evaluated.
  ['getter in value', { x: value({ class: getter('foo') }) }, '<img>', '<img>'], // Nested getters are NOT evaluated.
  ['static in getter', { x: getter({ class: 'foo' }) }, '<img>', '<img class="foo">'],
  ['static in thenable', { x: thenable({ class: 'foo' }) }, '<img>', '<img class="foo">'],
  ['static in value', { x: value({ class: 'foo' }) }, '<img>', '<img class="foo">'],
  ['thenable in getter', { x: getter({ class: thenable('foo') }) }, '<img>', '<img class="foo">'],
  ['thenable in thenable', { x: thenable({ class: thenable('foo') }) }, '<img>', '<img class="foo">'],
  ['thenable in value', { x: value({ class: thenable('foo') }) }, '<img>', '<img class="foo">'],
  ['value in getter', { x: getter({ class: value('foo') }) }, '<img>', '<img class="foo">'],
  ['value in thenable', { x: thenable({ class: value('foo') }) }, '<img>', '<img class="foo">'],
  ['value in value', { x: value({ class: value('foo') }) }, '<img>', '<img class="foo">'],
]);

asyncSuite('attributes_double', [
  ['null lhs getter', { x: getter({ class: null }), y: getter({ class: 'foo' }) }, '<img>', '<img class="foo">'],
  ['null lhs thenable', { x: thenable({ class: null }), y: thenable({ class: 'foo' }) }, '<img>', '<img class="foo">'],
  ['null lhs value', { x: value({ class: null }), y: value({ class: 'foo' }) }, '<img>', '<img class="foo">'],
  ['null rhs getter', { x: getter({ class: 'foo' }), y: getter({ class: null }) }, '<img>', '<img class="foo">'],
  ['null rhs thenable', { x: thenable({ class: 'foo' }), y: thenable({ class: null }) }, '<img>', '<img class="foo">'],
  ['null rhs value', { x: value({ class: 'foo' }), y: value({ class: null }) }, '<img>', '<img class="foo">'],
  ['override getter', { x: getter({ class: 'foo' }), y: getter({ class: 'bar' }) }, '<img>', '<img class="bar">'],
  ['override thenable', { x: thenable({ class: 'foo' }), y: thenable({ class: 'bar' }) }, '<img>', '<img class="bar">'],
  ['override value', { x: value({ class: 'foo' }), y: value({ class: 'bar' }) }, '<img>', '<img class="bar">'],
]);

asyncSuite('value_direct', [
  ['getter', { x: getter('foo') }, '', 'foo'],
  ['thenable', { x: thenable('foo') }, '', 'foo'],
  ['value', { x: value('foo') }, '', 'foo'],
]);

asyncSuite('value_raw', [
  ['getter', { x: getter('foo') }, '', 'foo'],
  ['thenable', { x: thenable('foo') }, '', 'foo'],
  ['value', { x: value('foo') }, '', 'foo'],
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

asyncSuite('with', [
  ['null', { x: Promise.resolve(null) }, '', '', 2],
  ['empty', { x: Promise.resolve({}) }, '', '', 2],
  ['direct', { x: Promise.resolve({y: 1}) }, '', '1', 2],
  ['wrapped', { x: Promise.resolve({y: Promise.resolve(1)}) }, '', '1', 3],
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

// An earlier promise that settles after a newer one must not overwrite the
// newer result (#514).
for (const [templateName, testName, settleFirst, secondValue, expected] of [
  ['direct', 'out-of-order resolution keeps latest value',
    ({ resolve }) => resolve('stale'), 'fresh', 'fresh'],
  ['state1', 'out-of-order rejection keeps latest resolved state',
    ({ reject }) => reject(new Error('stale')), 'fresh', '3 a3'],
  ['if', 'out-of-order condition keeps latest branch',
    ({ resolve }) => resolve(true), false, '2'],
  ['each_new', 'out-of-order sequence keeps latest items',
    ({ resolve }) => resolve(['a']), ['b'], 'b'],
  ['with', 'out-of-order context keeps latest data',
    ({ resolve }) => resolve({ y: 'stale' }), { y: 'fresh' }, 'fresh'],
  ['attribute', 'out-of-order attribute keeps latest value',
    ({ resolve }) => resolve('stale'), 'fresh', '<img class="fresh">'],
]) {
  asyncTest(templateName, testName, async (test, template, render) => {
    let first;
    const firstPromise = new Promise((resolve, reject) => {
      first = { resolve, reject };
    });
    firstPromise.catch(() => {});
    const current = new ReactiveVar(secondValue);
    template.helpers({ x: () => current.get() });

    const readHTML = render();
    current.set(firstPromise);
    Tracker.flush();
    current.set(Promise.resolve(secondValue));
    Tracker.flush();
    await new Promise(resolve => setTimeout(resolve, 0));
    Tracker.flush();
    test.equal(readHTML(), expected);

    settleFirst(first);
    await new Promise(resolve => setTimeout(resolve, 0));
    Tracker.flush();
    test.equal(readHTML(), expected);
  });
}
