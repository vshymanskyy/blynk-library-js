/*
 * Helpers
 */

function isEspruino() {
  return typeof process.env.BOARD !== 'undefined';
}

function blynkHeader(msg_type, msg_id, msg_len) {
  return String.fromCharCode(
    msg_type,
    msg_id  >> 8, msg_id  & 0xFF,
    msg_len >> 8, msg_len & 0xFF
  );
}

var MsgType = {
  RSP        :  0,
  LOGIN      :  2,
  PING       :  6,
  TWEET      :  12,
  EMAIL      :  13,
  NOTIFY     :  14,
  BRIDGE     :  15,
  HW         :  20,
};

var MsgStatus = {
  OK         :  200
};

var BlynkState = {
  CONNECTING    :  1,
  CONNECTED     :  2,
  DISCONNECTED  :  3,
};


if (!isEspruino()) {
  var events = require('events');
  var util = require('util');
}

/*
 * TCP Client
 */

var BlynkTcpClient = function(options) {
  var self = this;
  if (!isEspruino()) {
    events.EventEmitter.call(this);
  }
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

if (!isEspruino()) {
  util.inherits(BlynkTcpClient, events.EventEmitter);
}

/*
 * SSL Client
 */

var BlynkSslClient = function(options) {
  var self = this;
  if (!isEspruino()) {
    events.EventEmitter.call(this);
  }
  
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

if (!isEspruino()) {
  util.inherits(BlynkSslClient, events.EventEmitter);
}


/*
 * Serial
 */

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

/*
 * Boards
 */

var BoardDummy = function() {
  this.process = function(values) {
    if (values[0] === 'info') {
      return true;
    }
  };
};

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

/*
 * Blynk
 */

var Blynk = function(auth, options) {
  var self = this;
  if (!isEspruino()) {
    events.EventEmitter.call(this);
  }

  var options = options || {};
  this.auth = auth;
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
  } else {
    this.conn = new BlynkSslClient(options);
  }

  this.buff_in = '';
  this.msg_id = 1;

  this._onReceive = function(data) {
    //if (isEspruino()) {
    //  self.buff_in += data;
    //} else {
      self.buff_in += data.toString('binary');
    //}
    while (self.buff_in.length >= 5) {
      var msg_type = self.buff_in.charCodeAt(0);
      var msg_id   = self.buff_in.charCodeAt(1) << 8 | self.buff_in.charCodeAt(2);
      var msg_len  = self.buff_in.charCodeAt(3) << 8 | self.buff_in.charCodeAt(4);

      //console.log('d> ', data.toString('hex'));
      //console.log('i> ', new Buffer(self.buff_in, 'binary').toString('hex'));
      console.log('> ', msg_type, msg_id, msg_len);

      if (msg_id === 0)  { return self.disconnect(); }
      var consumed = 5;

      if (msg_type === MsgType.RSP) {
        if (self.timerConn && msg_id === 1 && msg_len === MsgStatus.OK) {
          clearInterval(self.timerConn);
          self.timerConn = null;
          self.timerHb = setInterval(function() {
            console.log('Heartbeat');
            self.sendMsg(MsgType.PING, null);
          }, self.heartbeat);
          self.emit('connect');
        }
      } else if (msg_type === MsgType.PING) {
        self.conn.write(blynkHeader(MsgType.RSP, msg_id, MsgStatus.OK));
      } else if (msg_type === MsgType.HW ||
                 msg_type === MsgType.BRIDGE)
      {
        if (msg_len > 1024)  { return self.disconnect(); }
        if (self.buff_in.length < msg_len+5) {
          return;
        }
        var values = self.buff_in.substr(5, msg_len).split('\0');
        consumed += msg_len;

        console.log('> ', values);

        if (values[0] === 'vw') {
          self.emit('virtual', {
            type : 'write',
            vPin : parseInt(values[1], 10),
            args : values.slice(2),
          });
        } else if (values[0] === 'vr') {
          self.emit('virtual', {
            type : 'read',
            vPin : parseInt(values[1], 10),
          });
        } else if (self.board.process(values)) {

        } else {
          console.log('Invalid cmd: ', values[0]);
        }
      }
      self.buff_in = self.buff_in.substr(consumed);
    } // end while
  };

  this.sendMsg = function(msg_type, msg_id, values) {
    values = values || [''];
    msg_id = msg_id || (self.msg_id++);
    var data = values.join('\0');
    var msg_len = data.length;
    self.conn.write(blynkHeader(msg_type, msg_id, msg_len) + data);
    console.log('< ', msg_type, msg_id, msg_len, ' : ', values);

    // TODO: track also recieving time
    if (self.timerHb) {
      clearInterval(self.timerHb);
      self.timerHb = setInterval(function(){
        self.sendMsg(MsgType.PING, null);
      }, self.heartbeat);
    }
  };

  /*
   * API
   */

  this.connect = function() {
    self.disconnect();
    self.timerConn = setInterval(function() {
      self.conn.connect(function() {
        self.conn.removeAllListeners('data');
        self.conn.on('data', self._onReceive);
        self.sendMsg(MsgType.LOGIN, 1, [self.auth]);
      });
    }, 5000);
  };

  this.disconnect = function() {
    self.conn.disconnect();
    self.emit('disconnect');
  };

  this.virtualWrite = function(pin , value) {
    self.sendMsg(MsgType.HW, null, ['vw', pin, value]);
  };

  this.email = function(to, topic, message) {
    self.sendMsg(MsgType.EMAIL, null, [to, topic, message]);
  };

  this.notify = function(message) {
    self.sendMsg(MsgType.NOTIFY, null, [message]);
  };

  this.tweet = function(message) {
    self.sendMsg(MsgType.TWEET, null, [message]);
  };
};

if (!isEspruino()) {
  util.inherits(Blynk, events.EventEmitter);
}

function startBlynk() {
  var blynk = new Blynk('7736215262c242c1989a1e262fbbcb19');
  blynk.connect();

  blynk.on('virtual', function(param){
    console.log('VIRTUAL:', param);
  });

  blynk.on('connect', function(){
    setInterval(function() {
      blynk.virtualWrite(9, (new Date()).getSeconds());
    }, 1000);
  });

}

startBlynk();
