[![NPM](https://nodei.co/npm/blynk-library.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/blynk-library/)

Implementations for other platforms:
* [Arduino](https://github.com/blynkkk/blynk-library)
* [Particle Core](https://github.com/vshymanskyy/blynk-library-spark)

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

## Usage example:
```js
var Blynk = require('blynk-library');

var blynk = new Blynk.Blynk('715f8caae9bf4a91bae319d0376caa8d', options = {
  certs_path : '../certs/'
});
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
