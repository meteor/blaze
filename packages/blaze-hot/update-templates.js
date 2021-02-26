export const UpdateAll = Symbol('update all templates')

let renderedTemplates = {};
let overrideTemplateContentBlock = null;
let overrideTemplateElseBlock = null;

const oldConstructView = Template.prototype.constructView;

Template.prototype.constructView = function () {
  let view = oldConstructView.apply(this, arguments);
  let templateName = this.viewName;

  view.onViewCreated(function () {
    renderedTemplates[templateName] = renderedTemplates[templateName] || [];
    renderedTemplates[templateName].push(view);
  });

  view.onViewDestroyed(function () {
    const index = renderedTemplates[templateName].indexOf(view);
    if (index > -1) {
      renderedTemplates[templateName].splice(index, 1);
    }
  });

  if (overrideTemplateContentBlock) {
    view.templateContentBlock = overrideTemplateContentBlock;
    overrideTemplateContentBlock = null;
  }

  if (overrideTemplateElseBlock) {
    view.templateElseBlock = overrideTemplateElseBlock;
    overrideTemplateElseBlock = null;
  }

  return view;
}

let updateRootViews = Template._applyHmrChanges;

let timeout = null;
let modifiedTemplates = new Set();
let templateViewPrefix = 'Template.';
Template._applyHmrChanges = function (templateName = UpdateAll) {
  if (templateName === UpdateAll) {
    clearTimeout(timeout);
    updateRootViews();
    return;
  } else {
    modifiedTemplates.add(templateName);
  }

  if (timeout) {
    return;
  }

  timeout = setTimeout(() => {
    timeout = null;
    modifiedTemplates.forEach(templateName => {
      modifiedTemplates.delete(templateName);
      let viewName = templateName;

      if (!(viewName in renderedTemplates)) {
        viewName = templateViewPrefix + viewName;
      } else {
        console.error('[Blaze HMR] Error: view name does not start with Template');
        return;
      }

      if (!(viewName in renderedTemplates)) {
        return;
      }

      let views = renderedTemplates[viewName];
      renderedTemplates[viewName] = [];
      while (views.length > 0) {
        let view = views.pop();

        // find first parent template that isn't a content block
        while (!view.template || view.templateContentBlock || view.templateElseBlock) {
          if (!view.parentView) {
            console.log('[Blaze HMR] Unable to update template', viewName);
            return;
          }

          view = view.parentView;
        }

        let parent = view.parentView;
        let parentElement = view._domrange.parentElement;
        let next = view._domrange.lastNode().nextSibling;
        let nextComment = null;

        if (!next) {
          // percolate:momentum requires a next node to show the new nodes
          next = nextComment = document.createComment('Blaze HMR Placeholder');
          parentElement.insertBefore(nextComment, null);
        }

        if (!parent) {
          // TODO: we only need to update a single root view
          return updateRootViews();
          console.log('[Blaze HMR] Error: unable to update - no parent');
          continue;
        }

        // TODO: this can be removed if we don't update a view, and then update
        // one of its children (we only need to update the parent).
        Package.tracker.Tracker.flush();

        if (view.templateContentBlock) {
          overrideTemplateContentBlock = view.templateContentBlock;
        }
        if (view.templateElseBlock) {
          overrideTemplateElseBlock = view.templateElseBlock;
        }

        // Since there is a parent range, Blaze will not automatically
        // detach the dom range.
        view._domrange.detach();
        view._domrange.destroy();
        let newView = Blaze.render(
          Template[view.template.viewName.slice('Template.'.length)],
          parentElement,
          next,
          parent
        );

        let index = parent._domrange.members.findIndex(member => {
          return member && member.view === view;
        });
        parent._domrange.members.splice(index, 1, newView._domrange);

        if (nextComment) {
          parentElement.removeChild(nextComment);
        }
      }
    });
  });
}
