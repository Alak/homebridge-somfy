// homebridge-somfy/index.js
// (C) 2017, Kevin Cathaly
//
// Homebridge plug-in for Somfy.

"use strict";

// const request = require("request");
const inherits = require('util').inherits;
const SomfyApi = require("./lib/SomfyApi");

var Service, Characteristic;

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	
	homebridge.registerAccessory("homebridge-somfy", "SomfyAccessory", SomfyAccessory);
};

//
// Freemote Accessory
//

function SomfyAccessory(log, config) {
	this.log = log;
	this.config = config;
	this.name = config["name"];
    this.remote = config["remote"];
	this.gpio = config["gpio"];
    this.id = config["id"];
    this.command = 1;
	this.currentPosition = 100;
	this.targetPosition = 100;

	if (!this.remote) throw new Error("You must provide a config value for 'remote'.");
	if (!this.gpio) throw new Error("You must provide a config value for 'gpio'.");

	this.Api = new SomfyApi(this.log, this.gpio);

	this.service = new Service.WindowCovering(this.name);

    this.positionState = Characteristic.PositionState.STOPPED;
	this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
}

SomfyAccessory.prototype = {
	//Start
	identify: function(callback) {
		this.log("Identify requested!");
		callback(null);
	},
	// Required
	getCurrentPosition: function(callback) {
		this.log("getCurrentPosition:", this.currentPosition);
		var error = null;
		callback(error, this.currentPosition);
	},

	getName: function(callback) {
		this.log("getName :", this.name);
		var error = null;
		callback(error, this.name);
	},

	getTargetPosition: function (callback) {
		this.log("getTargetPosition :", this.targetPosition);
		var error = null;
		callback(error, this.targetPosition);
	},

	setTargetPosition: function (value, callback) {
		this.log("setTargetPosition from %s to %s", this.targetPosition, value);
		this.targetPosition = value;


		if(this.targetPosition > this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.INCREASING);
            this.command = 0;
            this.currentPosition = 100;
		} else if(this.targetPosition < this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.DECREASING);
            this.command = 2;
            this.currentPosition = 0;
		} else if(this.targetPosition = this.currentPosition) {
			this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
            this.command = 1;
            this.currentPosition = 50;
		}		

        this.Api.sendCommand(this.remote, this.command);
        this.log("Fake Success");
        this.service.setCharacteristic(Characteristic.CurrentPosition, this.currentPosition);
        this.log("currentPosition is now %s", this.currentPosition);
        this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
        callback(null);
	},

	getPositionState: function(callback) {
		this.log("getPositionState :", this.positionState);
		var error = null;
		callback(error, this.positionState);
	},

    // setPositionState: function (value, callback) {
    //     this.log("setPositionState from %s to %s", this.positionState, value);
    //     this.service.setCharacteristic(Characteristic.PositionState, value);
    //     this.positionState = value;

    //     if (this.positionState == Characteristic.PositionState.INCREASING) {
    //         this.command = 0;
    //     } else if (this.positionState == Characteristic.PositionState.STOPPED) {
    //         this.command = 1;
    //         this.Api.sendCommand(this.log, this.remote)
    //     } else if (this.positionState == Characteristic.PositionState.DECREASING) {
    //         this.command = 2;
    //     }

    //     this.Api.sendCommand(this.remote, this.command);

	// 	var error = null;
	// 	callback(error);
	// },

	getServices: function() {
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "Somfy")
			.setCharacteristic(Characteristic.Model, "Smoove Origin")
			.setCharacteristic(Characteristic.SerialNumber, "x007");

		this.service
			.getCharacteristic(Characteristic.Name)
			.on('get', this.getName.bind(this));

		// Required Characteristics
		this.service
			.getCharacteristic(Characteristic.CurrentPosition)
			.on('get', this.getCurrentPosition.bind(this));

 		this.service
			.getCharacteristic(Characteristic.TargetPosition)
			.on('get', this.getTargetPosition.bind(this))
			.on('set', this.setTargetPosition.bind(this));

		this.service
			.getCharacteristic(Characteristic.PositionState)
			.on('get', this.getPositionState.bind(this));
            // .on('set', this.setPositionState.bind(this));
	
		return [informationService, this.service];
	}
};