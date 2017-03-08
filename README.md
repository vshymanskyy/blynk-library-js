[![NPM version](https://img.shields.io/npm/v/blynk-library.svg)](https://www.npmjs.com/package/blynk-library)
[![NPM download](https://img.shields.io/npm/dm/blynk-library.svg)](https://www.npmjs.com/package/blynk-library)
[![GitHub stars](https://img.shields.io/github/stars/vshymanskyy/blynk-library-js.svg)](https://github.com/vshymanskyy/blynk-library-js)
[![GitHub issues](https://img.shields.io/github/issues/vshymanskyy/blynk-library-js.svg)](https://github.com/vshymanskyy/blynk-library-js/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/vshymanskyy/blynk-library-js)

[![NPM](https://nodei.co/npm/blynk-library.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/blynk-library/)

Implementations for other platforms:
* [Arduino](https://github.com/blynkkk/blynk-library)
* [Particle](https://github.com/vshymanskyy/blynk-library-spark)
* [MicroPython WiPy](https://github.com/wipy/wipy/tree/master/lib/blynk)

__________

# blynk-library-js
Blynk library implementation for JavaScript (Node.js, Espruino)

# What is Blynk?
Blynk is a platform with iOS and Android apps to control Arduino, Raspberry Pi and the likes over the Internet.
You can easily build graphic interfaces for all your projects by simply dragging and dropping widgets.
If you need more information, please follow these links:

* [Kickstarter campaign](https://www.kickstarter.com/projects/167134865/blynk-build-an-app-for-your-arduino-project-in-5-m/description)
* [Blynk downloads, docs, tutorials](http://www.blynk.cc)
* [Blynk community](http://community.blynk.cc)
* [Facebook](http://www.fb.com/blynkapp)
* [Twitter](http://twitter.com/blynk_app)

## Getting Started tutorials

* [Blynk + JavaScript in 20 minutes (Raspberry Pi, Edison, Espruino...)](http://www.instructables.com/id/Blynk-JavaScript-in-20-minutes-Raspberry-Pi-Edison/)
* [Raspberry Pi + DHT11/DHT22/AM2302](http://www.instructables.com/id/Raspberry-Pi-Nodejs-Blynk-App-DHT11DHT22AM2302/)

## Install
```
npm install blynk-library
```

## Usage example:
```js
var BlynkLib = require('blynk-library');

var blynk = new BlynkLib.Blynk('715f8caae9bf4a91bae319d0376caa8d');
var v1 = new blynk.VirtualPin(1);
var v9 = new blynk.VirtualPin(9);

v1.on('write', function(param) {
  console.log('V1:', param);
});

v9.on('read', function() {
  v9.write(new Date().getSeconds());
});
```

## Tested on:
* Node.js
 * Intel Edison
 * Desktop (Windows, Linux): TCP, SSL
* Espruino
 * Pico: ESP8266WiFi_0v25, over USB/Serial
 * VoCore (using OpenWRT Espruino package)
 * Linux

## Boards with supported direct pin IO:
* Intel Edison, Galileo using [mraa](https://www.npmjs.com/package/mraa) package
* Raspberry Pi, Beaglebone using [onoff](https://www.npmjs.com/package/onoff) package
* Espruino Pico
* OpenWrt + Espruino package

Just install the required package and this module will do auto-detection.
