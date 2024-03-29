// message protocol commands

var bla = {
	'TOUCH_START': 'ts',
	'TOUCH_MOVE': 'tm',
}

var CMDS = {
	'p': 'ping (request) [token]',
	'pp': 'ping reply [token]',
	't': 'transmitter is ready',
	'ts': 'touch start [x1, y1, x2, y2....]',
	'tm': 'touch move [x1, y1, x2, y2....]',
	'te': 'touch end [x1, y1, x2, y2....]',
	'tc': 'touch cancel [x1, y1, x2, y2....]',
	'tf': 'touch force change [f1, f2, f3...]',
	'rr': 'request resize. server size [w, h]',
	'r': 'resized to [w, h]',
	'mc': 'mouse coordinates [0..1, 0..1]',
	'mm': 'mouse moving [dx, dy, dt]',
	'dm': 'device motion [accx, accy, accz]',
	'do': 'device orientation [alpha, beta, gamma]',
	'so': 'screen orientation [-90, 0, 90]',
	'sc': 'screen capture',
	'si': 'screen image',
	'sr': 'screen share request',
	'wr': 'web cam request',
	'rt': 'remote text (send text over)',
	'kt': 'send key tab {key}',
	// TODO
	'gr': 'generic request',
};

var KEYS = Object.keys(CMDS);

var WIRE = {}; // cmds to binary code
var CODES = {}; // wire to command keys

KEYS.forEach((key, i) => {
	WIRE[key] = i;
	CODES[i] = key;
});

if (typeof module === 'object') {
	module.exports = {
		CODES,
		WIRE
	}
}