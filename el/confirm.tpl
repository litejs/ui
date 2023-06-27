
%css
	.Confirm {
		z-index: 9;
	}
	.Confirm-bg {
		backdrop-filter: blur(5px);
		background-color: rgba(0, 0, 0, .6);
	}
	.Confirm-content {
		position: absolute;
		left: 0;
		right: 0;
		margin: 0 auto;
		top: 4%;
		width: 600px;
		background-color: #fff;
		box-shadow: 0 2px 10px 2px rgba(255,255,255,.5);
	}
	.sm .Confirm-content {
		width: 94%;
	}
	.Confirm--blur {
		transform: scale(.85);
		transform-origin: 50% 100vh;
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
		, kbMap = {}
		, body = document.body
		, blurEl = body.lastChild
		Object.assign(scope, opts)
		scope.title = title || "Confirm?"
		if (!scope.actions) scope.actions = [
			{ action: "close", title: "Close", key: "esc" }
		]
		for (var a, i = 0; a = scope.actions[i++]; ) {
			if (typeof a == "string") a = scope.actions[i-1] = {title:a,action:a}
			if (a.key) kbMap[a.key] = resolve.bind(el, el, a.action)
		}
		El.cls(blurEl, "Confirm--blur")
		El.cls(el.lastChild, "Confirm--blur", 0, 1)
		El.append(body, el)
		El.render(el, scope)
		if (scope.code) {
			El.$$(".js-numpad", el).on("click", numpad)
			kbMap.backspace = kbMap.del = kbMap.num = numpad
		}
		El.addKb(kbMap, el)
		El.$$(".js-btn", el).on("click", resolve)
		View.one("navigation", resolve)
		if (scope.bgClose) El.on(el, "click", resolve)
		El.on(el, "wheel", Event.stop)
		El.on(el.lastChild, "click", Event.stop)
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
			El.md(El.$(".js-body", el), code.replace(/./g, "•") || opts.body)
			if (typeof scope.code == "number" && code.length == scope.code && id && !sent) next(sent = code, id, resolve, reject)
		}
		function resolve(e, key) {
			if (el) {
				var action = key || El.attr(this, "data-action")
				, result = {
					code: code,
					input: El.val(El.$(".js-input", el)),
					inputMd: El.val(El.$(".js-inputMd", el)),
					select: El.val(El.$(".js-select". el))
				}
				El.kill(el, "transparent")
				El.cls(blurEl, "Confirm--blur", el = 0)
				if (action && next) {
					if (typeof next === "function") next(action, result)
					else if (typeof next[action] === "function") next[action](result)
					else if (next[action]) View.emit(next[action], result)
				}
				if (vibrate) navigator.vibrate(0)
				if (sound) sound.pause()
			}
		}
		scope.resolve = resolve
		View.emit("confirm:open", scope)
	})

%el Confirm
	.Confirm.max.fix.anim
		.Confirm-bg.max.abs
		.Confirm-content.Confirm--blur.grid.p2.anim
			.col.ts3 ;txt:: _(title, map)
			.col.js-body ;md:: _(body, map)
			.row.js-numpad
				;if: code
				;each: num in [1,2,3,4,5,6,7,8,9,"CLEAR",0]
				.col.w4>.btn {num}
			.row
				;if: input
				.col>input.field.js-input
			.row
				;if: data.inputMd!=null
				.col
					textarea.field.js-inputMd
						@keyup [this.parentNode.nextSibling.nextSibling], "renderMd"
						;val: inputMd
				.col.ts3 Preview
				.p4
					;md: inputMd
			.row
				;if: select
				.col
					select.field.js-select
						;list: select, [""]
						option
							;val:: item.id
							;txt:: _(item.name)
			.col
				.group ;each: action in actions
					.btn.js-btn
						;txt:: _(action.title)
						;class:: "w" + (12/actions.length)
						;nop: this.focus()
						;data: "action", action.action
						;class:: "is-" + action.action, action.action

