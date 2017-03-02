function Connection(target, handler) {
	var ws;
	var ready = false;
	var self = this;

	this.open = function() {
		ws = new WebSocket(target);
		window.ws = ws;
		ws.binaryType = 'arraybuffer';

		ws.addEventListener('open', function(e) {
			ready = true;
			if (handler.onOpen) handler.onOpen(e);
		});

		ws.addEventListener('error', function (e) {
			if (handler.onError) handler.onError(e);
		});

		ws.addEventListener('close', function(e) {
			ready = false;
			ws = null;
			setTimeout(self.open, 500);
			if (handler.onClose) handler.onClose(e);
		});

		function handleFloats(data) {
			var floats = new Float64Array(data);

			var cmdCode = floats[0];
			var cmd = CODES[cmdCode];

			if (cmd === undefined) {
				console.log('invalid cmd code', cmd);
			}

			var ts = floats[1];
			var coords = floats.subarray(2);
			
			if (handler.onMessage) handler.onMessage(cmd, coords);
		}

		ws.addEventListener('message', function(e) {
			// TODO handle binary streams
			var data = e.data;

			var b = Date.now();

			if (data instanceof Blob) {
				console.log('blob!');
				return;

				// console.log('do me', data);
				var reader = new FileReader();
				reader.addEventListener('loadend', function() {
					// reader.result contains the contents of blob as a typed array
					var floats = new Float64Array(reader.result);
					handleFloats(floats);
				});
				reader.readAsArrayBuffer(data);

				return;
			}
			else if (data instanceof ArrayBuffer) {
				handleFloats(new Float64Array(data));
				console.log(Date.now() - b);
				return;
			}
			else if (typeof data !== 'string') {
				console.log('Oops unknown data type', typeof data);
				return;
			}

			var d = data.split('\n');
			var cmd = d[0];
			var params;
			try {
				params = JSON.parse(d[1]);
			} catch (e) {
				this.send('Failed JSON: ' + d);
			}

			if (handler.onMessage) handler.onMessage(cmd, params);
		});
	};

	this.send = function send(e) {
		if (ws && ready) ws.send(e);
	}


	this.sendPack = function sendPack(cmd, array) {
		var cmdCode = WIRE[cmd];
		if (cmdCode === undefined) {
			console.log('Warning, unknown cmd', cmd);
		}

		var ts = Date.now();
		
		var floats = new Float64Array([cmdCode, ts].concat(array));
		this.send(floats);
	}
}
