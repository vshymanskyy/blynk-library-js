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
var Blynk = require('blynk');

var blynk = new Blynk.Blynk('7736215262c242c1989a1e262fbbcb19');
var v1 = new blynk.VirtualPin(1);
var v9 = new blynk.VirtualPin(9);

v1.on('write', function(param) {
  console.log('V1:', param);
});

v9.on('read', function() {
  v9.write(new Date().getSeconds());
});
```

## Boards with supported direct pin IO:
* Espruino
* Intel Edison, Galileo using [mraa](https://www.npmjs.com/package/mraa) package
* Raspberry Pi, Beaglebone using [onoff](https://www.npmjs.com/package/onoff) package

Just install the required package and this module will do auto-detection.

## Tested on:
* Desktop (Windows, Linux): TCP, SSL
* Intel Edison
* Espruino Pico: USB/Serial

## Espruino
To test this with the Espruino, you can try this:
```js
var Blynk = require('http://tiny.cc/blynk-js')
```
It will automatically detect Espruino and try connecting to Blynk over default USB.

**Warning: it will move console to Serial1! Don't try this if you don't know how to switch it back!**
