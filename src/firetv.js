
// adb kill-server
// adb start-server
// adb connect 192.168.0.14
// adb devices
// up
// adb shell input keyevent 19

var adb = require('adbkit')
var client = adb.createClient()

var err = (e) => { console.error('err', e)}
var ok = v => {
    console.log(v)
}

// see http://www.aftvnews.com/how-to-remotely-control-an-amazon-fire-tv-or-fire-tv-stick-via-adb/
var FIRETV_KEY_EVENTS = {
    UP: 19,
    DOWN: 20,
    LEFT: 21,
    RIGHT: 22,
    ENTER: 66,
    BACK: 4,
    HOME: 3,
    MENU: 1,
    MEDIA_PLAY_PAUSE: 85,
    MEDIA_PREVIOUS: 88,
    MEDIA_NEXT: 87
}

var HTML_KEY_CODE = {
    38: 'UP',
    40: 'DOWN',
    37: 'LEFT',
    39: 'RIGHT',
    13: 'ENTER',
    8: 'BACK',
    72: 'HOME', // 'h'
    77: 'MENU', // 'm,
    32: 'MEDIA_PLAY_PAUSE', // space
    74: 'MEDIA_PREVIOUS', // j
    75: 'MEDIA_NEXT', // k
}

module.exports = (key) => {
    var code = HTML_KEY_CODE[key];
    if (!code) {
        console.log('No understand', key)
        return;
    }

    console.log('processing ', code);
    send(code);
}

function send(NAME) {
    var CODE = FIRETV_KEY_EVENTS[NAME]
    var cmd = `input keyevent ${CODE}`;
    console.log(cmd);
    client.shell(deviceId, cmd)
        // Use the readAll() utility to read all the content without
        // having to deal with the events. `output` will be a Buffer
        // containing all the output.
        .then(adb.util.readAll, err)
        .then(function(output) {
            console.log('done')
            console.log('[%s] %s', deviceId, output.toString().trim())
        },)
}

function connect(host) {
    return client
        .connect(host)
        .then(ok, err)
}

var deviceId;

connect('192.168.0.14')
    .then(v => client.listDevices())
    .then(devices => devices.forEach(device => {
        console.log('device', device);
        deviceId = device.id;
        // send('DOWN')
    }), err)