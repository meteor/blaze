
// Packages and apps add templates on to this object.

/**
 * @summary The class for defining templates
 * @class
 * @instanceName Template.myTemplate
 */
Template = Blaze.Template;

var RESERVED_TEMPLATE_NAMES = "__proto__ name".split(" ");

// Check for duplicate template names and illegal names that won't work.
Template.__checkName = function (name) {
  // Some names can't be used for Templates. These include:
  //  - Properties Blaze sets on the Template object.
  //  - Properties that some browsers don't let the code to set.
  //    These are specified in RESERVED_TEMPLATE_NAMES.
  if (name in Template || _.contains(RESERVED_TEMPLATE_NAMES, name)) {
    if ((Template[name] instanceof Template) && name !== "body")
      throw new Error("There are multiple templates named '" + name + "'. Each template needs a unique name.");
    throw new Error("This template name is reserved: " + name);
  }
};

// XXX COMPAT WITH 0.8.3
Template.__define__ = function (name, renderFunc) {
  Template.__checkName(name);
  Template[name] = new Template("Template." + name, renderFunc);
  // Exempt packages built pre-0.9.0 from warnings about using old
  // helper syntax, because we can.  It's not very useful to get a
  // warning about someone else's code (like a package on Atmosphere),
  // and this should at least put a bit of a dent in number of warnings
  // that come from packages that haven't been updated lately.
  Template[name]._NOWARN_OLDSTYLE_HELPERS = true;
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
  var view = this;
  return _.map(Template.body.contentRenderFuncs, function (func) {
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
  if (Template.body.view)
    return;

  var view = Blaze.render(Template.body, document.body);
  Template.body.view = view;
};

Template.__pendingReplacement = []

var updateTimeout = null;

// Simple HMR integration to re-render all of the root views
// when a template is modified. This function can be overridden to provide
// an alternative method of applying changes from HMR.
Template._applyHmrChanges = function (templateName) {
  if (updateTimeout) {
    return;
  }

  // debounce so we only re-render once per rebuild
  updateTimeout = setTimeout(function () {
    updateTimeout = null;

    for (var i = 0; i < Template.__pendingReplacement.length; i++) {
      delete Template[Template.__pendingReplacement[i]]
    }

    Template.__pendingReplacement = [];

    var views = Blaze.__rootViews.slice();
    for(var i = 0; i < views.length; i++) {
      var view = views[i];
      if (view.destroyed) {
        continue;
      }

      var renderFunc = view._render;
      var parentEl;
      if (view._domrange && view._domrange.parentElement) {
        parentEl = view._domrange.parentElement;
      } else if (view._hmrParent) {
        parentEl = view._hmrParent;
      }

      var comment;
      if (view._hmrAfter) {
        comment = view._hmrAfter;
      } else {
        var first = view._domrange.firstNode();
        comment = document.createComment('Blaze HMR PLaceholder');
        parentEl.insertBefore(comment, first);
      }

      view._hmrAfter = null;
      view._hmrParent = null;

      if (view._domrange) {
        Blaze.remove(view);
      }

      try {
        if (view === Template.body.view) {
          var newView = Blaze.render(Template.body, document.body, comment);
          Template.body.view = newView;
        } else if (view.dataVar) {
          Blaze.renderWithData(renderFunc, view.dataVar.curValue, parentEl, comment);
        } else {
          Blaze.render(renderFunc, parentEl, comment);
        }

        parentEl.removeChild(comment);
      } catch (e) {
        console.log('[Blaze HMR] Error re-rending template:');
        console.error(e);

        // Record where the view should have been so we can still render it
        // during the next update
        var newestRoot = Blaze.__rootViews[Blaze.__rootViews.length - 1];
        if (newestRoot && newestRoot.isCreated && !newestRoot.isRendered) {
          newestRoot._hmrAfter = comment;
          newestRoot._hmrParent = parentEl;
        }
      }
    }
  });
}

Template._migrateTemplate = function (templateName, newTemplate, migrate) {
  var oldTemplate = Template[templateName];
  var migrate = Template.__pendingReplacement.indexOf(templateName) > -1

  if (oldTemplate && migrate) {
    newTemplate.__helpers = oldTemplate.__helpers;
    newTemplate.__eventMaps = oldTemplate.__eventMaps;
    newTemplate._callbacks.created = oldTemplate._callbacks.created;
    newTemplate._callbacks.rendered = oldTemplate._callbacks.rendered;
    newTemplate._callbacks.destroyed = oldTemplate._callbacks.destroyed;
    delete Template[templateName];
    Template._applyHmrChanges(templateName);
  }


  if (migrate) {
    Template.__pendingReplacement.splice(
      Template.__pendingReplacement.indexOf(templateName),
      1
    )
  }

  Template.__checkName(templateName);
  Template[templateName] = newTemplate;
};

// XXX COMPAT WITH 0.9.0
UI.body = Template.body;

// XXX COMPAT WITH 0.9.0
// (<body> tags in packages built with 0.9.0)
Template.__body__ = Template.body;
Template.__body__.__contentParts = Template.body.contentViews;
Template.__body__.__instantiate = Template.body.renderToDocument;
