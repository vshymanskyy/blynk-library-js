#!/usr/bin/env node
'use strict';

var usb = require('usb');
var serial = require('serialport');
var net = require('net');


function portAttached(port) {
  // TODO: Filter by vendorId:productId, serialNumber, comName
  // Get configuration: opendelay, baudrate
  console.log("Port attached:", JSON.stringify(port));
  port.baudrate = 115200;
  port.opendelay = 500;
  setTimeout(function() { openPort(port) }, port.opendelay);
}

function portDetached(port) {
  console.log("Port detached:", JSON.stringify(port));
}

function openPort(port) {
  var serialPort = new serial.SerialPort(port.comName, {
    baudrate: port.baudrate
  }, false);

  serialPort.open(function (err) {
    if (err) throw err;
    console.log('Port opened:', port.comName);
    makeTcpBridge(serialPort);
  });
}

function makeTcpBridge(stream) {
  var tcp_conn = net.connect(8442, "blynk-cloud.com", function(err) {
    if (err) throw err;
    console.log('TCP connected');
    stream.on('error', function(){ console.log('COM error') });
    stream.on('close', function(){ console.log('COM close') });
    tcp_conn.on('error', function(){ console.log('TCP error') });
    tcp_conn.on('close', function(){ console.log('TCP close') });
    tcp_conn.setNoDelay(true);
    stream.pipe(tcp_conn).pipe(stream);
  });
}

var knownPorts = [];

function rescanPorts() {
  serial.list(function (err, ports) {
    ports.forEach(function (port) {
      if (knownPorts.indexOf(port.comName) == -1) {
        knownPorts.push(port.comName);
        portAttached(port);
      }
    });
    var currPorts = ports.map(function (port) { return port.comName });
    knownPorts.forEach(function (port, i) {
      if (currPorts.indexOf(port) == -1) {
        knownPorts.splice(i, 1);
        portDetached({comName: port});
      }
    });
  });
}

usb.on('attach', function(device) {
  setTimeout(rescanPorts, 100);
});

usb.on('detach', function(device) {
  setTimeout(rescanPorts, 10);
});

// Catch ctrl+c event
process.on('SIGINT', function() {
  process.exit();
});

// Scan initial set of devices
serial.list(function (err, ports) {
  knownPorts = ports.map(function (port) { return port.comName });
});
