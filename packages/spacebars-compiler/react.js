import { HTML } from 'meteor/htmljs';

// A visitor to ensure that React components included via the `{{>
// React}}` template defined in the react-template-helper package are
// the only child in their parent component. Otherwise `React.render`
// would eliminate all of their sibling nodes.
//
// It's a little strange that this logic is in spacebars-compiler if
// it's only relevant to a specific package but there's no way to have
// a package hook into a build plugin.
export const ReactComponentSiblingForbidder = HTML.Visitor.extend();
ReactComponentSiblingForbidder.def({
  visitArray (array, parentTag) {
    for (let i = 0; i < array.length; i++) {
      this.visit(array[i], parentTag);
    }
  },
  visitObject (obj, parentTag) {
    if (obj.type === 'INCLUSION' && obj.path.length === 1 && obj.path[0] === 'React') {
      if (!parentTag) {
        throw new Error(
          `{{> React}} must be used in a container element${
             this.sourceName ? (` in ${this.sourceName}`) : ''
                }. Learn more at https://github.com/meteor/meteor/wiki/React-components-must-be-the-only-thing-in-their-wrapper-element`);
      }

      let numSiblings = 0;
      for (let i = 0; i < parentTag.children.length; i++) {
        const child = parentTag.children[i];
        if (child !== obj && !(typeof child === 'string' && child.match(/^\s*$/))) {
          numSiblings++;
        }
      }

      if (numSiblings > 0) {
        throw new Error(
          `{{> React}} must be used as the only child in a container element${
             this.sourceName ? (` in ${this.sourceName}`) : ''
                }. Learn more at https://github.com/meteor/meteor/wiki/React-components-must-be-the-only-thing-in-their-wrapper-element`);
      }
    }
  },
  visitTag (tag) {
    this.visitArray(tag.children, tag /* parentTag */);
  },
});
