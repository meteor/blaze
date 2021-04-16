import { CodeGen, builtInBlockHelpers, isReservedName } from './codegen';
import { optimize } from './optimizer';
import { parse, compile, codeGen, TemplateTagReplacer, beautify } from './compiler';
import { TemplateTag } from './templatetag';

SpacebarsCompiler = {
  CodeGen,
  _builtInBlockHelpers: builtInBlockHelpers,
  isReservedName,
  optimize,
  parse,
  compile,
  codeGen,
  _TemplateTagReplacer: TemplateTagReplacer,
  _beautify: beautify,
  TemplateTag,
};

export { SpacebarsCompiler };
