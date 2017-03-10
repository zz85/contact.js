var child_process = require('child_process');
var EventEmitter = require('events').EventEmitter;

class ScreenShare extends EventEmitter {
    constructor() {
        super();
    }

    start() {
        // options. Scaling, cropping.
        var args = `ffmpeg
            -f avfoundation
                -i 1
            -f mpegts
            -codec:v mpeg1video
                -q 15   
                -bf 0
            -`.trim().split(/\s+/);

        var cmd = args.shift();
        console.log(args);

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
        if (this.process) this.process.kill();
    }
}

module.exports = ScreenShare;



p = new ScreenShare();
p.on('out', d => console.log(d));
p.on('data', d => {
    for (var c of clients) {
        c.send(d);
    }
});
p.start();

// Screenshare server

WebSocket = require('uws');
var clients = new Set();
var wss = new WebSocket.Server({ port: 8082, perMessageDeflate: false });
wss.on('connection', function(ws) {
	ws.on('close', () => {
        console.log('Disconnected WebSocket');
        clients.delete(ws)
    });
    
    console.log(
		'New WebSocket Connection: ', 
		ws.upgradeReq.socket.remoteAddress,
		ws.upgradeReq.headers['user-agent'],
		'('+wss.connectionCount+' total)'
	);

    clients.add(ws);
});