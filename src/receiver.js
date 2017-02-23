"use strict";

var contact = window.contact || {}; // Namespace

var ws;

contact.Recevier = function(destination) {
	connect(destination);
}


window.addEventListener('load', function() {
	new contact.Recevier(location.hostname);
});

function connect(destination) {
	ws = new WebSocket("ws://" + destination + ":8081/receiver");

	ws.addEventListener('open', function(e) {
		console.log('Connected to ' + ws.url);
		sendDimension();
	});
	ws.addEventListener('close', function(e) {
		console.log('Disconnected from ' + ws.url + ' (' + e.reason + ')');
		ws = null;
	});

	ws.addEventListener('message', onMessage);

	ws.addEventListener('error', function(e) {
		console.log('error', e);
		ws = null;
	});
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
		target.target.dispatchEvent(touchEvent);

	} else {
		window.dispatchEvent(touchEvent);
	}

	// debug({touches:touches});

}


var scaleWidth, scaleHeight;
var width, height;

function onMessage(e) {
	var data = e.data;

	var d = data.split('\n');

	switch (d[0]) {
		case 'p':
			ws.send('pp\n'  + d[1]);
			break;
		case 't':
			console.log('transmitter is ready');
			break;
		case 'r':
			// sendDimension();
			break;
		case 'ts':
		case 'tm':
		case 'te':
		case 'tc':
			var a = JSON.parse(d[1]);
			createEvents(a, d[0]);
			break;
		case 'rr':
			var dimensions = JSON.parse(d[1]);
			scaleWidth = dimensions[0];
			scaleHeight = dimensions[1];
			break;
		case 'dm':
			var dms = JSON.parse(d[1]);
			if (window.onDm) window.onDm(
				dms[0], dms[1], dms[2],
				dms[3], dms[4], dms[5],
				dms[6]
				);
			break;
		case 'do':
			var dos = JSON.parse(d[1]);
			window.dos = dos;
			if (window.onDo) window.onDo(dos[0], dos[1], dos[2]);
			break;
		default:
			console.log(d);
	}
}

function send(e) {
	if (ws) ws.send(e);
}

function sendDimension() {
	width = window.innerWidth;
	height = window.innerHeight;
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