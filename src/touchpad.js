var robot = require('robotjs');
var wire = require('./wire');
var screenshare = require('./screenshare');
var Session = require('./session');

var MIN_SPEED = 0.15;
var MAX_SPEED = 5;

const SCROLL_DAMPENING = 0.90; // ran 1000 / 24 ~= 40hz
const FORCE_TOUCH_THRESHOLD = 0.1; // touch force above this, considered click

// Remote TouchPad / Remote Control Session
// Features
// - remote mouse control
// - server mouse reporting to transmitter

// multiple implementations, robotjs, electron, cliclick, hammerspoon
var RobotMover = {
	scroll: (x, y) => {
		robot.scrollMouse(x, y)
	},
	getMouse: () => {
		const mouse = robot.getMousePos();
		return {
			x: mouse.x,
			y: mouse.y
		};
	},
	moveMouse: (x, y) => robot.moveMouse(x, y),
	dragMouse: (x, y) => robot.dragMouse(x, y),
	// mouseToggle('up')
	// mouseToggle('down')
}

var mover = require('./screen');
/**
 * TODO: dragMouse(), mouseToggle()
 */

class TouchPadSession extends Session {
	constructor(ws, sessions, roles) {
		super(ws, sessions, roles);

		this.speed = MIN_SPEED;

		// TODO fix accelearation
		this.scrollYspeed = 0;

		var interval = setInterval(() => this.onInterval(), 25);
		this.intervals.push(interval);
	}

	sendScreen() {
		var screen = robot.captureScreen();
		var ts = Date.now();

		var imgBytes = screen.width * screen.height * screen.bytesPerPixel;
		var buffer = new ArrayBuffer(20 + imgBytes);
		var header = new Float64Array(buffer, 0, 2);
		header.set([wire.WIRE['si'], ts]);
		var screenView = new Uint16Array(buffer, 16, 2);
		screenView.set([ screen.width, screen.height ]);

		var imgView = new Uint8Array(buffer, 20, imgBytes);
		imgView.set(screen.image);

		this.sendRaw(buffer);
	}

	updateMouse() {
		// periodically poll the system for mouse coordinates
		// console.log('updateMouse');
		this.mouse = mover.getMouse()
		this.screenSize = robot.getScreenSize();
	}

	move(dx, dy, dt) {
		console.log('dx, dy, dt', dx, dy, dt);
		var mouse = this.mouse;
		var scale = 0.004;

		var dist = Math.sqrt(dx * dx + dy * dy);
		var currentSpeed = Math.min(Math.max(dist / dt * 1000 * scale, MIN_SPEED), MAX_SPEED);

		var speed = this.speed * 0.6 + currentSpeed * 0.4;

		var vx = dx * speed;
		var vy = dy * speed;
		var tx = mouse.x + vx;
		var ty = mouse.y + vy;

		this.speed = speed;

		this.mouse.x = tx;
		this.mouse.y = ty;

		if (this.forceDown) {
			robot.dragMouse(this.mouse.x, this.mouse.y);
		}
		else {
			mover.moveMouse(this.mouse.x, this.mouse.y);
		}
		// console.log('currentSpeed', currentSpeed, '->', speed);
		// console.log('vx', vx, vy);
		// console.log('move', tx, ty);
	}

