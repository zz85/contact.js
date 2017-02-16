var http_port = 8001,
	websockets_port = 8081,
	http = require('http'),
	urlParser = require('url'),
	fs = require('fs'),
	path = require('path'),
	currentDir = process.cwd();

var robot = require('robotjs');

// Start contact.js Websocket Server

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: websockets_port});

var pings = {};
var connections = [];
var receiver, transmitter;

var TYPE_RECEIVER = 'receiver',
	TYPE_TRANSMITTER = 'transmitter';

class TransmitterSession {
	constructor(ws) {
		this.ws = ws;
		this.speed = 1;
		
		ws.on('message', data => this.onMessage(data));
		ws.on('close', e => console.log('TransmitterSession closed', e));
	}

	updateMouse() {
		console.log('updateMouse');
		var mouse = robot.getMousePos();
		this.mouse = {
			x: mouse.x,
			y: mouse.y
		};
	}

	move(dx, dy, dt) {
		var mouse = this.mouse;
		var scale = 0.02;

		var dist = Math.sqrt(dx * dx + dy * dy);
		var currentSpeed = Math.max(dist / dt * 1000 * scale, 1);
		
		var speed = this.speed * 0.8 + currentSpeed * 0.2;
		
		var vx = dx * speed;
		var vy = dy * speed;
		var tx = mouse.x + vx;
		var ty = mouse.y + vy;

		this.speed = speed;
		this.mouse.x = Math.max(0, tx);
		this.mouse.y = Math.max(0, ty);

		// TODO add max bounds

		robot.moveMouse(this.mouse.x, this.mouse.y);
		console.log('currentSpeed', currentSpeed, '->', speed);;
		console.log('vx', vx, vy);
		console.log('move', tx, ty);
	}

	onMessage(msg) {
		var data = msg.split('\n');
		var cmd = data[0];
		var coords = data[1] && JSON.parse(data[1]);

		// data
		// console.log('msg', cmd, coords);

		// TODO support scrolling / pitch-zoom / double clicking / right click
		// TODO server mouse reporting
		// TODO force touch https://github.com/stuyam/pressure/tree/master/src/adapters
		// TODO MOUSE recording.

		switch (cmd) {
			case 'ts': // receives touch data
				this.clicked = false;
				this.moved = false;
				this.speed = 1;
				this.updateMouse();
				this.last = coords;
				this.down = Date.now();
				break;
			case 'tm':
				if (!this.moved && Date.now() - this.down > 250) {
					robot.mouseToggle('down');
				}
				this.moved = true;
				this.last = coords;
				break;
			case 'te':
				this.last = null;
				if (!this.moved) {
					robot.mouseToggle('down');
					robot.mouseToggle('up');
					this.clicked = true;
				}
				
				break;
			case 'dm':
				this.move(coords[0], coords[1], coords[2]);
				break;
			case 'tc':
				break;
			case 'p': // receives ping
				ws.send('pp\n'  + data[1]);
				break;
			case 'pp': // ping reply
				var reply = data[1];
				console.log(ws.type + ': RTT', Date.now() - pings[reply]);
				delete pings[reply];
				break;
			case 'r': // handle receiver resizing
				break;
			default:
				// We just dump stuff for logging
				console.log(data);
				break;
		}
	}
}

wss.on('connection', function(ws) {
	var info = ws.upgradeReq;
	console.log('Received websocket connection to ', info.url );

	var session;

	if (info.url == '/transmitter') {
		transmitter = ws;
		ws.type = 'transmitter';
		console.log('Transmitter connected.');
		if (receiver) {
			receiver.send('t');
			receiver.wh && ws.send('rr\n' + receiver.wh);
		}

		session = new TransmitterSession(ws);
	} else if (info.url == '/receiver') {
		// receiver
		receiver = ws;
		ws.type = TYPE_RECEIVER;
		console.log('Receiver connected.');
		if (transmitter) {
			transmitter.send('t');
			transmitter.wh && ws.send('rr\n' + transmitter.wh);
		}
	}

	ws.send('r');

	ws.on('message', processMessage);

	ws.on('close', function(e) {
		console.log('socket closed');
		if (ws.type==TYPE_TRANSMITTER) transmitter = null;
		else if (ws.type==TYPE_RECEIVER) receiver = null;
	});

	function processMessage(data) {
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

function debug(o) {
	// A Circular Reference Json Stringifier
	var cache = [];
	var j = JSON.stringify(o, function(key, value) {
		if (typeof value === 'object' && value !== null) {
			if (cache.indexOf(value) !== -1) {
				return;
			}
			cache.push(value);
		}
		return value;
	});
	cache = null; // Enable garbage collection
	return j;
}


// Embed http Server
/**
 * a barebones HTTP server in JS
 * to serve three.js easily
 *
 * @author zz85 https://github.com/zz85
 *
 * Usage: node simplehttpserver.js <port number>
 *
 */
port = process.argv[2] ? parseInt(process.argv[2], 0) : port;

function handleRequest(request, response) {

	var urlObject = urlParser.parse(request.url, true);
	var pathname = decodeURIComponent(urlObject.pathname);

	console.log('[' + (new Date()).toUTCString() + '] ' + '"' + request.method + ' ' + pathname + '"');

	var filePath = path.join(currentDir, pathname);

	fs.stat(filePath, function(err, stats) {

		if (err) {
			response.writeHead(404, {});
			response.end('File not found!');
			return;
		}

		if (stats.isFile()) {

			fs.readFile(filePath, function(err, data) {

				if (err) {
					response.writeHead(404, {});
					response.end('Opps. Resource not found');
					return;
				}

				response.writeHead(200, {});
				response.write(data);
				response.end();
			});

		} else if (stats.isDirectory()) {

			fs.readdir(filePath, function(error, files) {

				if (error) {
					response.writeHead(500, {});
					response.end();
					return;
				}

				var l = pathname.length;
				if (pathname.substring(l-1)!='/') pathname += '/';

				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write('<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>' + filePath + '</title></head><body>');
				response.write('<h1>' + filePath + '</h1>');
				response.write('<ul style="list-style:none;font-family:courier new;">');
				files.unshift('.', '..');
				files.forEach(function(item) {

					var urlpath = pathname + item,
						itemStats = fs.statSync(currentDir + urlpath);

					if (itemStats.isDirectory()) {
						urlpath += '/';
						item += '/';
					}

					response.write('<li><a href="'+ urlpath + '">' + item + '</a></li>');
				});

				response.end('</ul></body></html>');
			});
		}
	});
}

var port = http_port;
http.createServer(handleRequest).listen(port);

require('dns').lookup(require('os').hostname(), function (err, addr, fam) {
 	console.log('Running at http server on http://' + addr  + ((port === 80) ? '' : ':') + port + '/');
 	console.log('Running at contact.js websocket server on http://' + addr  + ((port === 80) ? '' : ':') + websockets_port + '/');
})

console.log('Simple nodejs server has started...');
console.log('Base directory at ' + currentDir);