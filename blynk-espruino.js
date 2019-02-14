/* Copyright (c) 2015-2019 Volodymyr Shymanskyy. See the file LICENSE for copying permission. */
'use strict';

function blynkHeader(msg_type, msg_id, msg_len) {
  return String.fromCharCode(
    msg_type,
    msg_id  >> 8, msg_id  & 0xFF,
    msg_len >> 8, msg_len & 0xFF
  );
}

var MsgType = {
  RSP           :  0,
  LOGIN         :  2,
  PING          :  6,
  TWEET         :  12,
  EMAIL         :  13,
  NOTIFY        :  14,
  BRIDGE        :  15,
  HW_SYNC       :  16,
  INTERNAL      :  17,
  PROPERTY      :  19,
  HW            :  20,
  HW_LOGIN      :  29,

  REDIRECT      :  41,
  DEBUG_PRINT   :  55,

  EVENT_LOG     :  64,
};

var MsgStatus = {
  OK                    :  200,
  ILLEGAL_COMMAND       :  2,
  ALREADY_REGISTERED    :  4,
  INVALID_TOKEN         :  9
};

var BlynkState = {
  CONNECTING    :  1,
  CONNECTED     :  2,
  DISCONNECTED  :  3
};

  var EspruinoTCP = function(options) {
    var self = this;

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
      self.sock = net.connect({host : self.addr, port: self.port}, function() {
        console.log('Connected');
        self.sock.on('data', function(data) {
          self.emit('data', data);
        });
        self.sock.on('end', function() {
          self.emit('end', '');
        });
        done();
      });
    };

    this.disconnect = function() {
      if (self.sock) {
        self.sock = null;
      }
    };
  };

  var BoardEspruino = function(values) {
    var self = this;
    this.init = function(blynk) {
      self.blynk = blynk;
    };
    this.process = function(values) {
      switch(values[0]) {
        case 'pm':
          // TODO
          break;
        case 'dw':
          var pin = Pin(values[1]);
          var val = parseInt(values[2]);
          pinMode(pin, 'output');
          digitalWrite(pin, val);
          break;
        case 'dr':
          var pin = Pin(values[1]);
          self.blynk.sendMsg(MsgType.HW, ['dw', values[1], digitalRead(pin)]);
          break;
        case 'aw':
          var pin = Pin(values[1]);
          var val = parseFloat(values[2]);
          pinMode(pin, 'output');
          analogWrite(pin, val / 255);
          break;
        case 'ar':
          var pin = Pin(values[1]);
          self.blynk.sendMsg(MsgType.HW, ['aw', values[1], 4095 * analogRead(pin)]);
          break;
        default:
          return null;
      }
      return true;
    };
  };

/*
 * Blynk
 */

var Blynk = function(auth, options) {
  var self = this;

  this.auth = auth;
  var options = options || {};
  this.heartbeat = options.heartbeat || 10000;

  // Auto-detect board
  if (options.board) {
    this.board = options.board;
  } else {
    this.board = new BoardEspruino();
  }
  self.board.init(self);

  // Auto-detect connector
  if (options.connector) {
    this.conn = options.connector;
  } else {
    this.conn = new EspruinoTCP(options);
  }

  this.buff_in = '';
  this.msg_id = 1;
  this.vpins = [];
  this.profile = options.profile;

  this.VirtualPin = function(vPin) {
    this.pin = vPin;
    self.vpins[vPin] = this;

    this.write = function(value) {
      self.virtualWrite(this.pin, value);
    };
  };

  this.WidgetBridge = function(vPin) {
    this.pin = vPin;

    this.setAuthToken = function(token) {
      self.sendMsg(MsgType.BRIDGE, [this.pin, 'i', token]);
    };
    this.digitalWrite = function(pin, val) {
      self.sendMsg(MsgType.BRIDGE, [this.pin, 'dw', pin, val]);
    };
    this.analogWrite = function(pin, val) {
      self.sendMsg(MsgType.BRIDGE, [this.pin, 'aw', pin, val]);
    };
    this.virtualWrite = function(pin, val) {
      self.sendMsg(MsgType.BRIDGE, [this.pin, 'vw', pin].concat(val));
    };
  };

  this.WidgetTerminal = function(vPin) {
    if (needsEmitter()) {
      events.EventEmitter.call(this);
    }
    this.pin = vPin;
    self.vpins[vPin] = this;

    this.write = function(data) {
      self.virtualWrite(this.pin, data);
    };
  };

  this.WidgetLCD = function(vPin) {
    this.pin = vPin;

    this.clear = function() {
      self.virtualWrite(this.pin, 'clr');
    };
    this.print = function(x, y, val) {
      self.sendMsg(MsgType.HW, ['vw', this.pin, 'p', x, y, val]);
    };
  };

  this.WidgetLED = function(vPin) {
    this.pin = vPin;

    this.setValue = function(val) {
      self.virtualWrite(this.pin, val);
    };
    this.turnOn = function() {
      self.virtualWrite(this.pin, 255);
    };
    this.turnOff = function() {
      self.virtualWrite(this.pin, 0);
    };
  };

  if (!options.skip_connect) {
    this.connect();
  }
};


