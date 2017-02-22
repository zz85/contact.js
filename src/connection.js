function Connection(target, handler) {
	var ws;
	var ready = false;
	var self = this;

	this.open = function() {
		ws = new WebSocket(target);
		window.ws = ws;

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

		ws.addEventListener('message', function(e) {
			if (handler.onMessage) handler.onMessage(e);
		});

	};

	this.send = function send(e) {
		if (ws && ready) ws.send(e);
	}
}
