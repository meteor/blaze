Plugin.registerCompiler({
  extensions: ['html', 'blaze'],
  archMatching: 'web',
  isTemplate: true
}, () => new CachingHtmlCompiler(
  "templating",
  TemplatingTools.scanHtmlForTags,
  TemplatingTools.compileTagsWithSpacebars
));
