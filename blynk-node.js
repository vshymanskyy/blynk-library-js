var events = require('events');
var util = require('util');

/*
* TCP Client
*/

var BlynkTcpClient = function(options) {
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

util.inherits(BlynkTcpClient, events.EventEmitter);

var BlynkTcpServer = function(options) {
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

util.inherits(BlynkTcpServer, events.EventEmitter);

/*
* SSL Client
*/

var BlynkSslClient = function(options) {
  var self = this;
  events.EventEmitter.call(this);
  
  var options = options || {};
  self.addr = options.addr || "cloud.blynk.cc";
  self.port = options.port || 8441;
  // These are necessary only if using the client certificate authentication
  self.key  = options.key  || null;
  self.cert = options.cert || null;
  self.pass = options.pass || null;
  // This is necessary only if the server uses the self-signed certificate
  self.ca   = options.ca   || [ '../certs/server.crt' ];
  
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

util.inherits(BlynkSslClient, events.EventEmitter);

var BlynkSslServer = function(options) {
  var self = this;
  events.EventEmitter.call(this);

  var options = options || {};
  self.addr = options.addr || "0.0.0.0";
  self.port = options.port || 8443;
  self.key  = options.key  || '../certs/server_raw.pem';
  self.cert = options.cert || '../certs/server.crt';
  self.pass = options.pass || null;
  // This is necessary only if the server uses the self-signed certificate
  self.ca   = options.ca   || [ '../certs/client.crt' ];

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

util.inherits(BlynkSslServer, events.EventEmitter);


var BoardOnOff = function() {
  var Gpio = require('onoff').Gpio;
  this.process = function(values) {
    switch(values[0]) {
      case 'info':
        break;
      case 'dw':
        var pin = new Gpio(values[1], 'out');
        var val = parseInt(values[2], 10);
        pin.write(val);
        break;
      case 'aw':
        var pin = Pin(values[1]);
        var val = parseInt(values[2], 10);

        break;
      case 'dr':
        var pin = new Gpio(values[1], 'in');
        var val = parseInt(values[2], 10);
        pin.read(function(err, value) {
          if (!err) {
            //blynk.virtualWrite(values[1], value)
          }
        });

        break;
      case 'ar':
        var pin = Pin(values[1]);

        break;
      default:
        return false;
    }
    return true;
  };
};

exports.TcpClient = BlynkTcpClient;
exports.TcpServer = BlynkTcpServer;

exports.SslClient = BlynkSslClient;
exports.SslServer = BlynkSslServer;

exports.BoardOnOff = BoardOnOff;
