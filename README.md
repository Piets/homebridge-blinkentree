# homebridge-blinkentree
Blinkentree plugin for homebridge to control blinking trees.

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install homebridge-udmx using: `npm install -g homebridge-blinkentree`
3. Update your configuration file.  See below for examples.


## Example Configuration


    {
		"accessory": "blinkentree",
		"name": "Baum",
		"baseURL": "http://192.168.1.3",
		"serial": "001",
		"rainbow" : "Regenbogen"
	}
