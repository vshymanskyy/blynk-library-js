var util = require('util');
var noble = require('noble');
var stream = require("stream");
var net = require("net");

var peripherals = [];

////////////////////////////////////////////////////////////

function BleRawSerial(peripheral, opts, options) {
  stream.Duplex.call(this, options);

  this.peripheral = peripheral;
  this.uuid_svc = opts.uuid_svc;
  this.uuid_tx = opts.uuid_tx;
  this.uuid_rx = opts.uuid_rx;
}

util.inherits(BleRawSerial, stream.Duplex);

BleRawSerial.prototype.connect = function (callback) {
  var self = this;
  self.peripheral.discoverServices([self.uuid_svc], function(err, services) {
    if (err) throw err;
    services.forEach(function(service) {
      service.discoverCharacteristics([self.uuid_tx, self.uuid_rx], function(err, characteristics) {
        if (err) throw err;
        //console.log("CHARS:", characteristics);
        self.char_tx = characteristics[0];
        self.char_rx = characteristics[1];
        self.char_rx.notify(true, function(err) {
          if (err) throw err;
        });
        self.char_rx.on('read', function(data, isNotification) {
          //console.log('Got ' + data.length + ' bytes');
          if (!self.push(data)) {
            //self._source.readStop();
          }
        });
        callback();
      });
    });
  });
};

BleRawSerial.prototype._read = function (size) {
  //this._source.readStart();
};

BleRawSerial.prototype._write = function (chunk, enc, cb) {
  this.char_tx.write(chunk, true, function(err) {
    //console.log('Sent ' + chunk.length + ' bytes');
    if (typeof cb === 'function') {
      cb(err);
    }
  });
};

////////////////////////////////////////////////////////////

var crc = require('crc');

var commands = {

    MSG_ID_SERIAL_DATA        : new Buffer([0x00, 0x00]),
    MSG_ID_BT_SET_ADV         : new Buffer([0x05, 0x00]),
    MSG_ID_BT_SET_CONN        : new Buffer([0x05, 0x02]),
    MSG_ID_BT_SET_LOCAL_NAME  : new Buffer([0x05, 0x04]),
    MSG_ID_BT_SET_PIN         : new Buffer([0x05, 0x06]),
    MSG_ID_BT_SET_TX_PWR      : new Buffer([0x05, 0x08]),
    MSG_ID_BT_GET_CONFIG      : new Buffer([0x05, 0x10]),
    MSG_ID_BT_ADV_ONOFF       : new Buffer([0x05, 0x12]),
    MSG_ID_BT_SET_SCRATCH     : new Buffer([0x05, 0x14]),
    MSG_ID_BT_GET_SCRATCH     : new Buffer([0x05, 0x15]),
    MSG_ID_BT_RESTART         : new Buffer([0x05, 0x20]),
    MSG_ID_GATING             : new Buffer([0x05, 0x50]),
    MSG_ID_BL_CMD             : new Buffer([0x10, 0x00]),
    MSG_ID_BL_FW_BLOCK        : new Buffer([0x10, 0x01]),
    MSG_ID_BL_STATUS          : new Buffer([0x10, 0x02]),
    MSG_ID_CC_LED_WRITE       : new Buffer([0x20, 0x00]),
    MSG_ID_CC_LED_WRITE_ALL   : new Buffer([0x20, 0x01]),
    MSG_ID_CC_LED_READ_ALL    : new Buffer([0x20, 0x02]),
    MSG_ID_CC_ACCEL_READ      : new Buffer([0x20, 0x10]),
    MSG_ID_CC_TEMP_READ       : new Buffer([0x20, 0x11]),
    MSG_ID_AR_SET_POWER       : new Buffer([0x30, 0x00]),
    MSG_ID_AR_GET_CONFIG      : new Buffer([0x30, 0x06]),
    MSG_ID_DB_LOOPBACK        : new Buffer([0xFE, 0x00]),
    MSG_ID_DB_COUNTER         : new Buffer([0xFE, 0x01]),

};

function BleBeanSerial(peripheral, opts, options) {
  stream.Duplex.call(this, options);

  this.peripheral = peripheral;
  this.uuid_svc = opts.uuid_svc;
  this.uuid_rxtx = opts.uuid_rxtx;
  
  this.count = 0;
  this.gst = new Buffer(0);
}

util.inherits(BleBeanSerial, stream.Duplex);

