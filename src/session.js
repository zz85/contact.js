var wire = require('./wire');

class Session {
	constructor(ws, sessions, roles, name) {
		this.ws = ws;
		this.sessions = sessions;
		if (roles && !roles.length) console.log('Roles need to be an array!');
		this.roles = new Set(roles);
		this.name = name;

		this.intervals = [
			setInterval(() => {
				this.sendPack('p', [Date.now()]);
			}, 5000)
		];
	}

	sendToReceivers(msg) {
		this.sendToRole(msg, 'receiver');
	}

	sendToRole(msg, role) {
		for (let session of this.sessions) {
			if (session.roles.has(role)) {
				session.sendRaw(msg);
			}
		}
	}

	send(cmd, data) {
		var payload = cmd + '\n' + JSON.stringify(data);
		this.sendRaw(payload);
	}

	sendRaw(payload) {
		if (this.ws) {
			this.ws.send(payload, (e) => {
				if (e) console.log('Cannot send message', payload, e);
			});
		}
	}

	sendPack(cmd, array) {
		var cmdCode = wire.WIRE[cmd];
		if (cmdCode === undefined) {
			console.log('Warning, unknown cmd', cmd);
		}

		var ts = Date.now();

		var floats = new Float64Array([cmdCode, ts].concat(array));
		this.sendRaw(floats);
	}

	onClose(e) {
		console.log('Session closed', e);
		this.ws = null;
	}

	processMessage(cmd, params, data) {
		// console.log('cmd, params', cmd, params, this.roles);
		// TODO - unify clients and use traits / ECS.
		switch (cmd) {
			case 'ts': // receives touch data
			case 'tm':
			case 'te':
			case 'tc':
				this.sendToReceivers(data);
				break;
			case 'p': // receives ping
				// ws.send('pp\n'  + d[1]);
				break;
			case 'pp': // ping reply
				// var reply = d[1];
				// console.log(ws.type + ': RTT', Date.now() - pings[reply]);
				// delete pings[reply];
				break;
			case 'r': // handle from transmitter?
				console.log('received dimensions', params);
				this.width = params[0];
				this.height = params[1];

				this.sendToRole(
					'r\n['  + params[0] + ',' + params[1] + ']',
					'receiver'
				);
				break;
			case 'rr':
				break;
			default:
				// We just dump stuff for logging
				// console.log(data);
				break;
		}

	}
}

module.exports = Session;