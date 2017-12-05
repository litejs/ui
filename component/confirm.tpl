
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
	Mediator.on("confirm", function(title, opts, next) {
		if (!next && typeof opts === "function") {
			next = opts
			opts = null
		}
		var el = El("Confirm")
		, kbMap = { esc: resolve }
		, scope = Object.create(opts || null)
		scope._ = El.i18n
		scope.title = title || "Confirm?"
		if (!scope.actions) scope.actions = [
			{ title: "Cancel" },
			{ action: "ok", title: "Ok", key: "enter" }
		]
		for (var a, i = 0; a = scope.actions[i++]; ) {
			if (a.key) kbMap[a.key] = resolve.bind(el, el, a.action)
		}
		El.addKb(kbMap)
		El.on(el, "kill", El.rmKb)
		El.append(document.body, el)
		El.render(el, scope)
		El.findAll(el, ".btn").on("click", resolve)
		El.on(el, "wheel", Event.stop)
		El.on(el, "click", resolve)
		El.on(el.lastChild, "click", Event.stop)
		Mediator.one("navigation", resolve)
		function resolve(e, key) {
			if (el) {
				El.rmKb(kbMap)
				El.kill(el)
				el = null
				var action = key || El.attr(this, "data-action")
				if (next && action) next(action)
			}
		}
	})

@el Confirm
	.max.fix
		.Confirm-bg.abs.max
		.Confirm-content.grid-1
			.col-12 &txt: title
			.col-12.t2 &txt: body
			.row &each: action in actions
				div
					&class: "col-" + (12/actions.length)
					.btn
						&txt: action.title
						&data: "action", action.action
						&class: "btn--" + action.action

