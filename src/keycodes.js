var keycodes = {
	'8': 'backspace',
	'9': 'tab',
	'13': 'enter',
	'16': 'shift',
	'17': 'ctrl',
	'18': 'alt',
	'19': 'pause/break',
	'20': 'caps lock',
	'27': 'esc',
	'32': 'space',
	'33': 'page up',
	'34': 'page down',
	'35': 'end',
	'36': 'home',
	'37': 'left',
	'38': 'up',
	'39': 'right',
	'40': 'down',
	'45': 'insert',
	'46': 'delete',
	'48': '0',
	'49': '1',
	'50': '2',
	'51': '3',
	'52': '4',
	'53': '5',
	'54': '6',
	'55': '7',
	'56': '8',
	'57': '9',
	'65': 'a',
	'66': 'b',
	'67': 'c',
	'68': 'd',
	'69': 'e',
	'70': 'f',
	'71': 'g',
	'72': 'h',
	'73': 'i',
	'74': 'j',
	'75': 'k',
	'76': 'l',
	'77': 'm',
	'78': 'n',
	'79': 'o',
	'80': 'p',
	'81': 'q',
	'82': 'r',
	'83': 's',
	'84': 't',
	'85': 'u',
	'86': 'v',
	'87': 'w',
	'88': 'x',
	'89': 'y',
	'90': 'z',
	'91': 'left command',
	'93': 'right command',
	'96': 'numpad 0',
	'97': 'numpad 1',
	'98': 'numpad 2',
	'99': 'numpad 3',
	'100': 'numpad 4',
	'101': 'numpad 5',
	'102': 'numpad 6',
	'103': 'numpad 7',
	'104': 'numpad 8',
	'105': 'numpad 9',
	'106': 'numpad *',
	'107': 'numpad +',
	'109': 'numpad -',
	'110': 'numpad .',
	'111': 'numpad /',
	'112': 'f1',
	'113': 'f2',
	'114': 'f3',
	'115': 'f4',
	'116': 'f5',
	'117': 'f6',
	'118': 'f7',
	'119': 'f8',
	'120': 'f9',
	'121': 'f10',
	'122': 'f11',
	'123': 'f12',
	'144': 'num lock',
	'145': 'scroll lock',
	'182': 'my computer',
	'183': 'my calculator',
	'186': ';',
	'187': '=',
	'188': ',',
	'189': '-',
	'190': '.',
	'191': '/',
	'192': '`',
	'219': '[',
	'220': '\\',
	'221': ']',
	'222': '\''
};

var specials = [
	"backspace",
	"delete",
	"enter",
	"tab",
	"escape",
]

var directional = [
	"up",
	"down",
	"right",
	"left",
	"home",
	"end",
	"pageup",
	"pagedown",
];

var f_keys = [
	"f1",
	"f2",
	"f3",
	"f4",
	"f5",
	"f6",
	"f7",
	"f8",
	"f9",
	"f10",
	"f11",
	"f12",
];

var modifiers = [
	"command",
	"alt",
	"control",
	"shift",
	"right_shift",
	"space",
	"printscreen",
	"insert",
];

var audio = [
	"audio_mute",
	"audio_vol_down",
	"audio_vol_up",
	"audio_play",
	"audio_stop",
	"audio_pause",
	"audio_prev",
	"audio_next",
	"audio_rewind",
	"audio_forward",
	"audio_repeat",
	"audio_random",
];

var numpad = [
	"numpad_0",
	"numpad_1",
	"numpad_2",
	"numpad_3",
	"numpad_4",
	"numpad_5",
	"numpad_6",
	"numpad_7",
	"numpad_8",
	"numpad_9",
];

var lights = [
	"lights_mon_up",
	"lights_mon_down",
	"lights_kbd_toggle",
	"lights_kbd_up",
	"lights_kbd_down"
];

var keys = [
	'directional',
	'specials',
	'f_keys',
	'modifiers',
	'audio',
	'numpad',
	'lights'
].forEach(key => {
	const h3 = document.createElement('h3');
	h3.innerHTML = key;
	document.body.appendChild(h3);

	const hr = document.createElement('hr');
	document.body.appendChild(hr);

	const keys = window[key];
	keys.forEach(name => {
		var key = document.createElement('button');
		key.innerText = name;
		key.onclick = (e) => {
			sendKeyTap(name);
			// e.preventDefault();
			e.stopPropagation();
		}
		key.ontouchstart = (e) => {
			send('touchstart' + name);
		}

		key.ontouchend = (e) => {
			send('touchend' + name);
		}

		key.ontouchcancel = (e) => {
			send('touchcancel' + name);
		}

		document.body.appendChild(key);
	});
});