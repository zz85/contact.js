var ws = new WebSocket("ws://" + location.hostname + ":8080/");

var ready = false;

ws.addEventListener('open', function(e) {
	ready = true;
});

ws.addEventListener('close', function(e) {
	ready = false;
	// perhaps reconnect?
});

ws.addEventListener('message', function(e) {
	var data = e.data;

	var d = data.split('\n');

	switch (d[0]) {
		case 'p':
			ws.send('pp\n'  + d[1]);
			break;
		case 'i':
			ws.send('ii\n'  + 't');
			break;
	}

	console.log('message', e);
});

ws.addEventListener('error', function(e) {
	console.log('error', e);
});

function send(e) {
	if (ready) ws.send(e);
}

function convert(touches) {
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

window.onerror = function(message, file, line) {
	ws.send([message, file, line].join('\t'));
}

window.addEventListener('touchend', function(event) {
	if (event.touches.length==0)
	touchStart = false;
	touches = event.touches;
	send('te\n' + convert(touches));
}, false);

window.addEventListener('touchmove', function(event) {
	event.preventDefault();
	touches = event.touches;
	send('tm\n' + convert(touches));
}, false);

window.addEventListener('touchstart', function(event) {
	touches = event.touches;
	touchStart = true;
	send('ts\n' + convert(touches));
}, false);
