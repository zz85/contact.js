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

        const backingScaleFactor = aScreen('backingScaleFactor')
        const frame = aScreen('frame')
        const description = aScreen('deviceDescription')
        const screenNumber = description('objectForKey', $('NSScreenNumber'))
        const info = {
            x: frame.origin.x,
            y: frame.origin.y,
            w: frame.size.width,
            h: frame.size.height,
            scale: backingScaleFactor,
            i: i,
            id: screenNumber
        }

        console.log('Screen ' + i, info)
        displays.push(info)
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

function scroll(x, y) {
	const event = $.CGEventCreateScrollWheelEvent(
        null, $.kCGScrollEventUnitPixel, 2, y, x);
	$.CGEventPost($.kCGHIDEventTap, event);

    $.CFRelease(event);
}

// for testing only
/*
setInterval(() => {
    // moveMouse(Math.random() * 1000, Math.random() * 1000)
    // mouseMoveSilently(Math.random() * 1000, Math.random() * 1000)

    // scroll(0, 100)

    // // pick a screen and randomly move
    // s = ss[Math.random() * ss.length | 0];
    // console.log('screen', s.i)
    // s = ss[1]
    // tx = s.x + Math.random() * s.w;
    // ty = Math.random() *s.h - s.y
    // console.log('moving to', tx, ty)
    // mouseMoveSilently(tx, ty)
  
    // console.log(getMouse())
}, 500);


var ss = getScreens();
console.log(ss)
*/

module.exports = {
    moveMouse: mouseMoveSilently,
    getMouse,
    scroll
}

