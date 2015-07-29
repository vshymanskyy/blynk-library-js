/*
 * Helpers
 */

function isEspruino() {
  if (typeof process === 'undefined') return false;
  if (typeof process.env.BOARD === 'undefined') return false;
  return true;
}

function isNode() {
  return (typeof module !== 'undefined' && ('exports' in module));
}

function isBrowser() {
  return (typeof window !== 'undefined');
}

function needsEmitter() {
  return (!isEspruino() && isNode());
}


function blynkHeader(msg_type, msg_id, msg_len) {
  return String.fromCharCode(
    msg_type,
    msg_id  >> 8, msg_id  & 0xFF,
    msg_len >> 8, msg_len & 0xFF
  );
}

var MsgType = {
  RSP           :  0,
  REGISTER      :  1, //"mail pass"
  LOGIN         :  2, //"token" or "mail pass"
  SAVE_PROF     :  3,
  LOAD_PROF     :  4,
  GET_TOKEN     :  5,
  PING          :  6,
  ACTIVATE      :  7, //"DASH_ID"
  DEACTIVATE    :  8, //
  REFRESH       :  9, //"refreshToken DASH_ID"
  TWEET         :  12,
  EMAIL         :  13,
  NOTIFY        :  14,
  BRIDGE        :  15,
  HW            :  20,
};

var MsgStatus = {
  OK                    :  200,
  ILLEGAL_COMMAND       :  2,
};

var BlynkState = {
  CONNECTING    :  1,
  CONNECTED     :  2,
  DISCONNECTED  :  3,
};

if (isNode()) {
  var bl_node = require('./blynk-node.js');
  var events = require('events');
  var util = require('util');
}

/*
 * Serial
 */
if (isEspruino()) {
  var BlynkSerial = function(options) {
    var self = this;

    var options = options || {};
    self.ser  = options.serial || USB;
    self.conser = options.conser || Serial1;
    self.baud = options.baud || 9600;

    this.write = function(data) {
      self.ser.write(data);
    };

    this.connect = function(done) {
      self.ser.setup(self.baud);
      self.ser.removeAllListeners('data');
      self.ser.on('data', function(data) {
        self.emit('data', data);
      });
      if (self.conser) {
        self.conser.setConsole();
      }
      done();
    };

    this.disconnect = function() {
      //self.ser.setConsole();
    };
  };

  var BoardEspruino = function(values) {
    this.process = function(values) {
      switch(values[0]) {
        case 'info':
          break;
        case 'dw':
          var pin = Pin(values[1]);
          var val = parseInt(values[2], 10);
          pinMode(pin, 'output');
          digitalWrite(pin, val);
          break;
        case 'aw':
          var pin = Pin(values[1]);
          var val = parseInt(values[2], 10);
          pinMode(pin, 'output');
          analogWrite(pin, val);
          break;
        case 'dr':
          var pin = Pin(values[1]);

          break;
        case 'ar':
          var pin = Pin(values[1]);

          break;
        default:
          return null;
      }
      return true;
    };
  };
}

/*
 * Boards
 */

var BoardDummy = function() {
  this.process = function(values) {
    switch (values[0]) {
    case 'info':
      return true;
    case 'pm':
      return true;
    case 'dw':
    case 'dr':
    case 'aw':
    case 'ar':
      console.log("Dummy board does not support direct pin operations");
    }
  };
};

/*
 * Blynk
 */

var Blynk = function(auth, options) {
  if (needsEmitter()) {
    events.EventEmitter.call(this);
  }

  this.auth = auth;
  var options = options || {};
  this.heartbeat = options.heartbeat || (10*1000);

  // Auto-detect board
  if (options.board) {
    this.board = options.board;
  } else if (isEspruino()) {
    this.board = new BoardEspruino();
  } else {
    this.board = new BoardDummy();
  }

  // Auto-detect connector
  if (options.connector) {
    this.conn = options.connector;
  } else if (isEspruino()) {
    this.conn = new BlynkSerial(options);
  } else if (isBrowser()) {
    this.conn = new BlynkWsClient(options);
  } else {
    this.conn = new bl_node.SslClient(options);
  }

  this.buff_in = '';
  this.msg_id = 1;
  this.vpins = [];
  this.profile = options.profile;


  var blynk = this;
  this.VirtualPin = function(pin) {
    if (needsEmitter()) {
      events.EventEmitter.call(this);
    }
    this.blynk = blynk;
    this.pin = pin;
    blynk.vpins[pin] = this;
    
    this.write = function(value) {
      blynk.virtualWrite(this.pin, value);
    };
  };

  if (needsEmitter()) {
    util.inherits(this.VirtualPin, events.EventEmitter);
  } else if (isBrowser()) {
    MicroEvent.mixin(this.VirtualPin);
  }
  
  if (!options.skip_connect) {
    this.connect();
  }
};

if (needsEmitter()) {
  util.inherits(Blynk, events.EventEmitter);
} else if (isBrowser()) {
  MicroEvent.mixin(Blynk);
}

