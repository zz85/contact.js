var child_process = require('child_process');
var EventEmitter = require('events').EventEmitter;

class ScreenShare extends EventEmitter {
    constructor() {
        super();
    }

    running() {
        return this.process;
    }

    start(mode, scale) {
        if (this.running()) return;

        console.log('Starting ffmpeg', arguments);

        var webcam_input = `
            -s 1280x720
            -framerate 30
            -f avfoundation
                -i 0:0`;

        var DISPLAY_NO = 2; // change this
        // ffmpeg -hide_banner -f avfoundation -list_devices true -i ""

        var screen_input = `-f avfoundation -i ${DISPLAY_NO}`;

        var input = mode === 'webcam' ? webcam_input : screen_input;

        var scales = {
            '': '',
            '720p': '-vf scale=-1:720',
            '.75': '-vf scale=iw*0.75:ih*0.75',
            half: '-vf scale=iw*0.5:ih*0.5',
            quarter: '-vf scale=iw*0.25:ih*0.25',
            double: '-vf scale=iw*2:ih*2',
        };

        scale = scales[scale] || '';

        var bitrate_quality = '-b:v 1000k';
        var q_quality = '-q 22';

        // TODO options. cropping, quality / bitrate.
        var args = `ffmpeg
            ${input}
            ${scale}
            -f mpegts
            ${bitrate_quality}
            -codec:v mpeg1video
                -bf 0
            -`.trim().split(/\s+/);

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

    stop(cb) {
        if (!this.running()) return cb && cb();

        console.log('Killing ffmpeg');
        this.process.kill();

        if (cb) {
            this.process.on('exit', cb);
        }
    }
}

var count = 0;
var screenshare = new ScreenShare();
screenshare.on('out', d => {
    count++;
    if (count % 50 === 0)
        console.log(d)
});
screenshare.on('data', d => {
    for (var c of clients) {
        c.send(d);
    }
});

// screenshare.start();

// Screenshare server
var WebSocket = require('ws');

var clients = new Set();
var wss = new WebSocket.Server({ port: 8082, perMessageDeflate: false });

/*
var uws = require('uWebSockets.js');
uws = false;
if (uws)  new uws.App().ws('/*', {
    compression: false, // uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 10,
    open: (ws) => {
      console.log('A WebSocket connected!');
      if (!screenshare.running()) {
            screenshare.start();
        }

        ws.on('close', () => {
            console.log('Disconnected WebSocket');
            clients.delete(ws);

            setTimeout(stopFFmpeg, 5000);
        });

        console.log(
            'New WebSocket Connection: ',
            ws.upgradeReq.socket.remoteAddress,
            ws.upgradeReq.headers['user-agent'],
            '('+ wss.connectionCount + ' total)'
        );

        clients.add(ws);
        
    },
    message: (ws, message, isBinary) => {
      //Ok is false if backpressure was built up, wait for drain
      let ok = ws.send(message, isBinary);
    },
    drain: (ws) => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      console.log('WebSocket closed');
    }
  })
.get('/*', (res, req) => {
    res.end('Hello World!');
  }).listen(8082, (token) => {
    if (token) {
        console.log('Listening to port ' + 8082);
    } else {
        console.log('Failed to listen to port ' + 8082);
    }
});
*/

var stopping = null;

function stopFFmpeg() {
    if (clients.size === 0) {
        screenshare.stop();
    }
}

wss.on('connection', function(ws, req) {
    if (!screenshare.running()) {
        screenshare.start();
    }

	ws.on('close', () => {
        console.log('Disconnected WebSocket');
        clients.delete(ws);

        setTimeout(stopFFmpeg, 5000);
    });

    console.log(
		'New WebSocket Connection: ',
		req.socket.remoteAddress,
		req.headers['user-agent'],
		'('+ wss.connectionCount + ' total)'
	);

    clients.add(ws);
});

console.log('Screenshare websocket server running on port', 8082);

module.exports = {
    ScreenShare,
    ffmpeg: screenshare,
};