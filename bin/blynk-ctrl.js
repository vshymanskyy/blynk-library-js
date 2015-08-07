#!/usr/bin/env node

var Blynk = require('../');

var blynk = new Blynk.Blynk("e3918e9a5fbd4739a8c973bcfc4e12b8", options = {
    connector : new Blynk.TcpClient()
});

blynk.on('connect', function() {
  console.log("Blynk ready.");
});
