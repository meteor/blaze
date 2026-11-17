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

// A promise that rejects in an attribute is reported once, where it rejects,
// and not again by each enclosing layer of the attribute promise chain.
for (const [templateName, testName, makeHelpers, expectedMessages] of [
  ['attribute', 'rejected value reported once',
    () => ({ x: Promise.reject(new Error('class')) }), ['class']],
  ['attributes', 'rejected attributes object reported once',
    () => ({ x: Promise.reject(new Error('attrs')) }), ['attrs']],
  ['attributes', 'rejected nested value reported once',
    () => ({ x: value({ class: Promise.reject(new Error('class')) }) }), ['class']],
  ['attributes_double', 'two rejected values reported once each',
    () => ({ x: value({ class: Promise.reject(new Error('x')) }), y: value({ id: Promise.reject(new Error('y')) }) }), ['x', 'y']],
  ['attributes', 'error thrown while reading the resolved attributes reported once',
    () => ({ x: Promise.resolve({ get class() { throw new Error('getter'); } }) }), ['getter']],
  ['attribute_with', 'error thrown while reading the resolved data of an attribute block reported once',
    () => ({ x: Promise.resolve({ get y() { throw new Error('getter'); } }) }), ['getter']],
]) {
  asyncTest(templateName, testName, async (test, template, render) => {
    const reportedMessages = [];
    const originalReportException = Blaze._reportException;
    Blaze._reportException = (error) => reportedMessages.push(error.message);
    try {
      template.helpers(makeHelpers());
      render();
      await new Promise((resolve) => setTimeout(resolve, 50));
    } finally {
      Blaze._reportException = originalReportException;
    }
    test.equal(reportedMessages.sort(), expectedMessages);
  });
}

// Async block helpers inside HTML attributes (#470).
asyncSuite('attribute_if', [
  ['false', { x: Promise.resolve(false) }, '<img>', '<img class="a d">'],
  ['true', { x: Promise.resolve(true) }, '<img>', '<img class="a b c">'],
]);

asyncSuite('attribute_unless', [
  ['false', { x: Promise.resolve(false) }, '<img>', '<img class="a b c">'],
  ['true', { x: Promise.resolve(true) }, '<img>', '<img class="a d">'],
]);

asyncSuite('attribute_let', [
  ['false', { x: Promise.resolve(false) }, '<img class="a 2">', '<img class="a 2">'],
  ['true', { x: Promise.resolve(true) }, '<img class="a 2">', '<img class="a 1">'],
]);

asyncSuite('attribute_with', [
  ['direct', { x: Promise.resolve({ y: 'foo' }) }, '<img>', '<img class="a foo">'],
]);

asyncSuite('attribute_each', [
  ['empty', { x: Promise.resolve([]) }, '<img>', '<img class="a 0">'],
  ['two', { x: Promise.resolve([1, 2]) }, '<img>', '<img class="a 12">'],
]);

asyncSuite('attribute_inclusion', [
  ['false', { x: getter(false) }, '<img>', '<img class="a d">'],
  ['true', { x: getter(true) }, '<img>', '<img class="a b c">'],
]);

asyncTest('attribute_if', 'reactive update without infinite loop', async (test, template, render) => {
  const current = new ReactiveVar(Promise.resolve(true));
  let calls = 0;
  template.helpers({
    x() {
      calls += 1;
      return current.get();
    },
  });

  const readHTML = render();
  await new Promise(Tracker.afterFlush);
  test.equal(readHTML(), '<img class="a b c">');
  test.equal(calls, 2);

  current.set(Promise.resolve(false));
  Tracker.flush();
  await new Promise(resolve => setTimeout(resolve, 0));
  test.equal(readHTML(), '<img class="a d">');
  test.equal(calls, 4);
});

// A binding that settles later than the next microtask, as a method call does.
asyncTest('attribute_if', 'binding that settles later', async (test, template, render) => {
  const pending = [];
  let calls = 0;
  template.helpers({
    x() {
      calls += 1;
      return new Promise(resolve => pending.push(resolve));
    },
  });

  const readHTML = render();
  await new Promise(resolve => setTimeout(resolve, 10));
  test.equal(readHTML(), '<img>');
  test.equal(calls, 2);

  pending.forEach(resolve => resolve(true));
  await new Promise(resolve => setTimeout(resolve, 0));
  test.equal(readHTML(), '<img class="a b c">');
  test.equal(calls, 2);
});

// A run of the attribute updater invalidated while its bindings are pending
// must not write its result over the one of the run that replaced it: the
// promises A of the first run settle after the replacement, a promise B
// settled first or a synchronous value, and the replacement's result stays.
for (const [testName, synchronousReplacement] of [
  ['overlapping async updates keep the newest result', false],
  ['synchronous update kept over an earlier pending one', true],
]) {
  asyncTest('attribute_if', testName, async (test, template, render) => {
    const generation = new ReactiveVar(0);
    const pending = [];
    template.helpers({
      x() {
        if (generation.get() === 1 && synchronousReplacement) return false;
        return new Promise(resolve => pending.push(resolve));
      },
    });

    const readHTML = render();
    await new Promise(resolve => setTimeout(resolve, 0));
    test.equal(readHTML(), '<img>');
    const first = pending.splice(0);
    test.equal(first.length, 2);

    generation.set(1);
    Tracker.flush();
    const second = pending.splice(0);
    test.equal(second.length, synchronousReplacement ? 0 : 2);
    second.forEach(resolve => resolve(false));
    await new Promise(resolve => setTimeout(resolve, 0));
    test.equal(readHTML(), '<img class="a d">');

    first.forEach(resolve => resolve(true));
    await new Promise(resolve => setTimeout(resolve, 0));
    test.equal(readHTML(), '<img class="a d">');
  });
}

// `Blaze.toHTML` stays synchronous: a pending async binding renders as in the
// first pass of the materialized suites above (an empty block, the else branch
// of `#each`) and never leaks a `Promise` into the HTML.
asyncTest('if', 'toHTML renders a pending condition as empty', async (test, template) => {
  template.helpers({ x: getter(true) });
  test.equal(canonicalizeHtml(Blaze.toHTML(template)), '');
});

asyncTest('each_new', 'toHTML renders a pending sequence in else mode', async (test, template) => {
  template.helpers({ x: getter([1, 2]) });
  test.equal(canonicalizeHtml(Blaze.toHTML(template)), '0');
});

asyncTest('attribute_if', 'toHTML renders a pending attribute block as empty', async (test, template) => {
  template.helpers({ x: getter(true) });
  test.equal(canonicalizeHtml(Blaze.toHTML(template)), '<img class="a ">');
});
