/* global Blaze */
/* eslint-disable import/no-unresolved */

import has from 'lodash.has';

const { Template } = Blaze;

/**
 * @isTemplate true
 * @memberOf Template
 * @function dynamic
 * @summary Choose a template to include dynamically, by name.
 * @locus Templates
 * @param {String} template The name of the template to include.
 * @param {Object} [data] Optional. The data context in which to include the
 * template.
 */

Template.__dynamicWithDataContext.helpers({
  chooseTemplate (name) {
    return Blaze._getTemplate(name, function () {
      return Template.instance();
    });
  },
});

Template.__dynamic.helpers({
  dataContextPresent () {
    return has(this, 'data');
  },
  checkContext () {
    if (!has(this, 'template')) {
      throw new Error(
        "Must specify name in the 'template' argument " +
          'to {{> Template.dynamic}}.'
      );
    }

    Object.keys(this).forEach(function (k) {
      if (k !== 'template' && k !== 'data') {
        throw new Error(`Invalid argument to {{> Template.dynamic}}: ${k}`);
      }
    });
  },
});
