#!/usr/bin/env node

var AUTH = 'YOUR_AUTH_TOKEN';

var BlynkLib = require('blynk-library');
var blynk = new BlynkLib.Blynk(AUTH);
var v1 = new blynk.VirtualPin(1);

v1.on('write', function(param) {
  console.log('V1:', param);
});

blynk.on('connect', function() {
  console.log("Blynk ready.");
  blynk.syncAll();
});

blynk.on('disconnect', function() { console.log("DISCONNECT"); });
