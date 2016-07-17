var Barcli = require('barcli');
var five = require('johnny-five');
var pixel = require('node-pixel');
var raspi = require('raspi-io')

var l_servo, r_servo, line_array, ultrasonics, leds;

var LSTOP = 93;
var RSTOP = 94;

var l_speed = {
	f_slow: 0.1,
	f_med: 0.2,
	f_fast: 0.3,
	r_slow: 0.2,
	r_med: 0.3,
	r_fast: 0.35,
};
var r_speed = {
	f_slow: 0.1,
	f_med: 0.2,
	f_fast: 0.3,
	r_slow: 0.2,
	r_med: 0.3,
	r_fast: 0.35,
};

var calibrating = true;
var calibrate_time = 10000;

var gfront = new Barcli({ label: "front", range: [0, 350]});
var gback = new Barcli({ label: "back", range: [0, 350]});
var gleft = new Barcli({ label: "left", range: [0, 350]});
var gright = new Barcli({ label: "right", range: [0, 350]});
var gline = new Barcli({label: "line", range: [0, 5001]});


var boards = new five.Boards([
	{
		id: "i2c",
		io: new raspi(),
	},
	{
		id: "usb",
		port: process.argv[2],
	}
]);

boards.on("ready", function() {

/**	leds = new pixel.Strip({
        	color_order: pixel.COLOR_ORDER.GRB,
		address: 0x42,
        	board: this.byId("i2c"),
        	controller: "I2CBACKPACK",
        	strips: [150],
	});

	leds.on("ready", led_ops);

	ultrasonics = new five.Proximity.Collection({
		pins: [8, 9, 10, 11],
		controller: "HCSR04I2CBACKPACK",
		freq: 1000,
		address: 0x27,
	});
	ultrasonics.on("data", function() {
		
		gfront.update(this[0].cm);
		gback.update(this[1].cm);
		gleft.update(this[2].cm);
		gright.update(this[3].cm);
  	});
**/

	line_array = new five.IR.Reflect.Array({
		board: this.byId("usb"),
	  	emitter: 13,
	  	pins: ["A0", "A1", "A2", "A3", "A4", "A5"], // any number of pins
	  	freq: 150
	});

	servo_l = new five.Servo.Continuous({
		pin: 10,
		board: this.byId("usb"),
	});
	servo_r = new five.Servo.Continuous({
		pin: 11,
		board: this.byId("usb"),
	});
	servo_l.to(LSTOP);
	servo_r.to(RSTOP);

	console.info("Bot online. Calibrate sensors for 10 seconds");

	line_array.calibrateUntil(function() {
		return !calibrating;
	});

	setTimeout(function() {
		calibrating = false;
		console.log("Sensors calibrated, go for it");

		console.log("forward medium");
		servo_l.ccw(l_speed.f_fast);
		servo_r.ccw(r_speed.f_fast);
	}, calibrate_time);

	
    line_array.on('line', function() {
        if (!calibrating) {
            //console.log( "Line val: ", this.line);
		gline.update(this.line);

            /**if (this.line < 100) {
                servo_r.stop();
            } else if (this.line > 900) {
                servo_l.stop();
            } else {
                servo_l.ccw(0.1);
                servo_r.ccw(0.1);
            }**/
        }	
    });


});

boards.on("error", function(err) {
	if (err.code == "EIO") {
		console.log("Error on I2C");
		// don't exit
	} else {
		console.error("Error: ", err);
		process.exit(1);
	}
});

var led_ops =  function() {

        console.log("Strip ready, let's go");
	var fps = 80;
        var colors = ["red", "green", "blue", "yellow", "cyan", "magenta", "white"];
        var current_colors = [0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4];
        var current_pos = [0,1,2,3,4,30,31,32,33,34,60,61,62,63,64,90,91,92,93,94];
        var blinker = setInterval(function() {

		try {
            		leds.color("#000"); // blanks it out
		} catch (e) {
			if (e.code != "EIO") {
				throw (e);
			}
		}

            for (var i=0; i< current_pos.length; i++) {
                if (++current_pos[i] >= leds.stripLength()) {
                    current_pos[i] = 0;
                    if (++current_colors[i] >= colors.length) current_colors[i] = 0;
                }
		try {
                	leds.pixel(current_pos[i]).color(colors[current_colors[i]]);
		} catch (err) {
			// don't worry about dropped frames
			if (err.code != "EIO") {
				throw (err);
			}
			
		}
            }

            leds.show();
        }, 1000/fps);
};


process.on("beforeExit", function() {
	servo_l.to(LSTOP);
	servo_r.to(RSTOP);
});
	

