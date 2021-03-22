import { scanHtmlForTags } from './html-scanner';
import { compileTagsWithSpacebars } from './compile-tags-with-spacebars';
import { generateTemplateJS, generateBodyJS } from './code-generation'
import { CompileError, throwCompileError} from './throw-compile-error';

export const TemplatingTools  = {
  scanHtmlForTags,
  compileTagsWithSpacebars,
  generateTemplateJS,
  generateBodyJS,
  CompileError,
  throwCompileError
};
