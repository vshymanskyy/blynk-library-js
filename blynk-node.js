/* Copyright (c) 2015 Volodymyr Shymanskyy. See the file LICENSE for copying permission. */

'use strict';

var events = require('events');
var util = require('util');

/*
* TCP Client
*/

exports.TcpClient = function(options) {
  var self = this;
  events.EventEmitter.call(this);

  var options = options || {};
  self.addr = options.addr || "cloud.blynk.cc";
  self.port = options.port || 8442;

  var net = require('net');

  this.write = function(data) {
    if (self.sock) {
      self.sock.write(data, 'binary');
    }
  };

  this.connect = function(done) {
    if (self.sock) {
      self.disconnect();
    }
    console.log("Connecting to TCP:", self.addr, self.port);
    self.sock = new net.Socket();
    self.sock.setNoDelay(true);
    self.sock.setEncoding('binary');
    self.sock.connect(self.port, self.addr, function() {
      console.log('Connected');
      self.sock.on('data', function(data) {
        self.emit('data', data);
      });
      self.sock.on('end', function(data) {
        self.emit('end', data);
      });
      done();
    });
  };

  this.disconnect = function() {
    if (self.sock) {
      self.sock.destroy();
      self.sock = null;
    }
  };
};

util.inherits(exports.TcpClient, events.EventEmitter);

exports.TcpServer = function(options) {
  var self = this;
  events.EventEmitter.call(this);

  var options = options || {};
  self.addr = options.addr || '0.0.0.0';
  self.port = options.port || 8442;

  var net = require('net');

  this.write = function(data) {
    if (self.sock) {
      self.sock.write(data, 'binary');
    }
  };

  this.connect = function(done) {
    if (self.sock) {
      self.disconnect();
    }
    
    self.srvr = net.createServer(function(conn) {
      self.sock = conn;
      console.log('Connected');
      self.sock.setNoDelay(true);
      self.sock.setEncoding('binary');
      self.sock.on('data', function(data) {
        self.emit('data', data);
      });
      self.sock.on('end', function() {
        self.emit('end');
      });
      done();
    });

    console.log("TCP server:", self.addr, self.port);
    self.srvr.listen(self.port, self.addr);
  };

  this.disconnect = function() {
    if (self.sock) {
      self.sock.destroy();
      self.sock = null;
    }
  };
};

util.inherits(exports.TcpServer, events.EventEmitter);

/*
* SSL Client
*/

exports.SslClient = function(options) {
  var self = this;
  events.EventEmitter.call(this);
  
  var options = options || {};
  var base_dir = options.base_dir || "";
  self.addr = options.addr || "cloud.blynk.cc";
  self.port = options.port || 8441;
  // These are necessary only if using the client certificate authentication
  self.key  = options.key  || null;
  self.cert = options.cert || null;
  self.pass = options.pass || null;
  // This is necessary only if the server uses the self-signed certificate
  self.ca   = options.ca   || [ base_dir + 'certs/server.crt' ];
  
  var tls = require('tls');
  var fs = require('fs');

  this.write = function(data) {
    if (self.sock) {
      self.sock.write(data, 'binary');
    }
  };

  this.connect = function(done) {
    if (self.sock) {
      self.disconnect();
    }

    var opts = {};
    if (self.key)  { opts.key  = fs.readFileSync(self.key); }
    if (self.cert) { opts.cert = fs.readFileSync(self.cert); }
    if (self.pass) { opts.passphrase = self.pass; }
    if (self.ca)   { opts.ca   = self.ca.map(fs.readFileSync); }
    
    console.log("Connecting to SSL:", self.addr, self.port);
    self.sock = tls.connect(self.port, self.addr, opts, function() {
      console.log('Connected,', self.sock.authorized ? 'authorized' : 'unauthorized');
      self.sock.setNoDelay(true);
      self.sock.setEncoding('binary');
      self.sock.on('data', function(data) {
        self.emit('data', data);
      });
      self.sock.on('end', function(data) {
        self.emit('end', data);
      });
      done();
    });
  };

  this.disconnect = function() {
    if (self.sock) {
      self.sock.destroy();
      self.sock = null;
    }
  };
};

