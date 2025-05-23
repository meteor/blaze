import has from 'lodash.has';

/** @param {function(Binding): boolean} fn */
function _createBindingsHelper(fn) {
  /** @param {string[]} names */
  return (...names) => {
    const view = Blaze.currentView;

    // There's either zero arguments (i.e., check all bindings) or an additional
    // "hash" argument that we have to ignore.
    names = names.length === 0
      // TODO: Should we walk up the bindings here?
      ? Object.keys(view._scopeBindings)
      : names.slice(0, -1);

    return names.some(name => {
      const binding = _lexicalBindingLookup(view, name);
      if (!binding) {
        throw new Error(`Binding for "${name}" was not found.`);
      }

      return fn(binding.get());
    });
  };
}

Blaze._globalHelpers = {
  /** @summary Check whether any of the given bindings (or all if none given) is still pending. */
  '@pending': _createBindingsHelper(binding => binding === undefined),
  /** @summary Check whether any of the given bindings (or all if none given) has rejected. */
  '@rejected': _createBindingsHelper(binding => !!binding && 'error' in binding),
  /** @summary Check whether any of the given bindings (or all if none given) has resolved. */
  '@resolved': _createBindingsHelper(binding => !!binding && 'value' in binding),
};

// Documented as Template.registerHelper.
// This definition also provides back-compat for `UI.registerHelper`.
Blaze.registerHelper = function (name, func) {
  Blaze._globalHelpers[name] = func;
};

// Also documented as Template.deregisterHelper
Blaze.deregisterHelper = function(name) {
  delete Blaze._globalHelpers[name];
};

const bindIfIsFunction = function (x, target) {
  if (typeof x !== 'function')
    return x;
  return Blaze._bind(x, target);
};

// If `x` is a function, binds the value of `this` for that function
// to the current data context.
const bindDataContext = function (x) {
  if (typeof x === 'function') {
    return function (...args) {
      let data = Blaze.getData();
      if (data == null)
        data = {};
      return x.apply(data, args);
    };
  }
  return x;
};

Blaze._OLDSTYLE_HELPER = {};

Blaze._getTemplateHelper = function (template, name, tmplInstanceFunc) {
  // XXX COMPAT WITH 0.9.3
  let isKnownOldStyleHelper = false;

  if (template.__helpers.has(name)) {
    const helper = template.__helpers.get(name);
    if (helper === Blaze._OLDSTYLE_HELPER) {
      isKnownOldStyleHelper = true;
    } else if (helper != null) {
      const printName = `${template.viewName} ${name}`;
      return wrapHelper(bindDataContext(helper), tmplInstanceFunc, printName);
    } else {
      return null;
    }
  }

  // old-style helper
  if (name in template) {
    // Only warn once per helper
    if (! isKnownOldStyleHelper) {
      template.__helpers.set(name, Blaze._OLDSTYLE_HELPER);
      if (! template._NOWARN_OLDSTYLE_HELPERS) {
        Blaze._warn('Assigning helper with `' + template.viewName + '.' +
                    name + ' = ...` is deprecated.  Use `' + template.viewName +
                    '.helpers(...)` instead.');
      }
    }
    if (template[name] != null) {
      return wrapHelper(bindDataContext(template[name]), tmplInstanceFunc);
    }
  }

  return null;
};

const wrapHelper = function (f, templateFunc, name = 'template helper') {
  if (typeof f !== "function") {
    return f;
  }

  return function (...args) {
    const self = this;

    return Blaze.Template._withTemplateInstanceFunc(templateFunc, function () {
      return Blaze._wrapCatchingExceptions(f, name).apply(self, args);
    });
  };
};

function _lexicalKeepGoing(currentView) {
  if (!currentView.parentView) {
    return undefined;
  }
  if (!currentView.__startsNewLexicalScope) {
    return currentView.parentView;
  }
  if (currentView.parentView.__childDoesntStartNewLexicalScope) {
    return currentView.parentView;
  }

  // in the case of {{> Template.contentBlock data}} the contentBlock loses the lexical scope of it's parent, wheras {{> Template.contentBlock}} it does not
  // this is because a #with sits between the include InOuterTemplateScope
  if (currentView.parentView.name === "with" && currentView.parentView.parentView && currentView.parentView.parentView.__childDoesntStartNewLexicalScope) {
    return currentView.parentView;
  }
  return undefined;
}

function _lexicalBindingLookup(view, name) {
  let currentView = view;

  // walk up the views stopping at a Spacebars.include or Template view that
  // doesn't have an InOuterTemplateScope view as a parent
  do {
    // skip block helpers views
    // if we found the binding on the scope, return it
    if (has(currentView._scopeBindings, name)) {
      return currentView._scopeBindings[name];
    }
  } while (currentView = _lexicalKeepGoing(currentView));

  return null;
}

