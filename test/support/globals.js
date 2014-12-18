if (typeof exports === 'object') {
  if (!global.Promise) {
    require('es6-promise').polyfill();
  }

  global.popsicle = require('popsicle');
  global.prefix   = require('popsicle-prefix');
  global.expect   = require('chai').expect;
}
else {
  window.ES6Promise.polyfill();
}
