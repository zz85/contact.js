"use strict";

var remoteMouseX, remoteMouseY;

var width, height, remoteWidth, remoteHeight;

var handler = {
	onOpen: function(e) {
		sendDimension();
		// send('devicemotion' + typeof(window.DeviceMotionEvent));
	},

	onError: function (e) {
		console.log('error', e)
	},

	onClose: function(e) {
		console.log('close', e)
	},

	onMessage: function(e) {
		var data = e.data;

		var d = data.split('\n');

		switch (d[0]) {
			case 'p':
				ws.send('pp\n'  + d[1]);
				break;
			case 'r':
				// sendDimension();
				break;
			case 'rr':
				var dimensions = JSON.parse(d[1]);
				remoteWidth = dimensions[0];
				remoteHeight = dimensions[1];

				var remoteRatio = remoteWidth / remoteHeight;
				var currentRatio = width / height;

				// if (remoteRatio > currentRatio) {
				// 	// remote width is wider. // currentHeight should be restricted
				// } else {
				// 	//
				// }
				send('ratio: ' + remoteRatio + ' vs ' + currentRatio);
				break;
			case 'mc':
				var dimensions = JSON.parse(d[1]);
				remoteMouseX = dimensions[0];
				remoteMouseY = dimensions[1];
				break;

		}
	},
	onError: function(e) {
		console.log('error', e);
	}
};

function send(e) {
	connection.send(e);
}

function convert(touches) {
	var i, len, px, py, touch;
	var a = [];
	for (i=0, len = touches.length; i<len; i++) {
		touch = touches[i];
		px = touch.pageX;
		py = touch.pageY;
		a.push(px, py);
	}

	return JSON.stringify(a);
}

function sendDimension() {
	width = window.innerWidth;
	height = window.innerHeight;
	send('r\n['+width+','+height+']');
}

window.onerror = function(message, file, line) {
	send([message, file, line].join('\t'));
}

var last = {};

function setLast(touches) {
	var touch = touches[0];
	if (touch) {
		var now = Date.now();

		if (last.time) {
			var dt = now - last.time;
			var dx = touch.pageX - last.pageX;
			var dy = touch.pageY - last.pageY;

			send('mm\n[' + dx + ',' + dy + ',' + dt + ']')
			// send('force' +  touch.force);
		}

		last.pageX = touch.pageX;
		last.pageY = touch.pageY;
		last.time = now;
	}
}

window.addEventListener('touchend', function(event) {
	touches = event.touches;
	last.time = 0;
	send('te\n' + convert(touches));
});

window.addEventListener('touchmove', function(event) {
	event.preventDefault();
	touches = event.touches;
	setLast(touches);
	send('tm\n' + convert(touches));
});

window.addEventListener('touchstart', function(event) {
	touches = event.touches;
	setLast(touches);
	send('ts\n' + convert(touches));
});

window.addEventListener('touchcancel', function(event) {
	touches = event.touches;
	send('tc\n' + convert(touches));
});

window.addEventListener('resize', sendDimension);


function tilt(a, b) {
	send('tilt [' + a + ', ' + b + ']');
}


// hello in 50 languages.
// css3d mobile deviceorientation threejs

// TODO 
// Joystick controller?

function activateDeviceOrientation() {
	var orientAlpha = 0, orientBeta = 0, orientGamma = 0;

	window.addEventListener('deviceorientation', function(event) {
		orientAlpha = event.alpha;
		orientBeta = event.beta;
		orientGamma = event.gamma;
		// alpha = compass (0, 360)
		// beta = forward roll (-90, 90) (-180, 180 ff)
		// gamma = -90, 270. (-90, 90 ff)

		send('do\n[' + event.alpha + ',' + event.beta + ',' + event.gamma + ']')
	});
}

function activateDeviceMotion() {
	var avg_ax = 0, avg_ay = 0, avg_az = 0;
	var dv_count = 0;
	var t = 0.5;
	var u = 0.5;
	var THRES = 5;

	function sign(x) {
		if (x > 0) return 1;
		if (x < 0) return -1;
		return 0;
	}

	// TODO the best way to understand this data is to graph it!
	// estimated 60fps
	window.addEventListener('devicemotion', function (event) {
		var acc = event.acceleration;
		avg_ax = avg_ax * t + acc.x * u;
		avg_ay = avg_ay * t + acc.y * u;
		avg_az = avg_az * t + acc.z * u;
		dv_count++;

		var s = '';
		if (Math.abs(avg_ax) > THRES) s += ' x:' + sign(avg_ax);
		if (Math.abs(avg_ay) > THRES) s += ' y:' + sign(avg_ay);
		if (Math.abs(avg_az) > THRES) s += ' z:' + sign(avg_az);

		// if (s) send(s);
		send('dm\n[' + acc.x + ',' + acc.y + ',' + acc.z + ']');
	});

	setInterval(function() {
		// send('dv_count' + dv_count);
		// send('acceleration' + JSON.stringify([ avg_ax, avg_ay, avg_az]));
		dv_count = 0;
	}, 100);
}


activateDeviceMotion();

var target = 'ws://' + location.hostname + ':8081/touchpad';
var connection = new Connection(target, handler);
connection.open();