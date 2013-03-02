var tmaps = {
	'ts': 'touchstart',
	'te': 'touchend',
	'tm': 'touchmove',
};

function createEvents(a, b) {

	var x, y, i, j, len, target;
	var touches = [];
	var targets = [];
	var uniqueTargets = [];

	for (i=0, len = a.length / 2;i<len;i++) {
		x = a[i * 2];
		y = a[i * 2 + 1];

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
		touchEvent.targetTouches = target.touches;
		touchEvent.currentTarget = target.target;
		target.target.dispatchEvent(touchEvent);

	} else {
		window.dispatchEvent(touchEvent);
	}

}

var ws = new WebSocket("ws://" + location.hostname + ":8080/");

ws.addEventListener('open', function(e) {
	ready = true;
	console.log('Connected to ' + ws.URL);
	sendDimension()
});
ws.addEventListener('close', function(e) {
	console.log('Disconnected from ' + ws.URL + ' (' + e.reason + ')');
});

ws.addEventListener('message', function(e) {
	var data = e.data;

	var d = data.split('\n');

	switch (d[0]) {
		case 'p':
			ws.send('pp\n'  + d[1]);
			break;
		case 'i':
			ws.send('ii\n'  + 'r');
			break;
		case 't':
			console.log('transmitter is ready');
			break;
		case 'ts':
		case 'tm':
		case 'te':
			var a = JSON.parse(d[1]);
			createEvents(a, d[0]);
			break;
	}

	// console.log('message', e);
});

ws.addEventListener('error', function(e) {
	console.log('error', e);
});

function send(e) {
	if (ready) ws.send(e);
}

function convert() {
	var i, len, px, py, touch;
	var o = {};
	var a = [];
	for (i=0, len = touches.length; i<len; i++) {
		touch = touches[i];
		px = touch.pageX;
		py = touch.pageY;
		o[i] = [px, py];
		a.push(px, py);
	}

	return JSON.stringify(a);
}

function sendDimension() {
	send('r\n'+window.innerHeight+','+window.innerWidth);
}

window.addEventListener('resize', sendDimension, false);

window.onerror = function(message, file, line) {
	send([message, file, line].join('\t'));
}