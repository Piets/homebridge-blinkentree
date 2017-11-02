var colorsys = require('colorsys'),
	request = require('request');

var Service, Characteristic;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-blinkentree", "blinkentree", blinkentree);
};

function blinkentree(log, config) {
    this.log = log;
    
    this.name = config.name;
    this.baseURL = config.baseURL;
    this.serial = config.serial;
    this.rainbowSuffix = config.rainbow;

    this.power = 0;
    this.brightness = 100;
    this.saturation = 0;
    this.hue = 0;
    this.rainbow = 0;

	this.updateRemoteState(this, true);
}

blinkentree.prototype = {
    getServices: function () {
        let informationService = new Service.AccessoryInformation();
        informationService
        .setCharacteristic(Characteristic.Manufacturer, "MacPiets")
        .setCharacteristic(Characteristic.Model, "Blinkentree")
        .setCharacteristic(Characteristic.SerialNumber, "333-333-"+this.serial);

        let lightbulbService = new Service.Lightbulb(this.name);
        var bulb = this;

        lightbulbService
        .getCharacteristic(Characteristic.On)
        .on('get', function(callback) {
           bulb.updateRemoteState(bulb, false);
        	callback(null, bulb.power);
        })
        .on('set', function(value, callback) {
            bulb.power = value;
            bulb.setColor(function() {
            	callback();
            });            
        });

        lightbulbService
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
           bulb.updateRemoteState(bulb, false);
        	callback(null, bulb.brightness);
        })
        .on('set', function(value, callback) {
            bulb.brightness = value;
            bulb.setColor(function() {
            	callback();
            });   
        });

        lightbulbService
        .addCharacteristic(Characteristic.Hue)
        .on('get', function(callback) {
           bulb.updateRemoteState(bulb, false);
        	callback(null, bulb.hue);
        })
        .on('set', function(value, callback) {
            bulb.hue = value;
            bulb.setColor(function() {
            	callback();
            });   
        });
    
        lightbulbService
        .addCharacteristic(Characteristic.Saturation)
        .on('get', function(callback) {
           bulb.updateRemoteState(bulb, false);
        	callback(null, bulb.saturation);
        })
        .on('set', function(value, callback) {
            bulb.saturation = value;
            bulb.setColor(function() {
            	callback();
            });   
        });

        var rainbowService = new Service.Switch(this.name + " " + this.rainbowSuffix);
        rainbowService
        .getCharacteristic(Characteristic.On)
        .on('get', function(callback) {
           bulb.updateRemoteState(bulb, false);
        	callback(null, bulb.rainbow);
        })
        .on('set', function(value, callback) {
            bulb.rainbow = value;
            bulb.setColor(function() {
            	callback();
            });   
        });

        this.informationService = informationService;
        this.lightbulbService = lightbulbService;
        this.rainbowService = rainbowService;
        return [informationService, lightbulbService, rainbowService];
    },

    setColor: function (callback) {
        var bulb = this;
        var color = colorsys.hsv_to_rgb({h: this.hue, s: this.saturation, v: this.brightness});

        if (!this.power) {
            color.r = 0;
            color.g = 0;
            color.b = 0;
        }

        var rainbowSend = 0;
        if (this.rainbow) {
        	rainbowSend = 1;
        }

        var body = "red=" + color.r + "&green=" + color.g + "&blue=" + color.b + "&intensity=255&rainbow=" + rainbowSend;
        var headers = {'Content-Length': body.length};

        request.post({url: this.baseURL+'/setColors', body: body, headers: headers}, function(error, response, body) {
        	callback();
		});
    },

    updateRemoteState: function (bulb, repeat) {
    	request(bulb.baseURL+'/getColors', function (error, response, body) {
    		if (error) {
        		bulb.log("Error while updating current state: " + error);
        	}

			if (!error && response && response.statusCode == 200) {
				var state = JSON.parse(body);

				var color = colorsys.rgb_to_hsv({r: state.red, g: state.green, b: state.blue});
				if (bulb.hue != color.h || bulb.saturation != color.s || bulb.brightness != color.v) {
					bulb.hue = color.h;
					bulb.saturation = color.s;
					bulb.brightness = color.v;
					
					bulb.lightbulbService
					.updateCharacteristic(Characteristic.Hue, bulb.hue)
					.updateCharacteristic(Characteristic.Saturation, bulb.saturation)
					.updateCharacteristic(Characteristic.Brightness, bulb.brightness);
				}

				var power = (bulb.brightness > 0);
				if (bulb.power != power) {
					bulb.power = power;
					
					bulb.lightbulbService.updateCharacteristic(Characteristic.On, bulb.power);
				}

				if (bulb.rainbow != state.rainbow) {
					bulb.rainbow = state.rainbow;

					bulb.rainbowService.updateCharacteristic(Characteristic.On, bulb.rainbow);
				}
			}

           if (repeat) {
			    // Update State again in a few seconds
			    setTimeout(bulb.updateRemoteState, 30000, bulb, repeat);
           }
		});
    }  
}
