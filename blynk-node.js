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
      self.sock.write(data);
    }
  };

  this.connect = function(done) {
    if (self.sock) {
      self.disconnect();
    }
    self.sock = new net.Socket();
    self.sock.setNoDelay(true);
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
      self.sock.write(data);
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
    
    self.sock = tls.connect(self.port, self.addr, opts, function() {
      console.log('Connected,', self.sock.authorized ? 'authorized' : 'unauthorized');
      self.sock.setNoDelay(true);
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

exports.BlynkTcpClient = BlynkTcpClient;
exports.BlynkSslClient = BlynkSslClient;