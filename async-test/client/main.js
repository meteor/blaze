import { Template } from "meteor/templating";
import { ReactiveVar } from "meteor/reactive-var";

import { Mongo } from "meteor/mongo";
import "./main.html";
export const LinksCollection = new Mongo.Collection(null);
  // Insert a document into the collection
  LinksCollection.insertAsync({
    title: "Do the Tutorial",
    url: "https://www.meteor.com/tutorials/react/creating-an-app",
  });
  LinksCollection.insertAsync({
    title: "Do the Tutorial",
    url: "https://www.meteor.com/tutorials/react/creating-an-app",
  });

Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);


});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
  fooAsync() {
    const p = new Promise((resolve) => resolve("foo"));
    return p;
  },
  foo() {
    return {
      bar: "baz",
    };
  },
  links() {
    return LinksCollection.find();
  },
  async linksAsync() {
    return LinksCollection.find();
  },
});

Template.hello.events({
  "click button"(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});
