/* global Blaze HTML ElementAttributesUpdater Tracker */
/* eslint-disable import/no-unresolved, no-cond-assign, no-global-assign, no-restricted-syntax, prefer-rest-params, no-param-reassign, no-multi-assign */

const isSVGAnchor = function (node) {
  // We generally aren't able to detect SVG <a> elements because
  // if "A" were in our list of known svg element names, then all
  // <a> nodes would be created using
  // `document.createElementNS`. But in the special case of <a
  // xlink:href="...">, we can at least detect that attribute and
  // create an SVG <a> tag in that case.
  //
  // However, we still have a general problem of knowing when to
  // use document.createElementNS and when to use
  // document.createElement; for example, font tags will always
  // be created as SVG elements which can cause other
  // problems. #1977
  return (node.tagName === 'a' &&
    node.attrs &&
    node.attrs['xlink:href'] !== undefined);
};

const materializeTag = function (tag, parentView, workStack) {
  const { tagName } = tag;
  let elem;
  if ((HTML.isKnownSVGElement(tagName) || isSVGAnchor(tag))
    && document.createElementNS) {
    // inline SVG
    elem = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  } else {
    // normal elements
    elem = document.createElement(tagName);
  }

  let rawAttrs = tag.attrs;
  let { children } = tag;
  if (tagName === 'textarea' && tag.children.length &&
    !(rawAttrs && ('value' in rawAttrs))) {
    // Provide very limited support for TEXTAREA tags with children
    // rather than a "value" attribute.
    // Reactivity in the form of Views nested in the tag's children
    // won't work.  Compilers should compile textarea contents into
    // the "value" attribute of the tag, wrapped in a function if there
    // is reactivity.
    if (typeof rawAttrs === 'function' ||
      HTML.isArray(rawAttrs)) {
      throw new Error("Can't have reactive children of TEXTAREA node; " +
        "use the 'value' attribute instead.");
    }
    rawAttrs = Object.assign({}, rawAttrs || null);
    rawAttrs.value = Blaze._expand(children, parentView);
    children = [];
  }

  if (rawAttrs) {
    const attrUpdater = new ElementAttributesUpdater(elem);
    const updateAttributes = function () {
      const expandedAttrs = Blaze._expandAttributes(rawAttrs, parentView);
      const flattenedAttrs = HTML.flattenAttributes(expandedAttrs);
      const stringAttrs = {};
      // eslint-disable-next-line no-unused-vars
      for (const attrName in flattenedAttrs) {
        // map `null`, `undefined`, and `false` to null, which is important
        // so that attributes with nully values are considered absent.
        // stringify anything else (e.g. strings, booleans, numbers including 0).
        if (flattenedAttrs[attrName] == null || flattenedAttrs[attrName] === false) stringAttrs[attrName] = null;
        else {
          stringAttrs[attrName] = Blaze._toText(flattenedAttrs[attrName],
            parentView,
            HTML.TEXTMODE.STRING);
        }
      }
      attrUpdater.update(stringAttrs);
    };
    let updaterComputation;
    if (parentView) {
      updaterComputation =
        parentView.autorun(updateAttributes, undefined, 'updater');
    } else {
      updaterComputation = Tracker.nonreactive(function () {
        return Tracker.autorun(function () {
          Tracker._withCurrentView(parentView, updateAttributes);
        });
      });
    }
    Blaze._DOMBackend.Teardown.onElementTeardown(elem, function attrTeardown() {
      updaterComputation.stop();
    });
  }

  if (children.length) {
    const childNodesAndRanges = [];
    // push this function first so that it's done last
    workStack.push(function () {
      for (let i = 0; i < childNodesAndRanges.length; i++) {
        const x = childNodesAndRanges[i];
        if (x instanceof Blaze._DOMRange) x.attach(elem);
        else elem.appendChild(x);
      }
    });
    // now push the task that calculates childNodesAndRanges
    workStack.push(Blaze._bind(Blaze._materializeDOM, null,
      children, childNodesAndRanges, parentView,
      workStack));
  }

  return elem;
};


const materializeDOMInner = function (htmljs, intoArray, parentView, workStack) {
  if (htmljs == null) {
    // null or undefined
    return;
  }

  // eslint-disable-next-line default-case
  switch (typeof htmljs) {
    case 'string':
    case 'boolean':
    case 'number':
      intoArray.push(document.createTextNode(String(htmljs)));
      return;
    case 'object':
      if (htmljs.htmljsType) {
        // eslint-disable-next-line default-case
        switch (htmljs.htmljsType) {
          case HTML.Tag.htmljsType:
            intoArray.push(materializeTag(htmljs, parentView, workStack));
            return;
          case HTML.CharRef.htmljsType:
            intoArray.push(document.createTextNode(htmljs.str));
            return;
          case HTML.Comment.htmljsType:
            intoArray.push(document.createComment(htmljs.sanitizedValue));
            return;
          case HTML.Raw.htmljsType: {
            // Get an array of DOM nodes by using the browser's HTML parser
            // (like innerHTML).
            const nodes = Blaze._DOMBackend.parseHTML(htmljs.value);
            for (let i = 0; i < nodes.length; i++) intoArray.push(nodes[i]);
            return;
          }
        }
      } else if (HTML.isArray(htmljs)) {
        for (let i = htmljs.length - 1; i >= 0; i--) {
          workStack.push(Blaze._bind(Blaze._materializeDOM, null,
            htmljs[i], intoArray, parentView, workStack));
        }
        return;
      } else {
        if (htmljs instanceof Blaze.Template) {
          htmljs = htmljs.constructView();
          // fall through to Blaze.View case below
        }
        if (htmljs instanceof Blaze.View) {
          Blaze._materializeView(htmljs, parentView, workStack, intoArray);
          return;
        }
      }
  }

  throw new Error(`Unexpected object in htmljs: ${htmljs}`);
};

// Turns HTMLjs into DOM nodes and DOMRanges.
//
// - `htmljs`: the value to materialize, which may be any of the htmljs
//   types (Tag, CharRef, Comment, Raw, array, string, boolean, number,
//   null, or undefined) or a View or Template (which will be used to
//   construct a View).
// - `intoArray`: the array of DOM nodes and DOMRanges to push the output
//   into (required)
// - `parentView`: the View we are materializing content for (optional)
// - `_existingWorkStack`: optional argument, only used for recursive
//   calls when there is some other _materializeDOM on the call stack.
//   If _materializeDOM called your function and passed in a workStack,
//   pass it back when you call _materializeDOM (such as from a workStack
//   task).
//
// Returns `intoArray`, which is especially useful if you pass in `[]`.
Blaze._materializeDOM = function (htmljs, intoArray, parentView,
                                  _existingWorkStack) {
  // In order to use fewer stack frames, materializeDOMInner can push
  // tasks onto `workStack`, and they will be popped off
  // and run, last first, after materializeDOMInner returns.  The
  // reason we use a stack instead of a queue is so that we recurse
  // depth-first, doing newer tasks first.
  const workStack = (_existingWorkStack || []);
  materializeDOMInner(htmljs, intoArray, parentView, workStack);

  if (!_existingWorkStack) {
    // We created the work stack, so we are responsible for finishing
    // the work.  Call each "task" function, starting with the top
    // of the stack.
    while (workStack.length) {
      // Note that running task() may push new items onto workStack.
      const task = workStack.pop();
      task();
    }
  }

  return intoArray;
};
