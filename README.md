# blynk-library-js
Blynk library implementation for JavaScript (Node.js, Espruino)

[![NPM version](https://img.shields.io/npm/v/blynk-library.svg)](https://www.npmjs.com/package/blynk-library)
[![NPM download](https://img.shields.io/npm/dm/blynk-library.svg)](https://www.npmjs.com/package/blynk-library)
[![GitHub stars](https://img.shields.io/github/stars/vshymanskyy/blynk-library-js.svg)](https://github.com/vshymanskyy/blynk-library-js)
[![GitHub issues](https://img.shields.io/github/issues/vshymanskyy/blynk-library-js.svg)](https://github.com/vshymanskyy/blynk-library-js/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/vshymanskyy/blynk-library-js)

If you like **Blynk** - give it a star, or fork it and contribute! 
[![GitHub stars](https://img.shields.io/github/stars/blynkkk/blynk-library.svg?style=social&label=Star)](https://github.com/blynkkk/blynk-library/stargazers) 
[![GitHub forks](https://img.shields.io/github/forks/blynkkk/blynk-library.svg?style=social&label=Fork)](https://github.com/blynkkk/blynk-library/network)
__________

## What is Blynk?
Blynk provides **iOS** and **Android** apps to control any hardware **over the Internet** or **directly using Bluetooth**.
You can easily build graphic interfaces for all your projects by simply dragging and dropping widgets, **right on your smartphone**.
Blynk is **the most popular IoT platform** used by design studios, makers, educators, and equipment vendors all over the world.

![Blynk Banner](https://github.com/blynkkk/blynkkk.github.io/blob/master/images/GithubBanner.jpg)

## Download

**Blynk App: 
[<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/googleplay.svg" width="18" height="18" /> Google Play](https://play.google.com/store/apps/details?id=cc.blynk) | 
[<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/apple.svg" width="18" height="18" /> App Store](https://itunes.apple.com/us/app/blynk-control-arduino-raspberry/id808760481?ls=1&mt=8)**

**Blynk [Server](https://github.com/blynkkk/blynk-server)**

## Documentation
Social: [Webpage](http://www.blynk.cc) / [Facebook](http://www.fb.com/blynkapp) / [Twitter](http://twitter.com/blynk_app) / [Kickstarter](https://www.kickstarter.com/projects/167134865/blynk-build-an-app-for-your-arduino-project-in-5-m/description)  
Help Center: http://help.blynk.cc  
Documentation: http://docs.blynk.cc/#blynk-firmware  
Community Forum: http://community.blynk.cc  
Examples Browser: http://examples.blynk.cc  
Blynk for Business: http://www.blynk.io

## Getting Started tutorials

* [Blynk + JavaScript in 20 minutes (Raspberry Pi, Edison, Espruino...)](http://www.instructables.com/id/Blynk-JavaScript-in-20-minutes-Raspberry-Pi-Edison/)
* [Raspberry Pi + DHT11/DHT22/AM2302](http://www.instructables.com/id/Raspberry-Pi-Nodejs-Blynk-App-DHT11DHT22AM2302/)

## Usage example
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

__________

### Implementations for other platforms
* [Arduino](https://github.com/blynkkk/blynk-library)
* [Particle](https://github.com/vshymanskyy/blynk-library-spark)
* [Lua, OpenWrt, NodeMCU](https://github.com/vshymanskyy/blynk-library-lua)
* [Python, MicroPython](https://github.com/vshymanskyy/blynk-library-python)
* [OpenWrt packages](https://github.com/vshymanskyy/blynk-library-openwrt)
* [MBED](https://developer.mbed.org/users/vshymanskyy/code/Blynk/)
* [Node-RED](https://www.npmjs.com/package/node-red-contrib-blynk-ws)
* [LabVIEW](https://github.com/juncaofish/NI-LabVIEWInterfaceforBlynk)
* [C#](https://github.com/sverrefroy/BlynkLibrary)

### License
This project is released under The MIT License (MIT)
