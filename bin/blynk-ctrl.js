#!/usr/bin/env node
'use strict';

var argparse = require('argparse');
var util = require('util');

var parser = new argparse.ArgumentParser({
  addHelp: true,
  description: 'This script uses Bridge feature to control another device from the command line.'
});


function GetActionOp(op, expand, minargs) {
  minargs = minargs || 1;
  var ActionOp = function (options) {
    options = options || {};
    argparse.Action.call(this, options);
  };
  util.inherits(ActionOp, argparse.Action);

  ActionOp.prototype.call = function (parser, namespace, values) {
    if (values.length < minargs) {
      throw new Error('not enough parameters');
    }
    
    var items = [].concat(namespace['ops'] || [])
    if (expand) {
      var pin = values[0];
      for (var i=1; i<values.length; i++) {
        items.push([op].concat(pin, values[i]));
      }
    } else {
      items.push([op].concat(values));
    }
    namespace.set('ops', items);
  };
  return ActionOp;
};

parser.addArgument(['-t', '--token'],  { action:"store",      dest:'token', required:true,    help:'Auth token of the controller' });

parser.addArgument([ '-dw', '--digitalWrite' ], { action: GetActionOp('dw', true, 2), nargs:'*', metavar:['PIN', 'VAL'] });
parser.addArgument([ '-aw',  '--analogWrite' ], { action: GetActionOp('aw', true, 2), nargs:'*', metavar:['PIN', 'VAL'] });
parser.addArgument([ '-vw', '--virtualWrite' ], { action: GetActionOp('vw', false, 2), nargs:'*', metavar:['PIN', 'VAL'] });

parser.addArgument([ '-dr', '--digitalRead' ],  { action: GetActionOp('dr'), nargs:1, metavar:['PIN'] });
parser.addArgument([ '-ar',  '--analogRead' ],  { action: GetActionOp('ar'), nargs:1, metavar:['PIN'] });
parser.addArgument([ '-vr', '--virtualRead' ],  { action: GetActionOp('vr'), nargs:1, metavar:['PIN'] });

parser.addArgument(['--delay'],                 { action: GetActionOp('delay'), nargs:1, type:'float', metavar:'SECs' });

parser.addArgument(['--delayAll'],     { action:"store",      dest:'delayAll', type:'float', metavar:'SECs', help:'Delay between all operations' });

parser.addArgument(['-s', '--server'], { action:'store',      dest:'server',                  help:'Server address or domain name' });
parser.addArgument(['-p', '--port'],   { action:"store",      dest:'port',   type:'int',      help:'Server port' });
parser.addArgument(['--target'],       { action:"store",      dest:'target', metavar:"TOKEN", help:'Auth token of the target device' });
parser.addArgument(['--dump'],         { action:"storeTrue",  dest:'dump',                    help:'Dump communication' });


var args = parser.parseArgs();
//console.dir(args);

var Blynk = require("../");
var blynk = new Blynk.Blynk(args['token']);
var bridge = new blynk.WidgetBridge(64);

blynk.on('connect', function() {
  bridge.setAuthToken(args['token']);
  args.ops.forEach(function(op) {
    switch(op[0]) {
    case 'dw': bridge.digitalWrite(op[1], op[2]);  break;
    case 'aw': bridge.analogWrite (op[1], op[2]);  break;
    case 'vw': bridge.virtualWrite(op[1], op.slice(2));  break;
    case 'dr': blynk.syncDigital(op[1]);           break;
    case 'ar': blynk.syncAnalog (op[1]);           break;
    case 'vr': blynk.syncVirtual(op[1]);           break;
    }
  });
});
