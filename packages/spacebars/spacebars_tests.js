/* global Tinytest Spacebars */

Tinytest.add('spacebars - Spacebars.dot', function (test) {
  test.equal(Spacebars.dot(null, 'foo'), null);
  test.equal(Spacebars.dot('foo', 'foo'), undefined);
  test.equal(Spacebars.dot({ x: 1 }, 'x'), 1);
  test.equal(Spacebars.dot(
    { x: 1, y () { return this.x + 1; } }, 'y')(), 2);
  test.equal(Spacebars.dot(
    function () {
      return { x: 1, y () { return this.x + 1; } };
    }, 'y')(), 2);

  let m = 1;
  const mget = function () {
    return {
      answer: m,
      getAnswer () {
        return this.answer;
      },
    };
  };
  const mgetDotAnswer = Spacebars.dot(mget, 'answer');
  test.equal(mgetDotAnswer, 1);

  m = 3;
  const mgetDotGetAnswer = Spacebars.dot(mget, 'getAnswer');
  test.equal(mgetDotGetAnswer(), 3);
  m = 4;
  test.equal(mgetDotGetAnswer(), 3);

  const closet = {
    mget,
    mget2 () {
      return this.mget();
    },
  };

  m = 5;
  // eslint-disable-next-line
  const f1 = Spacebars.dot(closet, 'mget', 'answer');
  m = 6;
  const f2 = Spacebars.dot(closet, 'mget2', 'answer');
  test.equal(f2, 6);
  m = 8;
  const f3 = Spacebars.dot(closet, 'mget2', 'getAnswer');
  m = 9;
  test.equal(f3(), 8);

  test.equal(Spacebars.dot(0, 'abc', 'def'), 0);
  test.equal(Spacebars.dot(function () { return null; }, 'abc', 'def'), null);
  test.equal(Spacebars.dot(function () { return 0; }, 'abc', 'def'), 0);

  // test that in `foo.bar`, `bar` may be a function that takes arguments.
  test.equal(Spacebars.dot(
    { one: 1, inc (x) { return this.one + x; } }, 'inc')(6), 7);
  test.equal(Spacebars.dot(
    function () {
      return { one: 1, inc (x) { return this.one + x; } };
    }, 'inc')(8), 9);
});
