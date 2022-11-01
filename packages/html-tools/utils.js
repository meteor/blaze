import { HTML } from 'meteor/htmljs';

export function asciiLowerCase(str) {
  return str.replace(/[A-Z]/g, function (c) {
    return String.fromCharCode(c.charCodeAt(0) + 32);
  });
}

const svgCamelCaseAttributes = 'attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits contentScriptType contentStyleType diffuseConstant edgeMode externalResourcesRequired filterRes filterUnits glyphRef glyphRef gradientTransform gradientTransform gradientUnits gradientUnits kernelMatrix kernelUnitLength kernelUnitLength kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent specularExponent spreadMethod spreadMethod startOffset stdDeviation stitchTiles surfaceScale surfaceScale systemLanguage tableValues targetX targetY textLength textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan'.split(' ');

const properAttributeCaseMap = (function (map) {
  const _map = map;
  for (let i = 0; i < svgCamelCaseAttributes.length; i++) {
    const a = svgCamelCaseAttributes[i];
    _map[asciiLowerCase(a)] = a;
  }
  return _map;
}({}));

const properTagCaseMap = (function (map) {
  const _map = map;
  const knownElements = HTML.knownElementNames;
  for (let i = 0; i < knownElements.length; i++) {
    const a = knownElements[i];
    _map[asciiLowerCase(a)] = a;
  }
  return _map;
}({}));

// Take a tag name in any case and make it the proper case for HTML.
//
// Modern browsers let you embed SVG in HTML, but SVG elements are special
// in that they have a case-sensitive DOM API (nodeName, getAttribute,
// setAttribute).  For example, it has to be `setAttribute("viewBox")`,
// not `"viewbox"`.  However, the browser's HTML parser is NOT case-sensitive
// and will fix the case for you, so if you write `<svg viewbox="...">`
// you actually get a `"viewBox"` attribute.  Any HTML-parsing toolchain
// must do the same.
export function properCaseTagName(name) {
  const lowered = asciiLowerCase(name);
  return Object.hasOwnProperty.call(properTagCaseMap, lowered) ?
    properTagCaseMap[lowered] : lowered;
}

// See docs for properCaseTagName.
export function properCaseAttributeName(name) {
  const lowered = asciiLowerCase(name);
  return Object.hasOwnProperty.call(properAttributeCaseMap, lowered) ?
    properAttributeCaseMap[lowered] : lowered;
}
