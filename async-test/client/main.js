import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { Template } from 'meteor/templating';

import './main.html';

const Collection = new Mongo.Collection(null);
Collection.insertAsync({});
Collection.insertAsync({});
Collection.insertAsync({});

Template.example.helpers({
  // Cursors.
  cursorGetterAsync: () => Promise.resolve(Collection.find()),
  cursorGetterSync: () => Collection.find(),
  cursorValueAsync: Promise.resolve(Collection.find()),
  cursorValueSync: Collection.find(),

  // Primitives.
  primitiveGetterAsync: () => Promise.resolve(Random.id()),
  primitiveGetterSync: () => Random.id(),
  primitiveValueAsync: Promise.resolve(Random.id()),
  primitiveValueSync: Random.id(),

  // Objects.
  asyncObjectAsyncProperty: Promise.resolve({ foo: Promise.resolve(Random.id()) }),
  asyncObjectSyncProperty: Promise.resolve({ foo: Random.id() }),
  syncObjectAsyncProperty: { foo: Promise.resolve(Random.id()) },
  syncObjectSyncProperty: { foo: Random.id() },

  // Non-ideal states of #letAwait.
  delayed: new Promise(resolve => setTimeout(() => resolve(Random.id()), 1000)),
  pending: new Promise(() => {}),
  rejected: Promise.reject(Random.id()),
});
