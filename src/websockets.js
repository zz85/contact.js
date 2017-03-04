// Start contact.js Websocket Server
var websockets_port = 8081;

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: websockets_port});

var pings = {};
var connections = [];
var receiver, transmitter;

var TYPE_RECEIVER = 'receiver',
	TYPE_TRANSMITTER = 'transmitter';

var TouchPadSession = require('./touchpad');
var Session = require('./session');

var sessions = new Set();

function displayClients() {
	console.log('Active Sessions', sessions.size);
}

wss.on('connection', function(ws) {
	var info = ws.upgradeReq;
	console.log('Received websocket connection to ', info.url );

	var session;

	// TODO turn this to remote control
	if (info.url === '/touchpad') {
		session = new TouchPadSession(ws, sessions);
	} else if (info.url == '/transmitter') {
		session = new Session(ws, sessions, 'transmitter');

		transmitter = ws;
		ws.type = 'transmitter';
		console.log('Transmitter connected.');
		
		// transmitter is ready signal
		session.sendToRole('t', 'receiver');

		// TODO do we know receiver's dimensions?
		// send to transmitter.
		if (receiver) {
			receiver.send('t');
			receiver.wh && ws.send('rr\n' + receiver.wh);
		}
		ws.on('message', processMessage);
	} else if (info.url == '/receiver') {
		// receiver
		session = new Session(ws, sessions, 'receiver');
		
		receiver = ws;
		ws.type = TYPE_RECEIVER;
		console.log('Receiver connected.');
		// if (transmitter) {
		// 	// NO IDEAs.
		// 	transmitter.send('t');
		// 	// send transmitter sizing
		// 	transmitter.wh && ws.send('rr\n' + transmitter.wh);
		// }
		ws.on('message', processMessage);
	}

	sessions.add(session);
	displayClients();

	ws.send('r\n[]');

	ws.on('close', function(e) {
		console.log('socket closed');
		if (ws.type==TYPE_TRANSMITTER) transmitter = null;
		else if (ws.type==TYPE_RECEIVER) receiver = null;
		sessions.delete(session);
		displayClients();
	});

	function processMessage(data) {
		// console.log('data', data);
		// TODO - unify binary protocol for all clients
		// TODO - unify clients and use traits / ECS.
		var d = data.split('\n');
		switch (d[0]) {
			case 'ts': // receives touch data
			case 'tm':
			case 'te':
			case 'tc':
				if (receiver) receiver.send(data);
				break;
			case 'p': // receives ping
				ws.send('pp\n'  + d[1]);
				break;
			case 'pp': // ping reply
				var reply = d[1];
				console.log(ws.type + ': RTT', Date.now() - pings[reply]);
				delete pings[reply];
				break;
			case 'r': // handle receiver resizing
				var dimensions = JSON.parse(d[1]);
				ws.w = dimensions[0];
				ws.h = dimensions[1];
				ws.wh = d[1];
				if (ws.type==TYPE_RECEIVER) transmitter && transmitter.send('rr\n' + receiver.wh);
				if (ws.type==TYPE_TRANSMITTER) receiver && receiver.send('rr\n' + transmitter.wh);
				break;
			default:
				// We just dump stuff for logging
				console.log(data);
				break;
		}

	}

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