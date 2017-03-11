var child_process = require('child_process');
var EventEmitter = require('events').EventEmitter;

class ScreenShare extends EventEmitter {
    constructor() {
        super();
    }

    running() {
        return this.process;
    }

    start() {
        if (this.running()) return;

        console.log('Starting ffmpeg');

        var webcam_input = `
            -s 1280x720
            -framerate 30
            -f avfoundation
                -i 0:0`;
        var screen_input = `-f avfoundation -i 1`

        // TODO options. Scaling, cropping, quality, bitrate.
        var args = `ffmpeg
            ${webcam_input}
            -f mpegts
            -codec:v mpeg1video
                -bf 0
            -`.trim().split(/\s+/);
        // -vf scale=-1:720
        // -b:v 1000k
        // -q 22

        var cmd = args.shift();
        console.log('Running', cmd, args.join(' '));

        var process = child_process.spawn(cmd, args);

        process.stdout.on('data', d => {
            this.emit('data', d);
        });

        process.stderr.on('data', d => this.emit('out', d.toString('utf-8')));

        process.on('exit', (a) => {
            this.process = null;
            console.log('Process exit', a)
        });

        this.process = process;
    }

    stop() {
        if (!this.running()) return;
        
        console.log('Killing ffmpeg');
        this.process.kill();
    }
}

module.exports = ScreenShare;

screenshare = new ScreenShare();
screenshare.on('out', d => console.log(d));
screenshare.on('data', d => {
    for (var c of clients) {
        c.send(d);
    }
});
screenshare.start();

// Screenshare server

var WebSocket = require('uws');
var clients = new Set();
var wss = new WebSocket.Server({ port: 8082, perMessageDeflate: false });
wss.on('connection', function(ws) {
    if (!screenshare.running()) {
        screenshare.start();
    }

	ws.on('close', () => {
        console.log('Disconnected WebSocket');
        clients.delete(ws);
        if (clients.size === 0) {
            screenshare.stop();
        }
    });
    
    console.log(
		'New WebSocket Connection: ', 
		ws.upgradeReq.socket.remoteAddress,
		ws.upgradeReq.headers['user-agent'],
		'('+ wss.connectionCount + ' total)'
	);

    clients.add(ws);
});