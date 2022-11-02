// _assign is like _.extend or the upcoming Object.assign.
// Copy src's own, enumerable properties onto tgt and return
// tgt.
const _assign = function (tgt, src) {
  const _tgt = tgt;
  Object.getOwnPropertyNames(src).forEach((k) => {
    _tgt[k] = src[k];
  });
  return _tgt;
};


export class TemplateTag {
  constructor(props) {
    if (props) _assign(this, props);

    this.constructorName = 'TemplateTag';
  }

  toJS (visitor) {
    return visitor.generateCall(this.constructorName,
      _assign({}, this));
  }
}
