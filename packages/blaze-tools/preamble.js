
import {
  EmitCode,
  toJSLiteral,
  toObjectLiteralKey,
  ToJSVisitor,
  toJS
} from './tojs';

import {
  parseNumber,
  parseIdentifierName,
  parseExtendedIdentifierName,
  parseStringLiteral
} from './tokens';

export const BlazeTools = {
  EmitCode,
  toJSLiteral,
  toObjectLiteralKey,
  ToJSVisitor,
  toJS,
  parseNumber,
  parseIdentifierName,
  parseExtendedIdentifierName,
  parseStringLiteral
};
