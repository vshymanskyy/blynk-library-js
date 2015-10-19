#!/usr/bin/env node

var Blynk = require('blynk-library');
var robot = require("robotjs");

if (!process.argv[2]) {
  console.log("Please specify auth token.");
  process.exit(1);
}

var blynk = new Blynk.Blynk(process.argv[2]);

// Mouse control
var dx = 0,
    dy = 0;
var tmr = 0;

robot.setMouseDelay(2);

function mouseMover() {
  var mousePos = robot.getMousePos();
  mousePos.x += dx;
  mousePos.y += dy;
  robot.moveMouse(mousePos.x, mousePos.y);
}

function deadZone(d) {
  var sign = d?d<0?-1:1:0;
  return (Math.abs(d) < 5) ? 0 : d - 5*sign;
}

var v1 = new blynk.VirtualPin(1);
v1.on('write', function(param) {
  dx = parseInt(param[0]);
  dy = -parseInt(param[1]);
  dx = deadZone(dx);
  dy = deadZone(dy);
  if ((dx != 0 || dy != 0) && tmr == 0) {
    tmr = setInterval(mouseMover, 50);
    mouseMover();
  } else if (dx == 0 && dy == 0 && tmr != 0) {
    clearInterval(tmr);
    tmr = 0;
  }
});

var v2 = new blynk.VirtualPin(2);
v2.on('write', function(param) {
  if (param[0]==1) {
    robot.mouseToggle("down", "left");
  } else {
    robot.mouseToggle("up", "left");
  }
});

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
  "page_up"         : 5,
  "page_down"       : 6,
  
  "audio_vol_up"    : 7,
  "audio_vol_down"  : 8,
  
  "audio_play"      : 9,
  "audio_next"      : 10,
};

// Generate virtual pins to control different keys
Object.keys(key_mapping).forEach(function(key) {
  var vpin_num = key_mapping[key];
  var vpin = new blynk.VirtualPin(vpin_num);
  vpin.on('write', function(param) {
    if (param[0] == 1) {
      robot.keyToggle(key, "down");
    } else {
      robot.keyToggle(key, "up");
    }
  });
});
