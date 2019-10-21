
%css
	.Confirm {
		z-index: 9;
	}
	.Confirm-bg {
		background-color: #000;
		opacity: .6;
	}
	.Confirm-content {
		position: absolute;
		left: 0;
		right: 0;
		margin: 0 auto;
		top: 60px;
		width: 400px;
		background-color: #fff;
		box-shadow: 0 2px 10px 2px rgba(255,255,255,.5);
		animation: .2s cubic-bezier(.2, -.3, .8, 0) reverse Confirm--blur;
	}
	.sm .Confirm-content {
		width: 100%;
	}
	.Confirm--blur {
		animation: .2s cubic-bezier(.2, 1, .8, 1.3) forwards Confirm--blur;
	}
	@keyframes Confirm--blur {
		to {
			filter: blur(4px);
			transform: scale(.9);
		}
	}

// reverse animation: x1, y1, x2, y2 -> (1 - x2), (1 - y2), (1 - x1), (1 - y1)
// https://developer.mozilla.org/en-US/docs/Web/API/Notification
// https://developers.google.com/web/fundamentals/push-notifications/display-a-notification
// var n = new Notification(title, options);
// {
//   "//": "Visual Options",
//   "body": "Did you make a $1,000,000 purchase at Dr. Evil...",
//   "icon": "images/ccard.png",  // 192px or more is a safe bet
//   "image": "<URL String>",     // width 1350px or more, ratio of 4:3 for desktop and Android will crop the image
//   "badge": "<URL String>", // 72px or more should be good
//   "vibrate": "<Array of Integers>",
//   "sound": "<URL String>",
//   "dir": "<String of 'auto' | 'ltr' | 'rtl'>",
//   "//": "Behavioural Options",
//   "tag": "<String>", // group messages so that any old notifications that are currently displayed will be closed if they have the same tag as a new notification.
//   "data": "<Anything>",
//   "requireInteraction": "<boolean>", // for Chrome on desktop
//   "renotify": "<Boolean>",
//   "silent": "<Boolean>",
//   "//": "Both Visual & Behavioural Options",
//   "actions": "<Array of Strings>",
//   "//": "Information Option. No visual affect.",
//   "timestamp": "<Long>" // ms
// }
// Star Wars shamelessly taken from the awesome Peter Beverloo
// https://tests.peter.sh/notification-generator/
//   "vibrate": [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
//   "actions": [
//     { "action": "yes", "title": "Yes", "icon": "images/yes.png" },
//     { "action": "no", "title": "No", "icon": "images/no.png" }
//   ]
%js
	View.on("confirm", function(title, opts, next) {
		View.blur()
		if (!next && typeof opts === "function") {
			next = opts
			opts = null
		}
		var sound, vibrate
		, code = ""
		, el = El("Confirm")
		, scope = El.scope(el, El.data)
		, kbMap = { esc: resolve }
		, body = document.body
		Object.assign(scope, opts)
		scope.title = title || "Confirm?"
		if (!scope.actions) scope.actions = [
			{ title: "Cancel" },
			{ action: "ok", title: "Ok", key: "enter" }
		]
		for (var a, i = 0; a = scope.actions[i++]; ) {
			if (typeof a == "string") a = scope.actions[i-1] = {title:a,action:a}
			if (a.key) kbMap[a.key] = resolve.bind(el, el, a.action)
		}
		kbMap.backspace = kbMap.del = kbMap.num = numpad
		El.addKb(kbMap)
		El.on(el, "kill", El.rmKb)
		El.cls(body.lastChild, "Confirm--blur")
		El.append(body, el)
		El.render(el, scope)
		El.findAll(el, ".js-numpad").on("click", numpad)
		El.findAll(el, ".js-btn").on("click", resolve)
		El.on(el, "wheel", Event.stop)
		El.on(el, "click", resolve)
		El.on(el.lastChild, "click", Event.stop)
		View.one("navigation", resolve)
		if (scope.vibrate && navigator.vibrate) {
			vibrate = navigator.vibrate(scope.vibrate)
		}
		if (scope.sound && window.Audio) {
			sound = new Audio(scope.sound)
			sound.play()
		}
		function numpad(e, _num) {
			// Enter pressed on focused element
			if (_num == void 0 && e.clientX == 0) return
			var num = _num == void 0 ? e.target[El.T] : _num
			code += num
			if (num == "CLEAR" || num == "del" || num == "backspace") code = ""
			El.txt(El.find(el, ".js-body"), code.replace(/./g, "•") || opts.body)
			// if (code.length == 4 && id && !sent) next(sent = code, id, resolve, reject)
		}
		function resolve(e, key) {
			if (el) {
				El.rmKb(kbMap)
				El.kill(el)
				El.cls(body.lastChild, "Confirm--blur", 0)
				el = null
				var action = key || El.attr(this, "data-action")
				if (action && next) {
					if (typeof next === "function") next(action, code)
					else if (typeof next[action] === "function") next[action](code)
					else if (next[action]) View.emit(next[action], code)
				}
				if (vibrate) navigator.vibrate(0)
				if (sound) sound.pause()
			}
		}
	})

%el Confirm
	.Confirm.max.fix
		.Confirm-bg.max.abs
		.Confirm-content.grid.p2
			.col.ts3 ;txt:: _(title)
			.col.js-body ;txt:: _(body)
			.row.js-numpad
				;if: code
				;each: num in [1,2,3,4,5,6,7,8,9,"CLEAR",0]
				.col.w4>.btn {num}
			.col
				.group ;each: action in actions
					.btn.js-btn
						;txt:: _(action.title)
						;class:: "w" + (12/actions.length)
						;nop: this.focus()
						;data: "action", action.action
						;class:: "is-" + action.action, action.action

