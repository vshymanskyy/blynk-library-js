
var WebSocket = require('ws');
var ws = new WebSocket('ws://localhost:8444');

ws.on('open', function open() {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  /*var array = new Float32Array(5);

  for (var i = 0; i < array.length; ++i) {
    array[i] = i / 2;
  }

  ws.send(array, { binary: true, mask: true });*/
  ws.send('something');
});
