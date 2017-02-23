var robot = require('robotjs');

var MIN_SPEED = 0.15;
var MAX_SPEED = 5;

// Remote TouchPad / Remote Control Session
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

		robot.moveMouse(this.mouse.x, this.mouse.y);
		// console.log('currentSpeed', currentSpeed, '->', speed);
		// console.log('vx', vx, vy);
		// console.log('move', tx, ty);
	}

	checkScrollMovement(coords, last) {
		if (coords.length < 4 || !last || last.length < 4) return;

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
		if (vy < 3) {
			this.scrollYspeed = 0.9 * this.scrollYspeed + 0.1 * Math.abs(dy1);
			robot.scrollMouse(this.scrollYspeed, dy1 < 0 ? 'up' : 'down'); 
		}
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
		// TODO add remote screen sharing?

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
				this.checkScrollMovement(coords, this.last);

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
				console.log(data);
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
		this.updateMouse();
		this.send('mc', [this.mouse.x / this.screenSize.width, this.mouse.y / this.screenSize.height])
	}

	onClose(e) {
		console.log('TransmitterSession closed', e);
		clearInterval(this.interval);
	}
}

module.exports = TouchPadSession;