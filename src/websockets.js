// Start contact.js Websocket Server
var websockets_port = 8081;

var WebSocketServer = require('ws').Server;
var pings = {}; // TODO remove

var TouchPadSession = require('./touchpad');
var Session = require('./session');

var sessions = new Set();
var wss = new WebSocketServer({ port: websockets_port });

function displayClients() {
	console.log('Active Sessions', sessions.size);
}


wss.on('connection', onConnection);

function onConnection(ws, req) {
	var info = ws.upgradeReq;
	if (req) info  = req;
	console.log('Received websocket connection to', info.url);
	// console.log(req);

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
		if (session.handleMessage) {
			try {
				session.handleMessage(d);
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log('session.handleMessage() not implemented');
		}
	});

	ws.on('close', function(e) {
		console.log('socket closed');
		sessions.delete(session);
		if (session.onClose) session.onClose(e);
		displayClients();
	});

	sessions.add(session);
	displayClients();

	// ws.send('rr\n[]');

}

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

