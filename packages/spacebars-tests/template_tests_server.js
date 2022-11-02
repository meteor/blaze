/* global Npm Meteor Assets */

const path = Npm.require('path');

Meteor.methods({
  getAsset (filename) {
    return Assets.getText(path.join('assets', filename));
  },
});

const templateSubFutures = {};

Meteor.publish('templateSub', function (futureId) {
  const self = this;
  Meteor.defer(async function () { // because subs are blocking
    if (futureId) {
      // XXX: this looks a little bit weird but we need to make
      // the internal `resolve` of the promise accessible for the Meteor.method
      // `makeTemplateSubReady` without introducing an async/wait cascade
      // Thus we link it to a member of the promise and store it in the dict.
      // This is the same effect as the prior Future.wait() approach.
      let resolver;
      const promise = new Promise((resolve) => {
        resolver = resolve;
      });
      promise.return = () => resolver();

      templateSubFutures[futureId] = promise;
      await templateSubFutures[futureId];
      delete templateSubFutures[futureId];
    }

    self.ready();
  });
});
Meteor.methods({
  makeTemplateSubReady (futureId) {
    templateSubFutures[futureId].return();
  },
});
