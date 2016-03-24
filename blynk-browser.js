/* Copyright (c) 2015 Volodymyr Shymanskyy. See the file LICENSE for copying permission. */

var MicroEvent  = function(){};
MicroEvent.prototype  = {
  on  : function(event, fct){
    this._events = this._events || {};
    this._events[event] = this._events[event] || [];
    this._events[event].push(fct);
  },
  off  : function(event, fct){
    this._events = this._events || {};
    if( event in this._events === false  )  return;
    this._events[event].splice(this._events[event].indexOf(fct), 1);
  },
  emit : function(event /* , args... */){
    this._events = this._events || {};
    if( event in this._events === false  )  return;
    for(var i = 0; i < this._events[event].length; i++){
      this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  },
  removeAllListeners : function(){
    this._events = {};
  }
};

MicroEvent.mixin  = function(destObject){
  var props = ['on', 'off', 'emit', 'removeAllListeners'];
  for(var i = 0; i < props.length; i ++){
    if( typeof destObject === 'function' ){
      destObject.prototype[props[i]]  = MicroEvent.prototype[props[i]];
    }else{
      destObject[props[i]] = MicroEvent.prototype[props[i]];
    }
  }
  return destObject;
}

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

var BlynkWsClient = function(options) {
  var self = this;
  
  var options = options || {};
  self.addr = options.addr || "blynk-cloud.com";
  self.port = options.port || 8082;

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
      self.sock = new WebSocket('ws://' + self.addr + ':' + self.port + '/websocket');
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

MicroEvent.mixin(BlynkWsClient);
