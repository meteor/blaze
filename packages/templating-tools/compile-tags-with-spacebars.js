import { SpacebarsCompiler } from 'meteor/spacebars-compiler';
import { generateBodyJS, generateTemplateJS } from './code-generation';
import { throwCompileError } from './throw-compile-error';

export function compileTagsWithSpacebars(tags, hmrAvailable) {
  const handler = new SpacebarsTagCompiler();

  tags.forEach((tag) => {
    handler.addTagToResults(tag, hmrAvailable);
  });

  return handler.getResults();
}


class SpacebarsTagCompiler {
  constructor() {
    this.results = {
      head: '',
      body: '',
      js: '',
      bodyAttrs: {}
    };
  }

  getResults() {
    return this.results;
  }

  addTagToResults(tag, hmrAvailable) {
    this.tag = tag;

    // do we have 1 or more attributes?
    const hasAttribs = Object.keys(this.tag.attribs).length > 0;

    if (this.tag.tagName === "head") {
      if (hasAttribs) {
        this.throwCompileError("Attributes on <head> not supported");
      }

      this.results.head += this.tag.contents;
      return;
    }


    // <body> or <template>

    try {
      if (this.tag.tagName === "template") {
        const name = this.tag.attribs.name;

        if (! name) {
          this.throwCompileError("Template has no 'name' attribute");
        }

        if (SpacebarsCompiler.isReservedName(name)) {
          this.throwCompileError(`Template can't be named "${name}"`);
        }

        const whitespace = this.tag.attribs.whitespace || '';

        const renderFuncCode = SpacebarsCompiler.compile(this.tag.contents, {
          whitespace,
          isTemplate: true,
          sourceName: `Template "${name}"`
        });

        this.results.js += generateTemplateJS(
          name, renderFuncCode, hmrAvailable);
      } else if (this.tag.tagName === "body") {
        const { whitespace = '', ...attribs } = this.tag.attribs;
        this.addBodyAttrs(attribs);

        const renderFuncCode = SpacebarsCompiler.compile(this.tag.contents, {
          whitespace,
          isBody: true,
          sourceName: "<body>"
        });

        // We may be one of many `<body>` tags.
        this.results.js += generateBodyJS(renderFuncCode, hmrAvailable);
      } else {
        this.throwCompileError("Expected <template>, <head>, or <body> tag in template file", tagStartIndex);
      }
    } catch (e) {
      if (e.scanner) {
        // In production builds (no HMR), throw a proper compile error
        // so the build fails with a clear error message as expected
        if (!hmrAvailable) {
          this.throwCompileError(e.message, this.tag.contentsStartIndex + e.offset);
        }

        // In development (HMR available), generate fallback code that
        // shows the compile error in the client-side error indicator
        const errorMessage = e.message;
        const errorOffset = this.tag.contentsStartIndex + e.offset;
        const errorLine = this.tag.fileContents
          .substring(0, errorOffset).split('\n').length;

        const sourceName = this.tag.tagName === 'template'
          ? `Template "${this.tag.attribs.name}"`
          : '<body>';

        console.warn(
          `Warning: Compile error in ${this.tag.sourceName}:${errorLine}: ${errorMessage}\n` +
          `The app will still run, but the affected template will show an error placeholder.`
        );

        const fullError = `Compile error in ${sourceName} (${this.tag.sourceName}:${errorLine}): ${errorMessage}`;
        const renderFuncCode = `function () {
  return Blaze._renderErrorPlaceholder(${JSON.stringify(fullError)});
}`;

        if (this.tag.tagName === 'template') {
          const name = this.tag.attribs.name;
          if (name) {
            this.results.js += generateTemplateJS(
              name, renderFuncCode, hmrAvailable);
          }
        } else if (this.tag.tagName === 'body') {
          this.results.js += generateBodyJS(renderFuncCode, hmrAvailable);
        }

        // Report to error indicator at runtime
        this.results.js += `\nif (typeof Blaze !== "undefined" && Blaze._errorIndicator) {\n` +
          `  Blaze._errorIndicator.addError(\n` +
          `    new Error(${JSON.stringify(fullError)}),\n` +
          `    "Template compile error:"\n` +
          `  );\n` +
          `}\n`;
      } else {
        throw e;
      }
    }
  }

  addBodyAttrs(attrs) {
    Object.keys(attrs).forEach((attr) => {
      const val = attrs[attr];

      // This check is for conflicting body attributes in the same file;
      // we check across multiple files in caching-html-compiler using the
      // attributes on results.bodyAttrs
      if (this.results.bodyAttrs.hasOwnProperty(attr) && this.results.bodyAttrs[attr] !== val) {
        this.throwCompileError(
          `<body> declarations have conflicting values for the '${attr}' attribute.`);
      }

      this.results.bodyAttrs[attr] = val;
    });
  }

  throwCompileError(message, overrideIndex) {
    throwCompileError(this.tag, message, overrideIndex);
  }
}
