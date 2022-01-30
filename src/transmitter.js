"use strict";

var remoteMouseX, remoteMouseY;

var width, height, remoteWidth, remoteHeight;	

var handler = {
	onOpen: function(e) {
		sendDimension();
	},

	onError: function (e) {
		console.log('error', e)
	},

	onClose: function(e) {
		console.log('close', e)
	},

	onMessage: function(cmd, params) {
		switch (cmd) {
			case 'p':
				sendPack('pp', params);
				break;
			// case 'r':
			// 	remoteWidth = params[0];
			// 	remoteHeight = params[1];

			// 	var remoteRatio = remoteWidth / remoteHeight;
			// 	var currentRatio = width / height;

			// 	// if (remoteRatio > currentRatio) {
			// 	// 	// remote width is wider. // currentHeight should be restricted
			// 	// } else {
			// 	// 	//
			// 	// }
			// 	// send('ratio: ' + remoteRatio + ' vs ' + currentRatio);
			// 	break;
			case 'mc':
				remoteMouseX = params[0];
				remoteMouseY = params[1];
				break;

		}
	},


	handleRaw: function handleRaw(cmd, dv, buffer) {
		if (cmd === 'si') {
			var ts = dv.getFloat64(8, true);
			var screenView = new Uint16Array(buffer, 16, 2);
			var imgBytes = screenView[0] * screenView[1] * 4;
			var imgView = new Uint8ClampedArray(buffer, 20, imgBytes);

			console.log('image!', Date.now() - ts);
			console.log('size', screenView);

			if (!window.ssctx) {
				var canvas = document.createElement('canvas');
				canvas.width = screenView[0];
				canvas.height = screenView[1];
				canvas.style.cssText = 'display: none; position: absolute; top: 0; left: 0; z-index: 10;';
				document.body.appendChild(canvas);
				var ctx = canvas.getContext('2d');
				window.ssctx = ctx;
				window.ss_canvas = canvas;
			}

			var imgData = new ImageData(imgView, screenView[0], screenView[1]);
			ssctx.putImageData(imgData, 0, 0);
			return true;
		}
	},

	onError: function(e) {
		console.log('error', e);
	}
};

function send(e) {
	connection.send(e);
}

function sendPack(cmd, array) {
	connection.sendPack(cmd, array);
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

	return a;
}

function sendDimension() {
	width = window.innerWidth;
	height = window.innerHeight;
	// send('r\n['+width+','+height+']');
	sendPack('r',  [width, height]);
}

window.onerror = function(message, file, line) {
	send([message, file, line].join('\t'));
}

var last = {};

function setLast(touches) {
	var touch = touches[0];
	if (touch && touches.length === 1) {
		var now = Date.now();

		if (last.time) {
			var dt = now - last.time;
			var dx = touch.pageX - last.pageX;
			var dy = touch.pageY - last.pageY;

			send('mm\n[' + dx + ',' + dy + ',' + dt + ']')
		}

		last.pageX = touch.pageX;
		last.pageY = touch.pageY;
		last.time = now;
	}
}

function activateTouch() {
	var target = window;

	target.addEventListener('touchend', function(event) {
		touches = event.touches;
		last.time = 0;
		sendPack('te', convert(touches));
	});

	target.addEventListener('touchmove', function(event) {
		// event.preventDefault();
		// if (event.scale !== 1) { event.preventDefault(); }
		touches = event.touches;
		setLast(touches);
		sendPack('tm', convert(touches));
	});


	target.addEventListener('touchforcechange', function(event) {
		// event.preventDefault();
		touches = event.touches;
		var forces = [];

		for (let i = 0; i < touches.length; i++) {
			forces.push(touches[i].force);
		}

		sendPack('tf', forces);
	});

	target.addEventListener('touchstart', function(event) {
		touches = event.touches;
		setLast(touches);
		sendPack('ts', convert(touches));
	});

	target.addEventListener('touchcancel', function(event) {
		touches = event.touches;
		sendPack('tc', convert(touches));
	});

	target.addEventListener('resize', sendDimension);
}

// hello in 50 languages.
// css3d mobile deviceorientation threejs

// TODO
// Joystick controller?

// Other possible sensors?
// 1. touch screen + force
// 2. video + audio
// 3. orientation
// 4. gps - location
// not available
// - battery, vibration, ambient light

function activateDeviceOrientation() {
	window.addEventListener('deviceorientation', function(event) {
		// if (Math.random() < 0.01) send('Absolute:' + event.absolute);

		sendPack('do', [
			event.alpha, event.beta, event.gamma,
			event.webkitCompassHeading || 0,
			window.orientation || 0
		]);
	});


	window.addEventListener('orientationchange', function(e) {
		// send('screen.orientation.angle' + window.orientation);
		sendPack('so', [
			window.orientation
		]);
	});

	// window.addEventListener( 'compassneedscalibration', );
}

function activateDeviceMotion() {
	var avg_ax = 0, avg_ay = 0, avg_az = 0;
	var dv_count = 0;
	var t = 0.5;
	var u = 0.5;
	var THRES = 5;
	var max_amp = 0;

	function sign(x) {
		if (x > 0) return 1;
		if (x < 0) return -1;
		return 0;
	}

	// estimated 60fps
	window.addEventListener('devicemotion', function (event) {
		var acc = event.acceleration;
		// acc = event.accelerationIncludingGravity;

		var alpha = event.rotationRate.alpha;
		var beta = event.rotationRate.beta;
		var gamma = event.rotationRate.gamma;
		var timeInterval = event.interval;

		// send('alpha' + alpha + ' ' + beta + ' ' + gamma + ',' + timeInterval);

		avg_ax = avg_ax * t + acc.x * u;
		avg_ay = avg_ay * t + acc.y * u;
		avg_az = avg_az * t + acc.z * u;
		dv_count++;

		var s = '';
		if (Math.abs(avg_ax) > THRES) s += ' x:' + sign(avg_ax);
		if (Math.abs(avg_ay) > THRES) s += ' y:' + sign(avg_ay);
		if (Math.abs(avg_az) > THRES) s += ' z:' + sign(avg_az);

		max_amp = Math.max(max_amp, Math.abs(avg_ax), Math.abs(avg_ay), Math.abs(avg_az));

		// if (s) send(s);
 
		sendPack('dm', [
			acc.x, acc.y, acc.z,
			alpha, beta, gamma,
			timeInterval
		]);
	});

	setInterval(function() {
		// send('dv_count' + dv_count);
		// send('max_amp' + max_amp);
		// send('acceleration' + JSON.stringify([ avg_ax, avg_ay, avg_az]));
		dv_count = 0;
	}, 100);
}

// function getScreen() {
// 	connection.sendPack('sc');
// }

// setInterval(getScreen, 5000);