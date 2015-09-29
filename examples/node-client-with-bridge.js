#!/usr/bin/env node

var Blynk = require('blynk-library');

var AUTH = 'YOUR_AUTH_TOKEN';

var blynk = new Blynk.Blynk(AUTH, options = {
  certs_path : '../certs/'
});

var v1 = new blynk.VirtualPin(1);
var v9 = new blynk.VirtualPin(9);
var bridge1 = new blynk.WidgetBridge(31);

v1.on('write', function(param) {
  console.log('V1:', param);
  bridge1.digitalWrite(13, param);
});

v9.on('read', function() {
  v9.write(new Date().getSeconds());
});

blynk.on('connect', function() {
  bridge1.setAuthToken('Your another api key');
  console.log("Blynk ready.");
});
blynk.on('disconnect', function() { console.log("DISCONNECT"); });
