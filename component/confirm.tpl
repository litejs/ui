
@css
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
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
	}
	.sm .Confirm-content {
		width: 100%;
	}

// https://developer.mozilla.org/en-US/docs/Web/API/Notification
// var n = new Notification(title, options);
// {
//   "body": "Did you make a $1,000,000 purchase at Dr. Evil...",
//   "icon": "images/ccard.png",
//   "vibrate": [200, 100, 200, 100, 200, 100, 400],
//   "tag": "request",
//   "actions": [
//     { "action": "yes", "title": "Yes", "icon": "images/yes.png" },
//     { "action": "no", "title": "No", "icon": "images/no.png" }
//   ]
// }
@js
	View.on("confirm", function(title, opts, next) {
		View.blur()
		if (!next && typeof opts === "function") {
			next = opts
			opts = null
		}
		var code = ""
		, el = El("Confirm")
		, scope = El.scope(el, opts || El.data)
		, kbMap = { esc: resolve }
		scope._ = El.i18n
		scope.title = title || "Confirm?"
		if (!scope.actions) scope.actions = [
			{ title: "Cancel" },
			{ action: "ok", title: "Ok", key: "enter" }
		]
		for (var a, i = 0; a = scope.actions[i++]; ) {
			if (a.key) kbMap[a.key] = resolve.bind(el, el, a.action)
		}
		kbMap.backspace = kbMap.del = kbMap.num = numpad
		El.addKb(kbMap)
		El.on(el, "kill", El.rmKb)
		El.append(document.body, el)
		El.render(el, scope)
		El.findAll(el, ".js-numpad").on("click", numpad)
		El.findAll(el, ".js-btn").on("click", resolve)
		El.on(el, "wheel", Event.stop)
		El.on(el, "click", resolve)
		El.on(el.lastChild, "click", Event.stop)
		View.one("navigation", resolve)
		function numpad(e, _num) {
			// Enter pressed on focused element
			if (_num == void 0 && e.clientX == 0) return
			var num = _num == void 0 ? El.txt(e.target || e.srcElement) : _num
			code += num
			if (num == "CLEAR" || num == "del" || num == "backspace") code = ""
			El.txt(El.find(el, ".t2"), code.replace(/./g, "•") || opts.body)
			// if (code.length == 4 && id && !sent) next(sent = code, id, resolve, reject)
		}
		function resolve(e, key) {
			if (el) {
				El.rmKb(kbMap)
				El.kill(el)
				el = null
				var action = key || El.attr(this, "data-action")
				if (next && action) next(action, code)
			}
		}
	})

@el Confirm
	.max.fix
		.Confirm-bg.abs.max
		.Confirm-content.grid.p2
			.col {title}
			.col.t2 {body}
			.row.js-numpad
				&if: code
				&each: num in [1,2,3,4,5,6,7,8,9,"CLEAR",0]
				.col.w4>.btn {num}
			.col
				.group &each: action in actions
					.btn.js-btn {action.title}
						&class:: "w" + (12/actions.length)
						&nop: this.focus()
						&data: "action", action.action
						&class:: "is-" + action.action, action.action

