var $ = require('nodobjc')


// 

$.import('Foundation') // foundation for strings/arrays
$.framework('Appkit') // nscreens
// coregraphics?

screens = $.NSScreen('screens')

// console.log('screens', screens);
console.log(screens('count'), screens.methods())
screen0 = screens('objectAtIndex', 0)

console.log(screen0.methods(), screen0('frame'), screen0('userSpaceScaleFactor'))
console.log(screen0('deviceDescription'))
console.log(screen0('visibleFrame'))
console.log(screen0('backingScaleFactor'))

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