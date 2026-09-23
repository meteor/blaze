export const hasOwn = (target, prop) => Object.prototype.hasOwnProperty.call(target, prop);
export const isObject = (o) => typeof o === 'object' && o !== null;
