/*
 * Warning: it will move console to Serial1!
 * Don't try this if you don't know how to switch it back!
 */

var Blynk = require('http://tiny.cc/blynk-js');

var AUTH = 'YOUR_AUTH_TOKEN';

function onInit() {
  var blynk = new Blynk.Blynk(AUTH, options = {
    connector : new Blynk.EspruinoSerial()
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
}

onInit();
