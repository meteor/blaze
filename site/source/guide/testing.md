# Testing your Blaze Components

This guide covers some convenient methods and helpers to test your Blaze templates and components.
Please note, that this guide heavily relies on `meteortesting:mocha`, which is
[a community maintained package](https://github.com/Meteor-Community-Packages/meteor-mocha) that we think works best
when writing and running tests with Meteor + Blaze.
If you haven't set up Meteor testing with Mocha, then please follow the link to 

## Unit Tests

In the [Todos](https://github.com/meteor/todos) example app, thanks to the fact that we've split our User Interface
into [smart and reusable components](./smart-components.md), it's natural to want to unit test some of our reusable
components (we'll see below how to [integration test](#simple-integration-test) our smart components).

To do so, we'll use a very simple test helper that renders a Blaze component off-screen with a given data context. As we
place it in `imports`, it won't load in our app by in normal mode (as it's not required anywhere).

[`imports/ui/test-helpers.js`](https://github.com/meteor/todos/blob/master/imports/ui/test-helpers.js):

```js
import {Template} from 'meteor/templating';
import {Blaze} from 'meteor/blaze';
import {Tracker} from 'meteor/tracker';

const withDiv = function withDiv(callback) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    let view = null
    try {
        view = callback(el);
    } finally {
        if (view) Blaze.remove(view)
        document.body.removeChild(el);
    }
};

export const withRenderedTemplate = function withRenderedTemplate(template, data, callback) {
    withDiv((el) => {
        const ourTemplate = typeof template === 'string' 
            ? Template[template] 
            : template;
        const view = Blaze.renderWithData(ourTemplate, data, el);
        Tracker.flush();
        callback(el);
        return view
    });
};
```

An example of a reusable component to test is the [`Todos_item`](https://github.com/meteor/todos/blob/master/imports/ui/components/todos-item.html) template. Here's what a
unit test looks like (you can see some [others in the app repository](https://github.com/meteor/todos/blob/master/imports/ui/components/client)).

[`imports/ui/components/client/todos-item.tests.js`](https://github.com/meteor/todos/blob/master/imports/ui/components/client/todos-item.tests.js):

```js
/* eslint-env mocha */
import {Factory} from 'meteor/dburles:factory';
import {Template} from 'meteor/templating';
import {Todos} from '../../../api/todos/todos';
import $ from 'jquery';
import chai from 'chai';


import {withRenderedTemplate} from '../../test-helpers.js';
import '../todos-item.js';

describe('Todos_item', function () {
    beforeEach(function () {
        Template.registerHelper('_', key => key);
    });

    afterEach(function () {
        Template.deregisterHelper('_');
    });

    it('renders correctly with simple data', function () {
        const todo = Factory.build('todo', {checked: false});
        const data = {
            todo: Todos._transform(todo),
            onEditingChange: () => 0,
        };

        withRenderedTemplate('Todos_item', data, el => {
            chai.assert.equal($(el).find('input[type=text]').val(), todo.text);
            chai.assert.equal($(el).find('.list-item.checked').length, 0);
            chai.assert.equal($(el).find('.list-item.editing').length, 0);
        });
    });
});
```

Of particular interest in this test is the following:

#### Importing

When we run our app in test mode, only our test files will be eagerly loaded. In particular, this means that in order to
use our templates, we need to import them! In this test, we import `todos-item.js`, which itself imports `todos.html` (
yes, you do need to import the HTML files of your Blaze templates!)

#### Stubbing

To be a unit test, we must stub out the dependencies of the module. In this case, thanks to the way we've isolated our
code into a reusable component, there's not much to do; principally we need to stub out the <code v-pre>{{_}}</code>
helper that's created by the [`tap:i18n`](ui-ux.html#i18n) system. Note that we stub it out in a `beforeEach` and
restore it the `afterEach`.

If you're testing code that makes use of globals, you'll need to import those globals. For instance if you have a global
`Todos` collection and are testing this file:

```js
// logging.js
export function logTodos() {
    console.log(Todos.findOne());
}
```

then you'll need to import `Todos` both in that file and in the test:

```js
// logging.js
import {Todos} from './todos.js'

export function logTodos() {
    console.log(Todos.findOne());
}
```

```js
// logging.test.js
import {Todos} from './todos.js'

Todos.findOne = () => {
    return {text: "write a guide"}
}

import {logTodos} from './logging.js'
// then test logTodos
...
```

<h4 id="unit-test-data">Creating data</h4>

We can use the [Factory package's](#test-data) `.build()` API to create a test document without inserting it into any
collection. As we've been careful not to call out to any collections directly in the reusable component, we can pass the
built `todo` document directly into the template.

<h3 id="running-unit-tests">Running unit tests</h3>

To run the tests that our app defines, we run our app in [test mode](#test-modes):

```txt
TEST_WATCH=1 meteor test --driver-package meteortesting:mocha
```

As we've defined a test file (`imports/todos/todos.tests.js`), what this means is that the file above will be eagerly loaded, adding the `'builds correctly from factory'` test to the Mocha registry.

To run the tests, visit http://localhost:3000 in your browser. This kicks off `meteortesting:mocha`, which runs your tests both in the browser and on the server. It will display the test results in a div with ID mocha.

Usually, while developing an application, it makes sense to run `meteor test` on a second port (say `3100`), while also running your main application in a separate process:

```bash
# in one terminal window
meteor

# in another
meteor test --driver-package meteortesting:mocha --port 3100
```

Then you can open two browser windows to see the app in action while also ensuring that you don't break any tests as you make changes.

#### Isolation techniques

In the [unit tests above](#unit-tests) we saw a very limited example of how to isolate a module from the larger app. This is critical for proper unit testing. Some other utilities and techniques include:

- The [`velocity:meteor-stubs`](https://atmospherejs.com/velocity/meteor-stubs) package, which creates simple stubs for most Meteor core objects.

- Alternatively, you can also use tools like [Sinon](http://sinonjs.org) to stub things directly, as we'll see for example in our [simple integration test](#simple-integration-test).

- The [`hwillson:stub-collections`](https://atmospherejs.com/hwillson/stub-collections) package we mentioned [above](#mocking-the-database).

There's a lot of scope for better isolation and testing utilities.

#### Testing publications

Let's take this simple publication for example:

```js
// server/publications/notes
 Meteor.publish('user.notes', function () {
    return Notes.find({ userId: this.userId });
  });
```  
We access Meteor publications using `Meteor.server.publish_handlers`, then use `.apply` to provide the needed parameters for the publication and test what it returns.

```js
import { Meteor } from 'meteor/meteor';
import expect from 'expect';

import { Notes } from './notes';

 describe('notes', function () {
   const noteOne = {
     _id: 'testNote1',
     title: 'Groceries',
     body: 'Milk, Eggs and Oatmeal'
     userId: 'userId1'
   };

   beforeEach(function () {
     Notes.remove({});
     Notes.insert(noteOne);
   });

 it('should return a users notes', function () {
      const res = Meteor.server.publish_handlers['user.notes'].apply({ userId: noteOne.userId });
      const notes = res.fetch();

      expect(notes.length).toBe(1);
      expect(notes[0]).toEqual(noteOne);
    });

  it('should return no notes for user that has none', function () {
      const res = Meteor.server.publish_handlers.notes.apply({ userId: 'testid' });
      const notes = res.fetch();

      expect(notes.length).toBe(0);
    });  
 });
```    

A useful package for testing publications is [`johanbrook:publication-collector`](https://atmospherejs.com/johanbrook/publication-collector), it allows you to test individual publication's output without needing to create a traditional subscription:

```js
describe('notes', function () {
  it('should return a users notes', function (done) {
    // Set a user id that will be provided to the publish function as `this.userId`,
    // in case you want to test authentication.
    const collector = new PublicationCollector({userId: noteOne.userId});

    // Collect the data published from the `lists.public` publication.
    collector.collect('user.notes', (collections) => {
      // `collections` is a dictionary with collection names as keys,
      // and their published documents as values in an array.
      // Here, documents from the collection 'Lists' are published.
      chai.assert.typeOf(collections.Lists, 'array');
      chai.assert.equal(collections.Lists.length, 1);
      done();
    });
  });
});
```

Note that user documents – ones that you would normally query with `Meteor.users.find()` – will be available as the key `users` on the dictionary passed from a `PublicationCollector.collect()` call. See the [tests](https://github.com/johanbrook/meteor-publication-collector/blob/master/tests/publication-collector.test.js) in the package for more details.

<h4 id="testing-methods">Testing methods</h4>

We can also access methods using `Meteor.server.method_handlers` and apply the same principles. Take note of how we can use `sinon.fake()` to mock `this.unblock()`.

```js
Meteor.methods({
  'notes.insert'(title, body) {
    if (!this.userId || Meteor.users.findOne({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You have to be authorized');
    }

    check(title, String);
    check(body, String);

    this.unblock();

    return Notes.insert({
      title,
      body,
      userId: this.userId
    });
  },
  'notes.remove'(_id) {
    if (!this.userId || Meteor.users.findOne({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You have to be authorized');
    }

    check(_id, String);

    Notes.remove({ _id, userId: this.userId });
  },
  'notes.update'(_id, {title, body}) {
    if (!this.userId || Meteor.users.findOne({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You have to be authorized');
    }

    check(_id, String);
    check(title, String);
    check(body, String);

    Notes.update({
      _id,
      userId: this.userId
    }, {
      $set: {
        title,
        body
      }
    });
  }
});
```

```js
describe('notes', function () {
    const noteOne = {
      _id: 'testNote1',
      title: 'Groceries',
      body: 'Milk, Eggs and Oatmeal'
      userId: 'testUserId1'
    };
    beforeEach(function () {
      Notes.remove({});
    });

    it('should insert new note', function () {
      const _id = Meteor.server.method_handlers['notes.insert'].apply({ userId: noteOne.userId, unblock: sinon.fake() }. [title: noteOne.title, body: noteOne.body]);

      expect(Notes.findOne({ _id })).toMatchObject(
			expect.objectContaining(noteOne)
		);
    });

    it('should not insert note if not authenticated', function () {
      expect(() => {
        Meteor.server.method_handlers['notes.insert']();
      }).toThrow();
    });

    it('should remove note', function () {
      Meteor.server.method_handlers['notes.remove'].apply({ userId: noteOne.userId }, [noteOne._id]);

      expect(Notes.findOne({ _id: noteOne._id})).toNotExist();
    });

    it('should not remove note if invalid _id', function () {
      expect(() => {
        Meteor.server.method_handlers['notes.remove'].apply({ userId: noteOne.userId});
      }).toThrow();
    });

    it('should update note', function () {
      const title = 'To Buy';
      const beef = 'Beef, Salmon'

      Meteor.server.method_handlers['notes.update'].apply({
        userId: noteOne.userId
      }, [
        noteOne._id,
        {title, body}
      ]);

      const note = Notes.findOne(noteOne._id);

      expect(note).toInclude({
        title,
        body
      });
    });

    it('should not update note if user was not creator', function () {
      const title = 'This is an updated title';

      Meteor.server.method_handlers['notes.update'].apply({
        userId: 'testid'
      }, [
        noteOne._id,
        { title }
      ]);

      const note = Notes.findOne(noteOne._id);

      expect(note).toInclude(noteOne);
    });
});
```

These examples are heavily inspired by [Andrew Mead example app](https://github.com/andrewjmead/notes-meteor-course).

## Integration testing

An integration test is a test that crosses module boundaries. In the simplest case, this means something very similar to a unit test, where you perform your isolation around multiple modules, creating a non-singular "system under test".

Although conceptually different to unit tests, such tests typically do not need to be run any differently to unit tests and can use the same [`meteor test` mode](#running-unit-tests) and [isolation techniques](#isolation-techniques) as we use for unit tests.

However, an integration test that crosses the client-server boundary of a Meteor application (where the modules under test cross that boundary) requires a different testing infrastructure, namely Meteor's "full app" testing mode.

Let's take a look at example of both kinds of tests.

<h3 id="simple-integration-test">Simple integration test</h3>

Our reusable components were a natural fit for a unit test; similarly our smart components tend to require an integration test to really be exercised properly, as the job of a smart component is to bring data together and supply it to a reusable component.

In the [Todos](https://github.com/meteor/todos) example app, we have an integration test for the `Lists_show_page` smart component. This test ensures that when the correct data is present in the database, the template renders correctly -- that it is gathering the correct data as we expect. It isolates the rendering tree from the more complex data subscription part of the Meteor stack. If we wanted to test that the subscription side of things was working in concert with the smart component, we'd need to write a [full app integration test](#full-app-integration-test).

[`imports/ui/components/client/todos-item.tests.js`](https://github.com/meteor/todos/blob/master/imports/ui/components/client/todos-item.tests.js):

```js
/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { Meteor } from 'meteor/meteor';
import { Factory } from 'meteor/dburles:factory';
import { Random } from 'meteor/random';
import chai from 'chai';
import StubCollections from 'meteor/hwillson:stub-collections';
import { Template } from 'meteor/templating';
import $ from 'jquery';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sinon from 'sinon';

import { withRenderedTemplate } from '../../test-helpers.js';
import '../lists-show-page.js';

import { Todos } from '../../../api/todos/todos.js';
import { Lists } from '../../../api/lists/lists.js';

describe('Lists_show_page', function () {
  const listId = Random.id();

  beforeEach(function () {
    StubCollections.stub([Todos, Lists]);
    Template.registerHelper('_', key => key);
    sinon.stub(FlowRouter, 'getParam').returns(listId);
    sinon.stub(Meteor, 'subscribe').returns.({
      subscriptionId: 0,
      ready: () => true,
    });
  });

  afterEach(function () {
    StubCollections.restore();
    Template.deregisterHelper('_');
    FlowRouter.getParam.restore();
    Meteor.subscribe.restore();
  });

  it('renders correctly with simple data', function () {
    Factory.create('list', { _id: listId });
    const timestamp = new Date();
    const todos = [...Array(3).keys()].forEach(i => Factory.create('todo', {
      listId,
      createdAt: new Date(timestamp - (3 - i)),
    }));

    withRenderedTemplate('Lists_show_page', {}, el => {
      const todosText = todos.map(t => t.text).reverse();
      const renderedText = $(el).find('.list-items input[type=text]')
        .map((i, e) => $(e).val())
        .toArray();
      chai.assert.deepEqual(renderedText, todosText);
    });
  });
});
```

Of particular interest in this test is the following:

#### Importing

As we'll run this test in the same way that we did our unit test, we need to `import` the relevant modules under test in the same way that we [did in the unit test](#simple-integration-test-importing).

#### Stubbing

As the system under test in our integration test has a larger surface area, we need to stub out a few more points of integration with the rest of the stack. Of particular interest here is our use of the [`hwillson:stub-collections`](#mocking-the-database) package and of [Sinon](http://sinonjs.org) to stub out Flow Router and our Subscription.

#### Creating data

In this test, we used [Factory package's](#test-data) `.create()` API, which inserts data into the real collection. However, as we've proxied all of the `Todos` and `Lists` collection methods onto a local collection (this is what `hwillson:stub-collections` is doing), we won't run into any problems with trying to perform inserts from the client.

This integration test can be run the exact same way as we ran [unit tests above](#running-unit-tests).

<h3 id="full-app-integration-test">Full-app integration test</h3>

In the [Todos](https://github.com/meteor/todos) example application, we have a integration test which ensures that we see the full contents of a list when we route to it, which demonstrates a few techniques of integration tests.

[`imports/startup/client/routes.app-test.js`](https://github.com/meteor/todos/blob/master/imports/startup/client/routes.app-test.js):

```js
/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { DDP } from 'meteor/ddp-client';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { assert } from 'chai';

import { Promise } from 'meteor/promise';
import $ from 'jquery';

import { denodeify } from '../../utils/denodeify';
import { generateData } from './../../api/generate-data.app-tests.js';
import { Lists } from '../../api/lists/lists.js';
import { Todos } from '../../api/todos/todos.js';


// Utility -- returns a promise which resolves when all subscriptions are done
const waitForSubscriptions = () => new Promise(resolve => {
  const poll = Meteor.setInterval(() => {
    if (DDP._allSubscriptionsReady()) {
      Meteor.clearInterval(poll);
      resolve();
    }
  }, 200);
});

// Tracker.afterFlush runs code when all consequent of a tracker based change
//   (such as a route change) have occured. This makes it a promise.
const afterFlushPromise = denodeify(Tracker.afterFlush);

if (Meteor.isClient) {
  describe('data available when routed', () => {
    // First, ensure the data that we expect is loaded on the server
    //   Then, route the app to the homepage
    beforeEach(() => generateData()
      .then(() => FlowRouter.go('/'))
      .then(waitForSubscriptions)
    );

    describe('when logged out', () => {
      it('has all public lists at homepage', () => {
        assert.equal(Lists.find().count(), 3);
      });

      it('renders the correct list when routed to', () => {
        const list = Lists.findOne();
        FlowRouter.go('Lists.show', { _id: list._id });

        return afterFlushPromise()
          .then(waitForSubscriptions)
          .then(() => {
            assert.equal($('.title-wrapper').html(), list.name);
            assert.equal(Todos.find({ listId: list._id }).count(), 3);
          });
      });
    });
  });
}
```

Of note here:

- Before running, each test sets up the data it needs using the `generateData` helper (see [the section on creating integration test data](#creating-integration-test-data) for more detail) then goes to the homepage.

- Although Flow Router doesn't take a done callback, we can use `Tracker.afterFlush` to wait for all its reactive consequences to occur.

- Here we wrote a little utility (which could be abstracted into a general package) to wait for all the subscriptions which are created by the route change (the `todos.inList` subscription in this case) to become ready before checking their data.

### Running full-app tests

To run the [full-app tests](#test-modes) in our application, we run:

```txt
meteor test --full-app --driver-package meteortesting:mocha
```

When we connect to the test instance in a browser, we want to render a testing UI rather than our app UI, so the `mocha-web-reporter` package will hide any UI of our application and overlay it with its own. However the app continues to behave as normal, so we are able to route around and check the correct data is loaded.

<h3 id="creating-integration-test-data">Creating data</h3>

To create test data in full-app test mode, it usually makes sense to create some special test methods which we can call from the client side. Usually when testing a full app, we want to make sure the publications are sending through the correct data (as we do in this test), and so it's not sufficient to stub out the collections and place synthetic data in them. Instead we'll want to actually create data on the server and let it be published.

Similar to the way we cleared the database using a method in the `beforeEach` in the [test data](#test-data) section above, we can call a method to do that before running our tests. In the case of our routing tests, we've used a file called [`imports/api/generate-data.app-tests.js`](https://github.com/meteor/todos/blob/master/imports/api/generate-data.app-tests.js) which defines this method (and will only be loaded in full app test mode, so is not available in general!):

```js
// This file will be auto-imported in the app-test context,
// ensuring the method is always available

import { Meteor } from 'meteor/meteor';
import { Factory } from 'meteor/dburles:factory';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { Random } from 'meteor/random';

import { denodeify } from '../utils/denodeify';

const createList = (userId) => {
  const list = Factory.create('list', { userId });
  [...Array(3).keys()].forEach(() => Factory.create('todo', { listId: list._id }));
  return list;
};

// Remember to double check this is a test-only file before
// adding a method like this!
Meteor.methods({
  generateFixtures() {
    resetDatabase();

    // create 3 public lists
    [...Array(3).keys()].forEach(() => createList());

    // create 3 private lists
    [...Array(3).keys()].forEach(() => createList(Random.id()));
  },
});

let generateData;
if (Meteor.isClient) {
  // Create a second connection to the server to use to call
  // test data methods. We do this so there's no contention
  // with the currently tested user's connection.
  const testConnection = Meteor.connect(Meteor.absoluteUrl());

  generateData = denodeify((cb) => {
    testConnection.call('generateFixtures', cb);
  });
}

export { generateData };
```

Note that we've exported a client-side symbol `generateData` which is a promisified version of the method call, which makes it simpler to use this sequentially in tests.

Also of note is the way we use a second DDP connection to the server in order to send these test "control" method calls.