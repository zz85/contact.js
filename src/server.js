var
	http_port = process.argv[2] ? process.argv[2] : 8001,
	http = require('http'),
	urlParser = require('url'),
	fs = require('fs'),
	path = require('path'),
	currentDir = process.cwd();

require('./websockets');

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
 	console.log('Running at contact.js websocket server on http://' + addr  + ((port === 80) ? '' : ':') + '8081/');
})

console.log('Simple nodejs server has started...');
console.log('Base directory at ' + currentDir);

var bonjour = require('bonjour')()
// advertise an HTTP server on port
bonjour.publish({ name: 'Contact Server', type: 'http', port: http_port })