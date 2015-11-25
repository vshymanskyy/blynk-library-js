#!/usr/bin/env node

var Blynk = require('blynk-library');

var AUTH = 'YOUR_AUTH_TOKEN';

var blynk = new Blynk.Blynk(AUTH, options = {
  connector : new Blynk.TcpClient({ addr:"192.168.1.1", port:8442 })
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
