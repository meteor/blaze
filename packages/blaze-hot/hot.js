import { Blaze } from 'meteor/blaze';
import { Template as Templates} from 'meteor/templating-runtime';
import { UpdateAll } from './update-templates.js';

let importedTemplating = new WeakMap();
let currentModule = {id: null};
const SourceModule = Symbol();

function patchTemplate(Template) {
  const oldRegisterHelper = Template.registerHelper;
  Template.registerHelper = function (name, func) {
    func[SourceModule] = currentModule.id;
    oldRegisterHelper(name, func);
  }

  const oldOnCreated = Template.prototype.onCreated;
  Template.prototype.onCreated = function (cb) {
    if (cb) {
      cb[SourceModule] = currentModule.id;
    }

    return oldOnCreated.call(this, cb);
  }

  const oldOnRendered = Template.prototype.onRendered;
  Template.prototype.onRendered = function (cb) {
    if (cb) {
      cb[SourceModule] = currentModule.id;
    }

    return oldOnRendered.call(this, cb);
  }

  const oldOnDestroyed = Template.prototype.onDestroyed;
  Template.prototype.onDestroyed = function (cb) {
    if (cb) {
      cb[SourceModule] = currentModule.id;
    }

    return oldOnDestroyed.call(this, cb);
  }

  const oldHelpers = Template.prototype.helpers;
  Template.prototype.helpers = function (dict) {
    if (typeof dict === 'object') {
      for (var k in dict) {
        if (dict[k]) {
          dict[k][SourceModule] = currentModule.id;
        }
      }
    }

    return oldHelpers.call(this, dict);
  }

  const oldEvents = Template.prototype.events;
  Template.prototype.events = function (eventMap) {
    const result = oldEvents.call(this, eventMap);
    this.__eventMaps[this.__eventMaps.length - 1][SourceModule] = currentModule.id;
    return result;
  }
}

function cleanTemplate(template, moduleId) {
  let usedModule = false
  if (!template || !Blaze.isTemplate(template)) {
    return usedModule;
  }

  function cleanArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
      let item = array[i];
      if (item && item[SourceModule] === moduleId) {
        usedModule = true
        array.splice(i, 1);
      }
    }
  }

  cleanArray(template._callbacks.created);
  cleanArray(template._callbacks.rendered);
  cleanArray(template._callbacks.destroyed);
  cleanArray(template.__eventMaps);

  Object.keys(template.__helpers).forEach(key => {
    if (template.__helpers[key] && template.__helpers[key][SourceModule] === moduleId) {
      usedModule = true
      delete template.__helpers[key];
    }
  });

  return usedModule
}

function shouldAccept(module) {
  if (!importedTemplating.get(module)) {
    return false;
  }
  if (!module.exports) {
    return true;
  }

  return Object.keys(module.exports).filter(key => key !== '__esModule').length === 0;
}

if (module.hot) {
  patchTemplate(Blaze.Template);
  module.hot.onRequire({
    before(module) {
      if (module.id === '/node_modules/meteor/blaze.js' || module.id === '/node_modules/meteor/templating.js') {
        importedTemplating.set(currentModule, true);
      }

      let previousModule = currentModule;
      currentModule = module;
      return previousModule;
    },
    after(module, previousModule) {
      if (shouldAccept(module)) {
        module.hot.accept();
        module.hot.dispose(() => {
          Object.keys(Templates).forEach(templateName => {
            let template = Templates[templateName]
            let usedByModule = cleanTemplate(template, module.id);
            if (usedByModule) {
              Template._applyHmrChanges(templateName);
            }
          });

          Object.values(Blaze._globalHelpers).forEach(helper => {
            if (helper && helper[SourceModule] === module.id) {
              Template._applyHmrChanges(UpdateAll);
            }
          });
        });
      }
      currentModule = previousModule
    }
  });
}
