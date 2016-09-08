'use strict';
var fs = require('fs');
var kMinPoolSpace;
var kPoolSize;

module.exports = function read() {
  if (!this.readable || this.paused || this.reading || this.closing) {
    return;
  }

  this.reading = true;

  if (!this.pool || this.pool.length - this.pool.used < kMinPoolSpace) {
    // discard the old pool. Can't add to the free list because
    // users might have references to slices on it.
    this.pool = new Buffer(kPoolSize);
    this.pool.used = 0;
  }

  // Grab another reference to the pool in the case that while we're in the
  // thread pool another read() finishes up the pool, and allocates a new
  // one.
  var toRead = Math.min(this.pool.length - this.pool.used, ~~this.bufferSize);
  var start = this.pool.used;

  var _afterRead = function(err, bytesRead, readPool, bytesRequested) {
    this.reading = false;
    if (err) {
      if (err.code && err.code === 'EAGAIN') {
        if (this.isOpen) {
          this.serialPoller.start();
        }
      // handle edge case were mac/unix doesn't clearly know the error.
      } else if (err.code && (err.code === 'EBADF' || err.code === 'ENXIO' || (err.errno === -1 || err.code === 'UNKNOWN'))) {
        this._disconnected(err);
      } else {
        this.fd = null;
        this.readable = false;
        this.emit('error', err);
      }
      return;
    }

    // Since we will often not read the number of bytes requested,
    // let's mark the ones we didn't need as available again.
    this.pool.used -= bytesRequested - bytesRead;

    if (bytesRead === 0) {
      if (this.isOpen) {
        this.serialPoller.start();
      }
    } else {
      var b = this.pool.slice(start, start + bytesRead);

      // do not emit events if the stream is paused
      if (this.paused) {
        if (!this.buffer) {
          this.buffer = new Buffer(0);
        }
        this.buffer = Buffer.concat([this.buffer, b]);
        return;
      }
      this._emitData(b);

      // do not emit events anymore after we declared the stream unreadable
      if (!this.readable) {
        return;
      }
      this._read();
    }
  }.bind(this);

  fs.read(this.fd, this.pool, this.pool.used, toRead, null, function(err, bytesRead) {
    var readPool = this.pool;
    var bytesRequested = toRead;
    _afterRead(err, bytesRead, readPool, bytesRequested);
  }.bind(this));

  this.pool.used += toRead;
};
