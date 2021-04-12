// _assign is like _.extend or the upcoming Object.assign.
// Copy src's own, enumerable properties onto tgt and return
// tgt.
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _assign = function (tgt, src) {
  for (var k in src) {
    if (_hasOwnProperty.call(src, k))
      tgt[k] = src[k];
  }
  return tgt;
};


export function TemplateTag (props) {
  if (! (this instanceof TemplateTag))
    // called without `new`
    return new TemplateTag;

  if (props)
    _assign(this, props);
}

_assign(TemplateTag.prototype, {
  constructorName: 'TemplateTag',
  toJS: function (visitor) {
    return visitor.generateCall(this.constructorName,
                                _assign({}, this));
  }
});
