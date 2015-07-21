var Blynk = require('./blynk');

var blynk = new Blynk.Blynk('7736215262c242c1989a1e262fbbcb19');

blynk.on('virtual', function(param){
  console.log('VIRTUAL:', param);
});

/*
blynk.on('connected', function(){
  setInterval(function() {
    blynk.virtualWrite(9, (new Date()).getSeconds());
  }, 1000);
});
*/

blynk.on('disconnected', function(){
  console.log("DISCONNECT");
});
