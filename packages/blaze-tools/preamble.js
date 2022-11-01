/* eslint-disable no-undef */


import {
  EmitCode,
  toJSLiteral,
  toObjectLiteralKey,
  ToJSVisitor,
  toJS,
} from './tojs';

import {
  parseNumber,
  parseIdentifierName,
  parseExtendedIdentifierName,
  parseStringLiteral,
} from './tokens';

BlazeTools = {
  EmitCode,
  toJSLiteral,
  toObjectLiteralKey,
  ToJSVisitor,
  toJS,
  parseNumber,
  parseIdentifierName,
  parseExtendedIdentifierName,
  parseStringLiteral,
};

export { BlazeTools };
