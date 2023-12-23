import { HTML } from 'meteor/htmljs';

export function asciiLowerCase (str) {
  return str.replace(/[A-Z]/g, function (c) {
    return String.fromCharCode(c.charCodeAt(0) + 32);
  });
}

const _properTagCaseMap = (map => {
  const knownElements = HTML.knownElementNames;
  knownElements.forEach(a => {
    map[asciiLowerCase(a)] = a;
  });
  return map;
})({});

// Take a tag name in any case and make it the proper case for HTML.
//
// Modern browsers let you embed SVG in HTML, but SVG elements are special
// in that they have a case-sensitive DOM API (nodeName, getAttribute,
// setAttribute).  For example, it has to be `setAttribute("viewBox")`,
// not `"viewbox"`.  However, the browser's HTML parser is NOT case-sensitive
// and will fix the case for you, so if you write `<svg viewbox="...">`
// you actually get a `"viewBox"` attribute.  Any HTML-parsing toolchain
// must do the same.
export function properCaseTagName (name) {
  const lowered = asciiLowerCase(name);
  return _properTagCaseMap.hasOwnProperty(lowered) ? _properTagCaseMap[lowered] : lowered;
}

const svgCamelCaseAttributes = 'attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits contentScriptType contentStyleType diffuseConstant edgeMode externalResourcesRequired filterRes filterUnits glyphRef glyphRef gradientTransform gradientTransform gradientUnits gradientUnits kernelMatrix kernelUnitLength kernelUnitLength kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent specularExponent spreadMethod spreadMethod startOffset stdDeviation stitchTiles surfaceScale surfaceScale systemLanguage tableValues targetX targetY textLength textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan'.split(' ');

const _properAttributeCaseMap = (map => {
  svgCamelCaseAttributes.forEach(a => {
    map[asciiLowerCase(a)] = a;
  });
  return map;
})({});

// See docs for properCaseTagName.
export function properCaseAttributeName(name) {
  const lowered = asciiLowerCase(name);
  return _properAttributeCaseMap.hasOwnProperty(lowered) ? _properAttributeCaseMap[lowered] : lowered;
}
