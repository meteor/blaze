## Blaze JS - https://blazejs.org

This is a [VitePress](https://vitepress.dev) site used to generate the
[Blaze JS documentation](https://blazejs.org/).

### Running locally

```
npm install
npm run docs:init   # links CONTRIBUTING, CODE_OF_CONDUCT and SECURITY from the repository root
npm run docs:api    # regenerates source/api/{blaze,spacebars,templates_api}.md from the JSDoc
npm run docs:dev
```

`npm run docs:build` builds the static site into `.vitepress/dist`.

### Generated API pages

`source/api/blaze.md`, `source/api/spacebars.md` and `source/api/templates_api.md`
are generated from the JSDoc comments of the packages by `npm run docs:api` and
committed. Run it after changing a JSDoc comment: the `Docs` workflow fails when
they are out of date.

### Deployment

blazejs.org is served by Netlify, configured by `netlify.toml` at the repository
root: it builds `site/` with the three commands above and publishes
`.vitepress/dist`. The `Docs` workflow runs the same build on every pull request.
