## Blaze JS - http://blazejs.org

This is a [vitepress](https://vitepress.dev) static site used to generate
the [Blaze JS Documentation](http://blazejs.org/).

### Running locally

```
npm install
npm run docs:dev
```

#### Generating `data.js`

To generate the api boxes, the site uses a file `data/data.js` which is generated from the js docs in
the [Blaze source code](https://github.com/meteor/blaze). This will automatically happen whenever you start your local
hexo server.

#### Starting hexo

Ensure you've run `npm install`. Then simply `npm start`.
