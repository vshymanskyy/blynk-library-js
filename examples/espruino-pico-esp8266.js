var Blynk = require('http://tiny.cc/blynk-js');

var SSID = 'YOUR_WIFI_NAME';
var PASS = 'YOUR_WIFI_PASS';
var AUTH = 'YOUR_AUTH_TOKEN';

function blynkInit() {
  var blynk = new Blynk.Blynk(AUTH);

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
}

function onInit() {
  Serial2.setup(115200, { rx: A3, tx : A2 });
  var wifi = require("ESP8266WiFi_0v25").connect(Serial2, function(err) {
    if (err) throw err;
    wifi.reset(function(err) {
      if (err) throw err;
      console.log("Connecting to WiFi:", SSID);
      wifi.connect(SSID, PASS, function(err) {
        if (err) throw err;
        console.log("WiFi connected.");
        blynkInit();
      });
    });
  });
}

onInit();
