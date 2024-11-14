# How to Deploy the Packages

## Prerequisites
- Ensure you have Meteor installed and are logged in to your Meteor account
  - If you're running a checkout, make sure you're in the right updated branch
- Make sure to update the version numbers in each package's `package.js` file before publishing

## Publishing Packages

### Automatic Publishing (Recommended)
Run the `publish-all.sh` script from the root directory:
```bash
./publish-all.sh
```

### Manual Publishing
If you need to publish specific packages only:
1. Remove unwanted packages from `publish-all.sh`, or
2. Manually publish individual packages using:
```bash
cd packages/<package-name>
meteor publish
```

If you change the  `publish-all.sh` script removing packages, **do not commit the changes**.

## Package Dependencies
The publish order is critical due to package dependencies. The current sequence publishes "leaf" packages first (those with fewer dependencies), followed by packages that depend on them:

```
1. htmljs              7.  observe-sequence     13. templating
2. html-tools          8.  blaze               14. spacebars-tests
3. blaze-tools         9.  spacebars           15. blaze-html-templates
4. spacebars-compiler  10. templating-compiler  16. ui
5. templating-tools    11. templating-runtime
6. caching-html-compiler 12. blaze-hot
```

> ⚠️ **IMPORTANT**: Maintaining this order is crucial for successful deployment. Do not modify the sequence unless you fully understand the dependency chain.
