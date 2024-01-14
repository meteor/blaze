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

  if (! _existingWorkStack) {
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

const materializeDOMInner = function (htmljs, intoArray, parentView, workStack) {
  if (htmljs == null) {
    // null or undefined
    return;
  }

  switch (typeof htmljs) {
  case 'string': case 'boolean': case 'number':
    intoArray.push(document.createTextNode(String(htmljs)));
    return;
  case 'object':
    if (htmljs.htmljsType) {
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
      case HTML.Raw.htmljsType:
        // Get an array of DOM nodes by using the browser's HTML parser
        // (like innerHTML).
        const nodes = Blaze._DOMBackend.parseHTML(htmljs.value);
        for (let i = 0; i < nodes.length; i++)
          intoArray.push(nodes[i]);
        return;
      }
    } else if (HTML.isArray(htmljs)) {
      for (let i = htmljs.length-1; i >= 0; i--) {
        workStack.push(Blaze._bind(Blaze._materializeDOM, null,
                              htmljs[i], intoArray, parentView, workStack));
      }
      return;
    } else {
      // Try to construct a `Blaze.View` out of the object. If it works...
      if (isPromiseLike(htmljs)) {
        htmljs = Blaze._Await(htmljs);
      } else if (htmljs instanceof Blaze.Template) {
        htmljs = htmljs.constructView();
      }

      // ...materialize it.
      if (htmljs instanceof Blaze.View) {
        Blaze._materializeView(htmljs, parentView, workStack, intoArray);
        return;
      }
    }
  }

  throw new Error("Unexpected object in htmljs: " + htmljs);
};

const isPromiseLike = x => !!x && typeof x.then === 'function';

function then(maybePromise, fn) {
  if (isPromiseLike(maybePromise)) {
    maybePromise.then(fn);
  } else {
    fn(maybePromise);
  }
}

function waitForAllAttributes(attrs) {
  // Non-object attrs (e.g., `null`) are ignored.
  if (!attrs || attrs !== Object(attrs)) {
    return {};
  }

  // Combined attributes, e.g., `<img {{x}} {{y}}>`.
  if (Array.isArray(attrs)) {
    const mapped = attrs.map(waitForAllAttributes);
    return mapped.some(isPromiseLike) ? Promise.all(mapped) : mapped;
  }

  // Singular async attributes, e.g., `<img {{x}}>`.
  if (isPromiseLike(attrs)) {
    return attrs.then(waitForAllAttributes);
  }

  // Singular sync attributes, with potentially async properties.
  const promises = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (isPromiseLike(value)) {
      promises.push(value.then(value => {
        attrs[key] = value;
      }));
    } else if (Array.isArray(value)) {
      value.forEach((element, index) => {
        if (isPromiseLike(element)) {
          promises.push(element.then(element => {
            value[index] = element;
          }));
        }
      });
    }
  }

  // If any of the properties were async, lift the `Promise`.
  return promises.length ? Promise.all(promises).then(() => attrs) : attrs;
}

const materializeTag = function (tag, parentView, workStack) {
  const tagName = tag.tagName;
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
  let children = tag.children;
  if (tagName === 'textarea' && tag.children.length &&
      ! (rawAttrs && ('value' in rawAttrs))) {
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
      then(waitForAllAttributes(expandedAttrs), awaitedAttrs => {
        const flattenedAttrs = HTML.flattenAttributes(awaitedAttrs);
        const stringAttrs = {};
        Object.keys(flattenedAttrs).forEach((attrName) => {
          // map `null`, `undefined`, and `false` to null, which is important
          // so that attributes with nully values are considered absent.
          // stringify anything else (e.g. strings, booleans, numbers including 0).
          if (flattenedAttrs[attrName] == null || flattenedAttrs[attrName] === false)
            stringAttrs[attrName] = null;
          else
            stringAttrs[attrName] = Blaze._toText(flattenedAttrs[attrName],
                                                  parentView,
                                                  HTML.TEXTMODE.STRING);
        });
        attrUpdater.update(stringAttrs);
      });
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
        if (x instanceof Blaze._DOMRange)
          x.attach(elem);
        else
          elem.appendChild(x);
      }
    });
    // now push the task that calculates childNodesAndRanges
    workStack.push(Blaze._bind(Blaze._materializeDOM, null,
                          children, childNodesAndRanges, parentView,
                          workStack));
  }

  return elem;
};


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
  return (node.tagName === "a" &&
          node.attrs &&
          node.attrs["xlink:href"] !== undefined);
};
