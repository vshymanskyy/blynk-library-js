'use strict';

var BlynkSerial = function(options) {
  var SerialPort = require('serialport').SerialPort;
  var self = this;
  events.EventEmitter.call(this);

  var options = options || {};
  self.addr = options.addr || '/dev/ttyUSB0';
  self.baud = options.baud || 9600;

  this.write = function(data) {
    self.ser.write(data);
  };

  this.connect = function(done) {
    self.ser = new SerialPort(self.addr, {
        baudrate: self.baud,
        buffersize: 1
    });
    self.ser.on('data', function(data) {
      self.emit('data', data);
    });
    self.ser.on('end', function() {
      self.emit('end');
    });
    done();
  };

  this.disconnect = function() {
    self.ser.close();
  };
};

util.inherits(BlynkSerial, events.EventEmitter);
