// message protocol commands

var CMDS = {
	'p': 'ping (request) [token]',
	'pp': 'ping reply [token]',
	't': 'transmitter is ready',
	'r': 'send dimensions',
	'ts': 'touch start [x1, y1, x2, y2....]',
	'tm': 'touch move [x1, y1, x2, y2....]',
	'te': 'touch end [x1, y1, x2, y2....]',
	'tc': 'touch cancel [x1, y1, x2, y2....]',
	'rr': 'request resize. server size [w, h]',
	'r': 'resized to [w, h]',
	'mc': 'mouse coordinates [0..1, 0..1]',
	'mm': 'mouse moving [dx, dy, dt]',
	'dm': 'device motion [accx, accy, accz]',
	'do': 'device orientation [alpha, beta, gamma]'
};