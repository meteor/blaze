import { HTMLTools } from 'meteor/html-tools';
import { BlazeTools } from 'meteor/blaze-tools';
import { codeGen } from './compiler';


// ============================================================
// Code-generation of template tags

// The `CodeGen` class currently has no instance state, but in theory
// it could be useful to track per-function state, like whether we
// need to emit `var self = this` or not.
export function CodeGen() {
}

export const builtInBlockHelpers = {
  if: 'Blaze.If',
  unless: 'Blaze.Unless',
  with: 'Spacebars.With',
  each: 'Blaze.Each',
  let: 'Blaze.Let',
};


// Mapping of "macros" which, when preceded by `Template.`, expand
// to special code rather than following the lookup rules for dotted
// symbols.
const builtInTemplateMacros = {
  // `view` is a local variable defined in the generated render
  // function for the template in which `Template.contentBlock` or
  // `Template.elseBlock` is invoked.
  contentBlock: 'view.templateContentBlock',
  elseBlock: 'view.templateElseBlock',

  // Confusingly, this makes `{{> Template.dynamic}}` an alias
  // for `{{> __dynamic}}`, where "__dynamic" is the template that
  // implements the dynamic template feature.
  dynamic: 'Template.__dynamic',

  subscriptionsReady: 'view.templateInstance().subscriptionsReady()',
};

const additionalReservedNames = ['body', 'toString', 'instance', 'constructor',
  'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf',
  'propertyIsEnumerable', '__defineGetter__', '__lookupGetter__',
  '__defineSetter__', '__lookupSetter__', '__proto__', 'dynamic',
  'registerHelper', 'currentData', 'parentData', '_migrateTemplate',
  '_applyHmrChanges', '__pendingReplacement',
];

// A "reserved name" can't be used as a <template> name.  This
// function is used by the template file scanner.
//
// Note that the runtime imposes additional restrictions, for example
// banning the name "body" and names of built-in object properties
// like "toString".
export function isReservedName(name) {
  return Object.hasOwnProperty.call(builtInBlockHelpers, name) ||
    Object.hasOwnProperty.call(builtInTemplateMacros, name) ||
    additionalReservedNames.includes(name);
}

const makeObjectLiteral = function (obj) {
  const parts = [];
  Object.getOwnPropertyNames(obj).forEach((k) => parts.push(`${BlazeTools.toObjectLiteralKey(k)}: ${obj[k]}`));
  return `{${parts.join(', ')}}`;
};