Blynk.prototype.onReceive = function(data) {
  var self = this;
  self.buff_in += data;
  while (self.buff_in.length >= 5) {
    var msg_type = self.buff_in.charCodeAt(0);
    var msg_id   = self.buff_in.charCodeAt(1) << 8 | self.buff_in.charCodeAt(2);
    var msg_len  = self.buff_in.charCodeAt(3) << 8 | self.buff_in.charCodeAt(4);

    if (msg_id === 0)  { return self.disconnect(); }
    var consumed = 5;

    if (msg_type === MsgType.RSP) {
      //console.log('> ', msg_type, msg_id, string_of_enum(MsgStatus, msg_len), ' ! ');
if (!self.profile) {
      if (self.timerConn && msg_id === 1 && msg_len === MsgStatus.OK) {
        clearInterval(self.timerConn);
        self.timerConn = null;
        self.timerHb = setInterval(function() {
          //console.log('Heartbeat');
          self.sendMsg(MsgType.PING, null);
        }, self.heartbeat);
        self.emit('connect');
      }
}
      self.buff_in = self.buff_in.substr(5);
      continue;
    }

    if (msg_len > 1024)  { return self.disconnect(); }
    if (self.buff_in.length < msg_len+5) {
      return;
    }
    var values = self.buff_in.substr(5, msg_len).split('\0');
    self.buff_in = self.buff_in.substr(msg_len+5);
    //console.log('> ', msg_type, msg_id, msg_len, ' : ', values);

    if (msg_type === MsgType.LOGIN ||
        msg_type === MsgType.PING)
    {
      self.sendRsp(MsgType.RSP, msg_id, MsgStatus.OK);
    } else if (msg_type === MsgType.GET_TOKEN) {
      self.sendRsp(MsgType.GET_TOKEN, msg_id, self.auth.length, self.auth);
    } else if (msg_type === MsgType.LOAD_PROF) {
      self.sendRsp(MsgType.LOAD_PROF, msg_id, self.profile.length, self.profile);
    } else if (msg_type === MsgType.HW ||
                msg_type === MsgType.BRIDGE)
    {
      if (values[0] === 'vw') {        
        var pin = parseInt(values[1], 10);
        if (this.vpins[pin]) {
          this.vpins[pin].emit('write', values.slice(2));
        }
      } else if (values[0] === 'vr') {
        var pin = parseInt(values[1], 10);
        if (this.vpins[pin]) {
          this.vpins[pin].emit('read');
        }
      } else if (self.board.process(values)) {

      } else {
        console.log('Invalid cmd: ', values[0]);
        //self.sendRsp(MsgType.RSP, msg_id, MsgStatus.ILLEGAL_COMMAND);
      }
    } else if (msg_type === MsgType.REGISTER ||
                msg_type === MsgType.SAVE_PROF ||
                msg_type === MsgType.ACTIVATE ||
                msg_type === MsgType.DEACTIVATE ||
                msg_type === MsgType.REFRESH)
    {
      // these make no sence...
    } else {
      console.log('Invalid msg type: ', msg_type);
      self.sendRsp(MsgType.RSP, msg_id, MsgStatus.ILLEGAL_COMMAND);
    }
  } // end while
};

Blynk.prototype.sendRsp = function(msg_type, msg_id, msg_len, data) {
  var self = this;
  data = data || "";
  msg_id = msg_id || (self.msg_id++);
  if (msg_type == MsgType.RSP) {
    //console.log('< ', msg_type, msg_id, string_of_enum(MsgStatus, msg_len), ' ! ');
    self.conn.write(blynkHeader(msg_type, msg_id, msg_len));
  } else {
    //console.log('< ', msg_type, msg_id, msg_len, ' : ', data.split('\0'));
    self.conn.write(blynkHeader(msg_type, msg_id, msg_len) + data);
  }


  // TODO: track also recieving time
if (!self.profile) {
  if (self.timerHb) {
    clearInterval(self.timerHb);
    self.timerHb = setInterval(function(){
      console.log('Heartbeat');
      self.sendMsg(MsgType.PING, null);
    }, self.heartbeat);
  }
}
};

Blynk.prototype.sendMsg = function(msg_type, msg_id, values) {
  values = values || [''];
  data = values.join('\0');
  this.sendRsp(msg_type, msg_id, data.length, data);
};

/*
  * API
  */

Blynk.prototype.connect = function() {
  var self = this;
  self.disconnect();
  var doConnect = function() {
    self.conn.connect(function() {
      self.conn.on('data', function(data) { self.onReceive(data); });
      self.conn.on('end',  function()     { self.disconnect();    });
      self.sendRsp(MsgType.LOGIN, 1, self.auth.length, self.auth);
    });
  };

  if (self.profile) {
    doConnect();
  } else {
    self.timerConn = setInterval(doConnect, 5000);
    doConnect();
  }
};

Blynk.prototype.disconnect = function() {
  this.conn.disconnect();
  clearInterval(this.timerHb);
  this.emit('disconnect');
};

Blynk.prototype.virtualWrite = function(pin, value) {
  this.sendMsg(MsgType.HW, null, ['vw', pin, value]);
};

Blynk.prototype.email = function(to, topic, message) {
  this.sendMsg(MsgType.EMAIL, null, [to, topic, message]);
};

Blynk.prototype.notify = function(message) {
  this.sendMsg(MsgType.NOTIFY, null, [message]);
};

Blynk.prototype.tweet = function(message) {
  this.sendMsg(MsgType.TWEET, null, [message]);
};


if (typeof module !== 'undefined' && ('exports' in module)) {
  exports.Blynk = Blynk;

  if (isEspruino()) {
    exports.EspruinoSerial = BlynkSerial;
  } else if (isNode()) {
    exports.TcpClient = bl_node.BlynkTcpClient;
    exports.TcpServer = bl_node.BlynkTcpServer;
    exports.SslClient = bl_node.BlynkSslClient;
    exports.SslServer = bl_node.BlynkSslServer;
    exports.BoardOnOff = bl_node.BoardOnOff;
  }
}