	checkScrollMovement(coords) {
		// 2 fingers
		if (coords.length < 4) return 0;

		const last = this.lastScroll;
		if (!last) {
			this.lastScroll = [coords[0], coords[1], coords[2], coords[3]];
			return 0;
		}

		const dx1 = last[0] - coords[0];
		const dy1 = last[1] - coords[1];
		const dx2 = last[2] - coords[2];
		const dy2 = last[3] - coords[3];

		last[0] = coords[0];
		last[1] = coords[1];
		last[2] = coords[2];
		last[3] = coords[3];

		// console.log('dys', coords, last, dy1, dy2);

		// amptitude of y movements

		const ay1 = Math.abs(dy1);
		const ay2 = Math.abs(dy2); 
		if (ay1 > 0 || ay2 > 0) {
			// average distance moved by both fingers

			let ry = dy1 * 0.5 + dy2 * 0.5;

			return ry;
		}

		return 0;

		// distance travelled of finger 1 and 2
		const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
		const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

		// // distance of fingers moving closer to each other
		const vx = Math.abs(dx2 - dx1);
		const vy = Math.abs(dy2 - dy1);
		const vd = d2 - d1;

		// results
		let rx = vx < 5 ? dx1 : 0;
		let ry = vy > 5 ? dy1 : 0;

		// scroll left-right
		// scroll up-down

		if (vy < 5) {
			return dy1;
		}

		return 0;
	}

	processMessage(cmd, coords, data) {
		// TODO  / pitch-zoom / double clicking / right click
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
				else if (coords.length && coords[0] > FORCE_TOUCH_THRESHOLD && !this.forceDown) {
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
				if (coords.length === 2 && this._isScrolling()) {
					// stop scrolling
					this.scrollYspeed = 0;
				}
				break;
			case 'tm':
				var sy = this.checkScrollMovement(coords);

				// if (sy) {
					// this.scrollYspeed += sy * 2;
					// this.scrollYspeed = this.scrollYspeed * 0.9 + sy * 2;

					this.scrollYspeed = this.scrollYspeed * 0.85 + 0.15 * sy / 0.02 * 0.5;
					// this.scrollYspeed = this.scrollYspeed * 0.9 + sy * 1.5;
				// }

// 				if (NO_FORCE_CLICK)
// 				if (!this.moved && Date.now() - this.down > 250) {
// 					robot.mouseToggle('down');
// 				}
				this.moved = true;

				break;
			case 'te':
				this.last = null;
				if (!this.moved) {
					robot.mouseToggle('down');
					robot.mouseToggle('up');
					this.clicked = true;
				}
				this.lastScroll = null;

				break;
			case 'mm':
				if (!this._isScrolling())
					this.move(coords[0], coords[1], coords[2]);
				break;
			case 'tc':
				break;
			case 'sc':
				this.sendScreen();
				break;
			case 'p': // receives ping
				this.sendPack('pp', [ coords[0]]);
				break;
			case 'pp': // received ping reply
				var reply = coords[0];
				console.log('RTT', Date.now() - reply);
				break;
			case 'r': // handle receiver resizing
				break;
			case 'dm':
			case 'do':
			case 'so':
				this.sendToReceivers(data);
				break;
			case 'sr':
				screenshare.ffmpeg.stop(
					() => screenshare.ffmpeg.start('screenshare', coords.scale)
				);
				break;
			case 'wr':
				console.log('wr!');
				screenshare.ffmpeg.stop(
					() => screenshare.ffmpeg.start('webcam', coords.scale)
				);
				break;
			case 'rt':
				console.log('type', coords.text);
				robot.typeString(coords.text);
				// keyToggle
				break;
			case 'kt':
				try {
					robot.keyTap(coords.key);
				} catch (e) {
					console.log(coords.key, 'is not supported', e);
				}
				break;
			default:
				// We just dump stuff for logging
				console.log(cmd);
				break;
		}
	}

	_isScrolling() {
		return Math.abs(this.scrollYspeed) >= 1;
	}

	onInterval() {
		if (this._isScrolling()) {
			mover.scroll(0, -this.scrollYspeed | 0);
			this.scrollYspeed *= SCROLL_DAMPENING;
		} else {
			this.scrollYspeed = 0;
		}
			
		this.updateMouse();
		this.sendPack('mc', [this.mouse.x / this.screenSize.width, this.mouse.y / this.screenSize.height])
	}

	onClose(e) {
		console.log('TransmitterSession closed', e);
		while (this.intervals.length) {
			clearInterval(this.intervals.pop());
		}
		this.ws = null;
	}
}

module.exports = TouchPadSession;