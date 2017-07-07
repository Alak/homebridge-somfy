// homebridge-somfy/lib/SomfyApi.js
// (C) 2017, Kevin CATHALY
//

"use strict";

const Exec = require('child_process').exec;
const Commands = {"up": "0", "stop": "1", "down": "2", "prog": "3"};

module.exports = SomfyApi;

function SomfyApi(log, gpio) {
  this.log = log;
  this.gpio = gpio;
}

SomfyApi.prototype.sendCommand = function(remote, command) {
  this.log('sending command: ' + command + " to " + remote);
  Exec("python lib/pi-somfy.py " + remote + " " + Commands[command], this.log("result: " + puts));
}

function puts(error, stdout, stderr) { 
    return stdout + "\n" + stderr 
}