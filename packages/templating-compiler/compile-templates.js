Plugin.registerCompiler({
  extensions: ['html'],
  isTemplate: true
}, () => new CachingHtmlCompiler(
  "templating",
  TemplatingTools.scanHtmlForTags,
  TemplatingTools.compileTagsWithSpacebars
));
