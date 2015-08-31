var noble = require('noble');

noble.on('discover', function(peripheral) {
  console.log('found peripheral: ', peripheral.address, peripheral.rssi);
  (function do_connect() {
    peripheral.connect(function(error) {
      console.log('connected.');
      peripheral.discoverServices(null, function(error, services) {
        console.log('services:');
        for (var i in services) {
          console.log('  ' + i + ' uuid: ' + services[i].uuid);
          services[i].discoverCharacteristics(null, function(error, char) {
            console.log('char:');
            for (var i in char) {
              console.log('    ' + i + ' uuid: ' + char[i].uuid);
            }
          });
        }
      });
    });
    setTimeout(function() {
      peripheral.disconnect(function(error) {
        console.log('disconnected.');
      });
    }, 5000);
    setTimeout(do_connect, 10000);
  })();
});

noble.on('stateChange', function(state) {
  console.log('state: ' + state);
  if (state === 'poweredOn') {
    //noble.startScanning([], true);
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});
