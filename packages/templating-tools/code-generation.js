TemplatingTools.generateTemplateJS =
function generateTemplateJS(name, renderFuncCode, useHMR) {
  const nameLiteral = JSON.stringify(name);
  const templateDotNameLiteral = JSON.stringify(`Template.${name}`);

  if (useHMR) {
    // module.hot.data is used to make sure Template.__checkName can still
    // detect duplicates
    return `
Template._migrateTemplate(
  ${nameLiteral},
  new Template(${templateDotNameLiteral}, ${renderFuncCode}),
  module && module.hot && module.hot.data && module.hot.data[${nameLiteral}]
);
if (typeof module === "object" && module.hot) {
  if (module.hot.data) {
    module.hot.data[${nameLiteral}] = false;
  }
  module.hot.accept();
  module.hot.dispose((data) => {
    data[${nameLiteral}] = true;
  });
}
`
  }

  return `
Template.__checkName(${nameLiteral});
Template[${nameLiteral}] = new Template(${templateDotNameLiteral}, ${renderFuncCode});
`;
}

TemplatingTools.generateBodyJS =
function generateBodyJS(renderFuncCode, useHMR) {
  if (useHMR) {
    return `
(function () {
  var renderFunc = ${renderFuncCode};
  Template.body.addContent(renderFunc);
  Meteor.startup(Template.body.renderToDocument);
  if (typeof module === "object" && module.hot) {
    module.hot.accept();
    module.hot.dispose(() => {
      var index = Template.body.contentRenderFuncs.indexOf(renderFunc)
      Template.body.contentRenderFuncs.splice(renderFunc, 1);
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
