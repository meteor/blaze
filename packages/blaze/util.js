has = function (obj, key) {
  var keyParts = key.split('.');

  return (
    !!obj &&
    (keyParts.length > 1
      ? has(obj[key.split('.')[0]], keyParts.slice(1).join('.'))
      : hasOwnProperty.call(obj, key))
  );
};

isFunction = function (func) {
  if (func && typeof func === 'function') {
    return true;
  }
  return false;
};

isEmpty = obj => [Object, Array].includes((obj || {}).constructor) && !Object.entries((obj || {})).length;


isObject = function (value) {
  return value != null && typeof value == 'object' && !Array.isArray(value);
};

