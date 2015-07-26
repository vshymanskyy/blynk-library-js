# blynk-library-js
Blynk library implementation for JavaScript (Node.js, Espruino)

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

## Tested on:
* Node.js (Windows, Linux)
 * TCP
 * SSL
* Espruino Pico
 * USB/Serial

## Boards with supported direct pin IO:
* Espruino
* Raspberry Pi/Beaglebone using [onoff](https://www.npmjs.com/package/onoff) package

## Espruino
To test this with the Espruino, you can try this:
```js
var Blynk = require('http://tiny.cc/blynk-js')
```
It will automatically detect Espruino and try connecting to Blynk over default USB.

**Warning: it will move console to Serial1! Don't try this if you don't know how to switch it back!**
