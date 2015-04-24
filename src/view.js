


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
		close: function(opts) {
			var view = this

			if (view.open) {
				toggleView(view, false)
				view.emit("close", opts)
				if (view.child) view.child.close()
			}
		},
		wait: function(opts) {
			var view = this
			view.pending = true
			opts._p = 1 + (opts._p | 0)
			return function() {
				setTimeout(function() {
					if (!--opts._p && lastOpts == opts) {
						view.pending = false
						_ping(view, opts)
					}
				}, 1)
			}
		},
		ping: function(opts) {
			var view = this

			if (!view.el) {
				var files = (view.file || view.route + ".js")
				.replace(/^|,/g, "$&" + (View.base || ""))
				.split(",")

				xhr.load(files, function() {
					if (view.el) view.ping(opts)
					else if (view.route != "404") {
						View("404").show()
					}
				})
				return
			}
			view.pending = false

			view.emit("ping", opts)
			_ping(view, opts)
		}
	}

	function _ping(view, opts) {
		var parent = view.parent
		if (lastOpts != opts) return
		if (parent) {
			if (!view.open) {
				if (parent.child) parent.child.close()
				if (!view.pending) {
					toggleView(opts._render = view, true)
				}
			} else if (view.pending) {
				toggleView(view, false)
			}
			parent.ping(opts)
		}
		if (opts._r == view.route) {
			;(opts._render || view).el.render()
			view.emit("show", opts)
		}
	}

	var dummy = El("div")

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
			dummy)
		return

		;(parent.selector && parent.el.find(parent.selector) || parent.el)[
			open ? "appendChild" : "removeChild"
		](view.el)
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

	function viewPlugin(parent, name) {
		var t = this
		t.name = name
		t.parent = parent
		t.el = El("div")
		t.el.plugin = t
		return t
	}

	viewPlugin.prototype.done = function() {
		var temp
		, t = this
		, arr = t.name.split(" ")
		, el = t.el.firstChild
		, i = 0

		if (t.el.childNodes.length > 1) {
			el = []
			for (; temp = t.el.childNodes[i]; ) {
				el[i++] = temp
			}
			el = new El.wrap(el)
		}

		View(arr[0], el, arr[1], arr[2])
		t.el.plugin = null
		return t.parent
	}

	El.plugins.view = viewPlugin
}(this)

