# Contributing to Blaze

## How to run your app with the future version of Blaze to test it?

First, you have to clone the repository:

```bash
git clone --recursive https://github.com/meteor/blaze.git
```

Let's assume you cloned it into `/home/user/projects/blaze`.

You can use `master` branch which contains the work for next Blaze version, or you can switch to various
feature branches where we are developing new features.
You can see the name of the branch at the top of the GitHub pull request with work on that branch.

### Temporary

If you want to just temporary use the Blaze packages from the repository, you can run Meteor inside your app like:

```bash
METEOR_PACKAGE_DIRS=/home/user/projects/blaze/packages meteor
```

### Using symlinks

You can also create a `packages` directory inside your app (if you do not already have it) and
make symlinks for every package in the Blaze repository. Like:

```
ln -s /home/user/projects/blaze/packages/blaze packages/
ln -s /home/user/projects/blaze/packages/blaze-html-templates packages/
...
```

And so on for all the packages.
