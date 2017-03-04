"use strict";

var contact = window.contact || {}; // Namespace

var ws;

contact.Receiver = function(destination) {
	connect(destination);
}


window.addEventListener('load', function() {
	new contact.Receiver(location.hostname);
});

function connect(destination) {
	var target = 'ws://' + destination + ':8081/receiver';
	
	var handler = {
		onOpen: function(e) {
			console.log('Connected to ' + target);
			sendDimension();
		},

		onClose: function(e) {
			console.log('Disconnected from ' + target + ' (' + e.reason + ')');
			ws = null;
		},

		onMessage: onMessage,

		onError: function(e) {
			console.log('error', e);
			ws = null;
		}

	};

	window.connection = new Connection(target, handler);
	connection.open();
}

window.addEventListener('resize', sendDimension, false);

window.onerror = function(message, file, line) {
	send([message, file, line].join('\t'));
}

var tmaps = {
	'ts': 'touchstart',
	'te': 'touchend',
	'tm': 'touchmove',
	'tc': 'touchcancel',
};

function createEvents(a, b) {
	var x, y, i, j, len, target;
	var touches = [];
	var targets = [];
	var uniqueTargets = [];

	for (i=0, len = a.length / 2;i<len;i++) {
		x = a[i * 2];
		y = a[i * 2 + 1];

		x = x / scaleWidth * width;
		y = y / scaleHeight * height;

		touches.push({
			pageX: x,
			pageY: y
		});

		target = document.elementFromPoint(x, y);
		targets.push(target);
	}

	for (i=0;i<len;i++) {
		var target = targets[i];
		var count = 0;
		var duplicated = false;
		var currentTouches = [];

		for (j=0;j<len;j++) {
			if (targets[j] == target) {
				if (j<i) duplicated = true;
				count++;
				currentTouches.push(touches[j]);
			}
		}

		if (!duplicated) {
			uniqueTargets.push({
				target: target,
				count: count,
				touches: currentTouches
			})
		}
	}

	var touchEvent = new CustomEvent(tmaps[b], {
		bubbles: true,
		cancelable: true
	}); // DOM level 4

	touchEvent.touches = touches;

	var len=uniqueTargets.length;

	if (len) {
		// for (i=0; i<len; i++) {
		// 	uniqueTargets[i].target.dispatchEvent(touchEvent);
		// }

		// For simplicity now, fire off to the first target
		target = uniqueTargets[0];
		// touchEvent.targetTouches = target.touches;
		// touchEvent.currentTarget = target.target;
		if (target.target)
			target.target.dispatchEvent(touchEvent);

	} else {
		window.dispatchEvent(touchEvent);
	}

	// debug({touches:touches});

}


var scaleWidth = 1, scaleHeight = 1;
var width = window.innerWidth,
	height = window.innerHeight;

function onMessage(cmd, params) {
	// console.log('received', cmd, params);
	switch (cmd) {
		case 'p':
			connection.sendPack('pp', params);
			break;
		case 't':
			console.log('transmitter is ready');
			break;
		case 'r':
			var dimensions = params;
			scaleWidth = dimensions[0];
			scaleHeight = dimensions[1];
			break;
		case 'ts':
		case 'tm':
		case 'te':
		case 'tc':
			createEvents(params, cmd);
			break;
		case 'dm':
			var dms = params;
			if (window.onDm) window.onDm(
				dms[0], dms[1], dms[2],
				dms[3], dms[4], dms[5],
				dms[6]
				);
			break;
		case 'do':
			var dos = params;
			window.dos = dos;
			if (window.onDo) window.onDo(dos[0], dos[1], dos[2], dos[3], dos[4]);
			break;
		case 'so':
			if (window.onOrientation)
				window.onOrientation(params[0]);
			break;
		default:
			console.log(cmd, params);
	}
}

function send(e) {
	if (ws) ws.send(e);
}

function sendDimension() {
	send('r\n['+width+','+height+']');
}


// var particles = [];

// for (var i=0;i<10;i++) {
// 	particles.push(createParticle());
// }

// function createParticle() {
// 	var canvas = document.createElement('canvas');
// 	canvas.style.position = 'absolute';
// 	canvas.style.zIndex = 9999;

// 	canvas.width = 44;
// 	canvas.height = 44;
// 	var ctx = canvas.getContext('2d');
// 	ctx.beginPath();
// 	ctx.arc(22, 22, 20, 0, 2*Math.PI, true);

// 	ctx.fillStyle = "rgba(200, 0, 0, 0.2)";
// 	ctx.fill();

// 	ctx.lineWidth = 2;
// 	ctx.strokeStyle = "rgba(200, 0, 0, 0.8)";
// 	ctx.stroke();

// 	document.body.appendChild(canvas);

// 	return canvas;

// }

// function debug(event) {
// 	// console.log('moo');
// 	var t = event.touches;
// 	for (i=0;i<t.length;i++) {
// 		var x = t[i].pageX;
// 		var y = t[i].pageY;
// 		particles[i].style.left = (x-20) + 'px';
// 		particles[i].style.top = (y-20) + 'px';
// 	}
// }