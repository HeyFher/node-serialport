'use strict';

/**
 * @module serialport
 */

/**
 * @name module:serialport.Binding
 * @type {module:serialport~Binding}
 * @description The Binding is how node SerialPort talks to the underlying system. By default we auto detect windows, Linux and OSX and load the appropriate module for your system. You can assign `SerialPort.Binding` to any backend you like. You can find more by searching on [npm](https://npmjs.org/).

  You can also avoid auto loading the default backends by requiring SerialPort with
  ```js
  var SerialPort = require('serialport/lib/serialport');
  SerialPort.Binding = MyBindingClass;
  ```
 */

switch (process.platform) {
  case 'win32':
    module.exports = require('./bindings-win32');
    break;
  case 'darwin':
    module.exports = require('./bindings-darwin');
    break;
  default:
    module.exports = require('./bindings-unix');
}

/**
 * @typedef {Class} Binding
 * @class
 * @description You wont ever have to use Binding objects directly they'll be used by SerialPort to access the underlying hardware. This documentation is geared towards people making bindings for different platforms.
 */

 /**
  * Request a number of bytes from the SerialPort
  * @description something or another.
  * @method module:serialport~Binding#write
  * @param  {(string|buffer)} data Accepts a [`Buffer` ](http://nodejs.org/api/buffer.html) object or a string.
  */
