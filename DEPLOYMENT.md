# How to Deploy the Packages

## Prerequisites
- Ensure you have Meteor installed and are logged in to your Meteor account
  - If you're running a checkout, make sure you're in the right updated branch
- Make sure to update the version numbers in each package's `package.js` file before publishing

## Preparing 3.1.0-beta.1

The `release-3.1.0` branch prepares this package set:

| Packages | Version |
| --- | --- |
| `blaze`, `blaze-html-templates` | `3.1.0-beta.1` |
| `templating` | `1.5.0-beta.1` |
| The other 13 packages in `publish-all.sh` | `2.1.0-beta.1` |

The local `test-in-browser` driver is not published. Internal dependencies in
`package.js` must reference this beta's package versions as well.

Before publishing, run the package suite with both the native and jQuery DOM
backends using the commands in `AGENTS.md`, and check the Meteor integration
results in [meteor/meteor#14754](https://github.com/meteor/meteor/pull/14754).
Those checks must cover the exact source commit being published. Update the
Blaze submodule in the integration PR when the release preparation changes.

Check that each target version is still available with `meteor show
<package>@<version>`, then replace `unreleased` in `HISTORY.md` with the actual
publication date and commit that change. Run `./publish-all.sh` from the
repository root in its existing dependency order.

After publishing, commit the `.versions` files written by Meteor, following the
beta.0 publication. Verify the package records with `meteor show
blaze@3.1.0-beta.1` and `meteor show blaze-html-templates@3.1.0-beta.1`, then
check installation in a separate app without `METEOR_PACKAGE_DIRS` or local
Blaze packages:

```bash
meteor add blaze-html-templates@3.1.0-beta.1
```

Keep the integration PR's submodule on the final recorded release commit.
Publishing this beta does not require merging 3.1.0 into `master` or deploying
the documentation site.

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
