
import { getCharacterReference } from './charref';
import { asciiLowerCase, properCaseTagName, properCaseAttributeName} from "./utils";
import { TemplateTag } from './templatetag'
import { Scanner } from './scanner';
import { parseFragment, codePointToString, getContent, getRCData } from './parse';
import { getComment, getDoctype, getHTMLToken, getTagToken, TEMPLATE_TAG_POSITION } from './tokenize';

HTMLTools = {
  asciiLowerCase,
  properCaseTagName,
  properCaseAttributeName,
  TemplateTag,
  Scanner,
  parseFragment,
  codePointToString,
  TEMPLATE_TAG_POSITION,
  Parse: {
    getCharacterReference,
    getContent,
    getRCData,
    getComment,
    getDoctype,
    getHTMLToken,
    getTagToken,
  }
};

export { HTMLTools };
