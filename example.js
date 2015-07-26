var Blynk = require('./blynk');

var blynk = new Blynk.Blynk('7736215262c242c1989a1e262fbbcb19');

var v1 = new blynk.VirtualPin(1);

v1.on('write', function(param){
  console.log('V1:', param);
});

var v9 = new blynk.VirtualPin(9);
v9.on('read', function(param){
  v9.write(new Date().getSeconds());
});

/*
blynk.on('connected', function(){
  setInterval(function() {
    blynk.virtualWrite(9, ();
  }, 1000);
});
*/

blynk.on('disconnected', function(){
  console.log("DISCONNECT");
});