Blynk.prototype.onReceive = function(data) {
  var self = this;
  self.buff_in += data;
  while (self.buff_in.length >= 5) {
    var msg_type = self.buff_in.charCodeAt(0);
    var msg_id   = self.buff_in.charCodeAt(1) << 8 | self.buff_in.charCodeAt(2);
    var msg_len  = self.buff_in.charCodeAt(3) << 8 | self.buff_in.charCodeAt(4);

    if (msg_id === 0)  { return self.disconnect(); }

    if (msg_type === MsgType.RSP) {
      //console.log('> ', string_of_enum(MsgType, msg_type), msg_id, string_of_enum(MsgStatus, msg_len));

        if (self.timerConn && msg_id === 1) {
          if (msg_len === MsgStatus.OK || msg_len === MsgStatus.ALREADY_REGISTERED) {
            clearInterval(self.timerConn);
            self.timerConn = null;
            self.timerHb = setInterval(function() {
              //console.log('Heartbeat');
              self.sendMsg(MsgType.PING);
            }, self.heartbeat);
            console.log('Authorized');
            self.sendMsg(MsgType.INTERNAL, ['ver', '0.5.4', 'buff-in', 256, 'dev', 'espruino']);
            self.emit('connect');
          } else {
            //if invalid token, no point in trying to reconnect
            if (msg_len === MsgStatus.INVALID_TOKEN) {
              //letting main app know why we failed
              self.emit('error', "error: " + msg_len);
              //console.log('Disconnecting because of invalid token');
              self.disconnect();
              if(self.timerConn) {
                //clear connecting timer
                console.log('clear conn timer');
                clearInterval(self.timerConn);
                self.timerConn = null;
              }
            }
          }
        }

      self.buff_in = self.buff_in.substr(5);
      continue;
    }

    if (msg_len > 256)  { return self.disconnect(); }
    if (self.buff_in.length < msg_len+5) {
      return;
    }
    var values = self.buff_in.substr(5, msg_len).split('\0');
    self.buff_in = self.buff_in.substr(msg_len+5);

    /*if (msg_len) {
      console.log('> ', string_of_enum(MsgType, msg_type), msg_id, msg_len, values.join('|'));
    } else {
      console.log('> ', string_of_enum(MsgType, msg_type), msg_id, msg_len);
    }*/

    if (msg_type === MsgType.LOGIN ||
        msg_type === MsgType.PING)
    {
      self.sendRsp(MsgType.RSP, msg_id, MsgStatus.OK);
    } else if (msg_type === MsgType.HW ||
               msg_type === MsgType.BRIDGE)
    {
      if (values[0] === 'vw') {
        var pin = parseInt(values[1]);
        if (self.vpins[pin]) {
          self.vpins[pin].emit('write', values.slice(2));
        }
      } else if (values[0] === 'vr') {
        var pin = parseInt(values[1]);
        if (self.vpins[pin]) {
          self.vpins[pin].emit('read');
        }
      } else if (self.board.process(values)) {

      } else {
        console.log('Invalid cmd: ', values[0]);
        //self.sendRsp(MsgType.RSP, msg_id, MsgStatus.ILLEGAL_COMMAND);
      }
    } else if (msg_type === MsgType.REDIRECT) {
      self.conn.addr = values[0];
      if (values[1]) {
        self.conn.port = parseInt(values[1]);
      }
      console.log('Redirecting to ', self.conn.addr, ':', self.conn.port);
      self.disconnect();
    } else if (msg_type === MsgType.DEBUG_PRINT) {
      console.log('Server: ', values[0]);
    } else {
      console.log('Invalid msg type: ', msg_type);
      self.sendRsp(MsgType.RSP, msg_id, MsgStatus.ILLEGAL_COMMAND);
    }
  } // end while
};

