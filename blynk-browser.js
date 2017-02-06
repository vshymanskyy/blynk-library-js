/* Copyright (c) 2015 Volodymyr Shymanskyy. See the file LICENSE for copying permission. */

var events = require('events');
var util = require('util');

if (!window.WebSocket) {
  window.WebSocket = window.MozWebSocket;
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

exports.WsClient = function(options) {
  var self = this;
  events.EventEmitter.call(this);

  var options = options || {};
  self.addr = options.addr || "blynk-cloud.com";
  self.port = options.port || 8082;
  self.path = options.path || "/websockets";

  this.write = function(data) {
    if (self.sock) {
      self.sock.send(str2ab(data));
    }
  };

  this.connect = function(done) {
    if (self.sock) {
      self.sock.close();
    }
    try {
      self.sock = new WebSocket('ws://' + self.addr + ':' + self.port + options.path);
      self.sock.binaryType = 'arraybuffer';
      self.sock.onopen = function(evt) { done() };
      self.sock.onclose = function(evt) { self.emit('end'); };
      self.sock.onmessage = function(evt) {
        var data = ab2str(evt.data);
        self.emit('data', data);
      };
      self.sock.onerror = function(evt) { self.emit('end'); };
    } catch(exception){
      console.log(exception);
    }

  };

  this.disconnect = function() {
    if (self.sock) {
      self.sock.close();
      self.sock = null;
    }
  };
};

util.inherits(exports.WsClient, events.EventEmitter);
