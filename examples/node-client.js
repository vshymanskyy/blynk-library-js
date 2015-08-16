#!/usr/bin/env nodejs

var Blynk = require('blynk-library');

var blynk = new Blynk.Blynk('715f8caae9bf4a91bae319d0376caa8d', options = {
  base_dir : '../'
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
