#!/usr/bin/env node

var Blynk = require("../");

var path = require('path');
var fs = require('fs');
var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../');

var blynk_opts = { base_dir : lib };

if (0) {
  blynk_opts.connector = new Blynk.TcpClient();
}

var blynk = new Blynk.Blynk(process.argv[2], options = blynk_opts);

blynk.on('connect', function() {
  console.log("Blynk ready.");
});
