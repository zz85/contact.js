// see http://www.aftvnews.com/how-to-remotely-control-an-amazon-fire-tv-or-fire-tv-stick-via-adb/
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

client.connect('192.168.0.14')
    .then(ok, err)
    .then(v => client.listDevices())
    .then(devices => devices.forEach(device => {
        return client.shell(device.id, 'echo $RANDOM')
        // Use the readAll() utility to read all the content without
        // having to deal with the events. `output` will be a Buffer
        // containing all the output.
        .then(adb.util.readAll)
        .then(function(output) {
          console.log('[%s] %s', device.id, output.toString().trim())
        })
    }), err)

