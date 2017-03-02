var robot = require('robotjs');
var wire = require('./wire');

var MIN_SPEED = 0.15;
var MAX_SPEED = 5;

// Remote TouchPad / Remote Control Session
// Features
// - remote mouse control
// - server mouse reporting to transmitter

function abToType(b, Type) {
	var array = new Type(b.buffer, b.byteOffset, b.byteLength / Type.BYTES_PER_ELEMENT);
	return array;
}

class TouchPadSession {
	constructor(ws, sessions) {
		this.ws = ws;
		this.sessions = sessions;
		this.speed = MIN_SPEED;

		ws.on('message', data => this.onMessage(data));
		ws.on('close', e => this.onClose(e));

		this.updateMouse();
		this.interval = setInterval(() => this.onInterval(), 1000 / 60);

		// TODO fix accelearation
		this.scrollYspeed = 0;
		this.sy = 0;
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
		var scale = 0.004;

		var dist = Math.sqrt(dx * dx + dy * dy);
		var currentSpeed = Math.min(Math.max(dist / dt * 1000 * scale, MIN_SPEED), MAX_SPEED);

		var speed = this.speed * 0.8 + currentSpeed * 0.2;

		var vx = dx * speed;
		var vy = dy * speed;
		var tx = mouse.x + vx;
		var ty = mouse.y + vy;

		this.speed = speed;
		this.mouse.x = Math.min(Math.max(0, tx), this.screenSize.width);
		this.mouse.y = Math.min(Math.max(0, ty), this.screenSize.height);

		if (this.forceDown) {
			robot.dragMouse(this.mouse.x, this.mouse.y);
		}
		else robot.moveMouse(this.mouse.x, this.mouse.y);
		// console.log('currentSpeed', currentSpeed, '->', speed);
		// console.log('vx', vx, vy);
		// console.log('move', tx, ty);
	}

	checkScrollMovement(coords, last) {
		if (coords.length < 4 || !last || last.length < 4) return 0;

		const dx1 = last[0] - coords[0];
		const dy1 = last[1] - coords[1];
		const dx2 = last[2] - coords[2];
		const dy2 = last[3] - coords[3];

		const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
		const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

		const vx = Math.abs(dx2 - dx1);
		const vy = Math.abs(dy2 - dy1);
		const vd = d2 - d1;

		// console.log(dx1, dy1, 'diff', vd, vx, vy);

		robot.scrollMouse(vx < 5 ? dx1 : 0, vy > 5 ? dy1 : 0);

		if (vy < 5) {
			return dy1;
		}

		return 0;
	}

	onMessage(data) {
		if (data instanceof Buffer) {
			var cmdCode = data[0];
			var cmd = wire.CODES[cmdCode];

			if (cmd === undefined) {
				console.log('invalid cmd code', cmd);
			}

			var ts = data[1];

			var moo = abToType(data.slice(2).buffer, Float32Array);
			console.log('meows', cmd, ts, moo);
			return;
		}
		else if (typeof data !== 'string') {
			console.log('Oops unknown data type', typeof data, data);
			return;
		}

		var msg = data.split('\n');
		var cmd = msg[0];
		var coords = msg[1] && JSON.parse(msg[1]);

		this.processMessage(cmd, coords, data);
	}

	processMessage(cmd, coords, msg) {

		// TODO support scrolling / pitch-zoom / double clicking / right click
		// https://github.com/zingchart/zingtouch https://github.com/davidflanagan/Gestures
		// TODO MOUSE recording.
		// TODO add remote screen sharing? screen.capture

		switch (cmd) {
			case 'tf':
				// TODO implement me!
				// Also, touch move should use the latest fingers
				// console.log('forces', coords);
				if (!coords.length && this.forceDown) {
					console.log('^', coords);
					robot.mouseToggle('up');
					this.forceDown = false;
				}
				else if (coords.length && coords[0] > 0.1 && !this.forceDown) {
					console.log('v', coords);
					robot.mouseToggle('down');
					this.forceDown = true;
				}
				break;
			case 'ts': // receives touch data
				this.clicked = false;
				this.moved = false;
				this.speed = 1;
				this.updateMouse();
				this.last = coords;
				this.down = Date.now();
				break;
			case 'tm':
				this.sy = this.checkScrollMovement(coords, this.last);
				if (this.sy) this.scrollYspeed = 0.5 * this.scrollYspeed + 0.5 * this.sy;

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
			case 'mm':
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
			case 'dm':
				this.sendToReceivers(msg);
				break;
			case 'do':
				this.sendToReceivers(msg);
				break;
			default:
				// We just dump stuff for logging
				console.log(cmd);
				break;
		}
	}

	sendToReceivers(msg) {
		for (let session of this.sessions) {
			if (session instanceof TouchPadSession) {

			} else {
				session.send(msg);
			}
		}
	}

	send(cmd, data) {
		var payload = cmd + '\n' + JSON.stringify(data);
		if (this.ws) this.ws.send(payload);
	}

	onInterval() {
		this.scrollYspeed *= 0.9;
		// if (Math.abs(this.scrollYspeed) > 0.1)
		// 	robot.scrollMouse(Math.abs(this.scrollYspeed) * 0.5, this.scrollYspeed < 0 ? 'up' : 'down');

		this.updateMouse();
		this.send('mc', [this.mouse.x / this.screenSize.width, this.mouse.y / this.screenSize.height])
	}

	onClose(e) {
		console.log('TransmitterSession closed', e);
		clearInterval(this.interval);
	}
}

module.exports = TouchPadSession;