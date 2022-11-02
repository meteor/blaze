/* global Template Blaze */
/* eslint-disable no-global-assign */

// Packages and apps add templates on to this object.

/**
 * @summary The class for defining templates
 * @class
 * @instanceName Template.myTemplate
 */
// eslint-disable-next-line prefer-destructuring
Template = Blaze.Template;

const RESERVED_TEMPLATE_NAMES = '__proto__ name'.split(' ');

// Check for duplicate template names and illegal names that won't work.
Template.__checkName = function (name) {
  // Some names can't be used for Templates. These include:
  //  - Properties Blaze sets on the Template object.
  //  - Properties that some browsers don't let the code to set.
  //    These are specified in RESERVED_TEMPLATE_NAMES.
  if (name in Template || RESERVED_TEMPLATE_NAMES.includes(name)) {
    if (Template[name] instanceof Template && name !== 'body') {
      throw new Error(
        `There are multiple templates named '${
          name
        }'. Each template needs a unique name.`
      );
    }
    throw new Error(`This template name is reserved: ${name}`);
  }
};

let shownWarning = false;

// XXX COMPAT WITH 0.8.3
Template.__define__ = function (name, renderFunc) {
  Template.__checkName(name);
  Template[name] = new Template(`Template.${name}`, renderFunc);
  // Exempt packages built pre-0.9.0 from warnings about using old
  // helper syntax, because we can.  It's not very useful to get a
  // warning about someone else's code (like a package on Atmosphere),
  // and this should at least put a bit of a dent in number of warnings
  // that come from packages that haven't been updated lately.
  Template[name]._NOWARN_OLDSTYLE_HELPERS = true;

  // Now we want to show at least one warning so that people get serious about
  // updating away from this method.
  if (!shownWarning) {
    shownWarning = true;
    console.warn('You app is using old Template definition that is scheduled to be removed with Blaze 3.0, please check your app and packages for use of: Template.__define__');
  }
};

// Define a template `Template.body` that renders its
// `contentRenderFuncs`.  `<body>` tags (of which there may be
// multiple) will have their contents added to it.

/**
 * @summary The [template object](#Template-Declarations) representing your `<body>`
 * tag.
 * @locus Client
 */
Template.body = new Template('body', function () {
  const view = this;
  return Template.body.contentRenderFuncs.map(function (func) {
    return func.apply(view);
  });
});
Template.body.contentRenderFuncs = []; // array of Blaze.Views
Template.body.view = null;

Template.body.addContent = function (renderFunc) {
  Template.body.contentRenderFuncs.push(renderFunc);
};

// This function does not use `this` and so it may be called
// as `Meteor.startup(Template.body.renderIntoDocument)`.
Template.body.renderToDocument = function () {
  // Only do it once.
  if (Template.body.view) return;

  const view = Blaze.render(Template.body, document.body);
  Template.body.view = view;
};

Template.__pendingReplacement = [];

let updateTimeout = null;

// Simple HMR integration to re-render all of the root views
// when a template is modified. This function can be overridden to provide
// an alternative method of applying changes from HMR.
Template._applyHmrChanges = function (/* templateName */) {
  if (updateTimeout) {
    return;
  }

  // debounce so we only re-render once per rebuild
  updateTimeout = setTimeout(function () {
    updateTimeout = null;

    for (let i = 0; i < Template.__pendingReplacement.length; i++) {
      delete Template[Template.__pendingReplacement[i]];
    }

    Template.__pendingReplacement = [];

    const views = Blaze.__rootViews.slice();
    views
      .filter(view => !view.destroyed)
      .forEach(view => {
        const _view = view;
        const renderFunc = _view._render;
        let parentEl;
        if (_view._domrange && _view._domrange.parentElement) {
          parentEl = _view._domrange.parentElement;
        } else if (_view._hmrParent) {
          parentEl = _view._hmrParent;
        }

        let comment;
        if (_view._hmrAfter) {
          comment = _view._hmrAfter;
        } else {
          const first = _view._domrange.firstNode();
          comment = document.createComment('Blaze HMR PLaceholder');
          parentEl.insertBefore(comment, first);
        }

        _view._hmrAfter = null;
        _view._hmrParent = null;

        if (_view._domrange) {
          Blaze.remove(_view);
        }

        try {
          if (_view === Template.body.view) {
            const newView = Blaze.render(Template.body, document.body, comment);
            Template.body.view = newView;
          } else if (_view.dataVar) {
            Blaze.renderWithData(renderFunc, _view.dataVar.curValue, parentEl, comment);
          } else {
            Blaze.render(renderFunc, parentEl, comment);
          }

          parentEl.removeChild(comment);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('[Blaze HMR] Error re-rending template:');
          console.error(e);

          // Record where the view should have been so we can still render it
          // during the next update
          const newestRoot = Blaze.__rootViews[Blaze.__rootViews.length - 1];
          if (newestRoot && newestRoot.isCreated && !newestRoot.isRendered) {
            newestRoot._hmrAfter = comment;
            newestRoot._hmrParent = parentEl;
          }
        }
      });
  });
};

Template._migrateTemplate = function (templateName, newTemplate) {
  const oldTemplate = Template[templateName];
  const migrate = Template.__pendingReplacement.indexOf(templateName) > -1;
  const _newTemplate = newTemplate;

  if (oldTemplate && migrate) {
    _newTemplate.__helpers = oldTemplate.__helpers;
    _newTemplate.__eventMaps = oldTemplate.__eventMaps;
    _newTemplate._callbacks.created = oldTemplate._callbacks.created;
    _newTemplate._callbacks.rendered = oldTemplate._callbacks.rendered;
    _newTemplate._callbacks.destroyed = oldTemplate._callbacks.destroyed;
    delete Template[templateName];
    Template._applyHmrChanges(templateName);
  }

  if (migrate) {
    Template.__pendingReplacement.splice(
      Template.__pendingReplacement.indexOf(templateName),
      1
    );
  }

  Template.__checkName(templateName);
  Template[templateName] = _newTemplate;
};
