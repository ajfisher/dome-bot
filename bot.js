var five = require('johnny-five');
var pixel = require('node-pixel');

var l_servo, r_servo, line_array, ultrasonics, leds;

var calibrating = true;

var board = new five.Board({ port: process.argv[2] });

board.on("ready", function() {

	line_array = new five.IR.Reflect.Array({
	  emitter: 13,
	  pins: ["A0", "A1",], // "A2", "A3"], // any number of pins
	  freq: 150
	});

	servo_l = new five.Servo.Continuous(10);
	servo_r = new five.Servo.Continuous(11);

	leds = new pixel.Strip({
        	color_order: pixel.COLOR_ORDER.GRB,
        	board: this,
        	controller: "I2CBACKPACK",
        	strips: [17],
	});

	leds.on("ready", led_ops);

	console.info("Bot online. Calibrate sensors for 5 seconds");

	line_array.calibrateUntil(function() {
		return !calibrating;
	});

	setTimeout(function() {
		calibrating = false;
		console.log("Sensors calibrated, go for it");
	}, 5000);

	

    line_array.on('line', function() {
        if (!calibrating) {
            console.log( "Line val: ", this.line);

            if (this.line < 100) {
                servo_r.stop();
            } else if (this.line > 900) {
                servo_l.stop();
            } else {
                servo_l.ccw(0.15);
                servo_r.ccw(0.15);
            }
        }
    });


});

board.on("error", function(err) {
	console.error("Error: ", err);
	process.exit(1);
});

var led_ops =  function() {

        console.log("Strip ready, let's go");

        var colors = ["red", "green", "blue", "yellow", "cyan", "magenta", "white"];
        var current_color = 0;
        var blinker = setInterval(function() {

            if (++current_color >= colors.length) current_color = 0;
            leds.color(colors[current_color]);
            leds.show();
        }, 1000);
};

