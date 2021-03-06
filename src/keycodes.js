function sendKeyTap(key) {
	connection.sendType('kt', {
		key: key
	})
}

function sendString(input) {
	if (input) connection.sendType('rt', {
		text: input
	});
}

var keys_to_elusive_icons = {
	'audio_mute': 'el-volume-off',
	'audio_vol_down': 'el-volume-down',
	'audio_vol_up': 'el-volume-up',
	'audio_play': 'el-play',
	'audio_stop': 'el-stop',
	'audio_pause': 'el-pause',
	'audio_prev': 'el-backward', // fast-backward
	'audio_next': 'el-forward',
	'audio_rewind': 'el-step-backward',
	'audio_forward': 'el-step-forward',
	'audio_repeat': 'el-repeat',
	'audio_random': 'el-random',
	'up': 'el-caret-up',
	'down': 'el-caret-down',
	'left': 'el-caret-left',
	'right': 'el-caret-right',
};

var alias = {
	'lights_mon_up': 'Screen &#x1f506;', //  ▲
	'lights_mon_down': 'Screen &#x1f505;', //  ▼
	'lights_kbd_up': 'Kbd &#x1f506;', //  ▲
	'lights_kbd_down': 'Kbd &#x1f505;', //  ▼
	// 'command': 'command ' + hexEncode('⌘'),
}

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
	'backspace',
	'delete',
	'enter',
	'tab',
	'escape',
]

var directional = [
	'up',
	'down',
	'left',
	'right',

	'home',
	'end',
	'pageup',
	'pagedown',
];

var f_keys = [
	'f1',
	'f2',
	'f3',
	'f4',
	'f5',
	'f6',
	'f7',
	'f8',
	'f9',
	'f10',
	'f11',
	'f12',
];

var modifiers = [
	'command',
	'alt',
	'control',
	'shift',
	'right_shift',
	'space',
	'printscreen',
	'insert',
];

var audio = [
	'audio_mute',
	'audio_vol_down',
	'audio_vol_up',
	'audio_play',
	'audio_stop',
	'audio_pause',
	'audio_prev',
	'audio_next',
	'audio_rewind',
	'audio_forward',
	'audio_repeat',
	'audio_random',
];

var numpad = [
	'numpad_0',
	'numpad_1',
	'numpad_2',
	'numpad_3',
	'numpad_4',
	'numpad_5',
	'numpad_6',
	'numpad_7',
	'numpad_8',
	'numpad_9',
];

var lights = [
	'lights_mon_down',
	'lights_mon_up',
	
	'lights_kbd_down',
	'lights_kbd_up',
	
	'lights_kbd_toggle',
];

var keys = [
	'lights',
	'directional',
	'audio',
	'specials',
	'numpad',
	'f_keys',
	'modifiers',
];

function dump() {
	keys.forEach(key => {
		const h3 = document.createElement('h3');
		h3.innerHTML = key;
		document.body.appendChild(h3);

		const hr = document.createElement('hr');
		document.body.appendChild(hr);

		const keys = window[key];
		keys.forEach(name => {
			var key = document.createElement('button');

			var css = keys_to_elusive_icons[name];
			if (!css) {
				key.innerHTML = alias[name] || name;
			} else {
				var i = document.createElement('i');
				i.className = 'el ' + css;
				key.appendChild(i);
			}

			let interval;

			const repeat = () => {
				sendKeyTap(name);
			}

			key.ontouchstart = (e) => {
				sendKeyTap(name);
				e.preventDefault();
				e.stopPropagation();

				if (!interval)
					interval = setInterval(repeat, 200);
			}

			key.ontouchend = (e) => {
				if (interval) {
					interval = clearInterval(interval);
				}
			}

			key.ontouchcancel = (e) => {
				if (interval) {
					interval = clearInterval(interval);
				}
			}

			document.body.appendChild(key);
		});
	});
}

dump();