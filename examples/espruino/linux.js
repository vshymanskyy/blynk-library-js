#!/usr/bin/env espruino

/*
 * In the same directory as this script,
 * create a node_modules folder and put blynk.js module inside.
 */

var Blynk = require('blynk');

var AUTH = 'YOUR_AUTH_TOKEN';

var blynk = new Blynk.Blynk(AUTH, options = {
  connector : new Blynk.EspruinoTCP()
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

