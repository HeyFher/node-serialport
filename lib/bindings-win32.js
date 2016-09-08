'use strict';

var bindings = require('bindings')('serialport.node');

module.exports = {
  close: bindings.close,
  drain: bindings.drain,
  flush: bindings.flush,
  list: bindings.list,
  open: bindings.open,
  set: bindings.set,
  update: bindings.update,
  write: bindings.write,
  read: bindings.read,
  dataAvailable: bindings.dataAvailable
};
