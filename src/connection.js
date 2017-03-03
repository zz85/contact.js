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
			if (handler.onClose) handler.onClose(e);

			setTimeout(self.open, 500);
		});

		function handleFloats(buffer) {
			var dv = new DataView(buffer);
			var cmdCode = dv.getFloat64(0, true);

			var cmd = CODES[cmdCode];

			if (cmd === undefined) {
				console.log('invalid cmd code', cmd);
			}
			else if (cmd === 'si') {
				var ts = dv.getFloat64(8, true);
				var screenView = new Uint16Array(buffer, 16, 2);
				var imgBytes = screenView[0] * screenView[1] * 4;
				var imgView = new Uint8ClampedArray(buffer, 20, imgBytes);

				console.log('image!', Date.now() - ts);
				console.log('size', screenView);

				if (!window.ssctx) {
					var canvas = document.createElement('canvas');
					canvas.width = screenView[0];
					canvas.height = screenView[1];
					canvas.style.cssText = 'display: none; position: absolute; top: 0; left: 0; z-index: 10;';
					document.body.appendChild(canvas);
					var ctx = canvas.getContext('2d');
					window.ssctx = ctx;
					window.ss_canvas = canvas;
				}

				var imgData = new ImageData(imgView, screenView[0], screenView[1]);
				ssctx.putImageData(imgData, 0, 0);
				return;
			}

			var floats = new Float64Array(buffer);

			var ts = floats[1];
			var coords = floats.subarray(2);
			
			if (handler.onMessage) handler.onMessage(cmd, coords);
		}

		ws.addEventListener('message', function(e) {
			var data = e.data;

			if (data instanceof Blob) {
				// flushed to disk
				console.log('blob!');
				return;
				/*
				var reader = new FileReader();
				reader.addEventListener('loadend', function() {
					// reader.result contains the contents of blob as a typed array
					handleFloats(reader.result);
				});
				reader.readAsArrayBuffer(data);

				return;
				*/
			}
			else if (data instanceof ArrayBuffer) {
				// kept in memory
				handleFloats(data);
				return;
			}
			else if (typeof data !== 'string') {
				console.log('Oops unknown data type', typeof data);
				return;
			}

			// Handle as string
			// console.log('strs', data);

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
		
		var floats = new Float64Array([cmdCode, ts].concat(array || []));
		this.send(floats);
	}
}
