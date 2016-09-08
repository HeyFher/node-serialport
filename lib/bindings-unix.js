'use strict';

var bindings = require('bindings')('serialport.node');
var listLinux = require('./list-linux');

module.exports = {
  close: bindings.close,
  drain: bindings.drain,
  flush: bindings.flush,
  list: listLinux,
  open: bindings.open,
  set: bindings.set,
  update: bindings.update,
  write: bindings.write,
  read: bindings.read,
  dataAvailable: bindings.dataAvailable
};
