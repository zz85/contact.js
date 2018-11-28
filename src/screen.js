var $ = require('nodobjc')

$.framework('Foundation') // foundation for strings/arrays
$.framework('Appkit') // nscreens
$.framework('CoreFoundation')
$.framework('CoreGraphics')
// Cocoa, IOKit

function getScreens() {
    const screens = $.NSScreen('screens')
    const screens_count = screens('count')
    console.log(screens_count)

    const displays = []

    for (let i = 0; i < screens_count; i++) {
        const aScreen = screens('objectAtIndex', i)

        console.log('Screen ' + i)
        const backingScaleFactor = aScreen('backingScaleFactor')

        const frame = aScreen('frame')
        const description = aScreen('deviceDescription');
        
        // const visibleFrame = aScreen('visibleFrame')
        // console.log(aScreen.methods())
        // console.log(description('class'), description.methods())
        const deviceSize = description('objectForKey', $('NSDeviceSize'))
        console.log('deviceSize', deviceSize('class'), deviceSize.methods(), deviceSize('_value'))
        const screenNumber = description('objectForKey', $('NSScreenNumber'))

        let e = description('keyEnumerator')
        while (key = e('nextObject')) {
            console.log(key, description('objectForKey', key))
        }

        

        // NSDeviceResolution, NSDeviceSize, NSScreenNumber
        console.log('scaling', backingScaleFactor)
        displays.push({
            w: deviceSize.width,
            h: deviceSize.height,
            scale: backingScaleFactor,
            id: screenNumber
        })
    }

    return displays;
}

/*
// https://github.com/Hammerspoon/hammerspoon/blob/master/extensions/screen/internal.m
    NSScreen* screen = get_screen_arg(L, 1);
    CGDirectDisplayID screen_id = [[[screen deviceDescription] objectForKey:@"NSScreenNumber"] intValue];

    int i, numberOfDisplayModes;
    CGSGetNumberOfDisplayModes(screen_id, &numberOfDisplayModes);

    lua_newtable(L);

    for (i = 0; i < numberOfDisplayModes; i++)
    {
        CGSDisplayMode mode;
        CGSGetDisplayModeDescriptionOfLength(screen_id, i, &mode, sizeof(mode));
*/


// https://github.com/BlueM/cliclick/tree/master/Actions

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function getMouse() {
    const ref = $.CGEventCreate(null)
    const pos = $.CGEventGetLocation(ref)
    $.CFRelease(ref)

    return new Point(pos.x, pos.y);
}

function moveMouse(x, y) {
    const moveEventRef = // CGEventRef
        $.CGEventCreateMouseEvent(null,
            $.kCGEventMouseMoved,
            $.CGPointMake(x, y),
            $.kCGMouseButtonLeft); // kCGMouseButtonLeft is ignored
    $.CGEventPost($.kCGHIDEventTap, moveEventRef);
    $.CFRelease(moveEventRef);
}

function mouseMoveSilently(x, y) {
    // uses CGWarpMouseCursorPosition
    // https://developer.apple.com/documentation/coregraphics/1456387-cgwarpmousecursorposition?language=objc

    $.CGWarpMouseCursorPosition($.CGPointMake(x, y))
}

setInterval(() => {
    // moveMouse(Math.random() * 1000, Math.random() * 1000)
    // mouseMoveSilently(Math.random() * 1000, Math.random() * 1000)
    console.log(getMouse())
}, 500);

console.log(getScreens())

module.exports = {
    moveMouse: mouseMoveSilently,
    getMouse
}


