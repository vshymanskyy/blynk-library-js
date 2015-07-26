var Blynk = require('./blynk');

var blynk = new Blynk.Blynk('7736215262c242c1989a1e262fbbcb19');

var v1 = new blynk.VirtualPin(1);
var v9 = new blynk.VirtualPin(9);

v1.on('write', function(param) {
  console.log('V1:', param);
});

v9.on('read', function() {
  v9.write(new Date().getSeconds());
});

blynk.on('connected', function() { console.log("Blynk ready."); });
blynk.on('disconnected', function() { console.log("DISCONNECT"); });
