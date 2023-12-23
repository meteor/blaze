export function TemplateTag(props) {
  if (!(this instanceof TemplateTag)) {
    // called without `new`
    return new TemplateTag();
  }

  if (props) Object.assign(this, props);
}

Object.assign(TemplateTag.prototype, {
  constructorName: 'TemplateTag',
  toJS(visitor) {
    return visitor.generateCall(this.constructorName, Object.assign({}, this));
  },
});
