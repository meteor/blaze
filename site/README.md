## Blaze JS - http://blazejs.org

This is a [hexo](https://hexo.io) static site used to generate the [Blaze JS Documentation](http://blazejs.org/).

### Running locally

#### Submodules

This repo has two submodules, one the theme, the other full Meteor repository.

We have the Meteor repo to generate the `data.js` file (see below).

After cloning, or updating the repo, it makes sense to run

```
cd .. && git submodule update --init
```

Generally you should not commit changes to the submodules, unless you know what you are doing.

#### Generating `data.js`

To generate the api boxes, the site uses a file `data/data.js` which is generated from the js docs in the [Meteor source code](https://github.com/meteor/meteor). This will automatically happen whenever you start your local hexo server.

#### Starting hexo

Ensure you've run `npm install`. Then simply `npm start`.
