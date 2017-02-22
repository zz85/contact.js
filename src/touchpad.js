var robot = require('robotjs');

// Remote TouchPad / Remote Control Session
class TouchPadSession {
	constructor(ws) {
		this.ws = ws;
		this.speed = 1;
		
		ws.on('message', data => this.onMessage(data));
		ws.on('close', e => this.onClose(e));

		this.updateMouse();
		this.interval = setInterval(() => this.onInterval(), 100);
	}

	updateMouse() {
		// console.log('updateMouse');
		var mouse = robot.getMousePos();
		this.mouse = {
			x: mouse.x,
			y: mouse.y
		};

		this.screenSize = robot.getScreenSize();
	}

	move(dx, dy, dt) {
		var mouse = this.mouse;
		var scale = 0.02;

		var dist = Math.sqrt(dx * dx + dy * dy);
		var currentSpeed = Math.min(Math.max(dist / dt * 1000 * scale, .2), 10);
		
		var speed = this.speed * 0.8 + currentSpeed * 0.2;
		
		var vx = dx * speed;
		var vy = dy * speed;
		var tx = mouse.x + vx;
		var ty = mouse.y + vy;

		this.speed = speed;
		this.mouse.x = Math.min(Math.max(0, tx), this.screenSize.width);
		this.mouse.y = Math.min(Math.max(0, ty), this.screenSize.height);

		robot.moveMouse(this.mouse.x, this.mouse.y);
		// console.log('currentSpeed', currentSpeed, '->', speed);
		// console.log('vx', vx, vy);
		// console.log('move', tx, ty);
	}

	onMessage(msg) {
		var data = msg.split('\n');
		var cmd = data[0];
		var coords = data[1] && JSON.parse(data[1]);

		// data
		// console.log('msg', cmd, coords);

		// TODO support scrolling / pitch-zoom / double clicking / right click
		// https://github.com/zingchart/zingtouch https://github.com/davidflanagan/Gestures
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

	send(cmd, data) {
		var payload = cmd + '\n' + JSON.stringify(data);
		if (this.ws) this.ws.send(payload);
	}

	onInterval() {
		this.updateMouse();
		this.send('mc', [this.mouse.x / this.screenSize.width, this.mouse.y / this.screenSize.height])
	}

	onClose(e) {
		console.log('TransmitterSession closed', e);
		clearInterval(this.interval);
	}
}

module.exports = TouchPadSession;