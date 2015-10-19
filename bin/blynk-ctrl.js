#!/usr/bin/env node

var Blynk = require('../');

var blynk = new Blynk.Blynk("");

blynk.on('connect', function() {
  console.log("Blynk ready.");
});
