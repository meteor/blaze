/* global CachingHtmlCompiler TemplatingTools */
Plugin.registerCompiler({
  extensions: ['html'],
  // archMatching removed — compile for all architectures (web + os/server)
  // so that Template definitions are available server-side for SSG rendering.
  isTemplate: true,
}, () => new CachingHtmlCompiler(
  'templating',
  TemplatingTools.scanHtmlForTags,
  TemplatingTools.compileTagsWithSpacebars
));