Blaze._lexicalBindingLookup = function (view, name) {
  const binding = _lexicalBindingLookup(view, name);
  return binding && (() => binding.get()?.value);
};

// templateInstance argument is provided to be available for possible
// alternative implementations of this function by 3rd party packages.
Blaze._getTemplate = function (name, templateInstance) {
  if ((name in Blaze.Template) && (Blaze.Template[name] instanceof Blaze.Template)) {
    return Blaze.Template[name];
  }
  return null;
};

Blaze._getGlobalHelper = function (name, templateInstance) {
  if (Blaze._globalHelpers[name] != null) {
    const printName = `global helper ${name}`;
    return wrapHelper(bindDataContext(Blaze._globalHelpers[name]), templateInstance, printName);
  }
  return null;
};

// Looks up a name, like "foo" or "..", as a helper of the
// current template; the name of a template; a global helper;
// or a property of the data context.  Called on the View of
// a template (i.e. a View with a `.template` property,
// where the helpers are).  Used for the first name in a
// "path" in a template tag, like "foo" in `{{foo.bar}}` or
// ".." in `{{frobulate ../blah}}`.
//
// Returns a function, a non-function value, or null.  If
// a function is found, it is bound appropriately.
//
// NOTE: This function must not establish any reactive
// dependencies itself.  If there is any reactivity in the
// value, lookup should return a function.
Blaze.View.prototype.lookup = function (name, _options) {
  const template = this.template;
  const lookupTemplate = _options && _options.template;
  let helper;
  let binding;
  let boundTmplInstance;
  let foundTemplate;

  if (this.templateInstance) {
    boundTmplInstance = Blaze._bind(this.templateInstance, this);
  }

  // 0. looking up the parent data context with the special "../" syntax
  if (/^\./.test(name)) {
    // starts with a dot. must be a series of dots which maps to an
    // ancestor of the appropriate height.
    if (!/^(\.)+$/.test(name))
      throw new Error("id starting with dot must be a series of dots");

    return Blaze._parentData(name.length - 1, true /*_functionWrapped*/);

  }

  // 1. look up a helper on the current template
  if (template && ((helper = Blaze._getTemplateHelper(template, name, boundTmplInstance)) != null)) {
    return helper;
  }

  // 2. look up a binding by traversing the lexical view hierarchy inside the
  // current template
  if (template && (binding = Blaze._lexicalBindingLookup(Blaze.currentView, name)) != null) {
    return binding;
  }

  // 3. look up a template by name
  if (lookupTemplate && ((foundTemplate = Blaze._getTemplate(name, boundTmplInstance)) != null)) {
    return foundTemplate;
  }

  // 4. look up a global helper
  helper = Blaze._getGlobalHelper(name, boundTmplInstance);
  if (helper != null) {
    return helper;
  }

  // 5. look up in a data context
  return function (...args) {
    const isCalledAsFunction = (args.length > 0);
    const data = Blaze.getData();
    const x = data && data[name];
    if (! x) {
      if (lookupTemplate) {
        throw new Error("No such template: " + name);
      } else if (isCalledAsFunction) {
        throw new Error("No such function: " + name);
      } else if (name.charAt(0) === '@' && ((x === null) ||
                                            (x === undefined))) {
        // Throw an error if the user tries to use a `@directive`
        // that doesn't exist.  We don't implement all directives
        // from Handlebars, so there's a potential for confusion
        // if we fail silently.  On the other hand, we want to
        // throw late in case some app or package wants to provide
        // a missing directive.
        throw new Error("Unsupported directive: " + name);
      }
    }
    if (! data) {
      return null;
    }
    if (typeof x !== 'function') {
      if (isCalledAsFunction) {
        throw new Error("Can't call non-function: " + x);
      }
      return x;
    }
    return x.apply(data, args);
  };
};

// Implement Spacebars' {{../..}}.
// @param height {Number} The number of '..'s
Blaze._parentData = function (height, _functionWrapped) {
  // If height is null or undefined, we default to 1, the first parent.
  if (height == null) {
    height = 1;
  }
  let theWith = Blaze.getView('with');
  for (let i = 0; (i < height) && theWith; i++) {
    theWith = Blaze.getView(theWith, 'with');
  }

  if (! theWith)
    return null;
  if (_functionWrapped)
    return function () { return theWith.dataVar.get()?.value; };
  return theWith.dataVar.get()?.value;
};


Blaze.View.prototype.lookupTemplate = function (name) {
  return this.lookup(name, {template:true});
};