Object.assign(CodeGen.prototype, {
  codeGenTemplateTag(tag) {
    let dataCode;
    const self = this;
    if (tag.position === HTMLTools.TEMPLATE_TAG_POSITION.IN_START_TAG) {
      // Special dynamic attributes: `<div {{attrs}}>...`
      // only `tag.type === 'DOUBLE'` allowed (by earlier validation)
      return new BlazeTools.EmitCode(`function () { return ${
        self.codeGenMustache(tag.path, tag.args, 'attrMustache')
      }; }`);
    }
    if (tag.type === 'DOUBLE' || tag.type === 'TRIPLE') {
      let code = self.codeGenMustache(tag.path, tag.args);
      if (tag.type === 'TRIPLE') {
        code = `Spacebars.makeRaw(${code})`;
      }
      if (tag.position !== HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {
        // Reactive attributes are already wrapped in a function,
        // and there's no fine-grained reactivity.
        // Anywhere else, we need to create a View.
        code = `new Blaze.View(${
            BlazeTools.toJSLiteral(`lookup:${tag.path.join('.')}`)}, ` +
          `function () { return ${code}; })`;
      }
      return new BlazeTools.EmitCode(code);
    }
    if (tag.type === 'INCLUSION' || tag.type === 'BLOCKOPEN') {
      const { path } = tag;
      const { args } = tag;

      if (tag.type === 'BLOCKOPEN' &&
        Object.hasOwnProperty.call(builtInBlockHelpers, path[0])) {
        // if, unless, with, each.
        //
        // If someone tries to do `{{> if}}`, we don't
        // get here, but an error is thrown when we try to codegen the path.

        // Note: If we caught these errors earlier, while scanning, we'd be able to
        // provide nice line numbers.
        if (path.length > 1) throw new Error(`Unexpected dotted path beginning with ${path[0]}`);
        if (!args.length) throw new Error(`#${path[0]} requires an argument`);

        dataCode = null;
        // #each has a special treatment as it features two different forms:
        // - {{#each people}}
        // - {{#each person in people}}
        if (path[0] === 'each' && args.length >= 2 && args[1][0] === 'PATH' &&
          args[1][1].length && args[1][1][0] === 'in') {
          // minimum conditions are met for each-in.  now validate this
          // isn't some weird case.
          const eachUsage = 'Use either {{#each items}} or ' +
            '{{#each item in items}} form of #each.';
          const inArg = args[1];
          if (!(args.length >= 3 && inArg[1].length === 1)) {
            // we don't have at least 3 space-separated parts after #each, or
            // inArg doesn't look like ['PATH',['in']]
            throw new Error(`Malformed #each. ${eachUsage}`);
          }
          // split out the variable name and sequence arguments
          const variableArg = args[0];
          if (!(variableArg[0] === 'PATH' && variableArg[1].length === 1 &&
            variableArg[1][0].replace(/\./g, ''))) {
            throw new Error('Bad variable name in #each');
          }
          const variable = variableArg[1][0];
          dataCode = `function () { return { _sequence: ${
            self.codeGenInclusionData(args.slice(2))
          }, _variable: ${BlazeTools.toJSLiteral(variable)} }; }`;
        } else if (path[0] === 'let') {
          const dataProps = {};
          args.forEach(function (arg) {
            if (arg.length !== 3) {
              // not a keyword arg (x=y)
              throw new Error('Incorrect form of #let');
            }
            const argKey = arg[2];
            dataProps[argKey] =
              `function () { return Spacebars.call(${
                self.codeGenArgValue(arg)}); }`;
          });
          dataCode = makeObjectLiteral(dataProps);
        }

        if (!dataCode) {
          // `args` must exist (tag.args.length > 0)
          dataCode = self.codeGenInclusionDataFunc(args) || 'null';
        }

        // `content` must exist
        const contentBlock = (('content' in tag) ?
          self.codeGenBlock(tag.content) : null);
        // `elseContent` may not exist
        const elseContentBlock = (('elseContent' in tag) ?
          self.codeGenBlock(tag.elseContent) : null);

        const callArgs = [dataCode, contentBlock];
        if (elseContentBlock) callArgs.push(elseContentBlock);

        return new BlazeTools.EmitCode(
          `${builtInBlockHelpers[path[0]]}(${callArgs.join(', ')})`);
      }
      let compCode = self.codeGenPath(path, { lookupTemplate: true });
      if (path.length > 1) {
        // capture reactivity
        compCode = `function () { return Spacebars.call(${compCode
        }); }`;
      }

      dataCode = self.codeGenInclusionDataFunc(tag.args);
      const content = (('content' in tag) ?
        self.codeGenBlock(tag.content) : null);
      const elseContent = (('elseContent' in tag) ?
        self.codeGenBlock(tag.elseContent) : null);

      const includeArgs = [compCode];
      if (content) {
        includeArgs.push(content);
        if (elseContent) includeArgs.push(elseContent);
      }

      let includeCode =
        `Spacebars.include(${includeArgs.join(', ')})`;

      // calling convention compat -- set the data context around the
      // entire inclusion, so that if the name of the inclusion is
      // a helper function, it gets the data context in `this`.
      // This makes for a pretty confusing calling convention --
      // In `{{#foo bar}}`, `foo` is evaluated in the context of `bar`
      // -- but it's what we shipped for 0.8.0.  The rationale is that
      // `{{#foo bar}}` is sugar for `{{#with bar}}{{#foo}}...`.
      if (dataCode) {
        includeCode =
          `Blaze._TemplateWith(${dataCode}, function () { return ${
            includeCode}; })`;
      }

      // XXX BACK COMPAT - UI is the old name, Template is the new
      if ((path[0] === 'UI' || path[0] === 'Template') &&
        (path[1] === 'contentBlock' || path[1] === 'elseBlock')) {
        // Call contentBlock and elseBlock in the appropriate scope
        includeCode = `Blaze._InOuterTemplateScope(view, function () { return ${
          includeCode}; })`;
      }

      return new BlazeTools.EmitCode(includeCode);
    }
    if (tag.type === 'ESCAPE') {
      return tag.value;
    }
    // Can't get here; TemplateTag validation should catch any
    // inappropriate tag types that might come out of the parser.
    throw new Error(`Unexpected template tag type: ${tag.type}`);
  },

  // `path` is an array of at least one string.
  //
  // If `path.length > 1`, the generated code may be reactive
  // (i.e. it may invalidate the current computation).
  //
  // No code is generated to call the result if it's a function.
  //
  // Options:
  //
  // - lookupTemplate {Boolean} If true, generated code also looks in
  //   the list of templates. (After helpers, before data context).
  //   Used when generating code for `{{> foo}}` or `{{#foo}}`. Only
  //   used for non-dotted paths.
  codeGenPath(path, opts) {
    if (Object.hasOwnProperty.call(builtInBlockHelpers, path[0])) throw new Error(`Can't use the built-in '${path[0]}' here`);
    // Let `{{#if Template.contentBlock}}` check whether this template was
    // invoked via inclusion or as a block helper, in addition to supporting
    // `{{> Template.contentBlock}}`.
    // XXX BACK COMPAT - UI is the old name, Template is the new
    if (path.length >= 2 &&
      (path[0] === 'UI' || path[0] === 'Template')
      && Object.hasOwnProperty.call(builtInTemplateMacros, path[1])) {
      if (path.length > 2) {
        throw new Error(`Unexpected dotted path beginning with ${
          path[0]}.${path[1]}`);
      }
      return builtInTemplateMacros[path[1]];
    }

    const firstPathItem = BlazeTools.toJSLiteral(path[0]);
    let lookupMethod = 'lookup';
    if (opts && opts.lookupTemplate && path.length === 1) lookupMethod = 'lookupTemplate';
    let code = `view.${lookupMethod}(${firstPathItem})`;

    if (path.length > 1) {
      code = `Spacebars.dot(${code}, ${
        path.slice(1).map(BlazeTools.toJSLiteral).join(', ')})`;
    }

    return code;
  },

  // Generates code for an `[argType, argValue]` argument spec,
  // ignoring the third element (keyword argument name) if present.
  //
  // The resulting code may be reactive (in the case of a PATH of
  // more than one element) and is not wrapped in a closure.
  codeGenArgValue(arg) {
    const self = this;

    const argType = arg[0];
    const argValue = arg[1];

    let argCode;
    switch (argType) {
      case 'STRING':
      case 'NUMBER':
      case 'BOOLEAN':
      case 'NULL':
        argCode = BlazeTools.toJSLiteral(argValue);
        break;
      case 'PATH':
        argCode = self.codeGenPath(argValue);
        break;
      case 'EXPR':
        // The format of EXPR is ['EXPR', { type: 'EXPR', path: [...], args: { ... } }]
        argCode = self.codeGenMustache(argValue.path, argValue.args, 'dataMustache');
        break;
      default:
        // can't get here
        throw new Error(`Unexpected arg type: ${argType}`);
    }

    return argCode;
  },

  // Generates a call to `Spacebars.fooMustache` on evaluated arguments.
  // The resulting code has no function literals and must be wrapped in
  // one for fine-grained reactivity.
  codeGenMustache(path, args, mustacheType) {
    const self = this;

    const nameCode = self.codeGenPath(path);
    const argCode = self.codeGenMustacheArgs(args);
    const mustache = (mustacheType || 'mustache');

    return `Spacebars.${mustache}(${nameCode
    }${argCode ? `, ${argCode.join(', ')}` : ''})`;
  },

  // returns: array of source strings, or null if no
  // args at all.
  codeGenMustacheArgs(tagArgs) {
    const self = this;

    let kwArgs = null; // source -> source
    let args = null; // [source]

    // tagArgs may be null
    tagArgs.forEach(function (arg) {
      const argCode = self.codeGenArgValue(arg);

      if (arg.length > 2) {
        // keyword argument (represented as [type, value, name])
        kwArgs = (kwArgs || {});
        kwArgs[arg[2]] = argCode;
      } else {
        // positional argument
        args = (args || []);
        args.push(argCode);
      }
    });

    // put kwArgs in options dictionary at end of args
    if (kwArgs) {
      args = (args || []);
      args.push(`Spacebars.kw(${makeObjectLiteral(kwArgs)})`);
    }

    return args;
  },

  codeGenBlock(content) {
    return codeGen(content);
  },

  codeGenInclusionData(args) {
    const self = this;

    if (!args.length) {
      // e.g. `{{#foo}}`
      return null;
    }
    if (args[0].length === 3) {
      // keyword arguments only, e.g. `{{> point x=1 y=2}}`
      const dataProps = {};
      args.forEach(function (arg) {
        const argKey = arg[2];
        dataProps[argKey] = `Spacebars.call(${self.codeGenArgValue(arg)})`;
      });
      return makeObjectLiteral(dataProps);
    }
    if (args[0][0] !== 'PATH') {
      // literal first argument, e.g. `{{> foo "blah"}}`
      //
      // tag validation has confirmed, in this case, that there is only
      // one argument (`args.length === 1`)
      return self.codeGenArgValue(args[0]);
    }
    if (args.length === 1) {
      // one argument, must be a PATH
      return `Spacebars.call(${self.codeGenPath(args[0][1])})`;
    }
    // Multiple positional arguments; treat them as a nested
    // "data mustache"
    return self.codeGenMustache(args[0][1], args.slice(1),
      'dataMustache');
  },

  codeGenInclusionDataFunc(args) {
    const self = this;
    const dataCode = self.codeGenInclusionData(args);
    if (dataCode) {
      return `function () { return ${dataCode}; }`;
    }
    return null;
  },

});