Blynk.prototype.sendRsp = function(msg_type, msg_id, msg_len, data) {
  var self = this;
  data = data || "";

  if (!msg_id) {
    if (self.msg_id === 0xFFFF)
      self.msg_id = 1;
    else
      self.msg_id++;

    msg_id = self.msg_id;
  }

  if (msg_type == MsgType.RSP) {
    //console.log('< ', string_of_enum(MsgType, msg_type), msg_id, string_of_enum(MsgStatus, msg_len));
    data = blynkHeader(msg_type, msg_id, msg_len)
  } else {
    /*if (msg_len) {
      console.log('< ', string_of_enum(MsgType, msg_type), msg_id, msg_len, data.split('\0').join('|'));
    } else {
      console.log('< ', string_of_enum(MsgType, msg_type), msg_id, msg_len);
    }*/
    data = blynkHeader(msg_type, msg_id, msg_len) + data;
  }

  self.conn.write(data)
};

Blynk.prototype.sendMsg = function(msg_type, values, msg_id) {
  if (this.timerHb) {
    var values = values || [''];
    var data = values.join('\0');
    this.sendRsp(msg_type, msg_id, data.length, data);
  }
};

/*
  * API
  */

Blynk.prototype.connect = function() {
  var self = this;

  var doConnect = function() {
    if(self.conn) {
      //cleanup events
      self.conn.removeAllListeners();
    }
    self.conn.connect(function() {
      self.conn.on('data', function(data) { self.onReceive(data);     });
      self.conn.on('end',  function()     { self.end();               });

      self.sendRsp(MsgType.HW_LOGIN, 1, self.auth.length, self.auth);
    });
    self.conn.on('error', function(err) { self.error(err);            });
  };

    self.timerConn = setInterval(doConnect, 10000);
    doConnect();
};

Blynk.prototype.disconnect = function(reconnect) {
  console.log('Disconnect blynk');
  if(typeof reconnect === 'undefined' ) {
    reconnect = true;
  }

  var self = this;
  this.conn.disconnect();
  if (this.timerHb) {
    clearInterval(this.timerHb);
    this.timerHb = null;
  }
  this.emit('disconnect');
  //cleanup to avoid multiplying listeners
  this.conn.removeAllListeners();

  //starting reconnect procedure if not already in connecting loop and reconnect is true
  if(reconnect && !self.timerConn) {
    console.log("REARMING DISCONNECT");
    setTimeout(function () {self.connect()}, 5000);
  }
};

Blynk.prototype.error = function(err) {
  var self = this;
  //if we throw error and user doesn't handle it, app crashes. is it worth it?
  this.emit('error', err.code?err.code:'ERROR');
  console.error('Error', err.code);
  //starting reconnect procedure if not already in connecting loop
  if(!self.timerConn) {
    setTimeout(function () {self.connect()}, 5000);
  }
};

Blynk.prototype.end = function() {
  var self = this;
  self.disconnect();
};


Blynk.prototype.virtualWrite = function(pin, val) {
  this.sendMsg(MsgType.HW, ['vw', pin].concat(val));
};

Blynk.prototype.setProperty = function(pin, prop, val) {
  this.sendMsg(MsgType.PROPERTY, [pin, prop].concat(val));
};

Blynk.prototype.eventLog = function(name, descr) {
  this.sendMsg(MsgType.EVENT_LOG, [name].concat(descr));
};

Blynk.prototype.syncAll = function() {
  this.sendMsg(MsgType.HW_SYNC);
};

Blynk.prototype.syncVirtual = function(pin) {
  this.sendMsg(MsgType.HW_SYNC, ['vr', pin]);
};


Blynk.prototype.email = function(to, topic, message) {
  this.sendMsg(MsgType.EMAIL, [to, topic, message]);
};

Blynk.prototype.notify = function(message) {
  this.sendMsg(MsgType.NOTIFY, [message]);
};

Blynk.prototype.tweet = function(message) {
  this.sendMsg(MsgType.TWEET, [message]);
};

exports.Blynk = Blynk;
