Tinytest.add("spacebars - Spacebars.dot", function (test) {
  test.equal(Spacebars.dot(null, 'foo'), null);
  test.equal(Spacebars.dot('foo', 'foo'), undefined);
  test.equal(Spacebars.dot({x:1}, 'x'), 1);
  test.equal(Spacebars.dot(
    {x:1, y: function () { return this.x+1; }}, 'y')(), 2);
  test.equal(Spacebars.dot(
    function () {
      return {x:1, y: function () { return this.x+1; }};
    }, 'y')(), 2);

  var m = 1;
  var mget = function () {
    return {
      answer: m,
      getAnswer: function () {
        return this.answer;
      }
    };
  };
  var mgetDotAnswer = Spacebars.dot(mget, 'answer');
  test.equal(mgetDotAnswer, 1);

  m = 3;
  var mgetDotGetAnswer = Spacebars.dot(mget, 'getAnswer');
  test.equal(mgetDotGetAnswer(), 3);
  m = 4;
  test.equal(mgetDotGetAnswer(), 3);

  var closet = {
    mget: mget,
    mget2: function () {
      return this.mget();
    }
  };

  m = 5;
  var f1 = Spacebars.dot(closet, 'mget', 'answer');
  m = 6;
  var f2 = Spacebars.dot(closet, 'mget2', 'answer');
  test.equal(f2, 6);
  m = 8;
  var f3 = Spacebars.dot(closet, 'mget2', 'getAnswer');
  m = 9;
  test.equal(f3(), 8);

  test.equal(Spacebars.dot(0, 'abc', 'def'), 0);
  test.equal(Spacebars.dot(function () { return null; }, 'abc', 'def'), null);
  test.equal(Spacebars.dot(function () { return 0; }, 'abc', 'def'), 0);

  // test that in `foo.bar`, `bar` may be a function that takes arguments.
  test.equal(Spacebars.dot(
    { one: 1, inc: function (x) { return this.one + x; } }, 'inc')(6), 7);
  test.equal(Spacebars.dot(
    function () {
      return { one: 1, inc: function (x) { return this.one + x; } };
    }, 'inc')(8), 9);

});
