export function generateTemplateJS(name, renderFuncCode, useHMR) {
  const nameLiteral = JSON.stringify(name);
  const templateDotNameLiteral = JSON.stringify(`Template.${name}`);

  if (useHMR) {
    // module.hot.data is used to make sure Template.__checkName can still
    // detect duplicates
    return `
Template._migrateTemplate(
  ${nameLiteral},
  new Template(${templateDotNameLiteral}, ${renderFuncCode}),
);
if (typeof module === "object" && module.hot) {
  module.hot.accept();
  module.hot.dispose(function () {
    Template.__pendingReplacement.push(${nameLiteral});
    Template._applyHmrChanges(${nameLiteral});
  });
}
`
  }

  return `
Template.__checkName(${nameLiteral});
Template[${nameLiteral}] = new Template(${templateDotNameLiteral}, ${renderFuncCode});
`;
}

export function generateBodyJS(renderFuncCode, useHMR) {
  if (useHMR) {
    return `
(function () {
  var renderFunc = ${renderFuncCode};
  Template.body.addContent(renderFunc);
  Meteor.startup(Template.body.renderToDocument);
  if (typeof module === "object" && module.hot) {
    module.hot.accept();
    module.hot.dispose(function () {
      var index = Template.body.contentRenderFuncs.indexOf(renderFunc)
      Template.body.contentRenderFuncs.splice(index, 1);
      Template._applyHmrChanges();
    });
  }
})();
`
  }

  return `
Template.body.addContent(${renderFuncCode});
Meteor.startup(Template.body.renderToDocument);
`;
}
