/* Copyright (c) 2015 Volodymyr Shymanskyy. See the file LICENSE for copying permission. */

'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var default_certs_path = path.join(__dirname, "certs");

/*
* TCP Client
*/

var MsgType = {
  HW            :  20
};

exports.TcpClient = function(options) {
  var self = this;
  events.EventEmitter.call(this);

  var options = options || {};
  self.addr = options.addr || "blynk-cloud.com";
  self.port = options.port || 80;

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
    self.sock.connect({
      host: self.addr,
      family: 4,
      port: self.port
    }, function() {
      console.log('Connected');
      self.sock.on('data', function(data) {
        self.emit('data', data);
      });
      self.sock.on('end', function(data) {
        self.emit('end', data);
      });
      done();
    });
    self.sock.on('error', function(err) {
    	//console.log('error', err.code);
        self.emit('error', err);
    });

  };

  this.disconnect = function() {
    if (self.sock) {
      self.sock.destroy();
      self.sock.removeAllListeners();
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
  self.port = options.port || 80;

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
  var certs_path = options.certs_path || default_certs_path;
  self.addr = options.addr || "blynk-cloud.com";
  self.port = options.port || 443;
  // These are necessary only if using the client certificate authentication
  self.key  = options.key  || null;
  self.cert = options.cert || null;
  self.pass = options.pass || null;
  // This is necessary only if the server uses the self-signed certificate
  self.ca   = options.ca   || [ path.join(certs_path, 'server.crt') ];
  self.servername = options.servername || self.addr;

  var net = require('net');
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

    var opts = {
      host: self.addr,
      port: self.port,
      servername: self.servername,
      rejectUnauthorized: false,
      family: 4
    };
    if (self.key) { 
      if (Buffer.isBuffer(self.key)) {
        opts.key = self.key;
      } else {
        opts.key = fs.readFileSync(self.key); 
      }
    }
    if (self.cert) { 
      if (Buffer.isBuffer(self.cert)) {
        opts.cert = self.cert;
      } else {
        opts.cert = fs.readFileSync(self.cert); 
      }
    }
    if (self.pass) { opts.passphrase = self.pass; }
    if (self.ca)   {
      if (Buffer.isBuffer(options.ca)) {
        opts.ca = options.ca;
      } else {
        opts.ca = self.ca.map(function(item){
          return fs.readFileSync(item);
        });
      }
    }

    console.log("Connecting to:", self.addr, self.port);
    var sock = new net.Socket();
    sock.on('error', function(e) {
      console.log(e)
    });
    sock.connect({
      host: self.addr,
      family: 4,
      port: self.port
    }, function() {
      console.log("SSL authorization...");
      opts.socket = sock;
      self.sock = tls.connect(opts, function() {
        if (!self.sock.authorized) {
          console.log('SSL not authorized');
          return;
        }
        console.log('Connected');
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

      self.sock.on('error', function(err) {
          //console.log('error', err.code);
          self.emit('error', err);
      });
    });
  };

  this.disconnect = function() {
    if (self.sock) {
      self.sock.destroy();
      self.sock.removeAllListeners();
      self.sock = null;
      
    }
  };
};

util.inherits(exports.SslClient, events.EventEmitter);

exports.SslServer = function(options) {
  var self = this;
  events.EventEmitter.call(this);

  var options = options || {};
  var certs_path = options.certs_path || default_certs_path;
  self.addr = options.addr || "0.0.0.0";
  self.port = options.port || 8443;
  self.key  = options.key  || path.join(certs_path, 'server.pem');
  self.cert = options.cert || path.join(certs_path, 'server.crt');
  self.pass = options.pass || null;
  // This is necessary only if the server uses the self-signed certificate
  self.ca   = options.ca   || [ path.join(certs_path, 'client.crt') ];

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
  var self = this;
  var mraa = require('mraa');
  console.log('MRAA Version: ' + mraa.getVersion());
  this.init = function(blynk) {
    self.blynk = blynk;
  };
  this.process = function(values) {
    switch(values[0]) {
      case 'pm':
        break;
      case 'dw': {
        var pin = new mraa.Gpio(parseInt(values[1]));
        pin.dir(mraa.DIR_OUT);
        pin.write(parseInt(values[2]));
      } break;
      case 'aw': {
        var pwm = new mraa.Pwm(parseInt(values[1]));
        pwm.enable(true);
        pwm.period_us(700);
        pwm.write(scale(parseFloat(values[2]), 0, 255, 0, 1));
      } break;
      case 'dr': {
        var pin = new mraa.Gpio(parseInt(values[1]));
        pin.dir(mraa.DIR_IN);
        self.blynk.sendMsg(MsgType.HW, ['dw', values[1], pin.read()]);
      } break;
      case 'ar': {
        var pin = new mraa.Aio(parseInt(values[1])-14); // TODO
        self.blynk.sendMsg(MsgType.HW, ['aw', values[1], pin.read()]);
      } break;
      default:
        return false;
    }
    return true;
  };
};

exports.BoardOnOff = function() {
  var self = this;
  var Gpio;
  try {
    Gpio = require('onoff').Gpio;
    console.log("OnOff mode");
  } catch (e) {
    // Workaround for Omega
    Gpio = require('/usr/bin/onoff-node/onoff').Gpio;
    console.log("OnOff-Omega mode");
  }

  this.init = function(blynk) {
    self.blynk = blynk;
  };
  this.process = function(values) {
    switch(values[0]) {
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
            self.blynk.sendMsg(MsgType.HW, ['dw', values[1], value]);
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
