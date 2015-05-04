


/*
 * @version    0.4.0
 * @date       2015-01-16
 * @stability  2 - Unstable
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */



!function(exports) {
	var fn, re, lastOpts
	, fnStr = ""
	, reStr = ""
	, views = {}
	, groupsCount = 1
	, escapeRe = /[.*+?^=!:${}()|\[\]\/\\]/g
	, parseRe = /\{([\w%.]+?)\}|.[^{\\]*?/g
	, detached = El("div")

	function escapeRegExp(string) {
		return string.replace(escapeRe, "\\$&")
	}

	function View(route, el, parent, selector) {
		var view = this
		if (views[route]) {
			if (el) views[route].init(el, parent, selector)
			return views[route]
		}
		if (!(view instanceof View)) return new View(route, el, parent, selector)
		views[view.route = route] = view
		view.init(el, parent, selector)

		if (route.charAt(0) != "#") {
			var startLen = groupsCount++
			, a = ["o._r='" + route + "'"]
			, _re = route.replace(parseRe, function(_, key) {
				return key ?
					a.push("o['" + key + "']=a[" + (groupsCount++) + "]") && "([^/]+?)" :
					escapeRegExp(_)
			})

			fnStr += (fnStr ? "||" : "") + "a[" + startLen + "]&&(" + a + ")"
			reStr += (reStr ? "|" : "") + "(" + _re + ")"

			fn = new Function("o,a", "return a&&(" + fnStr + "),o")
			re = new RegExp("^\\/?(?:" + reStr + ")[\\/\\s]*$")
		}
	}

	View.prototype = {
		init: function(el, parent, selector) {
			var view = this
			view.el = el
			view.parent = typeof parent == "string" ? View(parent) : parent
			view.selector = selector
		},
		show: function(opts) {
			var view = this
			view.ping(lastOpts = opts || {_r: view.route})
		},
		close: function(opts, nextEl) {
			var view = this

			if (view.open) {
				view.emit("close", opts, nextEl)
				toggleView(view, false)
				if (view.child) view.child.close(opts)
			}
		},
		wait: function(opts) {
			var view = this
			view.pending = true
			opts._p = 1 + (opts._p | 0)
			function cb() {
				if (--opts._p || lastOpts != opts) return
				view.pending = false
				if (!view.el && view.route != "404") {
					View("404").show()
				} else {
					_ping(view, opts)
				}
			}
			return function() {
				setTimeout(cb, 1)
			}
		},
		ping: function(opts) {
			var view = this

			if (!view.el) {
				xhr.load(
					(view.file || view.route + ".js")
					.replace(/^|,/g, "$&" + (View.base || ""))
					.split(","),
					view.wait(opts)
				)
			}
			view.emit("ping", opts)
			_ping(view, opts)
		}
	}

	function _ping(view, opts) {
		var parent = view.parent
		if (lastOpts == opts && parent) {
			if (!view.open) {
				if (parent.child) parent.child.close(opts, view.el)
				if (!view.pending) {
					toggleView(opts._render = view, true)
				}
			} else if (view.pending) {
				toggleView(view, false)
			}
			parent.ping(opts)
		}
		if (lastOpts == opts && !view.pending && opts._r == view.route) {
			if (view.child) view.child.close(opts, view.el)
			;(opts._render || view).el.render()
			view.emit("show", opts)
		}
	}


	function toggleView(view, open) {
		var type
		, parent = view.parent
		if (!parent) return
		type = typeof parent.el
		if (type == "function") parent.el = parent.el()
		else if (type == "string") parent.el = El.tpl(parent.el)
		parent.child = view
		view.open = open
		view.el.to(open ?
			parent.selector && parent.el.find(parent.selector) || parent.el :
			detached
		)
	}

	Object.merge(View.prototype, Event.Emitter)

	View.home = "home"

	View.show = function(route) {
		var match = fn({_r:"404"}, re.exec(route || View.home))
		View(match._r).show(El.global.route = match)
	}

	View.def = function(str) {
		for (var match, re = /(\S+) (\S+)/g; match = re.exec(str);) {
			match[2].split(",").map(function(route) {
				View(route).file = match[1]
			})
		}
	}

	exports.View = View

	El.plugins.view = El.plugins.template.extend({
		done: function() {
			var t = this
			, parent = t.parent
			, arr = t.name.split(" ")
			View(arr[0], t._done(), arr[1], arr[2])
			return parent
		}
	})

}(this)

