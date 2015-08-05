#!/usr/bin/env nodejs

var Blynk = require('../');

var blynk = new Blynk.Blynk('715f8caae9bf4a91bae319d0376caa8d', options = {
    connector : new Blynk.TcpClient()
});

blynk.on('connect', function() {
  console.log("Blynk ready.");
});
