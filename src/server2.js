var http_port = 8001,
	websockets_port = 8081,
	http = require('http'),
	urlParser = require('url'),
	fs = require('fs'),
	path = require('path'),
	currentDir = process.cwd();

// Start contact.js Websocket Server

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: websockets_port});

var pings = {};
var connections = [];
var receiver, transmitter;

var TYPE_RECEIVER = 'receiver',
	TYPE_TRANSMITTER = 'transmitter';

var TouchPadSession = require('./touchpad');

var sessions = new Set();

function displayClients() {
	console.log('Active Sessions', sessions.size);
}

wss.on('connection', function(ws) {
	var info = ws.upgradeReq;
	console.log('Received websocket connection to ', info.url );

	var session;

	// TODO turn this to remote control
	if (info.url == '/transmitter') {
		transmitter = ws;
		ws.type = 'transmitter';
		console.log('Transmitter connected.');
		if (receiver) {
			receiver.send('t');
			receiver.wh && ws.send('rr\n' + receiver.wh);
		}

		session = new TouchPadSession(ws);
		sessions.add(session);
		displayClients();
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
		sessions.delete(session);
		displayClients();
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

var hostname = require('os').hostname();

require('dns').lookup(hostname, function (err, addr, fam) {
 	console.log('Running at http server on http://' + addr  + ((port === 80) ? '' : ':') + port + '/');
	console.log('Running at http server on http://' + hostname  + ((port === 80) ? '' : ':') + port + '/');
 	console.log('Running at contact.js websocket server on http://' + addr  + ((port === 80) ? '' : ':') + websockets_port + '/');
})

console.log('Simple nodejs server has started...');
console.log('Base directory at ' + currentDir);

var bonjour = require('bonjour')()
// advertise an HTTP server on port
bonjour.publish({ name: 'Contact Server', type: 'http', port: http_port })