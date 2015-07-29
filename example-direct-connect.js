var Blynk = require('./blynk');

var blynk = new Blynk.Blynk('715f8caae9bf4a91bae319d0376caa8d', options = {
    connector : new Blynk.SslServer(),
    profile : '{"dashBoards":[{"id":1,"boardType":"ESP8266","name":"Direct connect","widgets":[{"id":1,"type":"BUTTON","pinType":"VIRTUAL","pin":1,"value":"1","x":1,"y":1,"pushMode":false},{"id":2,"type":"DIGIT4_DISPLAY","pinType":"VIRTUAL","pin":9,"frequency":1000,"x":5,"y":1}]}]}'
});

var v1 = new blynk.VirtualPin(1);
var v9 = new blynk.VirtualPin(9);

v1.on('write', function(param) {
  console.log('V1:', param);
});

v9.on('read', function() {
  v9.write(new Date().getSeconds());
});

blynk.on('connect', function() { console.log("Blynk ready."); });
blynk.on('disconnect', function() { console.log("DISCONNECT"); });
