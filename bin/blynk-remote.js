#!/usr/bin/env node

var Blynk = require('blynk-library');
var robot = require("robotjs");

if (!process.argv[2]) {
  var open = require('open');
  open(__dirname + '/../docs/blynk-remote.html');

  console.log("Please specify auth token.");
  process.exit(1);
}

var blynk = new Blynk.Blynk(process.argv[2]);

// Mouse control
var delta_x = 0,
    delta_y = 0;
var cur_x = 0,
    cur_y = 0;
var tmr = 0;

robot.setMouseDelay(2);

function deadZone(d) {
  var sign = d?d<0?-1:1:0;
  return (Math.abs(d) < 50) ? 0 : (d - 50*sign)/10;
}

var v1 = new blynk.VirtualPin(1);
v1.on('write', function(param) {
  delta_x = deadZone(parseInt(param[0]));
  delta_y = deadZone(-parseInt(param[1]));
  if ((delta_x != 0 || delta_y != 0) && tmr == 0) {
    var mousePos = robot.getMousePos();
    cur_x = mousePos.x;
    cur_y = mousePos.y;
    tmr = setInterval(function() {
      robot.moveMouse(cur_x += delta_x, cur_y += delta_y);
    }, 30);
  } else if (delta_x == 0 && delta_y == 0 && tmr != 0) {
    clearInterval(tmr);
    tmr = 0;
  }
});

// Mouse left button
var v2 = new blynk.VirtualPin(2);
v2.on('write', function(param) {
  if (param[0]==1) {
    robot.mouseToggle("down", "left");
  } else {
    robot.mouseToggle("up", "left");
  }
});

// Mouse right button
var v3 = new blynk.VirtualPin(3);
v3.on('write', function(param) {
  if (param[0]==1) {
    robot.mouseToggle("down", "right");
  } else {
    robot.mouseToggle("up", "right");
  }
});

// Keyboard

var key_mapping = {
  "pageup"         : 5,
  "pagedown"       : 6,
  
  "audio_vol_up"    : 7,
  "audio_vol_down"  : 8,
  
  "audio_play"      : 9,
  "audio_next"      : 10,
};

// Generate virtual pins to control different keys
Object.keys(key_mapping).forEach(function(key_name) {
  var vpin_num = key_mapping[key_name];
  var vpin = new blynk.VirtualPin(vpin_num);
  vpin.on('write', function(param) {
    if (param[0] == 1) {
      robot.keyToggle(key_name, "down");
    } else {
      robot.keyToggle(key_name, "up");
    }
  });
});
