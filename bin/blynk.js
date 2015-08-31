#!/usr/bin/env node

var Blynk = require("../");

var path = require('path');
var fs = require('fs');
var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../');

var blynk_opts = { certs_path : path.join(lib, "certs") };

if (0) {
  blynk_opts.connector = new Blynk.TcpClient();
}

if (!process.argv[2]) {
  console.log("Please specify auth token.");
  process.exit(1);
}

var blynk = new Blynk.Blynk(process.argv[2], options = blynk_opts);

blynk.on('connect', function() {
  console.log("Blynk ready.");
});
