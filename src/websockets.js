// Start contact.js Websocket Server
var websockets_port = 8081;

var WebSocketServer = require('uws').Server;
var pings = {}; // TODO remove

var TouchPadSession = require('./touchpad');
var Session = require('./session');
var wire = require('./wire');

var sessions = new Set();
var wss = new WebSocketServer({ port: websockets_port });

function displayClients() {
	console.log('Active Sessions', sessions.size);
}

function abToType(b, Type) {
	var ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
	return ab;
}

function fromArrayBuffer(ab, Type) {
	var array = new Type(ab);
	return array;
}

function handleMessage(data, session) {
	if (!session.processMessage) {
		console.log('session.processMessage() not implemented!');
	}

	if (data instanceof Buffer || data instanceof ArrayBuffer) {
		if (data instanceof Buffer) {
			var ab = abToType(data);
		} else {
			// uws buffer handling
			var ab = data;
		}

		var floats = fromArrayBuffer(ab, Float64Array);

		var cmdCode = floats[0];
		var cmd = wire.CODES[cmdCode];

		if (cmd === undefined) {
			console.log('invalid cmd code', cmd);
		}

		var ts = floats[1];
		var coords = floats.subarray(2);

		// console.log('meows', cmd, ts, coords);
		if (this._lag !== undefined) {
			if (this._lag % 10000 === 0) console.log('lag', Date.now() - ts);
			this._lag++;
		} else {
			this._lag = 0;
		}

		session.processMessage(cmd, coords, data);
		return;
	}
	else if (typeof data !== 'string') {
		console.log('Oops unknown data type', typeof data, data);
		return;
	}

	var msg = data.split('\n');
	var cmd = msg[0];

	try {
		var coords = msg[1] && JSON.parse(msg[1]);
	} catch (e) {
		console.log('Cannot parse string', data);
	}

	session.processMessage(cmd, coords, data);
}

wss.on('connection', function(ws) {
	var info = ws.upgradeReq;
	console.log('Received websocket connection to', info.url);

	var session;

	if (info.url === '/touchpad') {
		session = new TouchPadSession(ws, sessions);
	} else if (info.url == '/transmitter') {
		session = new Session(ws, sessions, ['transmitter']);
		console.log('Transmitter connected.');

		// transmitter is ready signal
		session.sendToRole('t\n[]', 'receiver');

		// // TODO do we know receiver's dimensions?
		// // send to transmitter.
		// if (receiver) {
		// 	receiver.send('t');
		// 	receiver.wh && ws.send('rr\n' + receiver.wh);
		// }
	} else if (info.url == '/receiver') {
		// receiver
		session = new Session(ws, sessions, ['receiver']);
		console.log('Receiver connected.');
		// if (transmitter) {
		// 	// NO IDEAs.
		// 	transmitter.send('t');
		// 	// send transmitter sizing
		// 	transmitter.wh && ws.send('rr\n' + transmitter.wh);
		// }
	}

	// Standard bindings?
	ws.on('message', d => {
		handleMessage(d, session);
	});

	sessions.add(session);
	displayClients();

	// ws.send('rr\n[]');

	ws.on('close', function(e) {
		console.log('socket closed');
		sessions.delete(session);
		if (session.onClose) session.onClose(e);
		displayClients();
	});
});

// End of contact.js Websocket Server

// // Test latency
// setInterval(function() {
// 	var uid = ~~(Math.random() * 100000);
// 	pings[uid] = Date.now();
// 	pings[uid+1] = pings[uid];
// 	if (receiver) receiver.send('p\n' + uid);
// 	if (transmitter) transmitter.send('p\n' + (uid + 1));

// 	var now = Date.now();
// 	// cleanup pings
// 	for (var p in pings) {
// 		if ((now - pings[p]) > 30000)
// 			delete pings[p];
// 	}
// }, 5000);