util.inherits(exports.SslClient, events.EventEmitter);

exports.SslServer = function(options) {
  var self = this;
  events.EventEmitter.call(this);

  var options = options || {};
  var base_dir = options.base_dir || "";
  self.addr = options.addr || "0.0.0.0";
  self.port = options.port || 8443;
  self.key  = options.key  || base_dir + 'certs/server.pem';
  self.cert = options.cert || base_dir + 'certs/server.crt';
  self.pass = options.pass || null;
  // This is necessary only if the server uses the self-signed certificate
  self.ca   = options.ca   || [ base_dir + 'certs/client.crt' ];

  var tls = require('tls');
  var fs = require('fs');

  this.write = function(data) {
    if (self.sock) {
      self.sock.write(data, 'binary');
    }
  };

  this.connect = function(done) {
    if (self.sock) {
      self.disconnect();
    }
    
    var opts = { };
    if (self.key)  { opts.key  = fs.readFileSync(self.key); }
    if (self.cert) { opts.cert = fs.readFileSync(self.cert); }
    if (self.pass) { opts.passphrase = self.pass; }
    if (self.ca)   { opts.ca   = self.ca.map(fs.readFileSync); }
    if (self.ca)   { opts.requestCert = true; }
    
    self.srvr = tls.createServer(opts, function(conn) {
      self.sock = conn;
      console.log(self.sock.authorized ? 'Authorized' : 'Unauthorized');
      self.sock.setNoDelay(true);
      self.sock.setEncoding('binary');
      self.sock.on('data', function(data) {
        self.emit('data', data);
      });
      self.sock.on('end', function() {
        self.emit('end');
      });
      done();
    });

    console.log("SSL server:", self.addr, self.port);
    self.srvr.listen(self.port, self.addr);
  };

  this.disconnect = function() {
    if (self.sock) {
      self.sock.destroy();
      self.sock = null;
    }
  };
};

util.inherits(exports.SslServer, events.EventEmitter);

var scale = function(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) /
         (inMax - inMin) + outMin;
}

exports.BoardMRAA = function() {
  var mraa = require('mraa');
  console.log("MRAA mode");
  this.init = function(blynk) {
    this.blynk = blynk;
  };
  this.process = function(values) {
    switch(values[0]) {
      case 'info':
        break;
      case 'pm':
        break;
      case 'dw': {
        var pin = new mraa.Gpio(parseInt(values[1]));
        pin.dir(mraa.DIR_OUT);
        pin.write(parseInt(values[2]));
      } break;
      case 'aw': {
        var pwm = mraa.Pwm(parseInt(values[1]));
        pwm.enable(1);
        pwm.period_us(700);
        pwm.write(scale(parseFloat(values[2]), 0, 255, 0, 1));
      } break;
      case 'dr': {
        var pin = new mraa.Gpio(parseInt(values[1]));
        pin.dir(mraa.DIR_IN);
        this.blynk.virtualWrite(values[1], pin.read());
      } break;
      case 'ar': {
        var pin = new mraa.Aio(parseInt(values[1]));
        this.blynk.virtualWrite(values[1], pin.read());
      } break;
      default:
        return false;
    }
    return true;
  };
};

exports.BoardOnOff = function() {
  var Gpio = require('onoff').Gpio;
  console.log("OnOff mode");
  this.init = function(blynk) {
    this.blynk = blynk;
  };
  this.process = function(values) {
    switch(values[0]) {
      case 'info':
        break;
      case 'pm':
        break;
      case 'dw':
        var pin = new Gpio(parseInt(values[1]), 'out');
        pin.write(parseInt(values[2]));
        break;
      case 'dr':
        var pin = new Gpio(values[1], 'in');
        pin.read(function(err, value) {
          if (!err) {
            this.blynk.virtualWrite(values[1], value);
          }
        });
        break;
      case 'ar':
      case 'aw':
        break;
      default:
        return false;
    }
    return true;
  };
};