BleBeanSerial.prototype._onRead = function(gt){

  //see https://github.com/PunchThrough/bean-documentation/blob/master/serial_message_protocol.md

  //Received a single GT packet
  var start = (gt[0] & 0x80); //Set to 1 for the first packet of each App Message, 0 for every other packet
  var messageCount = (gt[0] & 0x60); //Increments and rolls over on each new GT Message (0, 1, 2, 3, 0, ...)
  var packetCount = (gt[0] & 0x1F); //Represents the number of packets remaining in the GST message

  //first packet, reset data buffer
  if (start) {
    this.gst = new Buffer(0);
  }

  //TODO probably only if messageCount is in order
  this.gst = Buffer.concat( [this.gst, gt.slice(1)] );

  //last packet, process and emit
  if(packetCount === 0){

    var length = this.gst[0]; //size of thse cmd and payload

    //crc only the size, cmd and payload
    var crcString = crc.crc16ccitt(this.gst.slice(0,this.gst.length-2));
    //messy buffer equality because we have to swap bytes and can't use string equality because tostring drops leading zeros
    
    //console.log('CRC: ' , typeof crcString);
    var crc16 = new Buffer(2);
    crc16.writeUInt16BE(crcString, 0);
    
    var valid = (crc16[0]===this.gst[this.gst.length-1] && crc16[1]===this.gst[this.gst.length-2]);

    var command = ( (this.gst[2] << 8) + this.gst[3] ) & ~(0x80) ;

    //this.emit('raw', this.gst.slice(2,this.gst.length-2), length, valid, command);

    if(valid){

      //ideally some better way to do lookup
      if(command === (commands.MSG_ID_CC_ACCEL_READ[0] << 8 ) + commands.MSG_ID_CC_ACCEL_READ[1])
      {
        var x = (((this.gst[5] << 24) >> 16) | this.gst[4]) * 0.00391;
        var y = (((this.gst[7] << 24) >> 16) | this.gst[6]) * 0.00391;
        var z = (((this.gst[9] << 24) >> 16) | this.gst[8]) * 0.00391;

        this.emit('accell', x.toFixed(5), y.toFixed(5), z.toFixed(5), valid);

      } else if(this.gst[2] === commands.MSG_ID_SERIAL_DATA[0] && this.gst[3] === commands.MSG_ID_SERIAL_DATA[1]){
        
        var data = this.gst.slice(4,this.gst.length-2);
        
        if (!this.push(data)) {
          //this._source.readStop();
        }

      } else if(command === (commands.MSG_ID_CC_TEMP_READ[0] << 8 ) + commands.MSG_ID_CC_TEMP_READ[1]){

        this.emit('temp', this.gst[4], valid);

      }

    else{

      this.emit('invalid', this.gst.slice(2,this.gst.length-2), length, valid, command);

      }

    }

  }

};

BleBeanSerial.prototype.sendCmd = function(cmdBuffer,payloadBuffer,done) {

  //size buffer contains size of(cmdBuffer, and payloadBuffer) and a reserved byte set to 0
  var sizeBuffer = new Buffer(2);
  sizeBuffer.writeUInt8(cmdBuffer.length + payloadBuffer.length,0);
  sizeBuffer.writeUInt8(0,1);

  //GST contains sizeBuffer, cmdBuffer, and payloadBuffer
  var gstBuffer = Buffer.concat([sizeBuffer,cmdBuffer,payloadBuffer]);

  var crcString = crc.crc16ccitt(gstBuffer);
  var crc16Buffer = new Buffer(2);
  crc16Buffer.writeUInt16BE(crcString, 0);

  //GATT contains sequence header, gstBuffer and crc166
  var gattBuffer = new Buffer(1 + gstBuffer.length + crc16Buffer.length);

  var header = (((this.count++ * 0x20) | 0x80) & 0xff);
  gattBuffer[0]=header;

  gstBuffer.copy(gattBuffer,1,0); //copy gstBuffer into gatt shifted right 1

  //swap 2 crc bytes and add to end of gatt
  gattBuffer[gattBuffer.length-2]=crc16Buffer[1];
  gattBuffer[gattBuffer.length-1]=crc16Buffer[0];

  this.char_rxtx.write(gattBuffer, true, done);

};

BleBeanSerial.prototype.connect = function (callback) {
  var self = this;
  self.peripheral.discoverServices([self.uuid_svc], function(err, services) {
    if (err) throw err;
    services.forEach(function(service) {
      service.discoverCharacteristics([self.uuid_rxtx], function(err, characteristics) {
        if (err) throw err;
        //console.log("CHARS:", characteristics);
        self.char_rxtx = characteristics[0];
        self.char_rxtx.notify(true, function(err) {
          if (err) throw err;
        });
        self.char_rxtx.on('read', function(data, isNotification) {
          self._onRead(data);
        });
        self.unGate();
        callback();
      });
    });
  });
};

