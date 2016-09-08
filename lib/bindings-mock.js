'use strict';

var inherits = require('inherits');
var processNextTick = require('process-nextick-args');

function MissingPortError(name) {
  name = name || 'unknown method:';
  this.message = name + ' Port does not exist - please call hardware.createPort(path) first';
  this.name = 'MissingPortError';
  Error.captureStackTrace(this, MissingPortError);
}
inherits(MissingPortError, Error);

function ClosedPortError(name) {
  name = name || 'unknown method:';
  this.message = name + ' Port is closed';
  this.name = 'ClosedPortError';
  Error.captureStackTrace(this, MissingPortError);
}
inherits(ClosedPortError, Error);

var ports = {};

function MockBindings(opt) {
  if (typeof opt.disconnect !== 'function') {
    throw new TypeError('options.disconnect is not a function');
  }
  if (typeof opt.push !== 'function') {
    throw new TypeError('options.push is not a function');
  }
  this.onDisconnect = opt.disconnect;
  this.push = opt.push;
  this.isOpen = false;
  this.flowing = false;
};

MockBindings.reset = function() {
  ports = {};
};

// control function
MockBindings.createPort = function(path, opt) {
  opt = opt || {};
  var echo = opt.echo;
  var readyData = opt.readyData || new Buffer('READY');
  ports[path] = {
    data: new Buffer(0),
    lastWrite: null,
    echo: echo,
    readyData: readyData,
    info: {
      comName: path,
      manufacturer: 'The J5 Robotics Company',
      serialNumber: undefined,
      pnpId: undefined,
      locationId: undefined,
      vendorId: undefined,
      productId: undefined
    }
  };
};

MockBindings.list = function(cb) {
  var info = Object.keys(ports).map(function(path) {
    return ports[path].info;
  });
  processNextTick(cb, null, info);
};

// control function
MockBindings.prototype.emitData = function(data) {
  if (!this.isOpen) {
    return;
  }
  if (data) {
    this.port.data = Buffer.concat([this.port.data, data]);
  }

  if (!this.flowing) {
    return;
  }
  processNextTick(function() {
    if (this.port.data.length > 0) {
      this.flowing = this.push(this.port.data);
      this.port.data = new Buffer(0);
    }
  }.bind(this));
};

// control function
MockBindings.prototype.disconnect = function() {
  var err = new Error('disconnected');
  this.onDisconnect(err);
};

MockBindings.prototype.open = function(path, opt, cb) {
  var port = this.port = ports[path];
  if (!port) {
    return cb(new MissingPortError(path));
  }

  if (port.openOpt && port.openOpt.lock) {
    return cb(new Error('port is locked cannot open'));
  }
  port.openOpt = opt;
  processNextTick(function() {
    this.isOpen = true;
    processNextTick(function() {
      if (port.echo) {
        this.emitData(port.readyData);
      }
      cb(null);
    }.bind(this));
  }.bind(this));
};

MockBindings.prototype.close = function(cb) {
  var port = this.port;
  if (!port) {
    return processNextTick(cb, new Error('port is already closed'));
  }
  processNextTick(function() {
    delete port.openOpt;

    // reset data on close
    port.data = new Buffer(0);

    delete this.port;
    this.isOpen = false;
    this.flowing = false;
    processNextTick(cb, null);
  }.bind(this));
};

MockBindings.prototype.update = function(opt, cb) {
  if (typeof opt !== 'object') {
    throw new TypeError('options is not an object');
  }

  if (!opt.baudRate) {
    throw new Error('Missing baudRate');
  }

  if (!this.isOpen) {
    return processNextTick(cb, new ClosedPortError('update'));
  }
  this.port.openOpt.baudRate = opt.baudRate;
  processNextTick(cb, null);
};

MockBindings.prototype.set = function(opt, cb) {
  if (typeof opt !== 'object') {
    throw new TypeError('options is not an object');
  }

  if (!this.isOpen) {
    return processNextTick(cb, new ClosedPortError('set'));
  }
  processNextTick(cb, null);
};

MockBindings.prototype.write = function(buffer, cb) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('buffer is not a Buffer');
  }

  if (!this.isOpen) {
    return processNextTick(cb, new ClosedPortError('write'));
  }

  var data = this.port.lastWrite = new Buffer(buffer); // copy
  processNextTick(cb, null);

  if (this.port.echo) {
    processNextTick(this.emitData.bind(this), data);
  }
};

MockBindings.prototype._read = function() {
  if (!this.isOpen) {
    throw new ClosedPortError('_read');
  }
  this.flowing = true;
  this.emitData();
};

MockBindings.prototype.flush = function(cb) {
  if (!this.isOpen) {
    return processNextTick(cb, new ClosedPortError('flush'));
  }
  processNextTick(cb, null);
};

MockBindings.prototype.drain = function(cb) {
  if (!this.isOpen) {
    return processNextTick(cb, new ClosedPortError('drain'));
  }
  processNextTick(cb, null);
};

module.exports = MockBindings;