BleBeanSerial.prototype._read = function (size) {
  //this._source.readStart();
};

BleBeanSerial.prototype._write = function (chunk, enc, cb) {
  // TODO: Cut into chunks
  this.sendCmd(commands.MSG_ID_SERIAL_DATA, chunk, cb);
};

BleBeanSerial.prototype.unGate = function(done) {
  this.sendCmd(commands.MSG_ID_GATING, new Buffer({}), done);
}

BleBeanSerial.prototype.setColor = function(color,done) {
  this.sendCmd(commands.MSG_ID_CC_LED_WRITE_ALL, color, done);
};

BleBeanSerial.prototype.requestAccell = function(done) {
  this.sendCmd(commands.MSG_ID_CC_ACCEL_READ, new Buffer([]), done);
};

BleBeanSerial.prototype.requestTemp = function(done) {
  this.sendCmd(commands.MSG_ID_CC_TEMP_READ, new Buffer([]), done);
};

////////////////////////////////////////////////////////////

var dev_service_uuids = {
  '713d0000503e4c75ba943148f18d941e': {
    name : 'mbed NRF51822',
    class: BleRawSerial,
    options: {
      uuid_svc:'713d0000503e4c75ba943148f18d941e',
      uuid_tx: '713d0003503e4c75ba943148f18d941e',
      uuid_rx: '713d0002503e4c75ba943148f18d941e'
    }
  },
  '6e400001b5a3f393e0a9e50e24dcca9e': {
    name : 'Nordic NRF8001 Serial',
    class: BleRawSerial,
    options: {
      uuid_svc:'6e400001b5a3f393e0a9e50e24dcca9e',
      uuid_tx: '6e400002b5a3f393e0a9e50e24dcca9e',
      uuid_rx: '6e400003b5a3f393e0a9e50e24dcca9e'
    }
  },
  'a495ff10c5b14b44b5121370f02d74de': {
    name : 'LightBlue Bean',
    class: BleBeanSerial,
    options: {
      uuid_svc:  'a495ff10c5b14b44b5121370f02d74de',
      uuid_rxtx: 'a495ff11c5b14b44b5121370f02d74de'
    }
  }
};

//Buffer.prototype.toByteArray = function() { return Array.prototype.slice.call(this, 0); };

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning(); // Object.keys(dev_service_uuids)
    console.log('Scanning for BLE devices...');
  } else {
    noble.stopScanning();
    console.log('State changed to ' + '. Scanning stopped.');
  }
});

// TODO: Multiple device connect?
noble.on('discover', function(peripheral) {
  var name = peripheral.advertisement.localName;
  var uuid = peripheral.uuid;
  var addr = peripheral.address;
  var rssi = peripheral.rssi;
  console.log(util.format('Discovered %s [addr: %s, uuid: %s, rssi: %d]', name, addr, uuid, rssi));

  peripheral.advertisement.serviceUuids.forEach(function(service) {
    var svc = dev_service_uuids[service];
    if (svc !== undefined) {
      console.log("Device type:", svc.name);

      peripheral.connect(function(err) {
        if (err) throw err;          
        peripherals[peripherals.length] = peripheral;

        var ble_ser = new svc.class(peripheral, svc.options);
        ble_ser.connect(function(err) {
          if (err) throw err;
          console.log('BLE connected');
        });
        var tcp_conn = net.connect(8442, 'cloud.blynk.cc', function(err) {
          if (err) throw err;
          console.log('TCP connected');
        });
        ble_ser.on('error', function(){ console.log('BLE error'); });
        tcp_conn.on('error', function(){ console.log('TCP error');});
        ble_ser.on('close', function(){ console.log('BLE close'); });
        tcp_conn.on('close', function(){ console.log('TCP close');});
        
        ble_ser.pipe(tcp_conn).pipe(ble_ser);
        
        //ble_ser.pipe(process.stdout);
      });
    }
  });
});

// catches ctrl+c event
process.on('SIGINT', function() {
  peripherals.forEach(function(peripheral) {
    console.log('Disconnecting from ' + peripheral.uuid + '...');
    peripheral.disconnect( function(){
      console.log('disconnected');
    });
  });

  //end process after 2 more seconds
  setTimeout(function(){
    process.exit();
  }, 2000);
});

process.stdin.resume();//so the program will not close instantly
